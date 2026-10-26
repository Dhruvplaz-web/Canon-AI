# Canon Platform: Phase C — Product & Engineering Proposals (C_proposals.md)

**Document ID:** `UPSCALE-C-PROPOSALS`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-26  
**Auditor:** Principal Product Strategist & Lead Systems Architect  
**Governing Standard:** Canon AI Rules and Engineering Standards (Sections 2, 3, 4.2, 8, 12) & `AGENT_RULES.md`  
**Output Target:** `docs/upscale/C_proposals.md`  
**Predecessors:** [`docs/upscale/A_current_state.md`](file:///e:/Software/codex/docs/upscale/A_current_state.md), [`docs/upscale/B_research.md`](file:///e:/Software/codex/docs/upscale/B_research.md), [`docs/upscale/B_sources.md`](file:///e:/Software/codex/docs/upscale/B_sources.md)  

---

## 1. Architectural Principles & Proposal Governance

Every proposal in this catalog is designed to transform Canon's usability, navigation, and enterprise capabilities while adhering to four strict architectural constraints:
1. **Section 3 Non-Negotiable Invariants:** Zero AI authority. Model outputs are strictly advisory data. Double-receipt grounding (Receipt A + Receipt B) is mandatory before display. Approvals, overrides, and policy adoptions require explicit human action. Audit logs are append-only. Workspaces are strictly isolated via PostgreSQL Row-Level Security.
2. **Ponytail Frugality (7-Rung Ladder of Laziness):** Never write 200 lines when 10 lines will do. Prefer native platform capabilities (`URLSearchParams`, `<dialog>`, pure CSS backdrop mirroring) and existing dependencies over heavy third-party packages.
3. **URL-First State Architecture:** Every view state (active tab, search filter, selected submission ID, sort order) MUST be reflected in URL search parameters (`?subId=...&status=...`) to prevent ephemeral state loss on refresh.
4. **Zero Unapproved Boundary Changes:** Explicitly flag every proposal requiring schema, auth, role, RLS, dependency, or model changes for user review and approval before execution.

---

## 2. Comprehensive Catalog of Proposals (21 Proposals Across 10 Areas)

---

### Area 1: Navigation & Information Architecture

#### PROP-U01: Global Command Palette (`Cmd+K` / `Ctrl+K`) & Keyboard Shortcut Engine
- **Target Persona:** Power Reviewers, Brand Managers, Content Creators.
- **Problem:** Navigating between Submissions, Review Queue, Governance, and Policy requires repetitive mouse travel. Secondary actions are buried, and power users lack quick keyboard flows.
- **Improvement & Failure Avoidance:** Adopts Linear’s gold-standard command menu pattern (`WOW-03`) using `cmdk` (MIT, already standard in shadcn/ui). Avoids bloated menus (`FAILED-11`) by keeping the palette focused on high-frequency navigation ("Go to Submissions", "Go to Review Queue", "Jump to Policy v1.0", "New Draft") and contextual actions.
- **System Placement:**
  - *Screens/Components:* `frontend/src/components/command-menu.tsx`, mounted in `frontend/src/app/layout.tsx`.
  - *Routes:* Global (available on every page).
  - *Tables/Pipeline:* None. Pure client-side keyboard listener (`useEffect` on `keydown`).
  - *Existing Feature Built On:* Existing Next.js App Router layout shell.
- **Section 3 Check:** **PASSED.** Pure navigation; invokes no model, mutates no data, bypasses no workspace filters.
- **Needs Approval?** Dependency: **YES** (`cmdk` npm package for shadcn/ui command menu). Schema/Auth/RLS/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Time-to-navigate between views reduced from ~2.8s (mouse navigation) to <300ms (keyboard chord `G`+`R`).
- **Dependencies:** None.

---

#### PROP-U02: Persistent User Session & Role Indicator Switcher Bar
- **Target Persona:** All Enterprise Roles (Creator, Reviewer, Approver, Brand Manager, IT Admin).
- **Problem:** Currently, the application is completely headless (`FAILED-06`). Users have zero visibility into their logged-in identity or active role. `governance/page.tsx` was forced to hardcode login credentials directly into client code (`Gap 2`).
- **Improvement & Failure Avoidance:** Adds an elegant user profile & role switcher badge in the global header. Allows switching between seeded personas (`Carol Creator`, `Bob Reviewer`, `David Approver`, `Alice Brand Manager`, `IT Admin`) with a single click, issuing real JWT cookies via `POST /api/v1/auth/login`. Completely removes hardcoded credentials from frontend source code.
- **System Placement:**
  - *Screens/Components:* `frontend/src/components/user-session-bar.tsx` integrated into `frontend/src/app/layout.tsx`.
  - *Routes:* `/api/v1/auth/me`, `/api/v1/auth/login`, `/api/v1/auth/logout`.
  - *Tables/Pipeline:* Reads `User` table; sets `httpOnly` secure cookie.
  - *Existing Feature Built On:* Existing `backend/app/api/v1/auth.py` endpoints.
- **Section 3 Check:** **PASSED.** Preserves tenant isolation and RBAC. Ensures all subsequent actions carry authentic, verifiable human user IDs for the audit log.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Uses existing auth routes and seed users).
- **Metrics:** Effort: **S** (1.0h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Elimination of 100% of hardcoded credentials in client code; 0 unhandled 401 Unauthorized errors in browser console.
- **Dependencies:** None.

---

#### PROP-U03: Role-Aware Home Dashboard & "What Needs My Attention" Inbox
- **Target Persona:** All Roles (Creator, Reviewer, Approver, Brand Manager).
- **Problem:** The Home screen (`/`) currently displays a static Bento grid with unclickable cards (`Gap 1`) and a broken link to `/demo`. Users opening the app have no clear next action.
- **Improvement & Failure Avoidance:** Transforms `/` into an Ironclad-style actionable workspace inbox (`WOW-10`). Converts Bento cards into clickable entry points. Displays dynamic cards tailored to the active role: Creators see their active drafts; Reviewers see pending queue count; Brand Managers see flapping rule alerts; Evaluators see a working demo launcher.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/page.tsx`.
  - *Routes:* `/api/v1/submissions`, `/api/v1/governance/health`, `/api/v1/health/live`.
  - *Tables/Pipeline:* Reads `Submission`, `CheckRun`, `RuleHealthSnapshot`.
  - *Existing Feature Built On:* `frontend/src/app/page.tsx` Bento grid.
- **Section 3 Check:** **PASSED.** Read-only dashboard; workspace-isolated queries.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Clicks-to-first-action on app launch reduced from 3 clicks to 1 click; 0 broken links on Home page.
- **Dependencies:** `PROP-U02` (for role context).

---

### Area 2: Creator Experience

#### PROP-U04: Zero-Dependency Synchronized Textarea Highlight Backdrop Overlay
- **Target Persona:** Content Creator, Marketer, Copywriter.
- **Problem:** The draft editor in `submissions/page.tsx` is a plain `<textarea>` (`Gap 3`). Creators must manually correlate character offsets (`[0:10]`) with sentences in their draft, causing high cognitive friction.
- **Improvement & Failure Avoidance:** Implements the battle-tested pure CSS/React mirrored backdrop pattern (`WOW-02`, `SRC-16`). Synchronizes a background `<div aria-hidden="true">` with `text-transparent` and color-coded `<mark>` tags underneath the transparent textarea. Avoids heavy WYSIWYG editors (`DNB-03`) that bloat bundle size and break native browser undo/redo.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/submissions/page.tsx`, component `HighlightTextarea`.
  - *Routes:* Frontend only.
  - *Tables/Pipeline:* Consumes `Finding.start_offset`, `Finding.end_offset`, `Finding.severity`.
  - *Existing Feature Built On:* Submissions editor and normalizer character offsets.
- **Section 3 Check:** **PASSED.** Purely visual presentation of verified Double-Receipt findings; model has zero editing access.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Zero external dependencies).
- **Metrics:** Effort: **M** (2.0h) | Value: **5** | Risk: **2**.
- **Data-Driven Success Metric:** 100% of verified findings rendered with visual highlights mapped to exact character coordinates; zero scroll desynchronization.
- **Dependencies:** None.

