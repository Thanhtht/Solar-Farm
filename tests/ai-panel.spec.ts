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
  await page.getByRole("button", { name: "Mở danh sách thiết bị" }).click();
}
async function select(page: Page, id: string) {
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

test("One chat retains messages and labels late answers with the original asset/mode/revision", async ({
  page,
}) => {
  // Force late responses to arrive even after cancellation, exercising the
  // context/generation guard rather than relying on browser abort behavior.
  await page.addInitScript(() => {
    const original = window.fetch;
    window.fetch = (input, init) =>
      original(
        input,
        input === "/api/ai" && init?.method === "POST"
          ? { ...init, signal: undefined }
          : init,
      );
  });
  const calls: any[] = [];
  let delayed = false;
  let delayedDone = false;
  let releaseDelayed: (() => void) | undefined;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const input = route.request().postDataJSON();
    calls.push(input);
    if (input.kind === "chat" && input.question === "Đợi phản hồi") {
      delayed = true;
      await new Promise<void>((resolve) => {
        releaseDelayed = resolve;
      });
    }
    await route
      .fulfill({
        json: {
          answer:
            input.question === "Đợi phản hồi"
              ? "ĐÁP ÁN CŨ"
              : "Đối chiếu đầu ra và mã lỗi theo quy trình an toàn.",
          key: contextKey(input.context),
          source: "AI API · fixture kiểm thử",
        },
      })
      .catch(() => {});
    if (input.kind === "chat" && input.question === "Đợi phản hồi")
      delayedDone = true;
  });
  await open(page);
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(panel.getByLabel("Mã truy cập AI", { exact: true })).toHaveCount(
    0,
  );
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  expect(calls.filter((c) => c.kind === "analysis")).toHaveLength(1);
  await select(page, "INV-03");
  await expect(panel.locator(".ai-message.assistant")).toHaveCount(1);
  await page.waitForTimeout(350);
  expect(calls).toHaveLength(1);
  await panel
    .getByRole("textbox", { name: "Nhập câu hỏi cho AI" })
    .fill("Tôi nên kiểm tra gì?");
  await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
  await expect(panel.locator(".ai-message.assistant").last()).toContainText(
    "INV-03 · Hiện trạng",
  );
  expect(calls.at(-1).context.assetId).toBe("INV-03");
  // A reply that arrives after a source change remains in the same chat with its captured source.
  for (const mutation of [
    async () => {
      await select(page, "PV-06");
      await select(page, "INV-03");
    },
    async () => {
      await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
    },
    async () => {
      await page
        .getByLabel("Kịch bản mô phỏng", { exact: true })
        .selectOption("fault");
    },
    async () => {
      await page
        .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
        .click();
    },
    async () => {
      await page
        .getByRole("button", { name: "Về trạng thái ban đầu", exact: true })
        .click();
    },
  ]) {
    await expect(
      panel.getByRole("textbox", { name: "Nhập câu hỏi cho AI" }),
    ).toBeEnabled();
    delayed = false;
    delayedDone = false;
    await panel
      .getByRole("textbox", { name: "Nhập câu hỏi cho AI" })
      .fill("Đợi phản hồi");
    await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
    await expect.poll(() => delayed).toBe(true);
    const sent = calls.at(-1).context;
    const previousAnswers = await panel
      .locator(".ai-message.assistant")
      .filter({ hasText: "ĐÁP ÁN CŨ" })
      .count();
    await mutation();
    releaseDelayed!();
    await expect.poll(() => delayedDone).toBe(true);
    const late = panel
      .locator(".ai-message.assistant")
      .filter({ hasText: "ĐÁP ÁN CŨ" });
    await expect(late).toHaveCount(previousAnswers + 1);
    await expect(late.last()).toHaveAttribute(
      "data-asset-id",
      sent.assetId ?? "plant",
    );
    await expect(late.last()).toHaveAttribute("data-mode", sent.mode);
    await expect(panel).not.toContainText("Để tôi xem và trả lời anh/chị nhé");
  }
  expect(calls.filter((c) => c.kind === "analysis")).toHaveLength(2);
  expect(
    calls.filter((c) => c.kind === "analysis").every((c) => c.question === ""),
  ).toBe(true);
  await page.screenshot({ path: "test-results/t03-desktop.png" });
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
    .locator(".ai-message p")
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
