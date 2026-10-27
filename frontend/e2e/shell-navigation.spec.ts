import { test, expect } from "@playwright/test";

test.describe("App Shell & Navigation (Phase 2)", () => {
  test("Skip to main content link works and gains visible focus", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    const skipLink = page.locator("a[href='#main-content']");
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test("Unauthenticated access to protected route redirects to login with returnUrl", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("http://localhost:3000/submissions");
    await page.waitForURL(/\/login\?returnUrl=%2Fsubmissions/);
    expect(page.url()).toContain("/login?returnUrl=%2Fsubmissions");
  });

  test("Open redirect attack via returnUrl is sanitized", async ({ page, context }) => {
    await context.clearCookies();
    // Attempt open redirect via protocol-relative URL
    await page.goto("http://localhost:3000/login?returnUrl=//evil.com");
    // Click demo persona fill
    await page.locator("button:has-text('Charlie Creator')").click();
    await page.locator("button[type='submit']").click();
    // Must redirect to '/' instead of external host
    await page.waitForURL("http://localhost:3000/");
    expect(page.url()).toBe("http://localhost:3000/");
  });

  test("Keyboard shortcuts dialog opens via shortcut and button, closes on Escape", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("domcontentloaded");

    // Open via button in footer
    const footerShortcutBtn = page.getByRole("button", { name: /Shortcuts \(\?\)/ });
    await expect(footerShortcutBtn).toBeVisible();
    await footerShortcutBtn.click();

    const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
    await expect(dialog).toBeVisible();

    // Close on Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    // Open via '?' keyboard shortcut
    await page.keyboard.press("?");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("Status footer renders operational health probe", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/API: Operational/)).toBeVisible({ timeout: 10000 });
  });

  test("Creator role sees Author Copy and does not see Rule Health in Nav", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.locator("button:has-text('Charlie Creator')").click();
    await page.locator("button[type='submit']").click();
    await page.waitForURL("http://localhost:3000/");

    // Check navbar links
    const nav = page.locator("nav[aria-label='Main Navigation']");
    await expect(nav.getByRole("link", { name: "Author Copy" })).toBeVisible();
    // Rule Health should NOT be visible for creator
    await expect(nav.getByRole("link", { name: "Rule Health & Backtest" })).not.toBeVisible();
  });
});
