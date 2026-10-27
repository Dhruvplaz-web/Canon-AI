# Phase 1: Canon Enterprise Design System Specification & Verification Report
**Document ID:** `docs/ui/01_design_system.md`  
**Task Reference:** `TSK-UI-PRO`  
**Status:** Complete · Pending Written Approval to Proceed to Phase 2 (Hard Gate)  
**Timestamp:** October 28, 2026

---

## 1. Executive Summary & Design System Architecture

Phase 1 establishes the unified design system foundation for Canon in accordance with **Engineering Standards Section 2, 3, and 5.3**, replacing the fragmented ad-hoc styling and arbitrary Tailwind values with strict, reusable tokens and accessible primitives.

### Core Architectural Deliverables
1. **Design Tokens (`src/lib/tokens.ts` & `src/app/globals.css`):**
   - Centralized CSS custom properties for Light and Dark themes.
   - Strict 8-point spatial rhythm (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
   - Semantic color tokens: Surface, Surface Elevated, Text Primary, Text Muted, Brand Primary.
   - Semantic severity color pairs (Critical, Warning, Info, Success) each verified to satisfy WCAG 2.1 AA (contrast $\ge 4.5:1$).
   - Layout-preserving reduced motion support (`prefers-reduced-motion: reduce`).
   - Tabular figures (`tabular-nums`) for numbers, percentages, and timestamps.
2. **Provider Infrastructure (`src/app/layout.tsx`):**
   - `ThemeProvider` (`next-themes`) supporting Light, Dark, and System modes with zero hydration mismatch.
   - `QueryProvider` (`@tanstack/react-query`) with caching, request deduplication, and retry logic.
   - `ToastProvider` for accessible status announcements (`aria-live="polite"`).
3. **Shared Headless Primitives (`src/components/ui/`):**
   - `Button.tsx`: Variants (`primary`, `secondary`, `outline`, `ghost`, `destructive`), sizes (`sm`, `md`, `lg`, `icon`), states (`hover`, `focus-visible`, `active`, `disabled`, `isLoading` spinner).
   - `Input.tsx`: Semantic `<input>` with error validation state (`aria-invalid`, `aria-describedby`).
   - `Select.tsx`: Accessible `<select>` with custom styling and Chevron indicator.
   - `Badge.tsx`: Semantic status and category pills.
   - `StatusBadge.tsx`: Strict severity badges pairing explicit text labels with icons (`CRITICAL`, `WARNING`, `INFO`, `PASSED`).
   - `Dialog.tsx`: Radix Dialog with real focus trap, focus restoration on close, and Escape key dismissal.
   - `Sheet.tsx`: Radix Drawer primitive for mobile navigation and rule grounding sidebars.
   - `Tabs.tsx`: Radix Tabs with ARIA roles (`tablist`, `tab`, `tabpanel`) and arrow-key navigation.
   - `Tooltip.tsx`: Delayed accessible hover/focus announcements.
   - `DropdownMenu.tsx`: Radix DropdownMenu for user profiles and action lists with keyboard traversal.
   - `Table.tsx`: Accessible table with `<caption>`, `<th scope="col">`, and `tabular-nums`.
   - `Skeleton.tsx`: Layout-preserving pulsing skeleton loader with reduced-motion containment.
   - `Breadcrumb.tsx`: Semantic breadcrumb trail with `aria-current="page"`.
   - `EmptyState.tsx`: Complete empty view with illustrative icon, description, and primary CTA.
   - `ErrorState.tsx`: Fault-isolated error card with `role="alert"` and inline retry action.
   - `Toast.tsx`: Non-intrusive bottom-right toast notifications.
4. **Developer Showcase Page (`src/app/dev/components/page.tsx`):**
   - Interactive living documentation demonstrating every component and state.
   - Protected by production guard (`if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_DEV_SHOWCASE !== "true") notFound()`).

---

## 2. Token Architecture & Mathematical Verification

### A. Color Palette Matrix (WCAG 2.1 AA Validated)

Contrast ratios were calculated deterministically via `scripts/check-contrast.mjs` against WCAG 2.1 AA requirements ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text/borders):

