import { test, expect, type Page } from "@playwright/test";
import { contextKey } from "../src/lib/analysis";
import {
  actionFromFunction,
  describeSimulationAction,
} from "../src/lib/assistant-actions";
async function offlineScene(page: Page) {
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
}
test("Chat configures, applies and resets simulation in one session without changing current data", async ({
  page,
}) => {
  await offlineScene(page);
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    if (body.context.mode !== "simulation" || body.kind !== "chat")
      return route.fulfill({
        json: { answer: "Nhận định kiểm thử.", key: contextKey(body.context) },
      });
    const action =
      body.question === "Reset"
        ? { type: "reset" as const }
        : actionFromFunction(
            "set_simulation",
            {
              kind: "fault",
              scale: 8,
              durationHours: 24,
              apply: body.question !== "Chỉ thiết lập",
            },
            body.context,
          );
    await route.fulfill({
      json: {
        answer: describeSimulationAction(action, body.context).answer,
        key: contextKey(body.context),
        action,
      },
    });
  });
  await page.goto("/plants/sava");
  await expect(page.locator(".ai-message.assistant")).toHaveCount(1);
  const before = await page.locator(".kpis").textContent();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await input.fill("Chỉ thiết lập");
  await input.press("Enter");
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("fault");
  await expect(
    page.getByLabel("Quy mô ảnh hưởng", { exact: true }),
  ).toHaveValue("8");
  await expect(
    page.getByLabel("Thời gian ảnh hưởng", { exact: true }),
  ).toHaveValue("24");
  await expect(page.getByTestId("simple-energy-loss")).toContainText("—");
  await input.fill("Xem kết quả");
  await input.press("Enter");
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("723,69 MWh");
  await expect(page.locator(".ai-message.assistant").last()).toContainText(
    "723,6864 MWh",
  );
  await input.fill("Reset");
  await input.press("Enter");
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByLabel("Thời gian ảnh hưởng", { exact: true }),
  ).toHaveValue("1");
  await expect(page.locator(".ai-message.user")).toHaveCount(3);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis")).toHaveText(before!);
});

test("Late AI commands cannot overwrite manual simulation edits or run after switching to current", async ({
  page,
}) => {
  await offlineScene(page);
  let release: (() => void) | undefined;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    if (body.kind === "analysis")
      return route.fulfill({
        json: { answer: "Nhận định kiểm thử.", key: contextKey(body.context) },
      });
    await new Promise<void>((resolve) => (release = resolve));
    const action = actionFromFunction(
      "set_simulation",
      { kind: "fault", scale: 8, durationHours: 24, apply: true },
      body.context,
    );
    await route.fulfill({
      json: {
        answer: describeSimulationAction(action, body.context).answer,
        key: contextKey(body.context),
        action,
      },
    });
  });
  await page.goto("/plants/sava");
  await expect(page.locator(".ai-message.assistant")).toHaveCount(1);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await input.fill("Mô phỏng lỗi");
  await input.press("Enter");
  await expect(
    page.getByText("Anh/Chị chờ em một chút nhé…", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("dust");
  release!();
  await expect(page.locator(".ai-message.assistant").last()).toContainText(
    "chưa áp dụng lệnh",
  );
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("dust");
  await expect(page.getByTestId("simple-energy-loss")).toContainText("—");
  await input.fill("Mô phỏng lỗi lần nữa");
  await input.press("Enter");
  await expect(input).toBeDisabled();
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  const lateResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/ai") && r.request().method() === "POST",
  );
  release!();
  await lateResponse;
  await expect(page.locator(".ai-message.user")).toHaveCount(0);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(page.locator(".ai-message.user")).toHaveCount(2);
  await expect(page.locator(".ai-message.assistant").last()).toContainText(
    "chưa áp dụng lệnh",
  );
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("dust");
  await expect(page.getByTestId("simple-energy-loss")).toContainText("—");
});

test("Current chat focuses the real 3D camera on asked devices and answer priorities; simulation never follows old replies", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    if (body.question === "Trả lời sau")
      await new Promise<void>((resolve) => (release = resolve));
    await route.fulfill({
      json: {
        answer:
          body.kind === "analysis"
            ? "Nhận định kiểm thử."
            : "Tôi đề xuất ưu tiên INV-03 đang dừng phát.",
        key: contextKey(body.context),
        focusAssetId: body.kind === "chat" ? "INV-03" : null,
      },
    });
  });
  await page.goto("/plants/sava");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-device-projections", /INV-01/, {
    timeout: 45000,
  });
  await expect(page.locator(".ai-message.assistant")).toHaveCount(1);
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await input.fill("@INV-04");
  await input.press("End");
  await input.press("Enter");
  await expect(canvas).toHaveAttribute("data-focus-target", "INV-04");
  await expect(page.locator(".ai-message.user")).toHaveCount(0);
  await input.fill("Inverter 6 thế nào?");
  await input.press("Enter");
  await expect(canvas).toHaveAttribute("data-focus-target", "INV-06");
  await expect(page.locator(".ai-message.user").last()).toHaveAttribute(
    "data-asset-id",
    "INV-06",
  );
  await page.getByRole("button", { name: "Bỏ thiết bị khỏi câu hỏi" }).click();
  await input.fill("Nên ưu tiên gì?");
  await input.press("Enter");
  await expect(canvas).toHaveAttribute("data-focus-target", "INV-03");
  await expect(page.locator(".ai-message.assistant").last()).toContainText(
    "Trọng tâm: INV-03",
  );
  await page.getByRole("button", { name: "Bỏ thiết bị khỏi câu hỏi" }).click();
  await input.fill("Trả lời sau");
  await input.press("Enter");
  await expect(input).toBeDisabled();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const old = await canvas.getAttribute("data-focus-request");
  const lateResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/ai") && r.request().method() === "POST",
  );
  release!();
  await lateResponse;
  await expect(page.locator(".ai-message.user")).toHaveCount(0);
  expect(await canvas.getAttribute("data-focus-request")).toBe(old);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".ai-message.user")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/t03-new-overview.png",
    fullPage: true,
  });
});
