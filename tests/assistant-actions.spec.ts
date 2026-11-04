import { test, expect } from "@playwright/test";
import {
  actionFromFunction,
  readSimulationAction,
  selectionAfterAction,
  describeSimulationAction,
  initialSimulationConfig,
  referencedAssets,
  sameSimulationState,
  simulationFunctionMode,
} from "../src/lib/assistant-actions";
import { buildAnalysis, type AnalysisSelection } from "../src/lib/analysis";
import { createAiService } from "../src/lib/server/ai";
const source: AnalysisSelection = {
  mode: "simulation",
  assetId: null,
  revision: 2,
  submitted: false,
  config: initialSimulationConfig,
};
const args = { kind: "fault", scale: 8, durationHours: 24, apply: true };

test("Simulation actions reuse the model, separate future loss, preserve baseline and reject unsupported parameters", () => {
  const action = actionFromFunction("set_simulation", args, source);
  const next = selectionAfterAction(action, source);
  expect(next.revision).toBe(3);
  const analysis = buildAnalysis(next);
  expect(analysis.future!.incrementalLossMWh).toBeCloseTo(723.6864);
  expect(analysis.historical.lossMWh).toBeCloseTo(1.0944);
  expect(describeSimulationAction(action, source).answer).toContain(
    "723,6864 MWh",
  );
  const reset = selectionAfterAction({ type: "reset" }, next);
  expect(reset.config).toEqual(initialSimulationConfig);
  expect(reset.submitted).toBe(false);
  expect(buildAnalysis(reset).current.powerMW).toBeCloseTo(30.1536);
  expect(() =>
    readSimulationAction(action, { ...source, mode: "current" }),
  ).toThrow();
  for (const patch of [
    { scale: 9 },
    { scale: 1.5 },
    { durationHours: 5 },
    { target: "NOPE" },
    { kind: "dust", severityPercent: 51 },
    { kind: "fault", severityPercent: 70 },
    { kind: "cloud", target: "INV-04" },
  ])
    expect(() =>
      actionFromFunction("set_simulation", { ...args, ...patch }, source),
    ).toThrow();
  expect(() => actionFromFunction("execute_command", {}, source)).toThrow();
  expect(sameSimulationState({ ...source, assetId: "INV-03" }, source)).toBe(
    true,
  );
  expect(sameSimulationState({ ...source, revision: 3 }, source)).toBe(false);
  expect(sameSimulationState({ ...source, mode: "current" }, source)).toBe(
    false,
  );
});

test("Gemini native tools only exist in simulation chat; invalid/current function calls never mutate state", async () => {
  const sent: any[] = [];
  let call = { name: "set_simulation", args };
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-test-key",
    }),
    fetch: async (_url, init) => {
      sent.push(JSON.parse(init!.body as string));
      return Response.json({
        candidates: [{ content: { parts: [{ functionCall: call }] } }],
      });
    },
  });
  const request = {
    kind: "chat",
    context: source,
    question: "Cho 8 inverter dừng trong 24 giờ, xem kết quả",
  };
  const applied = await service.respond(request);
  expect(applied.action?.type).toBe("configure");
  expect(sent[0].tools[0].functionDeclarations.map((f: any) => f.name)).toEqual(
    ["set_simulation", "reset_simulation"],
  );
  expect(
    JSON.parse(sent[0].contents[0].parts[0].text).SIMULATION_SETUP,
  ).toEqual(initialSimulationConfig);
  const current = await service.respond({
    ...request,
    context: { ...source, mode: "current" },
  });
  expect(current.action).toBeUndefined();
  expect(sent[1].tools).toBeUndefined();
  const analysis = await service.respond({ ...request, kind: "analysis" });
  expect(analysis.action).toBeUndefined();
  expect(sent[2].tools).toBeUndefined();
  call = { name: "set_simulation", args: { ...args, durationHours: 5 } };
  const invalid = await service.respond({
    ...request,
    question: "thời gian không hỗ trợ",
  });
  expect(invalid.action).toBeUndefined();
});

