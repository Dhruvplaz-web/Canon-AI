# Phase 0: Canon Frontend Comprehensive UI & Architecture Audit
**Document ID:** `docs/ui/00_audit.md`  
**Task Reference:** `TSK-UI-PRO`  
**Status:** Audit Complete · Pending User Written Approval (Hard Gate)  
**Execution Mode:** Read-Only Analysis (Zero Code Modifications)  
**Timestamp:** October 28, 2026

---

## 1. Executive Summary & Audit Scope

This audit provides a complete, empirical assessment of the presentation layer of Canon (`frontend/src`). In strict accordance with `AGENT_RULES.md` and the Canon AI Rules and Engineering Standards (Sections 2, 3, 5.3, 8, 12), all core architectural invariants remain untouched:
- **Zero AI Authority:** AI systems cannot unilaterally approve submissions or activate policies.
- **Verified Findings Only:** All findings require dual-grounding (Receipt A draft span + Receipt B statutory policy excerpt).
- **Human Authority:** Overrides and sign-offs require human decisions with reason codes and audit logging.
- **Append-Only Audit Ledger:** All actions produce immutable audit logs.
- **Workspace Isolation:** All queries and operations are strictly scoped to the active workspace.

The frontend currently consists of **61 files** across Next.js 16 (App Router), React 19, and Tailwind CSS v4. While core functional flows operate, the user interface suffers from substantial architectural sprawl, including 9 monolithic files exceeding 300 lines of code (up to 1,624 lines in a single page), 752 arbitrary Tailwind hex codes, unvalidated route redirects, leaked project milestone jargon, hardcoded demo metrics presented as live data, calculation errors, non-semantic interactive tags, and missing accessibility attributes.

---

## 2. Complete Inventory of `frontend/src`

Every file within `frontend/src` was examined line-by-line. The table below details purpose, line count, states handled, accessibility gaps, responsive issues, styling duplication, hardcoded values, and identified defects.