| Semantic Token | Light Mode Hex | Light Ratio | Dark Mode Hex | Dark Ratio | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text Primary on Surface** | `#111827` on `#ffffff` | **17.74:1** | `#fafafa` on `#18181b` | **16.97:1** | `PASS (AAA)` |
| **Text Secondary on Surface** | `#374151` on `#ffffff` | **10.31:1** | `#d4d4d8` on `#18181b` | **11.99:1** | `PASS (AAA)` |
| **Text Muted on Surface** | `#4b5563` on `#ffffff` | **7.56:1** | `#a1a1aa` on `#18181b` | **6.91:1** | `PASS (AA)` |
| **Brand Primary on Surface** | `#1d4ed8` on `#ffffff` | **6.70:1** | `#60a5fa` on `#18181b` | **6.97:1** | `PASS (AA)` |
| **Text Primary on Canvas** | `#111827` on `#f8f9fa` | **16.83:1** | `#fafafa` on `#09090b` | **19.06:1** | `PASS (AAA)` |
| **Critical Text on Critical Bg** | `#b91c1c` on `#fef2f2` | **5.91:1** | `#fca5a5` on `#450a0a` | **8.51:1** | `PASS (AA)` |
| **Warning Text on Warning Bg** | `#92400e` on `#fffbeb` | **6.84:1** | `#fde68a` on `#451a03` | **12.03:1** | `PASS (AAA)` |
| **Info Text on Info Bg** | `#1d4ed8` on `#eff6ff` | **6.16:1** | `#93c5fd` on `#172554` | **8.15:1** | `PASS (AA)` |
| **Success Text on Success Bg** | `#15803d` on `#f0fdf4` | **4.79:1** | `#86efac` on `#052e16` | **10.62:1** | `PASS (AA)` |
| **Button Text Inverse on Brand** | `#ffffff` on `#2563eb` | **5.17:1** | `#ffffff` on `#2563eb` | **5.17:1** | `PASS (AA)` |

*Result:* **20/20 token pairs passed WCAG 2.1 AA requirements (0 failures).**

### B. Strict 8-Point Spatial Scale

All layout padding, margins, and component heights strictly adhere to the 8pt rhythm:
- `px1`: `4px` (subtle gaps, icon padding)
- `px2`: `8px` (form padding, compact gaps)
- `px3`: `12px` (input padding, card margins)
- `px4`: `16px` (container margins, standard card padding)
- `px6`: `24px` (section spacing, dialog padding)
- `px8`: `32px` (page section rhythm)
- `px12`: `48px` (major landmark separations)
- `px16`: `64px` (hero and footer spacing)

---

## 3. Tool-Measured Verification & Quality Gates

In strict accordance with the Hard Gates ("Never claim accessible, WCAG compliant, or production ready without a tool-produced result. Report what was measured"):

### 1. Playwright Component & Integration Suite (`e2e/design-system.spec.ts`)
Executed against `http://localhost:3000/dev/components`:
- `ok 1`: Renders all button variants, sizes, and states (14.4s)
- `ok 2`: Renders form controls and accessible error validation states (3.2s)
- `ok 3`: Renders semantic status badges with paired icons and text labels (2.8s)
- `ok 4`: Operates focus-trapped Radix Dialog and Sheet (5.2s)
- `ok 5`: Operates accessible Tabs with keyboard and click navigation (6.2s)
- `ok 6`: Validates Table accessibility attributes and tabular numbers (3.1s)
- `ok 7`: Toggles Theme Mode between light and dark (3.4s)
- `ok 8`: Triggers accessible Toasts with aria-live announcements (3.2s)
- `ok 9`: Automated WCAG 2.1 AA Accessibility Audit via Axe-core (4.3s)  
**Total Result:** `9 passed (54.4s)`, `0 failed`.

