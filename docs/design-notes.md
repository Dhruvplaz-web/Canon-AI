# Design Notes: Markup.ai Style Reference & Canon Visual Refresh System

## Overview
This document records the visual design analysis of the reference page (`https://markup.ai/blog/guardrails-for-ai-marketing-content`) at desktop (1440px) and mobile (390px) viewports, and defines the design tokens for Canon's comprehensive visual refresh.

> **Guideline Reminder:** Style inspiration only. Do not copy logo, images, brand name, or any reference text.

---

## 1. Color Palette (Exact Hex Values & Token Roles)

| Token Name | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-bg-canvas` | `#FFFFFF` | Primary page background, airy and uncluttered |
| `--color-bg-subtle` | `#F8F9FA` | Alternate section background, table header, light panel fills |
| `--color-surface` | `#FFFFFF` | Card surface, modal surface, dropdowns, input background |
| `--color-surface-hover` | `#F9FAFB` | Hover state for interactive cards and list rows |
| `--color-text-primary` | `#111827` | Headings, primary titles, emphasized labels (High contrast >12:1) |
| `--color-text-secondary` | `#4B5563` | Body copy, descriptions, explanatory paragraphs (>7:1) |
| `--color-text-muted` | `#6B7280` | Metadata, timestamps, breadcrumbs, helper captions (>4.5:1) |
| `--color-primary` | `#2563EB` | Primary CTA buttons, interactive links, focused borders |
| `--color-primary-hover` | `#1D4ED8` | Primary CTA hover state |
| `--color-primary-subtle` | `#EFF6FF` | Primary badge background, active navigation tab, receipt highlight |
| `--color-border-subtle` | `#E5E7EB` | Card borders, horizontal rules, table dividers, input borders |
| `--color-border-strong` | `#D1D5DB` | Focusable outlines, active tab indicators, callout left accents |

### Semantic Severity Tokens (Icons & Text Labels Mandatory)
| Level | Text / Icon Color | Background Tint | Border Accent |
| :--- | :--- | :--- | :--- |
| **Critical** | `#DC2626` (Red 600) | `#FEF2F2` (Red 50) | `#FECACA` (Red 200) |
| **Warning** | `#D97706` (Amber 600) | `#FFFBEB` (Amber 50) | `#FDE68A` (Amber 200) |
| **Minor / Info** | `#2563EB` (Blue 600) | `#EFF6FF` (Blue 50) | `#BFDBFE` (Blue 200) |
| **Pass / Success** | `#16A34A` (Green 600) | `#F0FDF4` (Green 50) | `#BBF7D0` (Green 200) |

---

## 2. Typography

- **UI & Headings Font:** `Inter`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  - Clean, spacious neo-grotesque sans with high legibility at all scales.
- **Monospace Font (Restricted use only):** `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, monospace
  - *Strictly reserved for:* Submission IDs, Rule codes (e.g. `TERM-007`, `CLAIM-001`), character spans, and verbatim receipts.

### Type Scale & Hierarchy
| Level | Font Size | Line Height | Weight | Letter Spacing | Color |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero H1** | `36px` (`2.25rem`) desktop / `28px` mobile | `1.2` | 700 (Bold) | `-0.025em` | `--color-text-primary` |
| **Section H2** | `26px` (`1.625rem`) desktop / `22px` mobile | `1.3` | 700 (Bold) | `-0.02em` | `--color-text-primary` |
| **Card / Subhead H3** | `18px` (`1.125rem`) | `1.4` | 600 (Semibold) | `-0.01em` | `--color-text-primary` |
| **Lead Paragraph** | `17px` (`1.0625rem`) | `1.6` | 500 (Medium) | `normal` | `--color-text-secondary` |
| **Standard Body** | `15px` (`0.9375rem`) | `1.6` | 400 (Regular) | `normal` | `--color-text-secondary` |
| **Caption / Badge** | `12px`–`13px` | `1.4` | 600 (Semibold) | `0.02em` | Varied |

---

## 3. Spacing, Geometry & Shadows

- **Container Max-Width:** `1200px` (`max-w-6xl` or `max-w-7xl` with `mx-auto`)
- **Horizontal Container Padding:**
  - Desktop (1440px): `32px` (`px-8`)
  - Mobile (390px): `16px` (`px-4`)
- **Corner Radii:**
  - Cards & Containers: `12px` (`rounded-xl`)
  - Buttons, Inputs, Selects: `8px` (`rounded-lg`)
  - Badges & Status Pills: `9999px` (`rounded-full`)
- **Shadow Scale:**
  - `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Default card elevation)
  - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` (Hover state for selectable cards)
  - `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1)` (Dropdowns, floating dialogs)
- **Borders:**
  - Standard cards: `1px solid var(--color-border-subtle)` (`#E5E7EB`)
  - Focus ring: `2px solid var(--color-primary)` with `2px` offset

