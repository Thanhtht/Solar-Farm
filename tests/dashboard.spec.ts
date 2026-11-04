import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, readFileSync } from "node:fs";
import { PNG } from "pngjs";
import { createHash } from "node:crypto";
function difference(a: Buffer, b: Buffer) {
  const x = PNG.sync.read(a),
    y = PNG.sync.read(b);
  expect([x.width, x.height]).toEqual([y.width, y.height]);
  let changed = 0;
  for (let i = 0; i < x.data.length; i += 4)
    if ([0, 1, 2].some((c) => Math.abs(x.data[i + c] - y.data[i + c]) > 25))
      changed++;
  return changed / (x.width * x.height);
}
async function simulate(page: Page, kind: string) {
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption(kind);
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
}
async function open(page: Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-device-projections",
    /INV-01/,
    { timeout: 20000 },
  );
  await expect(page.getByText("Đang chuẩn bị nhà máy 3D…")).toHaveCount(0, {
    timeout: 20000,
  });
}
async function waitFocus(page: Page, previous: string | null, id: string) {
  const canvas = page.locator("canvas");
  await expect
    .poll(() => canvas.getAttribute("data-focus-request"))
    .not.toBe(previous);
  await expect(canvas).toHaveAttribute("data-focus-target", id);
  await expect(canvas).toHaveAttribute("data-camera-moving", "false", {
    timeout: 15000,
  });
}
async function select(page: Page, id: string) {
  const toggle = page.getByRole("button", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  if ((await toggle.getAttribute("aria-expanded")) !== "true")
    await toggle.click();
  const old = await page.locator("canvas").getAttribute("data-focus-request");
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: id, exact: true })
    .click();
  await waitFocus(page, old, id);
  await page.locator(".scene-panel").scrollIntoViewIfNeeded();
  await expect(page.locator(".hud-identity")).toContainText(id);
}

test("Camera xoay/zoom/reset và tự focus khi chọn thiết bị", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await select(page, "INV-01");
  const canvas = page.locator("canvas");
  await page.getByRole("button", { name: "Ẩn hồ sơ thiết bị" }).click();
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  const rect = await canvas.boundingBox();
  if (!rect) throw Error("No canvas");
  await page.waitForTimeout(600);
  const original = await canvas.screenshot();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.7,
    rect.y + rect.height * 0.55,
    { steps: 10 },
  );
  await page.mouse.up();
  await page.waitForTimeout(900);
  const rotated = await canvas.screenshot();
  expect(rotated.equals(original)).toBe(false);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.waitForTimeout(900);
  const reset = await canvas.screenshot();
  writeFileSync("test-results/camera-reset.png", reset);
  expect(difference(original, reset)).toBeLessThan(0.02);
  const { position: panFrom, target: targetFrom } = await canvas.evaluate(
    (el) => ({
      position: JSON.parse(el.getAttribute("data-camera-position")!),
      target: JSON.parse(el.getAttribute("data-camera-target")!),
    }),
  );
  await page.mouse.move(rect.x + rect.width * 0.4, rect.y + rect.height * 0.6);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(
    rect.x + rect.width * 0.53,
    rect.y + rect.height * 0.47,
    { steps: 8 },
  );
  await page.mouse.up({ button: "right" });
  await page.waitForTimeout(900);
  // Read camera and target atomically: OrbitControls damping may still be
  // producing frames, so separate DOM requests can sample different moments.
  const { position: panTo, target: targetTo } = await canvas.evaluate((el) => ({
    position: JSON.parse(el.getAttribute("data-camera-position")!),
    target: JSON.parse(el.getAttribute("data-camera-target")!),
  }));
  expect(
    Math.hypot(...targetTo.map((n: number, i: number) => n - targetFrom[i])),
  ).toBeGreaterThan(1);
  expect(
    Math.hypot(
      ...panTo.map(
        (n: number, i: number) =>
          n - panFrom[i] - (targetTo[i] - targetFrom[i]),
      ),
    ),
  ).toBeLessThan(0.02);
  await expect(page.locator(".ai-mention")).toContainText("INV-01");
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-camera-target"))!),
    )
    .toEqual(targetFrom);
  await page.waitForTimeout(600);
  expect(difference(original, await canvas.screenshot())).toBeLessThan(0.02);
  const initial = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  await select(page, "PV-02");
  const focused = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  const distance = (p: number[]) => Math.hypot(p[0] + 6, p[1], p[2] + 8.5);
  expect(distance(focused)).toBeLessThan(distance(initial) * 0.8);
  const focusedTarget = JSON.parse(
    (await canvas.getAttribute("data-camera-target"))!,
  );
  expect(
    Math.hypot(...focused.map((n: number, i: number) => n - focusedTarget[i])),
  ).toBeCloseTo(32.8 / 1.5, 1);
  await expect(page.locator(".scene-hud")).toBeVisible();
  await expect(page.locator(".scene-hud svg.trend")).toHaveCount(0);
  await page.getByRole("button", { name: "Ẩn hồ sơ thiết bị" }).click();
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  await page.getByRole("button", { name: "Hiện hồ sơ" }).click();
  await expect(page.locator(".scene-hud h2")).toHaveText("Cụm pin 02");
  await page.screenshot({ path: "test-results/hud-focus.png" });
  await select(page, "INV-03");
  const inverterPosition = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  const inverterTarget = JSON.parse(
    (await canvas.getAttribute("data-camera-target"))!,
  );
  expect(
    Math.hypot(
      ...inverterPosition.map((n: number, i: number) => n - inverterTarget[i]),
    ),
  ).toBeCloseTo(24.8 / 1.5, 1);
});