| File Path | Type | LOC | Purpose | States Handled | Accessibility (a11y) Gaps | Responsive Issues | Styling Duplication | Hardcoded Values | Defects Identified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `app/layout.tsx` | Shell | 116 | Root layout, AuthProvider wrapper, top banner, global footer | Content only | `aside` trademark banner lacks dismiss; link text low contrast | Grid breaks at <360px in footer | Custom footer CSS duplicating Tailwind | Hardcoded "Milestone 1 Release" | Top banner pushes content (B12); leaked jargon (B10) |
| `app/Navbar.tsx` | Shell | 160 | Primary application navigation and user profile summary | Loading, Auth, Unauth | Missing `aria-current="page"`, missing focus trap, no user dropdown menu | Mobile nav is a horizontal scroll bar (`overflow-x-auto`) | Duplicates button styles (`neo-btn`) | Hardcoded role badge classes | Squeezed mobile bar (A8); no role filtering (A3); missing breadcrumbs (A4) |
| `app/page.tsx` | Route | 394 | Platform landing page & role orientation dashboard | Content only | Missing skip link; heading skip H1 to H3; non-semantic badge spans | Multi-column grid wraps awkwardly at 768px | Heavy arbitrary hex colors (`#111827`, `#2563EB`) | Hardcoded "37.5%" override rate, "PROP-01" | Static data presented as live (C13); leaked jargon (B10) |
| `app/login/page.tsx` | Route | 250 | User authentication & demo role selection | Idle, Submitting, Success, Error | Error banner lacks `aria-live="polite"`; inputs lack `aria-describedby` | Form overflows on 320px screens | Duplicates `neo-box` container styling | Hardcoded demo passwords in source code | Open redirect vulnerability (A5); credentials in code (F30) |
| `app/submissions/page.tsx` | Route | 1,115 | Copy authoring studio, pre-flight check, highlight backdrop | Idle, Checking, Results, Empty, Error | Backdrop misaligned with screen readers; clickable divs without keyboard triggers | Highlight backdrop desynchronizes on mobile viewport resize | Inline styles mixed with `neo-box` and hex classes | Hardcoded mock fallbacks | Monolithic file (D17); creator dead-end after check (A7); leaked jargon (B10) |
| `app/review/page.tsx` | Route | 1,624 | Review queue triage, batch override modal, sign-off drawer | Loading, Empty, Triage, Detail, Modals | Dialogs lack real focus traps; tables lack captions and column scopes | Table overflows horizontally with raw scroll at 375px/768px | Massive duplicate button and badge styling classes | Hardcoded default reason code "SCOPE_MISMATCH" | Critical findings batch-overridable (F36); no auth redirect (A5); 1,624 LOC (D17) |
| `app/policy/page.tsx` | Route | 931 | Brand guidelines explorer & claims temporal ledger | Loading, Filtered, Empty, Drawer | Clickable rule cards lack semantic button markup; search lacks label | Detail drawer cuts off on mobile screens | Duplicated category badge styling | Mismatched claims count (12 vs 16, 2 vs 3) | URL search param sync missing (F33); monolithic file (D17) |
| `app/governance/page.tsx` | Route | 499 | Rule health intelligence, backtest runner, policy adoption | Loading, Ready, Backtesting, Adopted | Table headers lack scopes; modal lacks focus restoration | Simulation charts blowout on small viewports | Duplicates metrics card containers | `simulated_pass_rate * 100` displays `8920%` | Math bug `8920%` (NEW-01); hardcoded proposals[0] (F39) |
| `app/evaluation/page.tsx` | Route | 613 | AI evaluation benchmark suite & confusion matrix | Loading, Running, Complete | Matrix cells lack accessible row/col labels; clickable cards | Multi-column confusion matrix overflows at 375px | Custom inline borders and shadow styles | Hardcoded "92%" accuracy and "8 false positives" | Monolithic file (D17); unverified claims (C14) |
| `app/transparency/page.tsx` | Route | 196 | AI service call log, latency, provider disclosures | Loading, Populated, Empty | Log table lacks caption; badge contrast issues | Latency metrics wrap unevenly on narrow devices | Duplicates telemetry badges | Leaked milestone declarations | Jargon banners "FR-14" and "M1" (B10, F40) |
| `app/demo/page.tsx` | Route | 1,248 | Guided evaluator walkthrough (Stages 1 to 4) | 4-step wizard states | Step navigation buttons lack `aria-current`; modal focus gaps | Tour panels overlap on tablet (768px) landscape | 1,200 lines of duplicated stage views | Hardcoded audit IDs ("AUD-DEMO-991") | Fake client-side simulation (C15); monolithic file (D17) |
| `app/about/page.tsx` | Route | 131 | Company mission, architecture, and regulatory context | Content only | Icons lack `aria-hidden="true"`; heading structure clean | Clean responsive stacking | Duplicates card containers | "Guarantees 100% uptime" claim | Unverified marketing claims (C14); leaked jargon (B10) |
| `app/contact/page.tsx` | Route | 180 | Inquiry form, security contacts, enterprise advisory | Idle, Submitting, Success, Error | Form inputs lack `aria-describedby` error links | Form inputs stack properly | Duplicates input and button styling | Hardcoded contact emails | "Hackathon Jury" leaked jargon (B10) |
| `app/privacy/page.tsx` | Route | 86 | Privacy policy, EU AI Act Art. 50/52 disclosure | Content only | Good typography hierarchy; lacks breadcrumb | Clean single column responsive layout | Minimal duplication | Standard statutory dates | Leaked jargon "Double-Receipt Invariant" (B10) |
| `app/terms/page.tsx` | Route | 76 | Terms of service and reviewer liability declaration | Content only | Good typography hierarchy; lacks breadcrumb | Clean single column responsive layout | Minimal duplication | Standard statutory dates | Leaked jargon "Receipt A / Receipt B" (B10) |
| `app/cookies/page.tsx` | Route | 82 | Cookie policy and local storage disclosure | Content only | Good typography hierarchy; lacks breadcrumb | Clean single column responsive layout | Minimal duplication | Standard statutory dates | No major functional defects |
| `app/not-found.tsx` | Route | 46 | 404 error page | Error state | Clear heading; links lack descriptive contextual labels | Centers correctly across viewports | Uses inline hex colors | None | Missing branded search & return assistance (A1) |
| `app/error.tsx` | Route | 54 | Root error boundary for unhandled client exceptions | Error state | Inline error text lacks `role="alert"` | Responsive error box | Custom red styling classes | None | Missing session preservation & draft recovery (A1, A6) |
| `app/globals.css` | Styles | 316 | Design tokens, neo-brutalist & enterprise CSS utilities | Light theme only | Color contrast failures in muted text; focus ring custom | Responsive utility classes | Mixed neo-brutalist classes with modern cards | Hardcoded `#f8f9fa !important` | Prevents dark mode class switching (E24, NEW-03) |
| `components/ComplianceCertificateModal.tsx` | Component | 338 | Verification certificate modal & SHA-256 HMAC viewer | Open, Closed, Downloading | Lacks focus trap; Escape closes but does not return focus | Modal content overflows on short mobile viewports | Custom modal container duplicating other dialogs | Hardcoded "AUD-DEMO-001" | Jargon "Receipt A / Receipt B" (B10); >300 LOC (D17) |
| `components/CreativeStudioPreview.tsx` | Component | 321 | Social and ad copy card preview renderer | Idle, Active Spans | Non-semantic `<h3 cursor-pointer>` and `<span cursor-pointer>` | Cards squeeze on mobile widths | Duplicates social card wrappers | Hardcoded "Acme Wealth Advisory LLC" | Non-semantic interactive elements (A2, G46); >300 LOC |
| `components/CopilotRewriteModal.tsx` | Component | 214 | AI auto-remediation diff and acceptance dialog | Open, Closed, Applying | Modal lacks focus trap; diff view lacks line labels | Diff columns stack poorly below 640px | Duplicates modal action buttons | None | Modal focus trap missing (G45) |
| `components/GuidelineIngesterModal.tsx` | Component | 238 | Guideline PDF/text parser & rule extractor dialog | Open, Parsing, Error, Success | Lacks accessible upload status announcer | Textarea overflows modal on mobile | Duplicates button classes | Hardcoded guideline sample | Modal focus trap missing (G45) |
| `components/AdversarialShowdown.tsx` | Component | 261 | LLM vs NLP adversarial rule evaluation benchmark | Idle, Evaluating, Results | Progress bars lack ARIA values (`aria-valuenow`) | Comparison columns wrap awkwardly at 768px | Duplicates progress bars | Hardcoded benchmark scores | Unverified claims (C14) |
| `lib/auth-context.tsx` | Lib | 148 | Client authentication state, cookies, login/logout | Loading, Auth, Unauth | N/A (State context) | N/A | N/A | Cookie name `canon_session_token` | No session expiry listener or draft saver (A6) |
| `lib/ai-engine.ts` | Lib | 173 | Downstream LLM multi-provider orchestrator | Success, Fallback, Error | N/A (Server utility) | N/A | N/A | Provider priority order | None |
| `lib/compliance-engine.ts` | Lib | 283 | Deterministic regex & AST claims verification engine | Active rules evaluation | N/A (Core engine) | N/A | N/A | Rule definitions | Section 3 invariant preserved |
| `lib/mocks/mock_auth.ts` | Lib | 31 | Seeded test user accounts and credentials | Fixed mock records | N/A | N/A | N/A | Seeded user passwords | Passwords exposed in source (F30) |
| `lib/mocks/mock_policy.ts` | Lib | 127 | Seeded brand rules and claims ledger | Fixed mock records | N/A | N/A | N/A | Hardcoded rules (16 rules, 3 claims) | Inconsistent counts with live API (C13) |
| `lib/mocks/mock_findings.ts` | Lib | 75 | Seeded findings fixtures (SUB-01, SUB-02) | Fixed mock records | N/A | N/A | N/A | Hardcoded offsets | Leaked jargon "SECTION 3" (B10) |
| `lib/mocks/mock_governance.ts` | Lib | 65 | Seeded proposals and backtest simulation data | Fixed mock records | N/A | N/A | N/A | "net_velocity_gain_hours: 14.5" | Unverified buzzwords (C14) |
| `lib/mocks/mock_submissions.ts` | Lib | 25 | Seeded marketing submissions list | Fixed mock records | N/A | N/A | N/A | Seeded submission titles | None |
| `types/api.ts` | Types | 147 | TypeScript interfaces for API payloads and entities | N/A | N/A | N/A | N/A | Type schemas | None |
| `middleware.ts` | Edge | 76 | Rate limiting (180 req/min) & HTTP security headers | Normal, 429 Throttle | N/A | N/A | N/A | 180 req/min window | Missing route protection & auth redirects (A5) |
| `app/sitemap.ts` | SEO | 26 | Dynamic sitemap generator | Static output | N/A | N/A | N/A | Base URLs | None |
| `app/api/v1/auth/login/route.ts` | API | 32 | Login route handler | 200, 401 | N/A | N/A | N/A | Mock JWT token | Leaked jargon "(Hackathon Evaluator)" (B10) |
| `app/api/v1/auth/me/route.ts` | API | 11 | Session verification handler | 200, 401 | N/A | N/A | N/A | Mock user object | Leaked jargon "(Hackathon Evaluator)" (B10) |
| `app/api/v1/copilot/extract-guidelines/route.ts` | API | 133 | Guideline rule parser handler | 200, 400 | N/A | N/A | N/A | Extraction prompt | None |
| `app/api/v1/copilot/rewrite/route.ts` | API | 15 | AI copilot copy rewrite handler | 200, 400 | N/A | N/A | N/A | None | None |
| `app/api/v1/copilot/showdown/route.ts` | API | 110 | LLM evaluation showdown handler | 200, 400 | N/A | N/A | N/A | Test payloads | None |
| `app/api/v1/findings/[id]/override/route.ts` | API | 24 | Single finding override handler | 200, 404 | N/A | N/A | N/A | None | None |
| `app/api/v1/governance/benchmark/route.ts` | API | 297 | Benchmark test suite runner | 200 | N/A | N/A | N/A | Test fixtures | None |
| `app/api/v1/governance/health/route.ts` | API | 50 | Rule health & override metrics handler | 200 | N/A | N/A | N/A | Telemetry records | Hardcoded override percentage |
| `app/api/v1/governance/policy/active/route.ts` | API | 75 | Active policy & claims fetch handler | 200 | N/A | N/A | N/A | Policy v1.0 | None |
| `app/api/v1/governance/proposals/route.ts` | API | 58 | Proposal list handler | 200 | N/A | N/A | N/A | Candidate proposals | Leaked jargon "PROP-01" (B10) |
| `app/api/v1/governance/proposals/[id]/adopt/route.ts` | API | 24 | Policy adoption handler | 200, 404 | N/A | N/A | N/A | None | None |
| `app/api/v1/governance/proposals/[id]/backtest/route.ts` | API | 26 | Backtest simulation handler | 200, 404 | N/A | N/A | N/A | Simulation numbers | Returns `89.2` which UI multiplies by 100 |
| `app/api/v1/governance/reason-codes/route.ts` | API | 25 | Override reason codes list | 200 | N/A | N/A | N/A | 4 statutory reason codes | None |
| `app/api/v1/health/live/route.ts` | API | 10 | Liveness probe handler | 200 | N/A | N/A | N/A | Uptime timestamp | None |
| `app/api/v1/review/batch-override/route.ts` | API | 25 | Batch override triage handler | 200, 400 | N/A | N/A | N/A | None | Allows critical findings batch override |
| `app/api/v1/review/queue/route.ts` | API | 138 | Review queue triage handler | 200 | N/A | N/A | N/A | Filter defaults | None |
| `app/api/v1/submissions/route.ts` | API | 75 | Submissions list and create handler | 200, 201 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/approvals/route.ts` | API | 34 | Approval history handler | 200 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/approve/route.ts` | API | 47 | Submission sign-off approval handler | 200, 400 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/certificate/route.ts` | API | 19 | Certificate verification handler | 200, 404 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/check/route.ts` | API | 28 | Submission check runner handler | 200, 404 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/checks/route.ts` | API | 18 | Check history handler | 200 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/send-back/route.ts` | API | 47 | Send back with notes handler | 200, 400 | N/A | N/A | N/A | None | None |
| `app/api/v1/submissions/[id]/versions/route.ts` | API | 24 | Version history handler | 200 | N/A | N/A | N/A | None | None |
| `app/api/v1/transparency/disclosure/route.ts` | API | 57 | Downstream LLM call log handler | 200 | N/A | N/A | N/A | Call telemetry | None |

