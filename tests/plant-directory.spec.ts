import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`Plant selection, direct access and return at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route("**/api/ai", (route) =>
      route.fulfill({ json: { available: false } }),
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Khám phá từng nhà máy." }),
    ).toBeVisible();
    const card = page.getByRole("link", { name: "Khám phá Nhà máy điện Sava" });
    await expect(card).toBeVisible();
    // The directory does not mount the heavy 3D dashboard or start AI probes.
    await expect(page.locator("canvas, .view-tabs, .ai-panel")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/plant-directory-${viewport.width}.png`,
      fullPage: true,
    });
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/plants\/sava$/);
    await expect(
      page.getByRole("tab", { name: "Hiện trạng", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { name: /Nhà máy điện Sava/ }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Xem kết quả mô phỏng", exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
    await expect(
      page.getByRole("tab", { name: "Thống kê", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/sava-header-${viewport.width}.png`,
    });
    await page.getByRole("link", { name: "Về danh sách nhà máy" }).click();
    await expect(page).toHaveURL("/");
    await expect(card).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/plants\/sava$/);
    await page.reload();
    await expect(
      page.getByRole("tab", { name: "Hiện trạng", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("link", { name: "Về danh sách nhà máy" }),
    ).toBeVisible();
  });
}
