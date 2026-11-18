import { test, expect } from "@playwright/test";
import { contextKey } from "../src/lib/analysis";

test("Suggested questions go to the conversation of the tab that shows them", async ({
  page,
}) => {
  const sent: { mode: string; question: string }[] = [];
  await page.route("**/api/ai", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    if (body.kind === "chat")
      sent.push({ mode: body.context.mode, question: body.question });
    return route.fulfill({
      json: { key: contextKey(body.context), answer: "Trả lời thử." },
    });
  });
  await page.goto("/plants/sava");
  const panel = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(panel.locator(".rule-disclosure")).toHaveAttribute("open", "");
  await expect(panel.locator(".rule-disclosure > summary")).toContainText(
    "không phải AI",
  );
  await panel
    .getByRole("button", { name: "Tóm tắt trạng thái nhà máy" })
    .click();
  await expect(panel.locator(".ai-message.user")).toHaveText(/Tóm tắt/);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(panel.locator(".ai-message.user")).toHaveCount(0);
  await panel
    .getByRole("button", { name: "Nếu 4 inverter bị hỏng thì sao?" })
    .click();
  await expect(panel.locator(".ai-message.user")).toHaveCount(1);
  expect(sent.map((s) => s.mode)).toEqual(["current", "simulation"]);
});

test("Device list sorts by severity and explains PV that cannot generate", async ({
  page,
}) => {
  await page.goto("/plants/sava");
  await page.getByRole("button", { name: "Danh sách thiết bị" }).click();
  const dialog = page.getByRole("dialog", { name: "Danh sách thiết bị" });
  const levels = await dialog
    .locator(".device-list-group")
    .evaluateAll((groups) =>
      groups.map((g) =>
        [...g.querySelectorAll(".device-list-row")].map((r) =>
          r.classList.contains("critical")
            ? 0
            : r.classList.contains("warning")
              ? 1
              : 2,
        ),
      ),
    );
  for (const group of levels)
    expect(group).toEqual([...group].sort((a, b) => a - b));
  await expect(dialog.locator('[data-asset="PV-03"]')).toContainText(
    "Không phát do INV-03 dừng",
  );
  await expect(dialog.locator('[data-asset="PV-01"]')).not.toContainText(
    "Không phát do",
  );
});

test("Scenario quick picks select one scenario and results stay neutral until applied", async ({
  page,
}) => {
  await page.goto("/plants/sava");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const metrics = page.locator(".setup-metrics");
  await expect(metrics).not.toHaveClass(/has-result/);
  await page.locator('[data-scenario="dust"]').click();
  await expect(page.locator('[data-scenario="dust"]')).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(metrics).not.toHaveClass(/has-result/);
  await page.getByRole("button", { name: "Xem kết quả mô phỏng" }).click();
  await expect(metrics).toHaveClass(/has-result/);
});