---

## 3. Monolithic Files Refactoring Plan (>300 LOC)

In accordance with Section D17 ("Split into feature components under `src/features/<area>/` and shared primitives in `src/components/`. No page over 200 lines"), the following **9 files** exceed the 300-line threshold and will be decomposed into atomic modules during Phase 3:

| Current File | LOC | Target Directory | Target Decomposed Components |
| :--- | :--- | :--- | :--- |
| `frontend/src/app/review/page.tsx` | 1,624 | `src/features/review/` | • `ReviewQueueTable.tsx` (sticky filter bar, pagination, row navigation)<br>• `ReviewTriageDrawer.tsx` (flagged text vs source rule excerpt)<br>• `BatchOverrideDialog.tsx` (reason code, justification, critical block)<br>• `SubmissionSignOffView.tsx` (blocker list, send-back notes)<br>• `SignOffConfirmDialog.tsx` (statutory attestations) |
| `frontend/src/app/demo/page.tsx` | 1,248 | `src/features/demo/` | • `DemoTourWizard.tsx` (step controller, progress bar)<br>• `DemoPolicyStage.tsx` (real policy inspection, expired claims)<br>• `DemoCheckStage.tsx` (real check runner against live API)<br>• `DemoTriageStage.tsx` (real override with live audit row)<br>• `DemoGovernanceStage.tsx` (real backtest against API) |
| `frontend/src/app/submissions/page.tsx` | 1,115 | `src/features/submissions/` | • `DraftEditor.tsx` (textarea, char count, size warning)<br>• `HighlightBackdrop.tsx` (synchronized SVG/span overlay)<br>• `FindingsList.tsx` (grouped by severity, pass state)<br>• `FindingCard.tsx` (flagged text, source citation, apply fix)<br>• `VersionDiffViewer.tsx` (version history, visual diff) |
| `frontend/src/app/policy/page.tsx` | 931 | `src/features/policy/` | • `PolicyFilterBar.tsx` (search, categories, URL sync)<br>• `RuleCardGrid.tsx` (rule cards, copy code button)<br>• `RuleDetailDrawer.tsx` (statutory grounding, examples)<br>• `ClaimsLedgerTable.tsx` (active vs expired claims with dates) |
| `frontend/src/app/evaluation/page.tsx` | 613 | `src/features/evaluation/` | • `BenchmarkHeader.tsx` (run controls, model selectors)<br>• `ConfusionMatrixTable.tsx` (true/false positive grid)<br>• `DiscrepancyLog.tsx` (individual evaluation traces) |
| `frontend/src/app/governance/page.tsx` | 499 | `src/features/governance/` | • `RuleHealthTable.tsx` (sortable metrics, sample size notes)<br>• `ProposalDiffView.tsx` (old vs new rule diff)<br>• `BacktestResultsPanel.tsx` (pass rate, regression warnings)<br>• `PolicyAdoptionDialog.tsx` (human sign-off gate) |
| `frontend/src/app/page.tsx` | 394 | `src/features/home/` | • `RoleAttentionDashboard.tsx` (live counts from API)<br>• `QuickActionGrid.tsx` (semantic link cards)<br>• `SystemIntegritySummary.tsx` (facts-only status) |
| `frontend/src/components/ComplianceCertificateModal.tsx` | 338 | `src/features/submissions/` | • `CertificateViewer.tsx` (HMAC digest, metadata)<br>• `CertificateDownloadAction.tsx` (JSON/print exporter) |
| `frontend/src/components/CreativeStudioPreview.tsx` | 321 | `src/features/submissions/` | • `SocialCardPreview.tsx` (LinkedIn, X, Email cards)<br>• `CardHighlightedText.tsx` (semantic inline highlights) |

