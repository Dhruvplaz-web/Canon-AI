import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const VIEWPORTS = [
  { name: "375_mobile", width: 375, height: 812 },
  { name: "768_tablet", width: 768, height: 1024 },
  { name: "1280_desktop", width: 1280, height: 800 },
  { name: "1920_ultrawide", width: 1920, height: 1080 },
];

const OUTPUT_DIR = path.resolve("..", "docs", "ui", "screenshots", "phase1");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.describe("Phase 1 Responsive Screenshot Matrix", () => {
  for (const vp of VIEWPORTS) {
    test(`Capture /dev/components at ${vp.width}px (Light & Dark)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dev/components");
      await page.waitForLoadState("networkidle");

      // 1. Light Theme Capture
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
      });
      await page.waitForTimeout(500);
      const lightFile = path.join(OUTPUT_DIR, `showcase_${vp.name}_light.png`);
      await page.screenshot({ path: lightFile, fullPage: true });

      // 2. Dark Theme Capture
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });
      await page.waitForTimeout(500);
      const darkFile = path.join(OUTPUT_DIR, `showcase_${vp.name}_dark.png`);
      await page.screenshot({ path: darkFile, fullPage: true });
    });
  }
});
