import { test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const VIEWPORTS = [
  { width: 375, height: 812, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1280, height: 800, name: "desktop" },
  { width: 1920, height: 1080, name: "wide" },
];

test("Capture Phase 2 responsive screenshots", async ({ page }) => {
  const outputDir = path.resolve(process.cwd(), "../docs/ui/screenshots/phase2");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    // Light mode
    await page.goto("http://localhost:3000/");
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, `${vp.name}-light.png`),
      fullPage: true,
    });

    // Dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, `${vp.name}-dark.png`),
      fullPage: true,
    });
  }
});
