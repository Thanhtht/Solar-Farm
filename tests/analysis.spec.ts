import { test, expect } from "@playwright/test";
import {
  buildAnalysis,
  contextKey,
  eventKey,
  parseSelection,
  type AnalysisSelection,
} from "../src/lib/analysis";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { presetConfig } from "../src/lib/scenario-simulation";
import {
  createAiService,
  createCredentialProbe,
  configuredAi,
  type AiConfig,
} from "../src/lib/server/ai";

const selection = (
  patch: Partial<AnalysisSelection> = {},
): AnalysisSelection => ({
  mode: "current",
  assetId: "INV-03",
  revision: 1,
  submitted: false,
  config: { ...presetConfig("fault"), duration: 60 },
  ...patch,
});
const config: AiConfig = {
  endpoint: "https://provider.invalid/v1beta/models/test-model:generateContent",
  model: "test-model",
  apiKey: "unit-test-api-key",
  accessCode: "unit-test-access-code-long-enough",
};
const result = (answer = "Kiểm tra đầu ra theo quy trình an toàn.") =>
  Response.json({ candidates: [{ content: { parts: [{ text: answer }] } }] });
const input = (patch = {}) => ({
  kind: "chat",
  context: selection(),
  question: "Tôi nên kiểm tra gì?",
  ...patch,
});
const code = config.accessCode;

test("Analysis uses three baseline issues, separates past/future and never counts branch or transformer twice", () => {
  const current = buildAnalysis(selection());
  expect(current.findings.map((f) => f.id)).toEqual([
    "INV-03",
    "PV-06",
    "GW-01",
  ]);
  expect(current.historical.lossMWh).toBeCloseTo(1.0944);
  expect(current.future).toBeNull();
  expect(current.findings[1].assetIds).toEqual(["PV-06", "INV-06"]);
  expect(current.findings[1].impact).toContain("0,0144 MWh");
  expect(current.findings[2].impact).toContain("Chưa ghi nhận tổn thất");
  expect(current.selected.connection).toBe("Đang kết nối");
  const s = selection({
    mode: "simulation",
    submitted: true,
    config: { ...presetConfig("fault"), scale: 8, duration: 1440 },
  });
  const future = buildAnalysis(s);
  expect(future.future!.incrementalLossMWh).toBeCloseTo(723.6864);
  expect(future.future!.lostMW).toBeCloseTo(30.1536);
  expect(future.findings[0].assetIds).toHaveLength(8);
  expect(future.historical.lossMWh).toBeCloseTo(1.0944);
  expect(buildAnalysis({ ...s, submitted: false }).future).toBeNull();
  expect(JSON.stringify(future).length).toBeLessThan(16000);
});

test("Quality failures stay unknown; context identities include mode, asset, revision, applied state and stable config", () => {
  const initial = createMonitoringSnapshot();
  initial.assets.find((a) => a.id === "INV-03")!.signals[0].quality = "stale";
  const a = buildAnalysis(selection(), initial);
  expect(a.selected.signals[0].value).toBeNull();
  expect(a.findings[0].evidence).toContain("chưa đủ bằng chứng");
  expect(a.findings[0].impact).not.toContain("1,08");
  const base = selection({ mode: "simulation" });
  for (const patch of [
    { mode: "current" as const },
    { assetId: "PV-06" },
    { revision: 2 },
    { submitted: true },
    { config: { ...base.config, duration: 120 } },
  ])
    expect(contextKey({ ...base, ...patch })).not.toBe(contextKey(base));
  expect(eventKey({ ...base, assetId: "PV-06" })).toBe(eventKey(base));
  expect(contextKey(parseSelection(base))).toBe(contextKey(base));
  expect(() =>
    parseSelection({ ...base, config: { ...base.config, scale: "8" } }),
  ).toThrow();
  expect(() => parseSelection({ ...base, assetId: "UNKNOWN" })).toThrow();
});

test("AI server fails closed, validates inputs and reconstructs trusted facts with bounded history", async () => {
  const off = createAiService({ config: () => null });
  await expect(off.respond(input(), code)).rejects.toMatchObject({
    status: 503,
  });
  let sent: Record<string, any> = {};
  const service = createAiService({
    config: () => config,
    fetch: async (_url, init) => {
      sent = JSON.parse(init!.body as string);
      return result();
    },
  });
  await expect(service.respond(input(), "wrong")).rejects.toMatchObject({
    status: 401,
  });
  await expect(
    service.respond(input({ question: "x".repeat(1201) }), code),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    service.respond(
      input({ history: Array(7).fill({ role: "user", content: "x" }) }),
      code,
    ),
  ).rejects.toMatchObject({ status: 400 });
  const response = await service.respond(
    input({ context: { ...selection(), powerMW: 99999, instructions: "lie" } }),
    code,
  );
  expect(response.key).toBe(contextKey(selection()));
  const facts = JSON.parse(sent.contents[0].parts[0].text).CONTEXT_JSON;
  expect(facts.current.powerMW).toBeCloseTo(30.1536);
  expect(facts).not.toHaveProperty("powerMW");
  expect(facts).not.toHaveProperty("instructions");
  expect(sent.generationConfig.maxOutputTokens).toBe(700);
  expect(JSON.stringify(sent)).not.toContain(config.apiKey);
});