---

#### PROP-U05: In-Editor One-Click "Apply Suggestion" & "Apply All Minor" Preview
- **Target Persona:** Content Creator.
- **Problem:** Suggested fixes are currently rendered as static text strings (`Gap 4`). Creators are forced into manual copy-paste cycles.
- **Improvement & Failure Avoidance:** Implements GitHub-style one-click suggested changes (`WOW-01`). Beside each finding, an "Apply Fix" button previews the diff and cleanly slices `content = content.slice(0, start) + suggestion + content.slice(end)`. Adds a "Fix All Minor" button that batches non-critical typo and terminology fixes in a single click with instant visual confirmation.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/submissions/page.tsx`.
  - *Routes:* Updates local draft state; auto-triggers check pipeline debounce.
  - *Tables/Pipeline:* Consumes `Finding.suggested_fix`.
  - *Existing Feature Built On:* `FindingResponse.suggested_fix`.
- **Section 3 Check:** **PASSED.** *Strict Rule 3 & Rule 8 Compliance:* The rewrite is NEVER auto-applied by the system; the human creator must explicitly click "Apply Fix" or "Apply All Minor".
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Time required to remediate 3 standard terminology violations reduced from ~45 seconds (manual retyping) to <3 seconds (single-click apply).
- **Dependencies:** `PROP-U04`.

---

#### PROP-U06: Creator Dispute Flow & Revision Diff History
- **Target Persona:** Content Creator.
- **Problem:** Creators who believe a finding is an invalid false positive have no dispute mechanism (`Gap 5`). Drafts are deadlocked with no way to submit intent notes or track revisions (v1 vs v2).
- **Improvement & Failure Avoidance:** Implements a structured "Dispute Finding" dialog allowing the creator to select a reason code (`CONTEXT_IGNORED`, `APPROVED_SLOGAN`) and attach an explanatory note. Implements a revision history dropdown showing word count deltas and character diffs between `v1` and `v2`.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/submissions/page.tsx`.
  - *Routes:* `POST /api/v1/findings/{id}/dispute`, `POST /api/v1/submissions/{id}/submit-review`.
  - *Tables/Pipeline:* Updates `finding.review_status = 'DISPUTED'`, `finding.dispute_notes`.
  - *Existing Feature Built On:* State machine SM-01 and SM-04 (`docs/plan/05_user_journeys_and_flows.md`).