---

## 4. Component Patterns

### A. Top Navigation Bar
- Clean, fixed/sticky white bar (`bg-white/95 backdrop-blur-md`) with subtle bottom border (`border-b border-gray-200`).
- **Left:** Brand wordmark ("CANON") in dark charcoal with a clean badge.
- **Center:** Navigation links with calm dark-gray typography (`#4B5563`), transitioning to `#111827` and subtle background pill on active/hover.
- **Right:** Small status pill (`API: ONLINE`) with green pulse indicator, keeping system status visible without clutter.
- **Top Notice:** Slim, calm announcement banner for trademark/working title notice with warm amber bullet.

### B. "Key Takeaways" / Callout Box
- Container with off-white or soft blue/neutral tint background (`#F8F9FA` or `#EFF6FF`).
- 4px thick solid accent line on the left border (`#2563EB`).
- Bold lead-in header with icon, followed by bulleted items or explanatory copy.

### C. Review Finding Cards (Double-Receipt Invariant)
- Clean card with top bar: severity badge (with explicit icon + text), Rule ID in monospace pill, title, and action buttons.
- Side-by-side (stacking on mobile) quote callouts:
  - **Receipt A (Draft Span):** Monospace font, soft amber or neutral quote card, showing character offsets and verbatim text.
  - **Receipt B (Policy Excerpt):** Monospace font, soft blue or neutral quote card, citing policy rule or ledger clause.
- Clear primary CTA button ("Override Finding") with standard min-height (44px) and high contrast.

### D. Card Grids & Interactive Test-Fixture Selectors
- Selection cards with clean border, hover shadow transition, radio/check indicator, and short lead-in text.
- Metric stat cards with large numerical value, small uppercase label, and status indicator.

### E. Multi-Column Footer
- Top border separating from main canvas (`border-t border-gray-200 bg-white`).
- Column 1: Brand mark, platform description, status indicator.
- Column 2: Navigation shortcuts.
- Column 3: Platform architecture / compliance invariants.
- Full-width bottom bar: Preserved required statutory disclaimer:
  *"Canon provides automated pre-publication brand and editorial review assistance. It does not provide certified legal advice or guarantee statutory compliance."*

---

## 5. Responsive Behavior Matrix (1440px -> 390px)

| Component | Desktop (1440px) | Mobile (390px) |
| :--- | :--- | :--- |
| **Top Nav** | Horizontal menu with links and status pill | Collapsible / stacked compact nav with scrollable tabs |
| **Page Container** | `px-8`, `max-w-7xl` | `px-4`, full width |
| **Submissions Layout** | 2-column grid (Form on left 60%, Results on right 40%) | 1-column stacked (Form on top, Results below) |
| **Review Queue Receipts** | 2-column grid (Receipt A left, Receipt B right) | 1-column stacked with divider |
| **Governance / Telemetry** | 3-column metric cards, side-by-side proposal backtest | 1-column cards, scrollable backtest table |
| **AI Transparency** | 2-column feature cards, 3-column metric row | 1-column stacked cards |
