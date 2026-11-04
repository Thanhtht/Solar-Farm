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
  await expect(panel).toContainText("Phân tích mô phỏng");
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
  await expect(panel.locator(".ai-context strong")).toContainText("PV-06");
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

test("AI chat retains provenance, coalesces automatic events and drops late answers across asset/mode/revision/reset", async ({
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
  await expect(panel.locator(".ai-message")).toHaveCount(0);
  await page.waitForTimeout(350);
  expect(calls).toHaveLength(1);
  await panel
    .getByRole("textbox", { name: "Nhập câu hỏi cho AI" })
    .fill("Tôi nên kiểm tra gì?");
  await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
  await expect(panel.locator(".ai-message.assistant")).toContainText(
    "INV-03 · Hiện trạng",
  );
  expect(calls.at(-1).context.assetId).toBe("INV-03");
  // Each mutation must invalidate a response already in flight, including A→B→A.
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
    await mutation();
    releaseDelayed!();
    await expect.poll(() => delayedDone).toBe(true);
    await expect(panel).not.toContainText("ĐÁP ÁN CŨ");
    await expect(panel).not.toContainText("đang phân tích");
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
  expect(
    await panel
      .locator(".ai-message p")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
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