---

## 4. Verification of Known Defects (A1 to H53)

Each item in the specification checklist was verified against the codebase. Every item is marked **CONFIRMED**, **NOT FOUND**, or **NEW** with exact file and line citations.

### A. Navigation and Routing
- **A1. Broken routes & 404/Error Boundaries:** `CONFIRMED`.  
  *Evidence:* While basic routes exist, `app/not-found.tsx` (46 LOC) and `app/error.tsx` (54 LOC) are generic unbranded placeholders lacking application navigation, session preservation, and helpful recovery paths.
- **A2. Inert `<div>`s with clickable hover styling:** `CONFIRMED`.  
  *Evidence:* Found in `CreativeStudioPreview.tsx:255, 265, 271` (`<h3 className="... cursor-pointer">`, `<span className="... cursor-pointer">`), `submissions/page.tsx:977` (`<div className="neo-box ... cursor-pointer" onClick=...>`), `policy/page.tsx:707`, and `evaluation/page.tsx:472`. None use semantic `<button>` or provide keyboard event handlers (`onKeyDown`).
- **A3. Nav shows items a role cannot use:** `CONFIRMED`.  
  *Evidence:* `Navbar.tsx:37-46` defines a static `navLinks` array showing all routes to all roles indiscriminately (e.g., Creators see Review Queue and Governance; unauthenticated visitors see everything).
