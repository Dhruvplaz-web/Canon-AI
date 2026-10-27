import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  { name: "375_mobile", width: 375, height: 812 },
  { name: "768_tablet", width: 768, height: 1024 },
  { name: "1280_desktop", width: 1280, height: 800 },
  { name: "1920_ultrawide", width: 1920, height: 1080 },
];

const OUTPUT_DIR = path.resolve("docs/ui/screenshots/phase1");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("=== CAPTURING PHASE 1 DESIGN SYSTEM SCREENSHOTS ===");

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("http://localhost:3000/dev/components");
    await page.waitForLoadState("networkidle");

    // 1. Light Mode Screenshot
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
    await page.waitForTimeout(400);
    const lightPath = path.join(OUTPUT_DIR, `showcase_${vp.name}_light.png`);
    await page.screenshot({ path: lightPath, fullPage: true });
    console.log(`[SAVED] ${lightPath}`);

    // 2. Dark Mode Screenshot
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(400);
    const darkPath = path.join(OUTPUT_DIR, `showcase_${vp.name}_dark.png`);
    await page.screenshot({ path: darkPath, fullPage: true });
    console.log(`[SAVED] ${darkPath}`);
  }

  await browser.close();
  console.log("Screenshot matrix capture complete: 8 images saved.");
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
