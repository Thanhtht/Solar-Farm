import { test, expect } from "@playwright/test";
test("Compact setup uses hours, applies only on request and removes obsolete panels", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const submit = page.getByRole("button", {
    name: "Xem kết quả mô phỏng",
    exact: true,
  });
  await expect(submit).toBeDisabled();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("cloud");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("2");
  await page
    .getByLabel("Thời gian ảnh hưởng", { exact: true })
    .selectOption("2");
  await expect(page.getByTestId("power-reduction")).toContainText("—");
  await submit.click();
  await expect(page.getByTestId("power-reduction")).toHaveText("3,89 MW");
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("7,78 MWh");
  const canvas = page.locator("canvas");
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-cloud-assets")) ?? "[]"),
    )
    .toEqual(["PV-01", "PV-02"]);
  await page
    .getByLabel("Thời gian ảnh hưởng", { exact: true })
    .selectOption("4");
  await expect(page.getByTestId("simple-energy-loss")).toContainText("—");
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-cloud-assets")) ?? "[]"),
    )
    .toEqual([]);
  await submit.click();
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("15,55 MWh");
  await expect(
    page.getByLabel("Thời gian ảnh hưởng").locator("option"),
  ).toHaveText([
    "1 giờ",
    "2 giờ",
    "3 giờ",
    "4 giờ",
    "6 giờ",
    "8 giờ",
    "12 giờ",
    "24 giờ",
  ]);
  await expect(
    page.locator(
      ".config-panel,.weather-panel,.notice-panel,.simulation-advanced,.simulation-estimates",
    ),
  ).toHaveCount(0);
  await expect(page.getByText(/Tùy chọn nâng cao/)).toHaveCount(0);
  await page.screenshot({
    path: "test-results/compact-result.png",
    fullPage: true,
  });
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("8");
  await page
    .getByLabel("Thời gian ảnh hưởng", { exact: true })
    .selectOption("24");
  await submit.click();
  await expect(page.getByTestId("power-reduction")).toHaveText("30,24 MW");
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("725,76 MWh");
});
test("Monitoring remains independent and returning to simulation preserves applied results", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.locator(".kpis").textContent();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page.getByLabel("Kịch bản mô phỏng").selectOption("dust");
  await page.getByRole("button", { name: "Xem kết quả mô phỏng" }).click();
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("0,86 MWh");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis")).toHaveText(before!);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("0,86 MWh");
});