### 2. Automated Axe-Core Accessibility Audit
- **Rule Set:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`
- **Measured Violations on `/dev/components`:** **`0 violations`**
- **Remediations Verified:** Resolved WCAG 2.5.3 (Label in Name) on navigation branding link by associating `aria-hidden="true"` with the logo container and letting text content define the accessible name.

### 3. Static Type Analysis & Linters
- **TypeScript (`pnpm exec tsc --noEmit`):** Exit code `0` (0 errors).
- **ESLint (`pnpm exec eslint` on all Phase 1 files):** Exit code `0` (0 errors, 0 warnings).
- **Next.js Production Build (`pnpm run build`):** Exit code `0` (all 34 static and dynamic routes compiled successfully).

### 4. Responsive Screenshot Matrix (8 Images Captured)
Screenshots were captured via Playwright at all 4 responsive breakpoints in both Light and Dark modes and saved to `docs/ui/screenshots/phase1/`:
- `showcase_375_mobile_light.png` (375px mobile, light theme) — 234 KB
- `showcase_375_mobile_dark.png` (375px mobile, dark theme) — 231 KB
- `showcase_768_tablet_light.png` (768px tablet, light theme) — 253 KB
- `showcase_768_tablet_dark.png` (768px tablet, dark theme) — 249 KB
- `showcase_1280_desktop_light.png` (1280px desktop, light theme) — 249 KB
- `showcase_1280_desktop_dark.png` (1280px desktop, dark theme) — 246 KB
- `showcase_1920_ultrawide_light.png` (1920px ultrawide, light theme) — 260 KB
- `showcase_1920_ultrawide_dark.png` (1920px ultrawide, dark theme) — 257 KB

*All breakpoints verify zero horizontal overflow, visible focus indicators, legible typography, and consistent 8pt spacing.*

---

## 4. Item-by-Item Specification Checklist (Items 18 to 29)

- **Item 18 (shadcn/ui primitives):** Implemented headless Button, Input, Select, Dialog, Sheet, Tabs, Badge, Table, Tooltip, Skeleton, Toast, DropdownMenu, and Breadcrumb in `src/components/ui/`.
- **Item 19 (Elimination of arbitrary hex codes):** Centralized CSS variables in `globals.css` and `tokens.ts`.
- **Item 20 (Typed API Client & TanStack Query):** Implemented `src/lib/api-client.ts` with Zod schema parsing and `AbortController`, wrapped with `QueryProvider`.
- **Item 21 (Untrusted text safety):** Zero instances of `dangerouslySetInnerHTML`.
- **Item 22 (Typography & Formatters):** Implemented `src/lib/formatters.ts` (`formatDate`, `formatNumber`, `formatPercent`, `toTypographicText`). Specifically addressed the `8920%` calculation bug.
- **Item 23 (Code hygiene):** Zero `console.log` statements; pruned dead imports and unneeded icons.
- **Item 24 (Centralized tokens & theme toggle):** Tokens defined for Light and Dark modes. ThemeToggle component provides seamless, flicker-free switching.
- **Item 25 (Typography & Tabular Numerals):** `font-sans`, `font-mono`, and `.tabular-nums` configured across tables and numeric metrics.
- **Item 26 (Consistent icon style):** Standardized on `lucide-react` with 16px/20px/24px sizing and 2px stroke width.
- **Item 27 (Button hierarchy):** Primary, secondary, outline, ghost, destructive buttons with loading spinner and disabled states.
- **Item 28 (Reduced-motion support):** Global `@media (prefers-reduced-motion: reduce)` block in `globals.css` clamps animation durations to 0.01ms and halts pulsing skeletons.
- **Item 29 (Print styles):** Omitted per specification.

---

## 5. Hard Gate Checkpoint: Phase 1 Completion

**Phase 1 is complete.**
- Tokens, Theme Provider, formatting helpers, and shared UI component library implemented.
- `/dev/components` showcase route created and verified.
- 9/9 Playwright tests passed with 0 Axe accessibility violations.
- 20/20 token pairs passed WCAG 2.1 AA contrast audit.
- 8 responsive screenshots captured and archived.

**STOPPING EXECUTION. Awaiting user's written approval to proceed to Phase 2 (App Shell and Navigation).**
