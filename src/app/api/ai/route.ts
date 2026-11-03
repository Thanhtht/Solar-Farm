import {
  ai,
  AiError,
  probeGeminiCredential,
  configuredAi,
} from "@/lib/server/ai";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  const credentialStatus = await probeGeminiCredential();
  return Response.json(
    {
      available: ai.available(),
      requiresAccessCode: false,
      credentialStatus,
      model: configuredAi()?.model ?? null,
    },
    { headers },
  );
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    let sameOrigin = false;
    try {
      const parsed = new URL(origin ?? "");
      sameOrigin =
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.origin === origin &&
        parsed.host === request.headers.get("host");
    } catch {
      /* Reject missing or malformed origins. */
    }
    if (!sameOrigin)
      throw new AiError(403, "origin", "Nguồn yêu cầu không hợp lệ.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new AiError(415, "content", "Chỉ nhận JSON.");
    if (Number(request.headers.get("content-length") ?? 0) > 20000)
      throw new AiError(413, "size", "Yêu cầu quá dài.");
    const reader = request.body?.getReader();
    if (!reader) throw new AiError(400, "input", "Yêu cầu không hợp lệ.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 20000) {
        await reader.cancel();
        throw new AiError(413, "size", "Yêu cầu quá dài.");
      }
      chunks.push(value);
    }
    let input;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new AiError(400, "input", "JSON không hợp lệ.");
    }
    await probeGeminiCredential();
    const result = await ai.respond(input);
    return Response.json(result, { headers });
  } catch (error) {
    const failure =
      error instanceof AiError
        ? error
        : new AiError(500, "internal", "Chưa xử lý được yêu cầu AI.");
    return Response.json(
      { code: failure.code, error: failure.message },
      { status: failure.status, headers },
    );
  }
}