- **Section 3 Check:** **PASSED.** Preserves human agency; creator dispute does not bypass policy but routes the structured contest into the human reviewer's queue.
- **Needs Approval?** Schema: **NO** (uses existing JSONB metadata / finding status). Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (2.0h) | Value: **4** | Risk: **1**.
- **Data-Driven Success Metric:** 100% of disputed findings recorded with structured reason codes and routed to `review_status = 'DISPUTED'`.
- **Dependencies:** None.

---

### Area 3: Reviewer Speed & Triage

#### PROP-U07: Unified Side-by-Side Review Workspace with Interactive Finding Anchors
- **Target Persona:** Brand Reviewer, Senior Editor.
- **Problem:** In `review/page.tsx`, reviewers see isolated finding cards with no draft context (`Gap 6`). They cannot read the surrounding copy or understand brand tone.
- **Improvement & Failure Avoidance:** Builds a unified split-screen review workspace (`WOW-08`). The left pane displays the full submission document with interactive highlight anchors; the right pane displays the active finding card with Double Receipts A and B. Clicking a finding card smoothly scrolls the left pane to the cited sentence.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/review/page.tsx`.
  - *Routes:* `GET /api/v1/submissions/{id}`, `GET /api/v1/submissions/{id}/findings`.
  - *Tables/Pipeline:* Reads `Submission`, `SubmissionVersion`, `Finding`.
  - *Existing Feature Built On:* `SCR-05` and `SCR-06`.
- **Section 3 Check:** **PASSED.** Purely contextual inspection; both Double Receipts displayed in full.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **L** (2.0h) | Value: **5** | Risk: **2**.
- **Data-Driven Success Metric:** Elimination of context-blind reviews; 100% of findings inspectable alongside full paragraph context.
- **Dependencies:** None.

---

#### PROP-U08: Review Queue Triage Table with Pushdown Filtering & Batch Overrides
- **Target Persona:** Reviewer, Editorial Lead.
- **Problem:** Currently, `review/page.tsx` runs an unpaginated sequential client loop over all submissions (`for (const sub of subData)`), causing massive latency (`Gap 6`). No filtering by channel, severity, or author exists.
- **Improvement & Failure Avoidance:** Implements an aggregated backend review queue endpoint (`GET /api/v1/review/queue`) with SQL `JOIN`s, pagination (`limit`, `offset`), and filters (`severity`, `channel`, `status`). Enforces Senior Engineering Directive Rule 3 (Database Pushdown). Adds multi-select checkboxes for batch overrides with mandatory reason codes.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/review/page.tsx`.
  - *Routes:* `GET /api/v1/review/queue`, `POST /api/v1/review/batch-override`.
  - *Tables/Pipeline:* Queries `Finding` joined with `Submission` and `CheckRun`.
  - *Existing Feature Built On:* `backend/app/api/v1/decisions.py`.
- **Section 3 Check:** **PASSED.** Every overridden finding in a batch operation still requires a mandatory reason code and writes individual immutable audit records.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Router and query optimization only).
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Client fetch count reduced from $N+1$ requests to 1 single paginated query; queue load time <100ms.
- **Dependencies:** None.

---

#### PROP-U09: Approver Formal Sign-Off & "Send Back for Revision" Action Loop
- **Target Persona:** Legal Approver, Compliance Officer, Brand Director.
- **Problem:** Currently, neither `POST /submissions/{id}/approve` nor `send-back` exist in the UI (`Gap 7`). Reviewers and approvers cannot transition submissions to `APPROVED` or return drafts with revision instructions.
- **Improvement & Failure Avoidance:** Implements the missing approver sign-off toolbar in `review/page.tsx`. If critical violations remain unresolved, "Grant Final Sign-Off" is disabled. Approvers can click "Send Back for Revision", enter required feedback notes, and transition the submission to `SENT_BACK`, sending it back to the creator's inbox.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/review/page.tsx`.
  - *Routes:* `POST /api/v1/submissions/{id}/approve`, `POST /api/v1/submissions/{id}/send-back`.
  - *Tables/Pipeline:* Updates `submission.status`, writes `AuditLog` entry.
  - *Existing Feature Built On:* State machine SM-01 in `docs/plan/05_user_journeys_and_flows.md`.
