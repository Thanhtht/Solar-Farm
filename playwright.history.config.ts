import { defineConfig } from "@playwright/test";

// Calculation-only suite: no production server, browser, AI or network required.
export default defineConfig({
  testDir: "./tests",
  testMatch: "performance-history.spec.ts",
  workers: 1,
});
