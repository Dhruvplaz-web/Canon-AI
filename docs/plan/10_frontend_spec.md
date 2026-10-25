# Canon: Frontend UI/UX Architecture & Screen Specification (10_frontend_spec.md)

**Document ID:** `DOC-10`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [TB-BRIEF, Sec 4] `file:///E:/Software/codex/Docuements/Canon_Role_Brief_Tanishka_Bellale_FINAL.pdf`, [STD, Sec 4.1, 5.3] `file:///E:/Software/codex/Docuements/Canon%20AI%20Rules%20and%20Engineering%20Standards.pdf`, [ARCH, Sec 14] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Aesthetic Identity & Design System Tokens

In strict accordance with the **Canon AI Rules and Engineering Standards** (Sections 3, 5, 8, 12):
- **Design Persona:** *Modern FinTech / Industrial Swiss* (Anti-AI-Sludge: Zero generic purple/neon-cyan gradients on slate-900).
- **Surfaces:** Crisp charcoal and obsidian surfaces (`#09090B`, `#18181B`), hairline 1px borders (`#27272A`), high-contrast clean typography, and muted semantic status badges.
- **Strict 8-Point Spatial Rhythm:** All margins, paddings, and gaps strictly follow: `4px` (`gap-1`), `8px` (`gap-2`), `12px` (`gap-3`), `16px` (`p-4`), `24px` (`p-6`), `32px` (`p-8`), `48px` (`p-12`). Zero arbitrary spacing values (no `7px`, `13px`, `19px`).

