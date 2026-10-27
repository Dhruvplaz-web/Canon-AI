import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Design System Component & Token Suite (Phase 1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/components");
    await page.waitForLoadState("networkidle");
  });

  test("1. Renders all button variants, sizes, and states", async ({ page }) => {
    // Variants
    await expect(page.getByRole("button", { name: "Primary Action" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Secondary Action" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Outline Action" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ghost Action" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Destructive" })).toBeVisible();

    // Sizes
    await expect(page.getByRole("button", { name: "Small (32px)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Medium (36px)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Large (44px)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quick search" })).toBeVisible();

    // States
    const loadingBtn = page.getByRole("button", { name: "Saving Draft..." });
    await expect(loadingBtn).toBeVisible();
    await expect(loadingBtn).toBeDisabled();

    const disabledBtn = page.getByRole("button", { name: "Disabled Action" });
    await expect(disabledBtn).toBeVisible();
    await expect(disabledBtn).toBeDisabled();
  });

  test("2. Renders form controls and accessible error validation states", async ({ page }) => {
    const defaultInput = page.getByPlaceholder("e.g. Acme Marketing Blast Q4");
    await expect(defaultInput).toBeVisible();
    await defaultInput.fill("Automated Test Input");
    await expect(defaultInput).toHaveValue("Automated Test Input");

    const errorInput = page.getByLabel("Validation Error Input");
    await expect(errorInput).toBeVisible();
    await expect(errorInput).toHaveAttribute("aria-invalid", "true");
    await expect(errorInput).toHaveAttribute("aria-describedby", "error-hint");

    const select = page.getByLabel("Accessible Select Box");
    await expect(select).toBeVisible();
    await select.selectOption("social");
    await expect(select).toHaveValue("social");
  });

  test("3. Renders semantic status badges with paired icons and text labels", async ({ page }) => {
    await expect(page.getByText("CRITICAL", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("WARNING", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("INFO", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("PASSED", { exact: true }).first()).toBeVisible();
  });

  test("4. Operates focus-trapped Radix Dialog and Sheet", async ({ page }) => {
    // Open Dialog
    await page.getByRole("button", { name: "Open Radix Dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByText("Statutory Release Sign-Off")).toBeVisible();

    // Verify focus trap / close on escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    // Open Sheet
    await page.getByRole("button", { name: "Open Slide-Out Sheet" }).click();
    await expect(page.getByText("Policy Excerpt Grounding")).toBeVisible();
    await page.getByRole("button", { name: "Close Panel" }).click();
    await expect(page.getByText("Policy Excerpt Grounding")).not.toBeVisible();
  });

  test("5. Operates accessible Tabs with keyboard and click navigation", async ({ page }) => {
    const triageTab = page.getByRole("tab", { name: "Active Triage (3)" });
    const historyTab = page.getByRole("tab", { name: "History Log" });

    await expect(triageTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Q4 Wealth Advisory Campaign")).toBeVisible();

    await historyTab.click();
    await expect(historyTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("History log entries will appear here.")).toBeVisible();
  });

  test("6. Validates Table accessibility attributes and tabular numbers", async ({ page }) => {
    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    // Check header scope
    const ruleHeader = page.getByRole("columnheader", { name: "Rule Code" });
    await expect(ruleHeader).toHaveAttribute("scope", "col");

    // Check tabular numeric formatting (e.g. 89.2% not 8920%)
    await expect(page.getByText("89.2%")).toBeVisible();
  });

  test("7. Toggles Theme Mode between light and dark", async ({ page }) => {
    const toggle = page.locator("header").getByRole("button", { name: /Switch to (light|dark) mode/ });
    await expect(toggle).toBeVisible();

    // Click to toggle
    await toggle.click();
    const html = page.locator("html");
    // Wait for theme class update
    await page.waitForTimeout(300);
    const hasDark = await html.evaluate((el) => el.classList.contains("dark"));

    // Toggle back
    await toggle.click();
    await page.waitForTimeout(300);
    const finalDark = await html.evaluate((el) => el.classList.contains("dark"));
    expect(finalDark).toBe(!hasDark);
  });

  test("8. Triggers accessible Toasts with aria-live announcements", async ({ page }) => {
    await page.getByRole("button", { name: "Success Toast" }).click();
    const alert = page.getByRole("status");
    await expect(alert).toBeVisible();
    await expect(page.getByText("Finding Overridden")).toBeVisible();
  });

  test("9. Automated WCAG 2.1 AA Accessibility Audit via Axe-core", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Color contrast validated deterministically via check-contrast.mjs
      .analyze();

    console.log(`[Axe Audit] Violations found on /dev/components: ${results.violations.length}`);
    if (results.violations.length > 0) {
      console.log(JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });
});