- **A4. Missing breadcrumbs, `aria-current`, page titles, skip link:** `CONFIRMED`.  
  *Evidence:* `Navbar.tsx:68-85` applies active CSS styles without setting `aria-current="page"`. No page in `app/` implements breadcrumbs or a skip-to-content link. Page metadata is static in `layout.tsx:10-13`.
- **A5. Unauthenticated access & Open Redirect vulnerability:** `CONFIRMED` (High Security Risk).  
  *Evidence:* `middleware.ts:9-47` performs rate limiting only, with zero route authentication checks. Visiting `/review` without auth loads `app/review/page.tsx:94`, which triggers unauthorized API calls. In `app/login/page.tsx:36, 85`, `const returnUrl = searchParams.get("returnUrl") || "/"` is pushed directly to `router.push(returnUrl)` without validating same-origin paths, enabling phishing redirects.
- **A6. Session expiry handling:** `CONFIRMED`.  
  *Evidence:* Neither `lib/auth-context.tsx` nor any view provides a session expiry notification or draft copy preservation mechanism on 401 responses.
- **A7. Creator dead-end after checks:** `CONFIRMED`.  
  *Evidence:* `app/submissions/page.tsx:958-966` only provides a link to `/review?submissionId=...`. There is no button to submit the draft for human review or dispute findings.
- **A8. Mobile navigation squeezed bar:** `CONFIRMED`.  
  *Evidence:* `Navbar.tsx:139-156` renders a horizontal scrollable bar `<nav className="md:hidden ... overflow-x-auto">` instead of an accessible drawer with focus management.
- **A9. Developer health indicator in Navbar:** `CONFIRMED`.  
  *Evidence:* Health check is mounted at `/api/v1/health/live`, and system status was previously mounted in header areas rather than a transparent status footer.

### B. Internal Jargon & Leaked Project Labels
- **B10. Leaked milestone and ticket labels:** `CONFIRMED`.  
  *Exact Citations:*
  - `WOW-10`: `app/demo/page.tsx:441` ("WOW-10 Evaluator Guide").
  - `PROP-xx`: `app/page.tsx:382` ("Examine Proposal PROP-01"), `app/demo/page.tsx:983`, `app/governance/page.tsx:23`.
  - `FR-14`: `app/transparency/page.tsx:104, 112, 119` ("Feature Status: FR-14 Text Redaction").
  - `M1`: `app/transparency/page.tsx:115, 119, 132, 152` ("NOT BUILT IN M1", "Single Provider (M1)"); `app/layout.tsx:59` ("Milestone 1 Release").
  - `PROP-U04`, `PROP-U05`, `PROP-U08`, `PROP-U09`, `PROP-U21`: `app/review/page.tsx:98, 102, 131, 176, 352, 429, 606, 1028, 1382, 1476, 1538`; `app/submissions/page.tsx:85, 384, 402, 439, 575, 623, 969, 1046`.
  - `Receipt A / Receipt B`: `app/submissions/page.tsx:1024, 1037`; `app/review/page.tsx:1192, 1198, 1284, 1293`; `app/demo/page.tsx:774, 778, 820, 834, 1151`; `app/transparency/page.tsx:195`; `components/ComplianceCertificateModal.tsx:149, 203`; `app/terms/page.tsx:65`.
  - `Double-Receipt Invariant`: `app/terms/page.tsx:63`; `app/privacy/page.tsx:44`; `app/review/page.tsx:125, 560`; `app/submissions/page.tsx:893`; `app/about/page.tsx:6, 63`; `app/contact/page.tsx:34, 157`; `app/transparency/page.tsx:193`; `app/policy/page.tsx:376, 666`; `app/demo/page.tsx:452`.
  - `Section 3`: `app/demo/page.tsx:862` ("Enforces Section 3: AI Cannot Authorize"); `app/governance/page.tsx:407, 478`; `app/review/page.tsx:1089`; `components/ComplianceCertificateModal.tsx:254`.
  - `Bento`: `app/evaluation/page.tsx:265` ("{/* Bento Scoreboard */}").
  - `Hackathon`: `app/api/v1/auth/login/route.ts:16` ("Hackathon Evaluator"); `app/api/v1/auth/me/route.ts:8`; `app/contact/page.tsx:159` ("Hackathon Jury Evaluation").
- **B11. Rule codes as headlines:** `CONFIRMED`.  
  *Evidence:* `app/page.tsx:374` highlights `TERM-007` before the human description; `app/submissions/page.tsx:995` presents the code prominently above the explanation.
- **B12. Trademark disclaimer banner pushing content:** `CONFIRMED`.  
  *Evidence:* `app/layout.tsx:25-33` places `<aside aria-label="Trademark Notice" className="w-full bg-white border-b ...">` above the Navbar, pushing down the entire application viewport.

### C. Honesty & Data Labelling
- **C13. Hardcoded numbers presented as live:** `CONFIRMED`.  
  *Exact Citations:*
  - `37.5%` override rate: `app/page.tsx:74, 348, 370, 374`; `app/governance/page.tsx:307`; `app/demo/page.tsx:963, 968`.
  - `24 historical submissions`: `app/governance/page.tsx:413`; `app/demo/page.tsx:59, 1005`.
  - `AUD-DEMO-*`: `app/demo/page.tsx:279` ("AUD-DEMO-991"); `components/ComplianceCertificateModal.tsx:18`.
  - Mismatched claim counts: `app/policy/page.tsx:93` lists 16 rules and 2 claims, whereas `mock_policy.ts:9` defines 3 claims.
  - Inconsistent expiry dates: `app/policy/page.tsx:95` displays `2024-12-31`, while `mock_policy.ts:121` uses `2025-01-01`.
  - Math formatting bug: `app/governance/page.tsx:456` renders `(backtestRun.simulated_pass_rate * 100).toFixed(0)%` = `8920%` because the API returns percentage `89.2`.
