import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/login",
  "/policy",
  "/transparency",
  "/demo",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/audit",
  "/dev/components",
];

test.describe("Full Link Crawl & Visual UAT (Phase 4)", () => {
  for (const route of ROUTES) {
    test(`Route ${route} returns 200 and renders cleanly`, async ({ page }) => {
      const response = await page.goto(`http://localhost:3000${route}`);
      expect(response?.status()).toBe(200);

      // Verify no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify basic headings exist
      const h1 = page.locator("h1");
      await expect(h1).toBeAttached();
    });
  }

  test("Axe-core Accessibility Audit on Core Platform Views", async ({ page }) => {
    // 1. Audit Home Dashboard
    await page.goto("http://localhost:3000/");
    await page.waitForSelector("h1");
    let results = await new AxeBuilder({ page })
      .exclude("nextjs-portal")
      .disableRules(["color-contrast"]) // Checked deterministically via scripts/check-contrast.mjs
      .analyze();
    expect(results.violations).toEqual([]);

    // 2. Audit Policy Explorer
    await page.goto("http://localhost:3000/policy");
    await page.waitForSelector("h1");
    results = await new AxeBuilder({ page })
      .exclude("nextjs-portal")
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);

    // 3. Audit Demo Tour
    await page.goto("http://localhost:3000/demo");
    await page.waitForSelector("h1");
    results = await new AxeBuilder({ page })
      .exclude("nextjs-portal")
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);

    // 4. Audit Transparency
    await page.goto("http://localhost:3000/transparency");
    await page.waitForSelector("h1");
    results = await new AxeBuilder({ page })
      .exclude("nextjs-portal")
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);

    // 5. Audit Audit Ledger
    await page.goto("http://localhost:3000/audit");
    await page.waitForSelector("h1");
    results = await new AxeBuilder({ page })
      .exclude("nextjs-portal")
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