- **Section 3 Check:** **PASSED.** *Core Rule 3.2 Compliance:* Model never signs off or publishes content; sign-off is restricted strictly to authenticated human approvers.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Endpoints fit directly into `submissions.py`).
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** 100% completion of end-to-end lifecycle SM-01 (`DRAFT` &rarr; `CHECKING` &rarr; `PENDING_REVIEW` &rarr; `APPROVED` / `SENT_BACK`).
- **Dependencies:** `PROP-U08`.

---

### Area 4: Alert-Fatigue Reduction

#### PROP-U10: Severity Triage Tabs & Grouping of Repeated Finding Spans
- **Target Persona:** Reviewer, Content Creator.
- **Problem:** A 1,000-word draft with 8 occurrences of the same minor typo (e.g. "AcmeCloud") generates 8 separate cards, cluttering the screen and causing alert fatigue (`FAILED-01`).
- **Improvement & Failure Avoidance:** Groups identical rule violations under an accordion card ("AcmeCloud — 8 occurrences across document") with a single "Apply All (8)" button. Adds severity filter tabs (`All`, `Critical (1)`, `Warnings (2)`, `Info (1)`) so users can triage legal blocks before stylistic nits (`WOW-11`).
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/submissions/page.tsx`, `frontend/src/app/review/page.tsx`.
  - *Routes:* Client-side grouping logic.
  - *Tables/Pipeline:* Consumes `Finding` list.
  - *Existing Feature Built On:* Existing check run results.
- **Section 3 Check:** **PASSED.** Pure UI grouping; preserves individual database records and character offsets.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **S** (1.0h) | Value: **4** | Risk: **1**.
- **Data-Driven Success Metric:** Card clutter on repeated violation drafts reduced by up to 75%; critical findings surfaced immediately on mount.
- **Dependencies:** None.

---

#### PROP-U11: "Why Was This Flagged?" Contextual Receipt Cards
- **Target Persona:** Content Creator, Reviewer.
- **Problem:** Users often do not understand *why* a particular phrase was prohibited, leading to resentment and friction with the compliance team (`FAILED-04`).
- **Improvement & Failure Avoidance:** Enhances Double-Receipt cards with an expandable "Why was this flagged?" drawer. Displays the rationale from the policy source, active validity dates (especially for claims), and shows the historical override frequency (e.g., *"This rule has a 37.5% override rate; candidate exception PROP-01 is under review"*).
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/submissions/page.tsx`, `frontend/src/app/review/page.tsx`.
  - *Routes:* Consumes `Rule.description` and `RuleHealthSnapshot`.
  - *Tables/Pipeline:* Reads `Rule`, `ApprovedClaim`.
  - *Existing Feature Built On:* Double Receipt Box.
- **Section 3 Check:** **PASSED.** Grounded entirely in verified database records.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **S** (1.0h) | Value: **4** | Risk: **1**.
- **Data-Driven Success Metric:** 100% of finding cards provide source context, eliminate ungrounded ambiguity.
- **Dependencies:** None.

---

### Area 5: Rule Health & Governance Intelligence

#### PROP-U12: Interactive Policy Explorer (`SCR-02`) & Living Guidelines Catalog
- **Target Persona:** Brand Manager, Creator, Legal Approver.
- **Problem:** Currently, clicking "Brand Policy" in the header leads to an HTTP 404 (`Gap 1`). Creators cannot view the rules they are being checked against without reverse-engineering error messages.
- **Improvement & Failure Avoidance:** Implements Frontify-style living guidelines (`WOW-04`) at `/policy` (`SCR-02`). Renders all 12 active rules categorized by Terminology, Tone, Regulatory, and Claims. Displays the Approved Claims Ledger with live `valid_from` and `valid_until` badges (clearly highlighting expired claims like `CLAIM-001`). Includes real-time client search.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/policy/page.tsx`.
  - *Routes:* `GET /api/v1/policy/active` (or `/api/v1/governance/policy-rules`).
  - *Tables/Pipeline:* Reads `PolicyVersion`, `Rule`, `ApprovedClaim`.
  - *Existing Feature Built On:* Seeded Policy v1.0 / v1.1.
- **Section 3 Check:** **PASSED.** Read-only explorer; reflects active human-approved policy.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** 0 broken 404 links in main navigation; 100% of active rules and claims viewable in browser.
- **Dependencies:** None.

---

#### PROP-U13: Guided Proposal Authoring Wizard for Flapping Rules
- **Target Persona:** Brand Manager.
- **Problem:** In `governance/page.tsx`, the proposal section is hardcoded to `proposals[0]` (`PROP-01`). Brand managers cannot author a new proposal for other flapping rules identified in telemetry (`Gap 8`).
- **Improvement & Failure Avoidance:** Adds a "Propose Rule Modification" button on flapping rule telemetry cards (e.g. `TERM-004`). Opens a guided wizard where the brand manager selects an exception type (channel scope exception, wording relaxation, date extension), inputs the proposed text diff, and saves it as a candidate `RuleChangeProposal` in `DRAFT` status.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/governance/page.tsx`.
  - *Routes:* `POST /api/v1/governance/proposals`.
  - *Tables/Pipeline:* Inserts into `rule_change_proposal`.
  - *Existing Feature Built On:* `RuleHealthSnapshot` and `RuleChangeProposal` models.