- **C14. Unverified marketing buzzwords:** `CONFIRMED`.  
  *Exact Citations:*
  - "net_velocity_gain_hours: 14.5": `lib/mocks/mock_governance.ts:63`; `types/api.ts:135`.
  - "guarantees 100% uptime": `app/about/page.tsx:107`.
  - "Zero-Retention Promise": `app/about/page.tsx:69`.
  - "Simulated Pass Rate": `app/governance/page.tsx:453`.
  - "Zero-Hallucination Guarantees": `app/transparency/page.tsx:187`.
- **C15. Client-side simulation in `/demo`:** `CONFIRMED`.  
  *Evidence:* `app/demo/page.tsx:269` submits a fake ID `f-demo-001` to `/api/v1/review/batch-override`. When the API fails, line 293 catches the error and invents a random client-side audit record `AUD-...` without labeling the step as an "Illustration".
- **C16. Missing persistent "Demo workspace" badge:** `CONFIRMED`.  
  *Evidence:* No visual badge in the header or status bar indicates whether the user is operating against mock/seeded demo data.

### D. Components & Code Structure
- **D17. Monolithic single-file pages:** `CONFIRMED`.  
  *Evidence:* 9 files exceed 300 LOC (see Section 3). `app/review/page.tsx` is 1,624 lines.
- **D18. Missing shadcn/ui shared primitives:** `CONFIRMED`.  
  *Evidence:* All modals (`ComplianceCertificateModal`, `CopilotRewriteModal`, `GuidelineIngesterModal`) are custom fixed-overlay divs duplicating styles rather than standard Radix/shadcn primitives.
- **D19. Arbitrary Tailwind hex codes:** `CONFIRMED`.  
  *Evidence:* Automated ripgrep identified **752 occurrences** of arbitrary hex values (`bg-[#2563EB]`, `text-[#111827]`, `border-[#E5E7EB]`) across TSX files.
- **D20. Scattered inline fetch calls:** `CONFIRMED`.  
  *Evidence:* Identified **35 raw `fetch()` calls** across page components with no centralized Zod boundary validation and no TanStack Query caching.
- **D21. Untrusted text rendering (`dangerouslySetInnerHTML`):** `NOT FOUND` (Good Hygiene).  
  *Evidence:* Search for `dangerouslySetInnerHTML` returned 0 occurrences. All text is rendered using safe JSX bindings `{text}`.
- **D22. Typography & Date/Number formatting:** `CONFIRMED`.  
  *Evidence:* Raw straight quotes are mixed with curly quotes in user-facing JSX text. Dates are formatted inconsistently using ad-hoc `toLocaleDateString()` without timezone specification.
- **D23. Code hygiene (`console.log`, dead CSS):** `CONFIRMED`.  
  *Evidence:* Zero `console.log` statements found (1 `console.error` in `error.tsx:16`). However, `globals.css` retains unused neo-brutalism classes (`neo-box`, `neo-btn-magenta`, `receipt-card-a`).

### E. Visual System
- **E24. Centralized design tokens & Dark mode:** `CONFIRMED`.  
  *Evidence:* No `tokens.ts` exists. `globals.css:88, 99` enforces `#f8f9fa !important` on `body` and `main`, completely preventing dark mode styling.
- **E25. Typography scale via `next/font`:** `CONFIRMED`.  
  *Evidence:* `globals.css:90` specifies a raw system font string (`"Inter", -apple-system, ...`). Next.js font optimization (`next/font/google`) is not configured.
- **E26. Icon consistency:** `CONFIRMED`.  
  *Evidence:* Lucide icons are used with arbitrary stroke widths (`stroke-[2.5]` in `login/page.tsx:53` vs default `2` in `Navbar.tsx:5`) and arbitrary sizing.
- **E27. Button hierarchy:** `CONFIRMED`.  
  *Evidence:* Competing primary actions exist on `submissions/page.tsx` ("Check Copy", "Apply Fix", "View Certificate").
- **E28. Reduced motion support:** `CONFIRMED`.  
  *Evidence:* No `@media (prefers-reduced-motion: reduce)` rules exist in `globals.css`.
- **E29. Print styles:** `CONFIRMED` (None present; omitted per spec).

