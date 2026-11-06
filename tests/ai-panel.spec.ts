import { test, expect, type Page } from "@playwright/test";
import { contextKey } from "../src/lib/analysis";

async function open(page: Page) {
  // Fast fallback path still renders the complete assistant and device controls.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.includes("webgl")) return null;
      return original.call(this, kind as never, ...(args as never[]));
    } as typeof original;
  });
  await page.goto("/");
}
async function select(page: Page, id: string) {
  await page.getByRole("button", { name: "Mở danh sách thiết bị" }).click();
  await page
    .locator(".device-tree")
    .getByRole("button", { name: id, exact: true })
    .click();
}

test("Rules work offline, link both branch devices and refresh on apply/reset/mobile without changing T02", async ({
  page,
}) => {
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(panel).toContainText("Trạng thái hiện tại");
  await expect(panel).toContainText("Hội thoại API chưa được cấu hình");
  await panel.locator(".rule-disclosure > summary").click();
  await expect(panel.locator("textarea")).toBeDisabled();
  await select(page, "INV-03");
  await expect(panel.locator(".rule-analysis details[open]")).toContainText(
    "1,08 MWh",
  );
  await expect(panel.locator(".rule-analysis details[open]")).toContainText(
    "không phải mất kết nối",
  );
  await panel.getByRole("button", { name: "Phân tích: xem INV-03" }).click();
  await select(page, "INV-06");
  await expect(panel.locator(".rule-analysis details[open]")).toContainText(
    "0,0144 MWh",
  );
  await panel.getByRole("button", { name: "Phân tích: xem PV-06" }).click();
  await expect(panel.locator(".ai-mention")).toContainText("PV-06");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("8");
  await page
    .getByLabel("Thời gian ảnh hưởng", { exact: true })
    .selectOption("24");
  await expect(panel).not.toContainText("Kết quả kịch bản đã áp dụng");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(panel).toContainText("723,6864 MWh");
  await expect(panel).toContainText("1,0944 MWh");
  await page
    .getByRole("button", { name: "Về trạng thái ban đầu", exact: true })
    .click();
  await expect(panel).not.toContainText("Kết quả kịch bản đã áp dụng");
  await page.setViewportSize({ width: 1024, height: 768 });
  const frame = await panel.boundingBox();
  const composer = await panel.locator(".ai-composer").boundingBox();
  expect(composer!.y).toBeGreaterThanOrEqual(frame!.y);
  expect(composer!.y + composer!.height).toBeLessThanOrEqual(
    frame!.y + frame!.height,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.scrollIntoViewIfNeeded();
  await expect(
    panel.getByRole("heading", { name: "Trợ lý AI", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/t03-mobile.png" });
});

test("Separate mode sessions retain drafts, device history and late replies without sharing context", async ({
  page,
}) => {
  const calls: any[] = [];
  let release: (() => void) | undefined;
  let completed = false;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    calls.push(body);
    if (body.question === "Đợi phản hồi")
      await new Promise<void>((resolve) => (release = resolve));
    await route.fulfill({
      json: {
        answer:
          body.question === "Đợi phản hồi"
            ? "ĐÁP ÁN CŨ"
            : `Phản hồi ${body.context.mode}`,
        key: contextKey(body.context),
      },
    });
    if (body.question === "Đợi phản hồi") completed = true;
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  const box = panel.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  await expect(panel.locator(".ai-guide")).toHaveCount(1);
  await select(page, "INV-03");
  await box.fill("Tôi nên kiểm tra gì?");
  await box.press("Enter");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(2);
  await box.fill("Bản nháp hiện trạng");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(box).toHaveValue("");
  await expect(panel.locator(".ai-message")).toHaveCount(0);
  await box.fill("Chat mô phỏng");
  await box.press("Enter");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  expect(calls.at(-1).history).toEqual([]);
  await box.fill("Bản nháp mô phỏng");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(box).toHaveValue("Bản nháp hiện trạng");
  await expect(panel).not.toContainText("Chat mô phỏng");
  await box.fill("Đợi phản hồi");
  await box.press("Enter");
  await expect(box).toBeDisabled();
  expect(
    calls.at(-1).history.every((m: any) => m.context.mode === "current"),
  ).toBe(true);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(box).toBeEnabled();
  await expect(box).toHaveValue("Bản nháp mô phỏng");
  await box.press("Enter");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(2);
  expect(
    calls.at(-1).history.every((m: any) => m.context.mode === "simulation"),
  ).toBe(true);
  release!();
  await expect.poll(() => completed).toBe(true);
  await expect(panel).not.toContainText("ĐÁP ÁN CŨ");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  const late = panel.locator(".ai-message.assistant").last();
  await expect(late).toContainText("ĐÁP ÁN CŨ");
  await expect(late).toHaveAttribute("data-mode", "current");
  await expect(late).toHaveAttribute("data-asset-id", "INV-03");
  await select(page, "PV-06");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(3);
  await expect(panel.locator(".ai-guide")).toHaveCount(1);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(3);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await box.fill("Kiểm tra hiện tại");
  await box.press("Enter");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(4);
  expect(calls.at(-1).context.config.kind).toBeNull();
  expect(
    calls.at(-1).history.every((m: any) => m.context.mode === "current"),
  ).toBe(true);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Về trạng thái ban đầu", exact: true })
    .click();
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(3);
  await expect(panel).not.toContainText("ĐÁP ÁN CŨ");
});

test("Provider failure ends loading and lets a user retry deliberately", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const input = route.request().postDataJSON();
    if (!failed) {
      failed = true;
      return route.fulfill({
        status: 504,
        json: { error: "AI trả lời quá hạn." },
      });
    }
    return route.fulfill({
      json: {
        answer: "Cần kiểm tra thêm dữ liệu.",
        key: contextKey(input.context),
        source: "AI API · fixture kiểm thử",
      },
    });
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(panel.getByLabel("Mã truy cập AI", { exact: true })).toHaveCount(
    0,
  );
  await expect(panel.getByRole("alert")).toContainText("quá hạn");
  await panel
    .getByRole("textbox", { name: "Nhập câu hỏi cho AI" })
    .fill("Thử lại");
  await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
  await expect(panel.locator(".ai-message.assistant")).toContainText(
    "Cần kiểm tra thêm dữ liệu",
  );
  await expect(panel.getByRole("alert")).toHaveCount(0);
});

test("Chat uses readable space and Enter sends once, Shift+Enter and IME do not send", async ({
  page,
}) => {
  const chats: any[] = [];
  let release: (() => void) | undefined;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    if (body.kind === "chat") {
      chats.push(body);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    return route.fulfill({
      json: {
        key: contextKey(body.context),
        answer:
          body.kind === "chat"
            ? "Mình có thể giải thích số liệu và kịch bản nhà máy."
            : "INV-03 đang dừng phát điện; hãy đối chiếu mã lỗi theo quy trình.",
        source: "fixture",
      },
    });
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  const box = panel.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  await expect(
    panel.getByText("ĐỒNG HÀNH VẬN HÀNH", { exact: true }),
  ).toHaveCount(0);
  await expect(panel.getByText("AI sẵn sàng", { exact: true })).toHaveCount(0);
  await expect(panel.locator(".rule-disclosure")).not.toHaveAttribute("open");
  const textSize = await panel
    .locator(".ai-message > p:not(.ai-guide)")
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(textSize).toBe(
    await panel
      .locator(".rule-disclosure > summary")
      .evaluate((el) => getComputedStyle(el).fontSize),
  );
  await box.focus();
  await box.press("Enter");
  expect(chats).toHaveLength(0);
  await box.fill("Xin chào");
  await box.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
    keyCode: 229,
  });
  expect(chats).toHaveLength(0);
  await box.press("End");
  await box.press("Shift+Enter");
  await box.pressSequentially("Bạn giúp được gì?");
  await expect(box).toHaveValue("Xin chào\nBạn giúp được gì?");
  await box.press("Enter");
  await expect.poll(() => chats.length).toBe(1);
  await page.keyboard.press("Enter");
  expect(chats).toHaveLength(1);
  expect(chats[0].question).toBe("Xin chào\nBạn giúp được gì?");
  release!();
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(2);
  await expect(box).toHaveValue("");
  const frame = await panel.boundingBox(),
    input = await box.boundingBox();
  expect(input!.y + input!.height).toBeLessThan(frame!.y + frame!.height);
  await page.screenshot({ path: "test-results/chat-readable-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/chat-readable-mobile.png" });
});

test("Chat starts plant-wide, device mention matches payload and can be removed", async ({
  page,
}) => {
  const calls: any[] = [];
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    calls.push(body);
    return route.fulfill({
      json: {
        key: contextKey(body.context),
        answer: "Tôi sẽ giải thích dựa trên dữ liệu anh/chị đang xem.",
      },
    });
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  await expect(panel.locator(".ai-context")).toHaveCount(0);
  await expect(panel.locator(".ai-mention")).toHaveCount(0);
  expect(calls[0].context.assetId).toBeNull();
  const box = panel.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await box.fill("Nhà máy đang thế nào?");
  await box.press("Enter");
  await expect
    .poll(() => calls.filter((c) => c.kind === "chat").length)
    .toBe(1);
  expect(calls.filter((c) => c.kind === "chat")[0].context.assetId).toBeNull();
  await select(page, "INV-03");
  await expect(panel.locator(".ai-mention")).toContainText("@INV-03");
  await box.fill("Tôi cần kiểm tra gì?");
  await box.press("Enter");
  await expect
    .poll(() => calls.filter((c) => c.kind === "chat").length)
    .toBe(2);
  expect(calls.filter((c) => c.kind === "chat")[1].context.assetId).toBe(
    "INV-03",
  );
  await expect(box).toBeEnabled();
  await panel.getByRole("button", { name: "Bỏ thiết bị khỏi câu hỏi" }).click();
  await expect(panel.locator(".ai-mention")).toHaveCount(0);
  await expect(panel.locator(".ai-context")).toHaveCount(0);
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  const inputBounds = await box.boundingBox(),
    sendBounds = await panel
      .getByRole("button", { name: "Gửi câu hỏi" })
      .boundingBox();
  expect(sendBounds!.x).toBeGreaterThanOrEqual(
    inputBounds!.x + inputBounds!.width,
  );
  await select(page, "PV-06");
  await expect(panel.locator(".ai-mention")).toContainText("@PV-06");
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/chat-mention-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/chat-mention-mobile.png" });
});

test("Typing @ suggests device IDs and Vietnamese names without losing drafts or chat", async ({
  page,
}) => {
  const calls: any[] = [];
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    calls.push(body);
    return route.fulfill({
      json: {
        key: contextKey(body.context),
        answer:
          body.context.assetId === "PV-06"
            ? "Nhánh pin 06 cần tiếp tục theo dõi."
            : "Tôi sẽ giúp anh/chị ưu tiên việc cần xử lý.",
      },
    });
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" }),
    box = panel.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  await box.fill("Xin tư vấn");
  const send = panel.getByRole("button", { name: "Gửi câu hỏi" });
  await expect(send).toBeEnabled();
  await expect
    .poll(() =>
      send.locator("svg").evaluate((el) => getComputedStyle(el).color),
    )
    .toBe("rgb(255, 255, 255)");
  await box.press("Enter");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(2);
  const retained = await panel.locator(".ai-message").count();
  await box.fill("Kiểm tra @cum pin 06");
  await box.press("End");
  const list = panel.getByRole("listbox", { name: "Gợi ý thiết bị" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option")).toHaveCount(1);
  await expect(list).toContainText("PV-06");
  await box.press("Enter");
  await expect(panel.locator(".ai-mention")).toContainText("@PV-06");
  await expect(box).toHaveValue("Kiểm tra ");
  await expect(panel.locator(".ai-message")).toHaveCount(retained);
  await box.press("Enter");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(3);
  expect(calls.at(-1).context.assetId).toBe("PV-06");
  expect(calls.at(-1).history[0].context.assetId).toBeNull();
  await select(page, "INV-03");
  await expect(
    panel
      .locator(".ai-message.assistant")
      .filter({ hasText: "Nhánh pin 06 cần tiếp tục theo dõi." }),
  ).toHaveAttribute("data-asset-id", "PV-06");
  await box.fill("@INV-");
  await box.press("End");
  await expect(list).toBeVisible();
  await box.press("ArrowDown");
  await box.press("Tab");
  await expect(panel.locator(".ai-mention")).toContainText("@INV-02");
  await box.fill("@zzzz");
  await box.press("End");
  await expect(list).toContainText("Không tìm thấy thiết bị");
  await box.press("Escape");
  await expect(list).toHaveCount(0);
  await page.setViewportSize({ width: 1024, height: 650 });
  await panel.scrollIntoViewIfNeeded();
  await box.fill("@");
  await box.press("End");
  await expect(list).toBeVisible();
  const shortPanel = await panel.boundingBox(),
    suggestionsBox = await list.boundingBox();
  expect(suggestionsBox!.y).toBeGreaterThanOrEqual(shortPanel!.y);
  await box.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await box.fill("Tôi nên kiểm tra gì tiếp?");
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/chat-single-session-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.scrollIntoViewIfNeeded();
  await box.fill("@pin");
  await box.press("End");
  await expect(list).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/chat-suggestions-mobile.png" });
});

test("Long Vietnamese conversation keeps visible history and bounds UTF-8 request bytes", async ({
  page,
}) => {
  const requests: any[] = [];
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const raw = route.request().postData()!,
      body = JSON.parse(raw);
    requests.push({ body, bytes: new TextEncoder().encode(raw).byteLength });
    return route.fulfill({
      json: { key: contextKey(body.context), answer: "đ".repeat(3900) },
    });
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" }),
    box = panel.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  for (let turn = 0; turn < 4; turn++) {
    await box.fill(`${turn} ${"đ".repeat(1100)}`);
    await box.press("Enter");
    await expect(panel.locator(".ai-message.assistant")).toHaveCount(turn + 2);
  }
  expect(requests.every((r) => r.bytes <= 20000)).toBe(true);
  expect(requests.at(-1).body.history.length).toBeLessThan(6);
  await expect(panel.locator(".ai-message.user")).toHaveCount(4);
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(5);
});