test("Hover mở nhãn, không chọn thiết bị hoặc kéo camera", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const canvas = page.locator("canvas");
  const initial = await canvas.getAttribute("data-camera-position");
  const initialImage = await canvas.screenshot({
    style: ".scene-label{visibility:hidden!important}",
  });
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  for (const [id, reading] of [
    ["INV-03", "0"],
    ["PV-06", "58"],
    ["PV-02", "Bình thường"],
  ]) {
    const rect = await canvas.boundingBox();
    const positions = JSON.parse(
      (await canvas.getAttribute("data-device-projections"))!,
    );
    await page.mouse.move(
      rect!.x + positions[id][0] * rect!.width,
      rect!.y + positions[id][1] * rect!.height,
    );
    await expect(page.getByRole("tooltip")).toContainText(id);
    await expect(page.getByRole("tooltip")).toContainText(reading);
    await expect(page.locator(".scene-hud")).toHaveCount(0);
    expect(await canvas.getAttribute("data-camera-position")).toBe(initial);
    // Locator screenshots include HTML overlays: hide the expected tooltip while comparing roads.
    expect(
      difference(
        initialImage,
        await canvas.screenshot({
          style: ".scene-label{visibility:hidden!important}",
        }),
      ),
    ).toBeLessThan(0.00001);
    await page.screenshot({ path: `test-results/hover-${id}.png` });
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  }
  await select(page, "INV-03");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("HUD ngắn gọn, popup chi tiết, bàn phím và khu vực AI", async ({
  page,
}) => {
  await open(page);
  await select(page, "PV-06");
  const hud = page.locator(".scene-hud");
  await expect(hud).toHaveClass(/warning/);
  await expect(hud).toContainText("Nhiệt độ");
  await expect(hud).toContainText("58");
  await expect(hud).toContainText("Lưu ý");
  await expect(hud.locator("dl>div").first()).toHaveClass(
    /hud-attention warning/,
  );
  await expect(hud.locator(".hud-attention dd")).toContainText("58");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(hud.locator("dl>div")).toHaveCount(4);
  await expect(hud.locator(".relations")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText("Cụm pin 06");
  await expect(dialog.getByRole("img", { name: /Nhiệt độ/ })).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveCount(4);
  await expect(
    dialog.locator(".device-trend-card.warning .trend-current"),
  ).toContainText("58");
  expect(
    await dialog
      .locator(".device-trends")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(2);
  const canvasBox = await page.locator("canvas").boundingBox(),
    box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(canvasBox!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    canvasBox!.x + canvasBox!.width,
  );
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await dialog
    .locator(".relations")
    .getByRole("button", { name: "INV-06", exact: true })
    .click();
  await expect(dialog.locator("h2")).toHaveText("Inverter 06");
  await page.screenshot({ path: "test-results/device-dialog.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Xem chi tiết", exact: true }),
  ).toBeFocused();
  const ai = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(ai).toContainText("INV-06");
  await expect(ai).toContainText("Hội thoại API chưa được cấu hình");
  await expect(ai.locator("textarea")).toBeDisabled();
  await expect(ai.getByRole("button", { name: "Gửi câu hỏi" })).toBeDisabled();
  await expect(ai.locator(".device-summary")).toHaveCount(0);
  await select(page, "INV-03");
  await expect(hud).toHaveClass(/critical/);
  await expect(hud).toContainText("1,08 MWh");
  await expect(hud).toContainText("Cảnh báo");
  await expect(hud.locator("dl>div").first()).toHaveClass(
    /hud-attention critical/,
  );
  await expect(hud.locator(".hud-attention dd")).toContainText("0");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.screenshot({ path: "test-results/critical-hud.png" });
});

test("GLB tải một lần, click 5 loại, cảnh báo và vật liệu độc lập", async ({
  page,
}) => {
  test.setTimeout(90000);
  const loaded = new Set<string>(),
    requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".glb")) requests.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().endsWith(".glb") && r.ok()) loaded.add(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect.poll(() => loaded.size).toBe(16);
  expect(requests.length).toBe(16);
  const canvas = page.locator("canvas");
  await expect
    .poll(() => canvas.getAttribute("data-device-projections"))
    .not.toBeNull();
  const original = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  for (const id of ["PV-02", "INV-03", "TR-01", "MET-01", "GW-01"]) {
    await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
    await expect
      .poll(async () => {
        const p = JSON.parse(
          (await canvas.getAttribute("data-camera-position"))!,
        );
        return Math.hypot(...p.map((n: number, i: number) => n - original[i]));
      })
      .toBeLessThan(0.1);
    const positions = JSON.parse(
        (await canvas.getAttribute("data-device-projections"))!,
      ),
      rect = await canvas.boundingBox();
    if (!rect) throw Error("Canvas");
    const old = await canvas.getAttribute("data-focus-request");
    // Use the real projected model position, including any HTML label above it.
    await page.mouse.click(
      rect.x + positions[id][0] * rect.width,
      rect.y + positions[id][1] * rect.height,
    );
    await waitFocus(page, old, id);
    await expect(page.locator(".hud-identity")).toContainText(id);
    await page
      .getByRole("button", { name: "Xem chi tiết", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("img")).toHaveCount(
      id.startsWith("PV-") || id.startsWith("INV-")
        ? 4
        : id === "MET-01"
          ? 3
          : 2,
    );
    await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  }
  const outlines = JSON.parse(
    (await canvas.getAttribute("data-device-outlines"))!,
  );
  expect(Object.keys(outlines)).toHaveLength(19);
  expect(Object.values(outlines).filter((c) => c === "19a86b")).toHaveLength(
    15,
  );
  const footprintBounds = JSON.parse(
    (await canvas.getAttribute("data-footprint-bounds"))!,
  );
  const audit = JSON.parse(readFileSync("docs/3D_ASSET_AUDIT.json", "utf8"));
  for (const [id, name] of [
    ["PV-02", "pv-block"],
    ["INV-03", "inverter"],
    ["TR-01", "transformer-station"],
    ["MET-01", "weather-station"],
    ["GW-01", "iot-gateway"],
  ]) {
    const model = audit.assets.find((a: { file: string }) =>
      a.file.endsWith(`/${name}.glb`),
    );
    const [minX, maxX, minZ, maxZ] = footprintBounds[id];
    expect(minX).toBeLessThan(model.min[0]);
    expect(minX).toBeGreaterThan(model.min[0] - 0.7);
    expect(maxX).toBeGreaterThan(model.max[0]);
    expect(maxX).toBeLessThan(model.max[0] + 0.7);
    expect(minZ).toBeLessThan(model.min[2]);
    expect(minZ).toBeGreaterThan(model.min[2] - 0.7);
    expect(maxZ).toBeGreaterThan(model.max[2]);
    expect(maxZ).toBeLessThan(model.max[2] + 0.7);
  }
  await expect(page.locator(".device-alert")).toHaveCount(0);
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-outlines"))!),
    )
    .toMatchObject({
      "INV-03": "e44538",
      "PV-06": "e9b323",
      "INV-06": "e9b323",
      "GW-01": "e9b323",
    });
  const base = JSON.parse((await canvas.getAttribute("data-device-colors"))!);
  expect(base["INV-03"]).toBe(base["INV-02"]);
  expect(base["PV-06"]).toBe(base["PV-05"]);
  await select(page, "PV-02");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await select(page, "PV-03");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await select(page, "INV-03");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await select(page, "PV-06");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-outlines"))!),
    )
    .toMatchObject({
      "INV-03": "e44538",
      "PV-06": "e9b323",
      "INV-06": "e9b323",
      "GW-01": "e9b323",
    });
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.waitForTimeout(700);
  await simulate(page, "dust");
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-outlines"))!),
    )
    .toMatchObject({ "PV-01": "e9b323", "INV-01": "e9b323" });
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-device-colors"))!)["PV-01"],
    )
    .not.toBe(base["PV-01"]);
  const dustColors = JSON.parse(
    (await canvas.getAttribute("data-device-colors"))!,
  );
  expect(dustColors["PV-02"]).toBe(base["PV-02"]);
  expect(dustColors["INV-01"]).toBe(base["INV-01"]);
  await expect(
    page.getByText("Bám bụi · PV-01", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/dust-preview.png" });

  await simulate(page, "fault");
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-outlines"))!),
    )
    .toMatchObject({ "PV-01": "e44538", "INV-01": "e44538" });
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await simulate(page, "cloud");
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-cloud-assets"))!),
    )
    .toEqual(["PV-01", "PV-02", "PV-05", "PV-06"]);
  const frame = await page.locator(".scene-panel").boundingBox();
  const setup = await page
    .getByRole("region", { name: "Thiết lập mô phỏng" })
    .boundingBox();
  expect(setup!.y + setup!.height).toBeLessThanOrEqual(frame!.y);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/cloud-preview.png" });
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-cloud-assets"))!),
    )
    .toEqual([]);
  await expect(
    page.getByRole("region", { name: "Chọn kịch bản mô phỏng" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Bố cục desktop/mobile, thiết lập và kết quả gọn phía trên", async ({
  page,
}) => {
  await open(page);
  await simulate(page, "cloud");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const centered = await page.locator(".topbar").evaluate((el) => {
      const heading = el.getBoundingClientRect(),
        tabs = el.querySelector('[role="tablist"]')!.getBoundingClientRect();
      return Math.abs(
        tabs.left + tabs.width / 2 - (heading.left + heading.width / 2),
      );
    });
    expect(centered).toBeLessThanOrEqual(2);
    await expect
      .poll(async () => {
        const b = await page.locator(".scene-panel").boundingBox();
        return b!.y + b!.height;
      })
      .toBeLessThanOrEqual(viewport.height);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const frame = document
            .querySelector(".scene-panel")!
            .getBoundingClientRect();
          const ai = document
            .querySelector(".ai-panel")!
            .getBoundingClientRect();
          return Math.max(
            Math.abs(ai.height - frame.height),
            Math.abs(ai.y - frame.y),
          );
        }),
      )
      .toBeLessThanOrEqual(1);
    const bounds = await page.locator(".simulation-setup").boundingBox();
    for (const control of await page
      .locator(
        ".simulation-setup button,.simulation-setup select,.setup-metrics > div",
      )
      .all()) {
      const box = await control.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        bounds!.x + bounds!.width,
      );
    }
    await page.screenshot({ path: `test-results/setup-${viewport.width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await select(page, "INV-03");
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveCount(4);
  await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await page.screenshot({
    path: "test-results/setup-mobile.png",
    fullPage: true,
  });
});

test("WebGL không khả dụng vẫn chọn được thiết bị và xem popup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...(args as []));
    } as typeof original;
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(
    page.getByText("WebGL chưa khả dụng", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "MET-01", exact: true })
    .click();
  await expect(page.locator(".hud-identity")).toContainText("MET-01");
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.getByRole("dialog").locator("h2")).toHaveText(
    "Trạm thời tiết",
  );
});

test("Model tải lỗi có thể thử lại", async ({ page }) => {
  let failed = false;
  await page.route("**/inverter/inverter.glb", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 503, body: "Temporary error" });
    } else await route.continue();
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(
    page.getByText("Không thể tải cảnh 3D", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Thử lại cảnh 3D" }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-device-projections",
    /INV-01/,
    { timeout: 20000 },
  );
});

test("Chỉ viền thiết bị chọn nhấp nháy, chuyển chọn và giảm chuyển động", async ({
  page,
}) => {
  await open(page);
  await select(page, "PV-06");
  await expect(page.locator(".selection-marker")).toHaveText(
    "Đang chọn · PV-06",
  );
  const opacity = async () =>
    JSON.parse(
      (await page.locator("canvas").getAttribute("data-outline-opacity"))!,
    );
  const first = await opacity();
  await expect
    .poll(async () => Math.abs((await opacity())["PV-06"] - first["PV-06"]))
    .toBeGreaterThan(0.1);
  expect((await opacity())["PV-05"]).toBe(0.95);
  await select(page, "INV-03");
  await expect(page.locator(".selection-marker")).toHaveText(
    "Đang chọn · INV-03",
  );
  await expect.poll(async () => (await opacity())["PV-06"]).toBe(0.95);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => (await opacity())["INV-03"]).toBe(1);
  await page.screenshot({ path: "test-results/selection-marker.png" });
});