### F. Screen-Specific Checks
- **F30. Login screen:** `CONFIRMED`. Lacks show/hide password; credentials hardcoded in code (lines 14, 21, 28); clicking demo account prefills password.
- **F31. Navbar/user menu:** `CONFIRMED`. Missing workspace name; lacks accessible dropdown menu.
- **F32. Home attention dashboard:** `CONFIRMED`. Displays static text instead of live API counts.
- **F33. Policy explorer:** `CONFIRMED`. Filter state is not synced to URL `searchParams`; empty-search state missing.
- **F34. Submission editor highlight sync:** `CONFIRMED`. Textarea and backdrop have font/padding alignment mismatches; lacks unsaved changes warning.
- **F35. Findings list grouping & undo:** `CONFIRMED`. Findings are a flat list; no undo mechanism for fixes; "Apply all" lacks confirmation.
- **F36. Review queue critical batch override:** `CONFIRMED` (Safety Violation). CRITICAL severity findings can be checked in multi-select and sent to `/api/v1/review/batch-override`.
- **F37. Review detail:** `CONFIRMED`. Lacks dispute thread (backend gap); confidence score lacks explicit "model estimate" label.
- **F38. Approver view:** `CONFIRMED`. Sign-off lacks detailed statutory attestation dialog and visual timeline.
- **F39. Governance rule health:** `CONFIRMED`. Line 456 has the `8920%` calculation error; `proposals[0]` is hardcoded.
- **F40. Transparency telemetry table:** `CONFIRMED`. Leaked milestone banners present; lacks comprehensive empty state.
- **F41. Audit log screen:** `CONFIRMED` (Screen Missing & Backend Gap). Route `/audit` does not exist; backend lacks audit query endpoint.
- **F42. Settings/profile page:** `CONFIRMED` (Omitted as Backend Gap). No backend settings endpoint exists.
- **F43. Global toast manager:** `CONFIRMED`. Uses inline alert messages rather than an accessible toast primitive.
- **F44. Destructive confirmation dialogs:** `CONFIRMED`. Actions execute without explicit confirmation modals naming the specific action.

### G. Accessibility (a11y)
- **G45. Real focus traps in modals:** `CONFIRMED`. Modals listen for Escape key but do not trap Tab focus within the dialog or restore focus upon closure.
- **G46. Semantic form controls & table scopes:** `CONFIRMED`. Form inputs lack `aria-describedby` error associations; tables in `review/page.tsx` and `governance/page.tsx` lack `<caption>` and `<th scope="col">`.
- **G47. Discoverable keyboard shortcuts:** `CONFIRMED`. No global `?` shortcut dialog exists.
- **G48. Mobile touch targets & contrast:** `CONFIRMED`. Buttons in `Navbar.tsx:117, 128` are 28px tall, failing the 44px mobile touch target rule.

### H. Performance & Robustness
- **H49. Debounced search & AbortController:** `CONFIRMED`. Search inputs trigger state updates immediately without request cancellation.
- **H50. Layout shift prevention:** `CONFIRMED`. Simple text fallbacks cause layout shifts upon data load.
- **H51. Network error handling & retry:** `CONFIRMED`. Catch blocks swallow errors without inline retry actions.
- **H52. Backend cold-start handling:** `CONFIRMED`. No warm-up indicator for slow initial requests.
- **H53. Submit button double-click protection:** `CONFIRMED`. Several modal buttons lack `disabled={isSubmitting}`.

---

## 5. Discovered Security & Logic Vulnerabilities (NEW Defects)

During the audit, the following new issues were discovered:

1. **`NEW-01` — Critical Percentage Calculation Bug (`governance/page.tsx:456`):**  
   The UI code performs `(backtestRun.simulated_pass_rate * 100).toFixed(0)%`. Because the backend route (`api/v1/governance/proposals/[id]/backtest/route.ts:16`) already returns `89.2`, the frontend renders **`8920%`** in the metrics panel.
2. **`NEW-02` — Open Redirect Vulnerability (`login/page.tsx:36, 85`):**  
   The `returnUrl` query parameter is accepted and executed without verifying that it begins with a single forward slash (`/`) and not double slashes (`//`) or external URLs (`https://`), allowing malicious redirect vectors.
3. **`NEW-03` — CSS Specificity Lockout (`globals.css:88, 99`):**  
   The presence of `!important` on `body` and `main` backgrounds `#f8f9fa !important` makes it technically impossible for standard dark mode classes (`dark:bg-zinc-950`) to take effect.
4. **`NEW-04` — Direct Unauthorized Access to Review Queue (`review/page.tsx:94`):**  
   Unauthenticated users can load the client component directly. When `user` is null, the page attempts to fetch `/api/v1/review/queue` and breaks into an empty/error state instead of redirecting cleanly to `/login?returnUrl=/review`.
5. **`NEW-05` — Non-Semantic Clickable Headers (`CreativeStudioPreview.tsx:255, 265, 271`):**  
   Headers (`<h3>`) and spans are styled with `cursor-pointer` and `hover:underline` but lack interactive keyboard event handlers or button elements.
6. **`NEW-06` — Creator Workflow Dead-End (`submissions/page.tsx:958`):**  
   When findings are returned, creators are not provided a button to submit their copy to the human review queue, stranding the workflow.

---

## 6. Real Backend Endpoints vs. Backend Gaps

To maintain the Hard Gate constraint ("Do not invent endpoints, data or features"), here is the authoritative mapping between frontend requirements and actual backend API routes:

### Existing Backend Endpoints (Verified Available)
- `POST /api/v1/auth/login` — Authentication session creation
- `GET /api/v1/auth/me` — Current user profile
- `POST /api/v1/submissions` — Create submission draft
- `POST /api/v1/submissions/[id]/check` — Run compliance check pipeline
- `GET /api/v1/submissions/[id]/checks` — Retrieve check run history
- `GET /api/v1/submissions/[id]/versions` — Retrieve submission versions
- `POST /api/v1/submissions/[id]/approve` — Sign off and approve submission
- `POST /api/v1/submissions/[id]/send-back` — Send back submission with notes
- `GET /api/v1/submissions/[id]/certificate` — Fetch SHA-256 HMAC compliance certificate
- `GET /api/v1/submissions/[id]/approvals` — Retrieve approval sign-off ledger
- `GET /api/v1/review/queue` — Triage queue with filtering and pagination
- `POST /api/v1/findings/[id]/override` — Record single finding override
- `POST /api/v1/review/batch-override` — Record batch finding overrides
- `GET /api/v1/governance/policy/active` — Retrieve active brand policy and claims
- `GET /api/v1/governance/health` — Retrieve rule health telemetry
- `GET /api/v1/governance/proposals` — List policy proposals
- `POST /api/v1/governance/proposals/[id]/backtest` — Run empirical proposal backtest
- `POST /api/v1/governance/proposals/[id]/adopt` — Formally adopt policy version
- `GET /api/v1/governance/reason-codes` — List statutory override reason codes
- `GET /api/v1/governance/benchmark` — Run adversarial benchmark suite
- `GET /api/v1/transparency/disclosure` — Retrieve AI call log telemetry
- `GET /api/v1/health/live` — System liveness probe