### 1.1 Complete Design Tokens (`tailwind.config.ts`)
```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 5 Core Semantic Surfaces
        surface: {
          DEFAULT: "#09090B",       // Canvas Base (Zinc-950)
          elevated: "#18181B",      // Cards & Panels (Zinc-900)
          subtle: "#27272A",        // Hover states & Hairlines (Zinc-800)
        },
        border: {
          hairline: "#27272A",      // 1px structure borders
          active: "#3F3F46",        // Focus and active rings
        },
        text: {
          primary: "#F4F4F5",       // High contrast white-zinc (Zinc-100)
          muted: "#A1A1AA",         // Secondary metadata (Zinc-400)
          faint: "#71717A",         // Tertiary labels (Zinc-500)
        },
        accent: {
          DEFAULT: "#2563EB",       // Safety International Blue (Primary Action)
          hover: "#1D4ED8",
          subtle: "#1E293B",
        },
        // Strict Semantic Status Tokens
        status: {
          critical: "#EF4444",      // Regulatory & Factual Violations (Red-500)
          criticalBg: "#450A0A",
          major: "#F59E0B",         // Voice, Tone & Branding (Amber-500)
          majorBg: "#451A03",
          minor: "#10B981",         // Advisory & Clean Passing (Emerald-500)
          minorBg: "#022C22",
          verified: "#3B82F6",      // Programmatic Receipt Verified (Blue-500)
          unverified: "#6B7280",    // Dropped / Unconfirmed (Gray-500)
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 2. Global Navigation Matrix per Role

The global application shell adapts its sidebar and navigation tabs based on the authenticated session's `role`.

| Navigation Tab | Target Route | `creator` | `reviewer` | `approver` | `brand_manager` | `it_admin` | `exec` |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Submissions** | `/submissions` | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **New Draft** | `/submissions/new` | **YES** | **YES** | **YES** | **YES** | NO | NO |
| **Review Queue** | `/review` | NO | **YES** | **YES** | **YES** | NO | **YES** (Read) |
| **Brand Policies** | `/policy` | **YES** (Read) | **YES** (Read) | **YES** | **YES** | **YES** | **YES** (Read) |
| **Rule Health** | `/governance/health` | NO | **YES** (Read) | **YES** | **YES** | **YES** | **YES** (Read) |
| **AI Disclosure** | `/transparency` | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Audit Log** | `/audit` | NO | NO | **YES** | **YES** | **YES** | **YES** (Read) |
| **System Admin** | `/admin` | NO | NO | NO | NO | **YES** | NO |

---

## 3. Master Screen Inventory & 4-State Specifications

---

### SCR-01: Authentication & Workspace Login (`/login`)
- **Purpose:** Secure entry point verifying credentials and establishing session cookie.
- **Roles:** Public / Unauthenticated.
- **Data Shown:** Workspace selector, email input, password input, security notice regarding AI disclosure.
- **Actions:** Submit login (`API-01`), switch workspace.
- **Complete State Spectrum:**
  1. *Loading:* Button displays pulsing indicator; inputs disabled.
  2. *Empty:* Default clean state with autofocus on email input.
  3. *Error:* Actionable red error toast: *"Invalid email or password. Please try again."*
  4. *Content:* Standard input form.
- **Accessibility:** Semantic `<form>`, input labels linked via `htmlFor`, error message linked via `aria-describedby`.
- **Linked APIs:** `POST /api/v1/auth/login`.

---

### SCR-02: Policy Sources & Rule Ingestion Portal (`/policy`)
- **Purpose:** Brand guideline repository; upload source documents, view active policy versions, and manage candidate rules.
- **Roles:** `brand_manager`, `approver`, `it_admin` (Full); `creator`, `reviewer` (Read-only view of approved rules).
- **Data Shown:** Source documents table (title, file type, SHA-256 hash, upload date), Active Policy card (`v1.0`, published timestamp, rule count), Approved Rules table.
- **Actions:** Upload source file (`API-04`), run rule compilation (`API-05`), approve/reject candidate rule (`API-06`), publish policy version (`API-07`).
- **Complete State Spectrum:**
  1. *Loading:* Pulsing card and table row skeletons (`h-12 w-full bg-surface-subtle animate-pulse`).
  2. *Empty:* Empty state illustration with title *"No Brand Guidelines Ingested"* and primary action button *"Upload Brand Guidelines (PDF/DOCX)"*.
  3. *Error:* Card error banner with *"Failed to load policy rules"* and inline *"Retry"* button.
  4. *Content:* Dual tab interface ("Active Policy v1.0" | "Source Documents").
- **Accessibility:** Table headers use `scope="col"`, keyboard accessible modal for source upload.
- **Linked APIs:** `API-04`, `API-05`, `API-06`, `API-07`, `API-08`.

---

### SCR-03: New Content Submission & Draft Editor (`/submissions/new`)
- **Purpose:** Ingest draft text or upload marketing collateral for automated brand verification.
- **Roles:** `creator`, `reviewer`, `brand_manager`, `agency`.
- **Data Shown:** Title input, campaign tag dropdown, content input toggle (Plain Text vs. File Upload), live character count.
- **Actions:** Paste/type text, drag-and-drop PDF/DOCX, trigger check run (`API-11`, `API-15`).
- **Complete State Spectrum:**
  1. *Loading:* Progress bar displaying document upload and offset indexing.
  2. *Empty:* Placeholder text in editor: *"Paste draft campaign copy, social post, or email draft here..."*.
  3. *Error:* File rejection banner: *"File exceeds 15 MB limit"* or *"Unrecognized file format"*.
  4. *Content:* Interactive textarea with line numbers or drag-and-drop dropzone.
- **Accessibility:** File upload supports keyboard space/enter activation, `aria-live="polite"` character counter.
- **Linked APIs:** `POST /api/v1/submissions`, `POST /api/v1/submissions/{id}/check`.

---

### SCR-04: Findings & Evidence Split-Screen Viewer (`/submissions/[id]/findings`) [PRIORITY POLISH #1]
- **Purpose:** Primary creator/reviewer interface displaying draft copy side-by-side with receipt-backed finding cards.
- **Roles:** All authenticated workspace roles.
- **Data Shown:**
  - *Left Pane (Document Canvas):* Submitted copy or PDF rendered via `react-pdf`, with colored highlight overlays corresponding to finding severities (Red = Critical, Amber = Major, Emerald = Minor).
  - *Right Pane (Findings Feed):* Chronological or severity-sorted finding cards. Each card displays: Flagged text, Rule ID, Severity badge, **Receipt Box** (Cited Source Quote + Document Title + Page Number), and Suggestion.
- **Actions:**
  - Click highlight $\to$ auto-scrolls to and expands finding card in right pane.
  - Click finding card $\to$ centers and pulses highlight in document canvas.
  - "Apply Suggestion" button (`API-18`) $\to$ applies fix to draft.
  - "Dispute Finding" button (`API-20`) $\to$ opens dispute modal requiring reason code.
- **Complete State Spectrum:**
  1. *Loading:* Dual pane skeleton loaders with pulsing text paragraphs and card outlines.
  2. *Empty (Clean Pass):* Prominent green banner: *"Verification Passed: Zero policy violations detected against Policy v1.0"* with a fast-track *"Submit for Sign-off"* button.
  3. *Error:* Actionable banner: *"Verification pipeline failed: Unable to parse document structure. Retry Check."*
  4. *Partial State:* Warning banner: *"Semantic tone checks temporarily unavailable. Deterministic rules verified."*
- **Accessibility:** Highlights keyboard-navigable via `Tab`; high-contrast borders; color is never the sole indicator of severity (icons + explicit text badges included).
- **Linked APIs:** `GET /api/v1/submissions/{id}/findings`, `POST /api/v1/findings/{id}/dispute`, `POST /api/v1/findings/{id}/decision`.

---

### SCR-05: Reviewer Queue & Submissions Dashboard (`/review`)
- **Purpose:** Central inbox for human reviewers and approvers to manage pending content submissions.
- **Roles:** `reviewer`, `approver`, `brand_manager`, `exec`.
- **Data Shown:** Submissions table: Title, Author, Campaign, Current Version, Findings Count (Critical / Major / Minor badges), Workflow Status (`PENDING_REVIEW`, `SENT_BACK`, `APPROVED`), Submitted Timestamp.
- **Actions:** Filter by status/campaign, sort by critical findings count, click row to open Review Workspace (`SCR-06`).
- **Complete State Spectrum:**
  1. *Loading:* 8 pulsing table rows matching column widths.
  2. *Empty:* Celebratory empty state illustration: *"All clear! No submissions pending review."*
  3. *Error:* Error banner with inline retry trigger.
  4. *Content:* Dense, high-information table with quick-action review buttons.
- **Accessibility:** `aria-sort` on column headers; arrow key navigation across table rows.
- **Linked APIs:** `GET /api/v1/submissions?status=PENDING_REVIEW`.

---

### SCR-06: Review Workspace & Adjudication Panel (`/review/[id]`) [PRIORITY POLISH #2]
- **Purpose:** Comprehensive decision workspace where reviewers inspect findings, evaluate creator disputes, record reason-coded overrides, and grant sign-offs.
- **Roles:** `reviewer`, `approver`, `brand_manager`.
- **Data Shown:** Complete submission history, split-screen canvas, creator dispute statements, threaded review comments.
- **Actions:**
  - "Override Finding" button (`API-19`) $\to$ triggers modal mandating Reason Code selection and justification note.
  - "Send Back for Revision" button (`API-22`) $\to$ prompts for remediation notes.
  - "Grant Final Sign-off" button (`API-21`) $\to$ authorizes publication (disabled if open Critical findings exist).
- **Complete State Spectrum:**
  1. *Loading:* Pulsing split-screen skeleton.
  2. *Error:* Actionable error toast if decision submission fails.
  3. *Content:* Full interactive review layout with real-time audit event feedback.
- **Accessibility:** Focus-trapped modal for overrides; `Escape` key closes modal; `Ctrl+Enter` submits override form.
- **Linked APIs:** `API-18`, `API-19`, `API-21`, `API-22`.

---

### SCR-07: Rule Health Governance Dashboard (`/governance/health`) [PRIORITY POLISH #3]
- **Purpose:** Continuous intelligence dashboard exposing defective brand guidelines and override distributions.
- **Roles:** `brand_manager`, `approver`, `it_admin`, `exec`.
- **Data Shown:**
  - *Summary Metric Cards:* Total Overrides Recorded, Noisy Rules Detected, Retrospective Time Saved.
  - *Rule Health Table:* Rule Code, Rule Text, Times Flagged, Times Overridden, Override Rate %, Dominant Reason Codes, Diagnostic Badge (`HEALTHY`, `NOISY`, `SCOPE_MISMATCH`, `UNCLEAR`, `STALE`).
  - *Demonstration Watermark:* Explicit badge: *"Demonstration Seed Data"* displayed when viewing seeded hackathon history.
- **Actions:** Filter by diagnostic state, click "Diagnose & Propose Change" to navigate to `SCR-08`.
- **Complete State Spectrum:**
  1. *Loading:* 4 pulsing metric cards + 6 table row skeletons.
  2. *Empty:* Informational banner: *"Rule Health requires at least 5 recorded overrides before reliable diagnostic metrics appear."*
  3. *Error:* Error banner with retry.
  4. *Content:* Visual data-dense table with Tremor-style semantic trend indicators.
- **Accessibility:** Numerical metrics formatted with `tabular-nums` for readability; contrast ratio $\ge 4.5:1$ on all status badges.
- **Linked APIs:** `GET /api/v1/governance/health`.

---

### SCR-08: Rule Change Proposal & Backtest Simulation Report (`/governance/proposals/[id]`)
- **Purpose:** Inspect synthesized rule modification diffs, execute backtest simulations across historical copy, and review empirical regression reports.
- **Roles:** `brand_manager`, `approver`.
- **Data Shown:**
  - *Rule Diff Viewer:* Side-by-side git-style diff showing original rule text vs. candidate rule text (e.g., added departmental scope filter).
  - *Backtest Simulation Report Card:* Historical Submissions Replayed (e.g., 142), Past False-Positives Eliminated (e.g., 14), Newly Missed Critical Findings (e.g., 0), Estimated Net Reviewer Hours Saved.
- **Actions:** Click "Run Backtest Simulation" (`API-25`), click "Adopt & Publish Policy v1.1" (`API-26`).
- **Complete State Spectrum:**
  1. *Loading:* Animated progress meter showing historical replay.
  2. *Content:* Visual diff with green addition lines and red deletion lines.
  3. *Warning State:* Red callout if backtest uncovers a critical regression on past submissions.
- **Accessibility:** High-contrast diff colors accessible for color-blind users (blue/orange toggle option).
- **Linked APIs:** `API-24`, `API-25`, `API-26`.

---

### SCR-09: Live AI Disclosure & Telemetry Panel (`/transparency/disclosure`)
- **Purpose:** Full transparency dashboard exposing real model providers, token consumption, latency, and data retention policies.
- **Roles:** All authenticated workspace roles.
- **Data Shown:** Active LLM Provider name, active model string, hosting mode, verified provider retention policy (`VER-11`), rolling 24-hour invocation count, average latency graph, recent execution log table.
- **Actions:** Inspect recent call metadata, download security compliance summary.
- **Complete State Spectrum:**
  1. *Loading:* Pulsing telemetry metric card skeletons.
  2. *Content:* Real-time data feed sourced from `ai_service_call` database table.
- **Accessibility:** Accessible data table with pagination controls.
- **Linked APIs:** `GET /api/v1/transparency/disclosure`.

---

### SCR-10: Immutable Audit Trail Explorer (`/audit`)
- **Purpose:** Compliance explorer providing chronological inspection of all system actions.
- **Roles:** `approver`, `brand_manager`, `it_admin`.
- **Data Shown:** Audit log table: Timestamp (UTC), Actor Name, Action Code (`rule.approved`, `finding.overridden`), Target Entity, Before State vs. After State JSON diff viewer.
- **Actions:** Filter by action/date range/actor, export compliance PDF (`API-28`).
- **Complete State Spectrum:**
  1. *Loading:* Skeleton table.
  2. *Content:* Dense monospace audit rows with expandable JSON detail drawers.
- **Accessibility:** Keyboard navigable tree view for JSON payload inspection.
- **Linked APIs:** `GET /api/v1/audit-log`.

---

## 4. Frontend Mock-Data Architecture for Parallel Development

- **FACT [TB-BRIEF, Sec 4; DHRUV-V3, Sec 8]:** To ensure Tanishka Bellale can build, style, and test all Next.js screens on Day 1 without waiting for backend deployment, a typed mock data layer is established under `frontend/src/lib/mocks/`.

```
frontend/src/lib/mocks/
  ├── mock_auth.ts          (Pre-seeded user profiles for each role)
  ├── mock_policy.ts        (Active Policy v1.0 with 12 approved rules)
  ├── mock_submissions.ts   (Draft submissions with varying violation states)
  ├── mock_findings.ts      (Verified Double-Receipt finding cards with offsets)
  ├── mock_rule_health.ts   (Seeded override history for TERM-007)
  ├── mock_disclosure.ts    (Simulated live AI call telemetry)
  └── mock_api_client.ts    (Toggleable API client switching between mock and live fetch)
```
- **Configuration Switch:** `NEXT_PUBLIC_USE_MOCK_DATA=true` enables instant, zero-latency local screen development and UI acceptance testing.