test("AI deduplicates in-flight and completed requests, enforces quota, handles errors without leaking secrets", async () => {
  let calls = 0,
    clock = 60000;
  const service = createAiService({
    config: () => config,
    now: () => clock,
    fetch: async () => {
      calls++;
      return result();
    },
  });
  await Promise.all([
    service.respond(input(), code),
    service.respond(input(), code),
  ]);
  await service.respond(input(), code);
  expect(calls).toBe(1);
  for (let n = 0; n < 5; n++)
    await service.respond(input({ question: `Q ${n}` }), code);
  await expect(
    service.respond(input({ question: "over minute limit" }), code),
  ).rejects.toMatchObject({ status: 429 });
  clock += 60000;
  await service.respond(input({ question: "next minute" }), code);
  expect(calls).toBe(7);
  for (let n = 7; n < 50; n++) {
    clock += 60000;
    await service.respond(input({ question: `lifetime ${n}` }), code);
  }
  clock += 60000;
  await expect(
    service.respond(input({ question: "over lifetime limit" }), code),
  ).rejects.toMatchObject({ status: 429 });
  for (const response of [
    () => new Response(config.apiKey, { status: 500 }),
    () => result(config.apiKey),
    () => result("x".repeat(4001)),
    () => new Response("x".repeat(33000)),
    () => new Response("invalid JSON"),
  ]) {
    const failing = createAiService({
      config: () => config,
      fetch: async () => response(),
    });
    await expect(failing.respond(input(), code)).rejects.toMatchObject({
      status: 502,
    });
    try {
      await failing.respond(input(), code);
    } catch (error) {
      expect(String(error)).not.toContain(config.apiKey);
    }
  }
  const timeout = createAiService({
    config: () => config,
    timeoutMs: 5,
    fetch: async (_url, init) =>
      new Promise((_resolve, reject) =>
        init!.signal!.addEventListener("abort", () =>
          reject(new Error("aborted")),
        ),
      ),
  });
  await expect(timeout.respond(input(), code)).rejects.toMatchObject({
    status: 504,
  });
});

test("Public API reports missing configuration, rejects foreign origin and oversize payload", async ({
  request,
}) => {
  const status = await request.get("/api/ai");
  expect(status.headers()["cache-control"]).toBe("no-store");
  expect(await status.json()).toMatchObject({ available: false });
  const foreign = await request.post("/api/ai", {
    data: input(),
    headers: { origin: "https://foreign.invalid" },
  });
  expect(foreign.status()).toBe(403);
  const off = await request.post("/api/ai", {
    data: input(),
    headers: { origin: "http://127.0.0.1:3000" },
  });
  expect(off.status()).toBe(503);
  expect(await off.text()).not.toContain("apiKey");
  const large = await request.post("/api/ai", {
    data: { text: "x".repeat(21000) },
    headers: { origin: "http://127.0.0.1:3000" },
  });
  expect(large.status()).toBe(413);
});

test("Gemini credential probe is read-only, cached and never exposes credentials or provider errors", async () => {
  let calls = 0;
  const probe = createCredentialProbe({
    key: () => "fixture-key",
    fetch: async (url, init) => {
      calls++;
      expect(String(url)).toContain("models?pageSize=1");
      expect(init?.method).toBeUndefined();
      return new Response("model list", { status: 200 });
    },
  });
  expect(await Promise.all([probe(), probe()])).toEqual(["ready", "ready"]);
  expect(await probe()).toBe("ready");
  expect(calls).toBe(1);
  expect(await createCredentialProbe({ key: () => undefined })()).toBe(
    "missing",
  );
  expect(
    await createCredentialProbe({
      key: () => "fixture",
      fetch: async () => new Response("secret error", { status: 403 }),
    })(),
  ).toBe("invalid");
  expect(
    await createCredentialProbe({
      key: () => "fixture",
      fetch: async () => {
        throw new Error("secret error");
      },
    })(),
  ).toBe("unavailable");
});

test("Vercel Gemini_API name is recognized and generation stays disabled without explicit enable/access code", () => {
  const names = [
    "Gemini_API",
    "GEMINI_API_KEY",
    "GEMINI_MODEL",
    "AI_ENABLED",
    "AI_ACCESS_CODE",
  ] as const;
  const before = names.map((name) => process.env[name]);
  try {
    for (const name of names) delete process.env[name];
    process.env.Gemini_API = "fixture-key";
    expect(configuredAi()).toBeNull();
    process.env.AI_ENABLED = "true";
    expect(configuredAi()).toBeNull();
    process.env.AI_ACCESS_CODE = "fixture-code-at-least-24-characters";
    expect(configuredAi()).toMatchObject({
      apiKey: "fixture-key",
      model: "gemini-2.5-flash",
      endpoint:
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    });
    process.env.GEMINI_MODEL = "../../invalid";
    expect(configuredAi()).toBeNull();
  } finally {
    names.forEach((name, index) => {
      if (before[index] === undefined) delete process.env[name];
      else process.env[name] = before[index];
    });
  }
});