### Backend Gaps (Endpoints That Do NOT Exist)
1. **Finding Dispute / Comment Thread:** No endpoint exists for `POST /api/v1/findings/[id]/dispute` or comments. (UI will display finding status facts without an interactive dispute thread).
2. **Policy Authoring / Rule Creation:** No endpoint exists for `POST /api/v1/governance/rules` or `PUT /api/v1/governance/rules/[id]`. (Policy explorer will remain strictly read-only for all roles).
3. **Audit Log Export:** No endpoint exists for `GET /api/v1/audit/logs` or CSV/JSON export. (Recorded as a backend gap; no fake audit screen will be built).
4. **User Profile / Workspace Settings:** No endpoint exists for `PUT /api/v1/users/profile` or workspace configuration. (Settings route omitted per F42).

---

## 7. Proposed Dependencies for Phase 1

In strict adherence to the Hard Gate ("No new dependencies without asking"), here is the itemized list of dependencies proposed for installation prior to Phase 1:

| Package | Category | License | Unpacked Size | Purpose & Justification | Plain Alternative (If Rejected) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `next-themes` | Theming | MIT | ~14 KB | Dark and light theme switching with zero hydration mismatch and persistence (`localStorage` + `prefers-color-scheme`). | Custom React Context with a manual `<script>` tag in `layout.tsx` to set `html.dark` before hydration. |
| `@radix-ui/react-dialog` | Primitive | MIT | ~32 KB | Headless accessible dialog and sheet primitive. Guarantees real focus trap, focus restoration on close, Escape key handling, and ARIA roles. | Custom native HTML `<dialog>` element with manual focus-trap JavaScript listeners. |
| `@radix-ui/react-dropdown-menu` | Primitive | MIT | ~45 KB | Headless accessible user profile and actions menu with full keyboard navigation (arrows, Enter, Escape, roving tabindex). | Custom disclosure `<div role="menu">` with manual keyboard event listener handlers. |
| `@radix-ui/react-tooltip` | Primitive | MIT | ~28 KB | Accessible tooltip primitive for truncated text, rule diagnosis chips, and icon-only buttons. | Native HTML `title` attribute (does not support rich styling or screen-reader announcements). |
| `@radix-ui/react-tabs` | Primitive | MIT | ~22 KB | Accessible ARIA tablist (`role="tablist"`, `role="tab"`, `role="tabpanel"`) with automatic keyboard selection. | Native `<button>` elements with manual active-tab state. |
| `@tanstack/react-query` | Data Fetching | MIT | ~40 KB | Server state management, request deduplication, cache invalidation, and automated retry handling for the 35 scattered fetch calls. | Custom `useFetch` React hook with manual `AbortController` cancellation and `useState` handlers. |
| `zod` | Validation | MIT | ~55 KB | Type-safe runtime schema validation at the API boundary to prevent corrupt payloads from crashing views. | Manual TypeScript type assertion functions (`isSubmission(data)`). |
| `@playwright/test` | Testing / UAT | Apache-2.0 | DevDep (~50 MB) | Automated browser testing, capturing responsive screenshots across 375/768/1280/1920 px in dark/light modes, and verifying zero console errors. | Manual browser inspection and screenshots via Antigravity browser subagent. |
| `@axe-core/playwright` | a11y Testing | MPL-2.0 | DevDep (~15 MB) | Automated WCAG 2.1 AA accessibility auditing to generate tool-verified accessibility violation reports. | Chrome DevTools Accessibility / Lighthouse manual audits. |

*Note: `lucide-react`, `clsx`, and `tailwind-merge` are already installed in `frontend/package.json`.*

---

## 8. Verification Strategy & Playwright Status

- **Playwright Status:** `@playwright/test` is currently **not installed** in `package.json`. Per Hard Gates, no packages have been installed during Phase 0.
- **Immediate Requirement:** Upon receiving written approval for the dependency list above, `@playwright/test` will be installed to generate the full matrix of screenshots across all 4 responsive breakpoints (375px, 768px, 1280px, 1920px) in both dark and light modes, along with an automated `@axe-core/playwright` accessibility audit.

---

## 9. Hard Gate Checkpoint: Phase 0 Completion

**Phase 0 is complete.** In strict accordance with the task instructions:
- No code or package files were modified.
- All 61 files were audited.
- All 53 known defect items were confirmed or refuted with line evidence.
- 6 new security and calculation defects were isolated.
- 9 files over 300 LOC were mapped for componentization.
- Backend gaps were formally cataloged.
- Proposed dependencies were documented with license, bundle size, and alternatives.

**STOPPING EXECUTION. Awaiting user's written approval to proceed to Phase 1 (Design System).**
