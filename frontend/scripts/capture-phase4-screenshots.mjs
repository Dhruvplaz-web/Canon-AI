import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../../docs/ui/screenshots/phase4");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "mobile_375", width: 375, height: 812 },
  { name: "tablet_768", width: 768, height: 1024 },
  { name: "desktop_1280", width: 1280, height: 800 },
  { name: "desktop_1920", width: 1920, height: 1080 },
];

const TARGETS = [
  { slug: "home", path: "/" },
  { slug: "policy", path: "/policy" },
  { slug: "submissions", path: "/submissions", auth: "creator" },
  { slug: "review", path: "/review", auth: "officer" },
  { slug: "governance", path: "/governance", auth: "brand_manager" },
  { slug: "transparency", path: "/transparency" },
  { slug: "audit", path: "/audit" },
  { slug: "demo", path: "/demo" },
];

async function capture() {
  console.log("Launching Chromium for Phase 4 responsive screenshot capture...");
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      console.log(`\n=== Capturing Viewport: ${vp.name} | Theme: ${theme} ===`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      const page = await context.newPage();

      for (const target of TARGETS) {
        // Handle auth if needed
        if (target.auth) {
          await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
          const personaText =
            target.auth === "creator"
              ? "Charlie Creator"
              : target.auth === "officer"
              ? "Legal Officer"
              : "Brenda Brand";

          const personaBtn = page.locator(`button:has-text('${personaText}')`);
          if (await personaBtn.isVisible()) {
            await personaBtn.click();
            await page.locator("button[type='submit']").click();
            await page.waitForTimeout(500);
          }
        }

        const url = `http://localhost:3000${target.path}`;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);

        // Ensure theme class matches
        await page.evaluate((t) => {
          if (t === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
          }
        }, theme);

        await page.waitForTimeout(300);

        const filename = `${target.slug}_${vp.name}_${theme}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`Saved: ${filename}`);
      }

      await context.close();
    }
  }

  await browser.close();
  console.log("\nPhase 4 responsive screenshot capture complete! Output in docs/ui/screenshots/phase4/");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
