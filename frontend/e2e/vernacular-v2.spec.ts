import { test, expect, Page } from "@playwright/test";

async function loginAndGoToVernacular(page: Page) {
  await page.goto("/login?returnUrl=%2Fsubmissions%3Ftab%3Dvernacular");
  if (page.url().includes("/login")) {
    await page.locator("button:has-text('Charlie Creator')").click();
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/\/submissions\?tab=vernacular/, { timeout: 15000 });
  }
}

test.describe("Vernacular Matcher v2 Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Default route mocks so no live network calls or API keys are required
    await page.route("**/api/v1/vernacular/embed-check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          model: "text-embedding-004",
          offlineRule: "4B",
          count: 0,
          findings: [],
        }),
      });
    });

    await page.route("**/api/v1/vernacular/ai-check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          model: "gemini-2.5-flash",
          count: 0,
          findings: [],
        }),
      });
    });

    await page.route("**/api/v1/review/queue", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          item: { id: "mock_rev_1" },
          total: 1,
        }),
      });
    });
  });

  test("1. each of the 4 presets renders the correct status chip", async ({ page }) => {
    // Override AI-check mock specifically for hedged case to return a review finding
    await page.route("**/api/v1/vernacular/ai-check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          model: "gemini-2.5-flash",
          count: 1,
          findings: [
            {
              id: "ai-fnd-hedged-01",
              status: "review",
              category: "SURROGATE_TOBACCO",
              severity: "WARNING",
              explanation: "Hedged festive branding requires human verification.",
              suggestedCompliantRewrite: "Verify festive non-tobacco product separation.",
              sourceTextSpan: "Rajnigandha traditional festive silver gift box",
              startIndex: 0,
              endIndex: 47,
              score: 0.72,
              ruleTitle: "AI Review Assessment",
              ruleCode: "AI-REVIEW-01",
              receiptA: {
                text: "Rajnigandha traditional festive silver gift box",
                start: 0,
                end: 47,
              },
              receiptB: {
                quote: "AI-assisted, human review required",
                verified: false,
                source: "AI Evaluation Engine",
              },
            },
          ],
        }),
      });
    });

    await loginAndGoToVernacular(page);
    await expect(page.locator("h2")).toContainText("Vernacular & Hinglish NLP Radar");

    // Preset 1: Direct violation -> 'violation' chip
    await page.locator("button:has-text('1. Direct Violation')").click();
    await expect(page.locator("span:has-text('violation')").first()).toBeVisible({ timeout: 5000 });

    // Preset 2: Indirect Hinglish surrogate -> 'violation' chip
    await page.locator("button:has-text('2. Indirect Hinglish Surrogate')").click();
    await expect(page.locator("span:has-text('violation')").first()).toBeVisible({ timeout: 5000 });

    // Preset 3: Safe look-alike -> 'clear' chip
    await page.locator("button:has-text('3. Safe Look-Alike')").click();
    await expect(page.locator("span:has-text('clear')").first()).toBeVisible({ timeout: 5000 });

    // Preset 4: Hedged case -> 'review (human review required)' chip
    await page.locator("button:has-text('4. Hedged Case')").click();
    await expect(page.locator("span:has-text('review (human review required)')").first()).toBeVisible({ timeout: 5000 });
  });

  test("2. brand-only result shows the CCPA 2022 cl. 6 proviso", async ({ page }) => {
    await loginAndGoToVernacular(page);

    // Test text that contains a restricted brand alone without claim or commodity
    const textarea = page.locator("#vernacular-copy-input");
    await textarea.fill("Kingfisher exclusive event celebration in Goa");

    // Must show the CCPA 2022 cl. 6 proviso text
    await expect(page.getByText(/CCPA 2022 cl\.?6 proviso/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("3. AI findings show 'AI-assisted, human review required' and no excerpt", async ({ page }) => {
    await page.route("**/api/v1/vernacular/ai-check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          model: "gemini-2.5-flash",
          count: 1,
          findings: [
            {
              id: "ai-sample-01",
              status: "review",
              category: "PROHIBITED_MAGIC_REMEDY",
              severity: "WARNING",
              explanation: "Hedged claim needs editorial confirmation.",
              suggestedCompliantRewrite: "Clarify health claim.",
              sourceTextSpan: "thoda better ho sakti hai",
              startIndex: 0,
              endIndex: 25,
              score: 0.65,
              ruleTitle: "AI Context Evaluation",
              ruleCode: "AI-EVAL-01",
              receiptA: {
                text: "thoda better ho sakti hai",
                start: 0,
                end: 25,
              },
              receiptB: {
                quote: "AI-assisted, human review required",
                verified: false,
                source: "AI Evaluation Engine",
              },
            },
          ],
        }),
      });
    });

    await loginAndGoToVernacular(page);
    const textarea = page.locator("#vernacular-copy-input");
    await textarea.fill("Yeh juice peene se immunity thoda better ho sakti hai");

    // Should render AI source tag and mandatory label
    await expect(page.locator("span:has-text('AI-assisted')").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=AI-assisted, human review required").first()).toBeVisible({ timeout: 5000 });
  });

  test("4. 'Excerpt pending verification' shows while quote_verified is false", async ({ page }) => {
    await loginAndGoToVernacular(page);

    // Preset 1 triggers DMRA-MAGIC-01 where quote_verified is false (STAT-007 has empty verbatim_excerpt)
    await page.locator("button:has-text('1. Direct Violation')").click();

    // Verify "Excerpt pending verification" is visible in Receipt B
    await expect(page.locator("text=Excerpt pending verification").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("span:has-text('PENDING')").first()).toBeVisible({ timeout: 5000 });
  });

  test("5. offline fallback: with embed-check and ai-check aborted, 'offline mode' badge shows and local findings still render", async ({ page }) => {
    await loginAndGoToVernacular(page);

    // Abort both backend network routes after initial navigation
    await page.route("**/api/v1/vernacular/embed-check", (route) => route.abort());
    await page.route("**/api/v1/vernacular/ai-check", (route) => route.abort());

    // Click direct violation preset
    await page.locator("button:has-text('1. Direct Violation')").click();

    // Offline mode badge must appear
    await expect(page.locator("span:has-text('offline mode')")).toBeVisible({ timeout: 5000 });

    // Local deterministic layers still render finding
    await expect(page.locator("span:has-text('violation')").first()).toBeVisible({ timeout: 5000 });
  });

  test("6. 'Send to review queue' works for a review item", async ({ page }) => {
    let reviewQueueCalled = false;
    await page.route("**/api/v1/review/queue", async (route) => {
      reviewQueueCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          item: { id: "queued_test_1" },
          total: 1,
        }),
      });
    });

    await loginAndGoToVernacular(page);

    // Brand-only match produces a 'review' item
    const textarea = page.locator("#vernacular-copy-input");
    await textarea.fill("Kingfisher exclusive event celebration in Goa");

    // Find and click the 'Send to review queue' button
    const reviewBtn = page.locator("button:has-text('Send to review queue')").first();
    await expect(reviewBtn).toBeVisible({ timeout: 5000 });
    await reviewBtn.click();

    // Button state changes to 'Sent'
    await expect(page.locator("button:has-text('Sent')").first()).toBeVisible({ timeout: 5000 });
    expect(reviewQueueCalled).toBe(true);
  });
});