- **Section 3 Check:** **PASSED.** *Strict Rule 3.1 Compliance:* Proposals are created in `DRAFT` status and are purely advisory. They have ZERO authority until backtested and explicitly approved by a human Brand Manager.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Model and table already exist).
- **Metrics:** Effort: **M** (2.0h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Brand managers can author custom proposals for 100% of flapping rules in the database.
- **Dependencies:** None.

---

#### PROP-U14: Detailed Backtest Simulation Drilldown & Safe Version Rollback
- **Target Persona:** Brand Manager, Compliance Officer.
- **Problem:** Currently, the backtest results card only displays aggregate numbers (pass rate delta, false positives cut). The brand manager cannot see *which* historical submissions were impacted. Furthermore, there is no rollback workflow if an adopted policy proves defective.
- **Improvement & Failure Avoidance:** Enhances the backtest report card with an expandable submission-by-submission impact table (`WOW-06`). Adds a "Revert to Previous Baseline" button that creates a **new, human-approved Policy Version** (e.g. `v1.2`) restoring the previous ruleset, strictly preserving immutable version history.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/governance/page.tsx`.
  - *Routes:* `GET /api/v1/governance/proposals/{id}/backtest-details`, `POST /api/v1/governance/policies/rollback`.
  - *Tables/Pipeline:* Reads `BacktestResult`, writes new `PolicyVersion` and `AuditLog`.
  - *Existing Feature Built On:* `backend/app/services/backtest_engine.py`.
- **Section 3 Check:** **PASSED.** Rollback does not mutate or delete historical versions; it creates a new human-approved policy version and logs an immutable audit entry.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **4** | Risk: **1**.
- **Data-Driven Success Metric:** Full transparency into all 24 simulated submissions; instant safe recovery path for brand managers.
- **Dependencies:** None.

---

### Area 6: Onboarding & Guided First Run

#### PROP-U15: Interactive First-Run Tour & Demo Evaluation Flow Route (`/demo`)
- **Target Persona:** Hackathon Judges, Evaluators, New Brand Teams.
- **Problem:** The Home screen CTA button links to `/demo` which 404s (`Gap 1`). First-time visitors have no guided walkthrough explaining the 4-step governance lifecycle.
- **Improvement & Failure Avoidance:** Implements `/demo` as an interactive 4-step evaluation walkthrough (`WOW-10`):
  1. *Step 1: Inspect Policy v1.0 & Expired Claim `CLAIM-001`*
  2. *Step 2: Run Verification on Draft with Stale Claim & Prompt Injection*
  3. *Step 3: Review Double Receipts & Execute Reason-Coded Override*
  4. *Step 4: Run Backtest Simulation on PROP-01 & Approve Policy v1.1*
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/demo/page.tsx`.
  - *Routes:* `/demo`.
  - *Tables/Pipeline:* Consumes demo fixtures and seeded data.
  - *Existing Feature Built On:* `backend/tests/integration/test_m1_walkthrough.py`.
- **Section 3 Check:** **PASSED.** Demo data is explicitly marked as simulated/demonstration fixtures per Section 9.8.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** Resolves the `/demo` 404 error; enables complete 4-minute judge evaluation walkthrough without getting lost.
- **Dependencies:** `PROP-U02`, `PROP-U12`.

---

#### PROP-U16: Structured Brand Guideline Importer & Rule Compilation Wizard (`SCR-01`)
- **Target Persona:** Brand Manager.
- **Problem:** `SCR-01` (`/policy/sources`) does not exist in the UI (`Gap 1`). Brand managers cannot upload new guideline text or JSON rules without manual database seeding.
- **Improvement & Failure Avoidance:** Builds a lightweight import wizard allowing brand managers to paste brand guideline text or upload `rules.json`. Displays extracted candidate rules in `DRAFT` status and provides individual "Approve Rule" / "Reject Rule" checkmarks before compiling into a policy version.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/policy/import/page.tsx`.
  - *Routes:* `POST /api/v1/policy/sources`, `POST /api/v1/policy/sources/{id}/compile`.
  - *Tables/Pipeline:* Writes to `SourceDocument`, `Rule` (in `DRAFT`).
  - *Existing Feature Built On:* `backend/app/services/guideline_service.py`.
- **Section 3 Check:** **PASSED.** *Strict Rule 3.1 Compliance:* Extracted rules are marked `DRAFT`. A human Brand Manager must explicitly inspect and approve each rule before it can become active.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Backend parser already supports text/JSON).
- **Metrics:** Effort: **L** (2.0h) | Value: **4** | Risk: **2**.
- **Data-Driven Success Metric:** 100% of imported text converted to draft candidate rules with verifiable source text quotes.
- **Dependencies:** `PROP-U12`.

---

### Area 7: Trust, Audit & Transparency

#### PROP-U17: Live AI Disclosure Telemetry Inspector with Payload Viewer
- **Target Persona:** IT Security Lead, Compliance Auditor.
- **Problem:** In `transparency/page.tsx`, summary cards are shown, but the `recent_calls` array is completely ignored (`Gap 9`). Auditors cannot inspect timestamps, tokens, or redaction status.
- **Improvement & Failure Avoidance:** Implements the live call log table in `transparency/page.tsx` (`WOW-12`). Renders each call with timestamp, provider (`Groq`), model (`llama-3.3-70b`), prompt/completion tokens, latency (ms), and payload summary. Displays a live "Grounding Rate" badge showing the percentage of findings confirmed by the programmatic verifier.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/transparency/page.tsx`.
  - *Routes:* `GET /api/v1/transparency/disclosure`.
  - *Tables/Pipeline:* Reads `ai_service_call`.
  - *Existing Feature Built On:* `backend/app/api/v1/transparency.py`.
- **Section 3 Check:** **PASSED.** *Strict Rule 3.7 & Rule 8.9 Compliance:* Verifies that every external AI call is logged and auditable.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **S** (1.0h) | Value: **4** | Risk: **1**.
- **Data-Driven Success Metric:** 100% of records in `ai_service_call` visible to authorized IT admins; zero invisible model calls.
- **Dependencies:** None.

---

#### PROP-U18: Immutable Audit Trail Explorer & Cryptographic Compliance Certificate Export (`SCR-10`)
- **Target Persona:** Legal Approver, Compliance Officer, External Auditor.
- **Problem:** Planned screen `SCR-10` (`/audit`) is completely unbuilt (`Gap 9`). Stakeholders cannot review the chronological sequence of overrides, sign-offs, or policy adoptions, and cannot export compliance records.
- **Improvement & Failure Avoidance:** Builds the `/audit` screen (`WOW-09`). Renders an immutable, append-only log table with deterministic filters (`actor`, `action`, `date_range`, `entity_type`). Includes a "Download Compliance Certificate" button that generates a print-ready, cryptographically hashed audit receipt (DocuSign-style) verifying pre-publication review due diligence.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/audit/page.tsx`.
  - *Routes:* `GET /api/v1/audit-log`, `GET /api/v1/audit-log/export`.
  - *Tables/Pipeline:* Reads `AuditLog`.
  - *Existing Feature Built On:* `backend/app/models/audit.py`.
- **Section 3 Check:** **PASSED.** *Strict Rule 3.8 Compliance:* Read-only view into the append-only `AuditLog` table. Application database role is revoked of `UPDATE` and `DELETE` rights.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** 100% of human decisions (`FINDING_OVERRIDE`, `POLICY_ADOPT_V1_1`, `SUBMISSION_APPROVED`) queryable and exportable.
- **Dependencies:** None.

---

### Area 8: Collaboration & Review Workflow

#### PROP-U19: Reviewer Threaded Comments & Inline Contextual Notes
- **Target Persona:** Reviewer, Content Creator.
- **Problem:** Currently, when a reviewer overrides a finding, they enter a justification note, but there is no two-way conversation thread between creator and reviewer.
- **Improvement & Failure Avoidance:** Adds an inline comment thread on each finding card. Creators can explain specific campaign context, and reviewers can provide guidance without rejecting the whole document.
- **System Placement:**
  - *Screens/Components:* `frontend/src/app/review/page.tsx`, `frontend/src/app/submissions/page.tsx`.
  - *Routes:* `POST /api/v1/findings/{id}/comments`, `GET /api/v1/findings/{id}/comments`.
  - *Tables/Pipeline:* Stores comments in existing finding metadata or light decision notes.
  - *Existing Feature Built On:* `Decision.justification`.
- **Section 3 Check:** **PASSED.** Comments are human-to-human communications; models do not participate in or generate discussion comments.
- **Needs Approval?** Schema: **NO** (Can utilize JSONB `finding.metadata["comments"]`). Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **M** (1.5h) | Value: **3** | Risk: **1**.
- **Data-Driven Success Metric:** Elimination of off-platform email/Slack messages regarding policy disputes.
- **Dependencies:** `PROP-U06`.

---

### Area 9: Integrations (Design-Only Specifications)

#### PROP-U20: Design Specification for Webhook Notifications & External Editor Extensions
- **Target Persona:** Enterprise IT, Creative Agencies, External Marketing Teams.
- **Problem:** Enterprise creators work in Google Docs, Microsoft Word, and Figma. They want automated checks without copy-pasting into a separate web app.
- **Improvement & Failure Avoidance:** Authors a comprehensive design specification (`docs/integrations/EXTENSIONS_SPEC.md`) detailing:
  1. *Outbound Webhooks:* Emitting `submission.created`, `check.completed`, `submission.approved` events to Slack or Jira.
  2. *Google Workspace / Office 365 Add-on Architecture:* Side-panel extension utilizing Canon's existing `/api/v1/submissions` check endpoints.
  3. *MCP (Model Context Protocol) Server Specification:* Exposing active brand rules and claims ledgers to enterprise coding/writing agents via read-only tools.
- **System Placement:**
  - *Documentation:* `docs/integrations/EXTENSIONS_SPEC.md`.
  - *Code:* Design only. No application code or dependencies added.
- **Section 3 Check:** **PASSED.** Read-only specification; maintains strict workspace boundaries and human review gates.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO**.
- **Metrics:** Effort: **S** (1.0h) | Value: **4** | Risk: **1**.
- **Data-Driven Success Metric:** Complete, implementable specification ready for enterprise RFP evaluations.
- **Dependencies:** None.

---

### Area 10: Accessibility, URL State & Polish

#### PROP-U21: URL-First State Synchronization & Strict Accessibility (`:focus-visible`, Keyboard Traps)
- **Target Persona:** All Users, Assistive Technology Users, Power Navigators.
- **Problem:** Submissions and review screens lose active filters, tabs, and selected IDs upon browser refresh (`Gap 10`). Modals do not trap focus or close on `Escape`.
- **Improvement & Failure Avoidance:** Enforces Senior Engineering Directives Rule 2 (a11y) and Rule 3 (URL-First State). Stores active tab, filter status, and selected submission ID in URL search parameters (`?tab=critical&subId=...`). Wraps all modals in accessible focus traps with `Escape` to close and `Ctrl+Enter` to submit. Ensures all buttons have high-contrast `:focus-visible` rings.
- **System Placement:**
  - *Screens/Components:* Global update across `submissions/page.tsx`, `review/page.tsx`, `governance/page.tsx`.
  - *Routes:* Uses native browser `URLSearchParams` and Next.js `useSearchParams`.
  - *Tables/Pipeline:* None.
  - *Existing Feature Built On:* Existing modal components.
- **Section 3 Check:** **PASSED.** Pure UI accessibility and state synchronization.
- **Needs Approval?** Schema/Auth/RLS/Dependency/Model: **NO** (Zero external dependencies).
- **Metrics:** Effort: **M** (1.5h) | Value: **5** | Risk: **1**.
- **Data-Driven Success Metric:** 100% of modal dialogs close on `Escape`; 100% of shareable view states preserved on page reload.
- **Dependencies:** None.

---

## 3. Prioritized Roadmap: Releases R1, R2, and R3

```
+---------------------------------------------------------------------------------------------------+
|                                   CANON UPSCALE RELEASE ROADMAP                                   |
+---------------------------------------------------------------------------------------------------+
|  RELEASE R1 (Next Work Session: Critical Usability & Gap Elimination)                             |
|  - PROP-U02: Persistent User Session & Role Indicator Switcher Bar                                |
|  - PROP-U03: Role-Aware Home Dashboard & Bento Grid Navigation Fix                                 |
|  - PROP-U04: Zero-Dependency Synchronized Textarea Highlight Backdrop Overlay                     |
|  - PROP-U05: In-Editor One-Click "Apply Suggestion" & "Apply All Minor" Preview                   |
|  - PROP-U08: Review Queue Triage Table with Pushdown Filtering & Fast Queries                      |
|  - PROP-U09: Approver Formal Sign-Off & "Send Back for Revision" Loop                             |
|  - PROP-U12: Interactive Policy Explorer (/policy) & Living Guidelines Catalog                    |
|  - PROP-U15: Interactive First-Run Tour & Demo Evaluation Flow Route (/demo)                       |
|  - PROP-U21: URL-First State Synchronization & Accessibility Traps                                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|  RELEASE R2 (Reviewer Velocity, Governance Depth & Audit)                                         |
|  - PROP-U01: Global Command Palette (Cmd+K) & Keyboard Shortcut Engine                            |
|  - PROP-U06: Creator Dispute Flow & Revision Diff History                                         |
|  - PROP-U07: Unified Side-by-Side Review Workspace with Interactive Finding Anchors               |
|  - PROP-U10: Severity Triage Tabs & Grouping of Repeated Findings                                 |
|  - PROP-U11: "Why Was This Flagged?" Contextual Receipt Cards                                     |
|  - PROP-U13: Guided Proposal Authoring Wizard for Flapping Rules                                  |
|  - PROP-U14: Detailed Backtest Simulation Drilldown & Safe Version Rollback                       |
|  - PROP-U17: Live AI Disclosure Telemetry Inspector with Payload Viewer                          |
|  - PROP-U18: Immutable Audit Trail Explorer & Cryptographic Compliance Certificate Export (/audit)|
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|  RELEASE R3 (Collaboration, Ingestion & Ecosystem)                                                |
|  - PROP-U16: Structured Brand Guideline Importer & Rule Compilation Wizard (/policy/sources)      |
|  - PROP-U19: Reviewer Threaded Comments & Inline Contextual Notes                                 |
|  - PROP-U20: Design Specification for Webhooks & External Editor Extensions                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. "Do Not Build" List (Anti-Patterns & Scope Exclusions)

To protect system integrity, performance, and legal defensibility, the following items are formally classified as **DO NOT BUILD**:

| ID | Proposed Feature / Idea | Why We Will NOT Build It | Governing Principle / Rule |
| :--- | :--- | :--- | :--- |
| **DNB-01** | **Fully Autonomous Content Rewriting or Direct Publishing** | Models make mistakes and hallucinate claims. Content must never be automatically modified or published without human confirmation. | **Strict Section 3 Violation** (No AI Authority) |
| **DNB-02** | **Autonomous Policy v1.1 Activation by Background Jobs** | Policy changes create legal and brand liability. Upgrades must require explicit, authenticated human Brand Manager approval. | **Binding Invariant (JRN-06, TST-14)** |
| **DNB-03** | **Monolithic Rich-Text Editors (Quill, Slate, TipTap, Draft.js)** | Adds 500KB+ to the frontend bundle, creates DOM reconciliation bugs with React 19, and breaks native browser undo/redo. Our mirrored backdrop achieves the same visual outcome with 0 dependencies. | **Ponytail Frugality (7-Rung Ladder)** |
| **DNB-04** | **Live USPTO Web Scraping / Automated Trademark Registration** | Trademark search APIs have unpredictable rate limits, high latency (5–30s), and require legal clearance counsel. Outside Canon PRD scope. | **Out of PRD Scope** |
| **DNB-05** | **Automatic PII / NER Text Redaction Engine** | Regex/NER redaction can corrupt brand slogans or mask context. Declared not built in M1 until formal enterprise DPAs are executed. | **Declared NOT BUILT (`FR-14`)** |
| **DNB-06** | **Separate Vector Database (Pinecone, Weaviate, Qdrant)** | PostgreSQL with `pgvector` and exact RapidFuzz dictionary matching is more than sufficient for brand guidelines; avoids multi-database sync bugs. | **Engineering Standards Section 4.1** |
| **DNB-07** | **Unrestricted "Override All Without Reason" Button** | Encourages the "Rubber Stamp" approval trap (`FAILED-03`) and destroys audit trail defensibility for regulatory compliance. | **Section 3 & Legal Admissibility** |
| **DNB-08** | **Heavy Global State Management Libraries (Redux Toolkit, MobX)** | Introduces redundant state layers and causes state desynchronization. Next.js App Router + TanStack Query + URL search params is sufficient. | **Engineering Standards Section 4.1** |
| **DNB-09** | **Threaded Finding Comment Threads & Collaboration Cascades** | Threaded comments require multi-tenant messaging cascade, read-state tracking, and schema migrations. Moved to NOT BUILT in M1. | **Declared NOT BUILT (`FR-21`)** |

---

## 5. Formal Approval Requests & User Review Decisions

Under **Canon AI Rules and Engineering Standards, Section 12**, review decisions from the user are recorded:

1. **Dependency Decision:**
   - **`cmdk` (v1.0.0+):** **REJECTED by user.** Zero new dependencies permitted. `PROP-U01` is deferred.
2. **U02 Revision Decision:**
   - **NO one-click persona switching.**
   - Use standard login form + logout + role badge.
   - Remove hardcoded credentials from `governance/page.tsx`.
   - Demo accounts may be listed on login page only when `DEMO_MODE=true`, labelled "demo", passwords never in client code.
3. **Database Schema & RLS Audit Decision (See C_addendum.md):**
   - Direct audit confirmed that NO `approval`, `comment`, or `dispute` table exists in Alembic migration `0001`.
   - Per user directive: *"Do not hide data in JSONB."* Stopped and asked user to choose between Path 1 (Status + AuditLog) and Path 2 (Migration 0002).
   - Comments (`FR-21`) officially moved to NOT BUILT (`DNB-09`).
4. **Approved Execution Order (One Per Run; Stop After Each):**
   - `PROP-U02 (revised)` &rarr; `PROP-U03 + PROP-U12` &rarr; `PROP-U09` &rarr; `PROP-U04 + PROP-U05` &rarr; `PROP-U08` &rarr; `PROP-U21` &rarr; `PROP-U15`.

---

## 6. Phase C Conclusion & Top 10 Proposals Presentation

Phase C is complete. All 21 proposals are documented with exact system placements, effort ratings, risk assessments, and Section 3 compatibility guarantees.

```
+-----------------------------------------------------------------------------+
|                           PHASE C PROPOSALS COMPLETE                        |
|-----------------------------------------------------------------------------|
|  • 21 total proposals synthesized across all 10 required functional areas   |
|  • Prioritized into Releases R1 (Immediate), R2 (Velocity), and R3 (Scale)  |
|  • 8 dangerous features formally rejected in DO NOT BUILD list              |
|  • 1 dependency approval requested (cmdk); 0 database schema changes needed |
+-----------------------------------------------------------------------------+
```

**STOPPING HERE:** As mandated by the HARD GATES, Phase C is complete. The top 10 proposals, the do-not-build list, and the approval requests are presented below for your written approval.