test("Known device references and answer focus resolve IDs, names and Vietnamese aliases only", async () => {
  expect(referencedAssets("Inverter 3 và cụm pin 06, INV-01")).toEqual([
    "INV-03",
    "PV-06",
    "INV-01",
  ]);
  expect(referencedAssets("INV-30 không tồn tại")).toEqual([]);
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-test-key",
    }),
    fetch: async () =>
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Tôi đề xuất ưu tiên INV-03 vì thiết bị đang dừng phát.",
                },
              ],
            },
          },
        ],
      }),
  });
  const response = await service.respond({
    kind: "chat",
    context: { ...source, mode: "current" },
    question: "Nên ưu tiên xử lý gì?",
  });
  expect(response.focusAssetId).toBe("INV-03");
});

test("A healthy asked inverter is acknowledged before a fault elsewhere, and histories stay in their mode", async () => {
  let sent: any;
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-test-key",
    }),
    fetch: async (_url, init) => {
      sent = JSON.parse(init!.body as string);
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Inverter 03 (INV-03) đã dừng phát từ 10:15; cần đối chiếu mã lỗi để xác minh nguyên nhân.",
                },
              ],
            },
          },
        ],
      });
    },
  });
  const response = await service.respond({
    kind: "chat",
    context: { ...source, mode: "current", assetId: "INV-04" },
    question: "Sao lại bị dừng phát điện? lâu chưa?",
    history: [
      { role: "user", content: "Tin mô phỏng không được gửi", context: source },
    ],
  });
  expect(response.answer).toMatch(
    /^Inverter 04 \(INV-04\) vẫn đang hoạt động bình thường/,
  );
  expect(response.answer.indexOf("INV-04")).toBeLessThan(
    response.answer.indexOf("INV-03"),
  );
  const content = JSON.parse(sent.contents[0].parts[0].text);
  expect(content.ANSWER_DEVICE.id).toBe("INV-04");
  expect(content.HISTORY).toEqual([]);
  expect(response.focusAssetId).toBe("INV-04");
});

test("A generating inverter with mild branch degradation is not declared healthy by the answer opening", async () => {
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-test-key",
    }),
    fetch: async () =>
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Cụm pin 06 (PV-06) đang suy giảm nhẹ 2% do nhiệt độ module tăng.",
                },
              ],
            },
          },
        ],
      }),
  });
  const response = await service.respond({
    kind: "chat",
    context: { ...source, mode: "current", assetId: "INV-06" },
    question: "Thiết bị này thế nào?",
  });
  expect(response.answer).toMatch(
    /^Inverter 06 \(INV-06\) hiện ghi nhận vấn đề/,
  );
  expect(response.answer).not.toContain("vẫn đang hoạt động bình thường");
});

test("Concrete what-if runs a simulation while advice and current mode remain conversational", async () => {
  expect(simulationFunctionMode("nếu 4 inverter bị hỏng thì sao", source)).toBe(
    "ANY",
  );
  expect(
    simulationFunctionMode(
      "Nếu 4 inverter bị hỏng thì cần kiểm tra gì?",
      source,
    ),
  ).toBe("AUTO");
  expect(
    simulationFunctionMode("nếu 4 inverter bị hỏng thì sao", {
      ...source,
      mode: "current",
    }),
  ).toBe("AUTO");
  let sent: any;
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-test-key",
    }),
    fetch: async (_url, init) => {
      sent = JSON.parse(init!.body as string);
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "set_simulation",
                    args: { kind: "fault", scale: 4, apply: true },
                  },
                },
              ],
            },
          },
        ],
      });
    },
  });
  const response = await service.respond({
    kind: "chat",
    context: source,
    question: "nếu 4 inverter bị hỏng thì sao",
  });
  expect(sent.toolConfig.functionCallingConfig.mode).toBe("ANY");
  expect(sent.systemInstruction.parts[0].text).toContain(
    "CHẾ ĐỘ HIỆN TẠI: MÔ PHỎNG",
  );
  expect(response.action).toMatchObject({
    type: "configure",
    apply: true,
    config: { kind: "fault", scale: 4, duration: 60 },
  });
  expect(response.answer).toContain("12,96 MWh");
});
