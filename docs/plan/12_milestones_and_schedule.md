# Canon: Milestones, Release Roadmap & 48-Hour Execution Schedule (12_milestones_and_schedule.md)

**Document ID:** `DOC-12`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [TASK, Phases 0-14] `file:///E:/Software/codex/Docuements/Canon%20Phased%20Project%20Task%20Document.pdf`, [DHRUV-V3, Sec 6-7] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [TB-BRIEF, Sec 4] `file:///E:/Software/codex/Docuements/Canon_Role_Brief_Tanishka_Bellale_FINAL.pdf`, [TG-BRIEF, Sec 1-3] `file:///E:/Software/codex/Docuements/Canon%20Role%20Brief%20for%20Tanishka%20Gawale.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Product Release Milestones & Progression

Canon is planned across three distinct maturity milestones. Milestone 1 represents the competitive hackathon vertical slice; Milestones 2 and 3 define the real-world startup trajectory.

```
+----------------------------------------------------------------------------------------------------+
|                                    PRODUCT RELEASE ROADMAP                                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  MILESTONE 1 (M1): Cloud-First Deployed Vertical Slice [48 Hours]                                  |
|  - Cloud Deployment Window: Hours 00–04 (Supabase DB, Render backend, Vercel edge proxy, CI).      |
|  - Deployed Environment Contract: All development from H05 onward runs against deployed cloud.     |
|  - Scope: 17 Tables, 28 API Endpoints, 8 Core Screens (SCR-01 to SCR-08).                         |
|  - Core Loop & Acceptance Test: Ingest Policy v1.0 -> Submit Copy -> Double-Receipt Findings       |
|    -> Reviewer Override with Reason Code -> Rule Health Diagnosis -> Minimal Scope-Exception       |
|    Proposal (PROP-01) -> Backtest Simulation -> Policy v1.1 Approval Acceptance Test.               |
|  - What Was Cut to Make Room: Binary PDF/PyMuPDF parsing (plain text/rules.json used),             |
|    24-page PDF extraction, in-container embeddings/bge-small (Pass-All mode used), local Ollama,   |
|    Railway mirror, local Docker demo profile. One host, one provider, one recorded fallback video. |
|                                       |                                                            |
|                                       v (Evaluator Validation & Advancement)                       |
|                                                                                                    |
|  MILESTONE 2 (M2): Beta-Ready Governance Platform [Weeks 3 to 6]                                   |
|  - Scope: 26 Tables, Full 28 Endpoints, 10 Screens.                                                |
|  - Parsing & Ingestion: Full PyMuPDF coordinate & bounding-box PDF extraction.                     |
|  - Vector Search: Local bge-small embeddings with pgvector cosine retrieval for > 100 rules.       |
|  - Evaluation: Standardized offline evaluation harness (make eval) quoting measured accuracy.       |
|                                       |                                                            |
|                                       v (Pilot Customers & Seed Capital)                           |
|                                                                                                    |
|  MILESTONE 3 (M3): Enterprise Startup-Ready [Months 3 to 6]                                        |
|  - Scope: Enterprise SAML/SSO, dedicated Redis/Celery queue workers, S3 asset storage.             |
|  - Authoring Integrations: Google Docs & Microsoft Word add-ins; MCP server for external AI tools. |
|  - Multi-Tenant Scale: Paid infrastructure (unpausable DB, dedicated API compute, 99.9% SLA).     |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1.2 Dhruv Patil (Lead Architect & Backend) Hours Breakdown by 4-Hour / Workstream Block

In strict compliance with sprint governance and the 30-hour engineering limit (Review Condition 8):

| Block | Sprint Window | Primary Tasks & Focus Areas | Dhruv Hours | Status |
|:---|:---|:---|:---:|:---:|
| **Block 1** | Hours 00–04 | Cloud Deployment (`TSK-M1-01` to `TSK-M1-03`, `TSK-M1-05`): Supabase DB, Render API, CI, OpenAPI & Mocks | 3.5 hrs | PASS |
| **Block 2** | Hours 05–12 | Data & Auth (`TSK-M1-07` to `TSK-M1-09`, `TSK-M1-11`): 17 tables (inc. `approved_claim`), Argon2, RLS Invariant, Seed Script | 5.0 hrs | PASS |
| **CHECKPOINT**| **Hour 12** | **Go/No-Go Evaluation Checkpoint & Predetermined Scope Cut Trigger** | — | **GATE** |
| **Block 3** | Hours 13–24 | Pipeline (`TSK-M1-12`, `TSK-M1-13`, `TSK-M1-15` to `TSK-M1-17`): Normalizer, Injection, Deterministic Claims/Terms Engine, Job Runner | 7.5 hrs | PASS |
| **CHECKPOINT**| **Hour 24** | **Pipeline & Core Verification Integration Checkpoint** | — | **GATE** |
| **Block 4** | Hours 25–36 | Intelligence & Governance (`TSK-M1-19` to `TSK-M1-21`, `TSK-M1-24` to `TSK-M1-26`): Adapter, Verifier, Overrides, Backtest Engine | 7.5 hrs | PASS |
| **CHECKPOINT**| **Hour 36** | **Feature Lock Checkpoint (Zero New Features Permitted)** | — | **GATE** |
| **Block 5** | Hours 37–48 | Hardening & E2E (`TSK-M1-28`, `TSK-M1-29`, `TSK-M1-31`, `TSK-M1-32`): E2E test `test_demo_flow.py`, `make eval`, Rehearsals | 4.0 hrs | PASS |
| **TOTAL** | **48 Hours** | **Complete Sprint Budget (Capped <= 30.0 hrs)** | **27.5 hrs** | **PASS** |

### 1.3 First Tasks to Cut at Hour 12 Checkpoint (Predetermined Scope Cuts)

If backend or frontend velocity falls behind schedule at the Hour 12 checkpoint, the team immediately executes the following predetermined cuts in order:
1. **Cut 1 (Dynamic Proposal Synthesis $\to$ Seeded Proposal):** Drop dynamic LLM rule proposal diff synthesis in `TSK-M1-24`; load the **seeded, deterministic draft proposal `PROP-01`** directly from `rules.json` into the database. (Recovers 1.0 hr).
2. **Cut 2 (Fuzzy Near-Miss Token Distance):** Drop complex token sort distance in `TSK-M1-16`; retain exact keyword substring matching and simple case-insensitive comparison. (Recovers 1.0 hr).
3. **Cut 3 (WCAG Relative Luminance Math):** Drop dynamic relative luminance contrast calculation in `TSK-M1-16`; evaluate contrast as a static guideline rule. (Recovers 0.5 hr).
4. **Cut 4 (Secondary UI Filters):** Drop secondary filter facets on the review queue (`SCR-05`); reviewers open submissions directly by ID or primary list. (Recovers 1.0 hr).
*Total velocity recovered if triggered:* **3.5 engineering hours**, restoring critical path momentum without compromising the core verification loop or acceptance test.

### 1.4 Submission Notes: Explicitly Unbuilt Features in Milestone 1
In strict adherence to Review Condition 4, the following functional requirements are declared as **NOT BUILT** in Milestone 1 and explicitly scheduled for post-hackathon milestones:
- **`FR-13` (Visual Asset Palette, Contrast & Logo Checks):** NOT BUILT in Milestone 1 (Deferred to Milestone 3 Visual Engine).
- **`FR-14` (Payload Redaction & Sensitive Data Masking):** NOT BUILT in Milestone 1 (Deferred to Milestone 2; LLM adapter passes sanitized prompt; external proxy redaction engine deferred).
- **`FR-21` (Threaded Collaboration Comments on Findings):** NOT BUILT in Milestone 1 (Deferred to Milestone 2 Collaboration Suite).
- **`FR-24` (Export Compliance Audit Trail as Formatted PDF):** NOT BUILT in Milestone 1 (CSV/JSON audit export supported via `API-28`; binary PDF export deferred to Milestone 2).

### 1.1 Milestone Criteria Definition

#### Milestone 1 (M1): Deployed Vertical Slice (CodeNexus Round 2 - 48 Hours)
- **Entry Criteria:** Complete planning document set approved; GitHub repository initialized; API keys and free-tier accounts provisioned; OpenAPI contract and mock fixtures delivered on Day 1.
- **Exit Criteria:**
  1. Web frontend deployed and reachable at public URL (Vercel).
  2. Backend API deployed on public cloud host (Render/Railway).
  3. Managed PostgreSQL database running on Supabase with RLS active.
  4. End-to-end core governance loop working live:
     - Active Policy `v1.0` loaded.
     - Submission checked in $< 4$ seconds.
     - Double-Receipt verified finding cards rendered with exact cited source receipts.
     - Reviewer override executed requiring Reason Code, updating Rule Health telemetry.
     - Final sign-off transition emitted to append-only audit log.
     - Live AI Disclosure Panel populated from real `ai_service_call` database logs.
  5. Zero console errors; 3 consecutive successful end-to-end demo dry runs.

#### Milestone 2 (M2): Beta-Ready Platform (Closed Customer Pilot)
- **Entry Criteria:** Milestone 1 successfully presented; feedback incorporated; design partner cohort secured.
- **Exit Criteria:** Full 26-table schema active; live (non-seeded) Rule Health diagnostics; automated rule change proposal diff generator; backtest simulation engine executing historical replay; `pgvector` embedding retrieval active; `make eval` harness reporting $> 90\%$ evidence verification rate.

#### Milestone 3 (M3): Enterprise Startup-Ready (Commercial Availability)
- **Entry Criteria:** 3 paying enterprise design partner contracts; seed funding or revenue breakeven achieved.
- **Exit Criteria:** SOC 2 Type 1 compliance readiness; SAML/SSO identity provider integration; dedicated Redis worker cluster; SLA-backed production infrastructure; external authoring plugins (Word / Google Docs); Model Context Protocol (MCP) server.

---

## 2. Milestone 1: Hour-by-Hour Master Execution Schedule (48 Hours)

- **Total Sprint Budget:** Exactly 48 Hours.
- **Hours-Per-Person Budget for Milestone 1 (Sprint Engineering Hours):**
  In strict compliance with healthy engineering practices and sprint rigor, individual workloads are budgeted below 30 hours per person across the 48-hour hackathon.

| Team Member | Role | Primary Assigned Modules | M1 Hours | Status (<= 30 hrs) |
|:---|:---|:---|:---:|:---:|
| **Dhruv Patil (DP)** | Lead Architect & Backend | Cloud deployment (H00-04), DB schema (17 tables), Auth, Check Pipeline, Backtest Engine, AI Adapter | 27.5 hrs | PASS (Within limit) |
| **Tanishka Bellale (TB)** | Frontend Lead | App Shell, Login, Submission Editor, Double-Receipt Viewer, Override Modal, Rule Health / Backtest UI | 27.0 hrs | PASS (Within limit) |
| **Prathmesh Shinde (PS)** | Domain, Fixtures & Review | Guideline JSON fixture, test cases, adversarial injection suite, **Second Diff Reviewer (Backend)** | 24.5 hrs | PASS (Within limit) |
| **Tanishka Gawale (TG)** | Project Mgr & QA Lead | Task tracking, gate compliance, 4-minute demo coordination, pre-recorded fallback video, Acceptance QA | 23.0 hrs | PASS (Within limit) |
| **TOTAL SPRINT** | Runtime Rebels | Integrated Cloud-First Execution | 103.0 hrs | PASS (All <= 30 hrs) |

- **Second Diff Reviewer Protocol for Non-Security Backend Code:**
  - *Security & Auth Code:* Dhruv Patil (Primary Author) + Tanishka Gawale (Compliance & Audit Reviewer).
  - *Non-Security Backend Code (Pipeline, Normalizer, Deterministic Rules, Backtest):* Dhruv Patil (Author) + **Prathmesh Shinde (Mandatory Second Diff Reviewer)**. Every PR requires Prathmesh's review and sign-off before merge to `main`.
  - *Frontend Code:* Tanishka Bellale (Author) + Dhruv Patil (API Contract Reviewer).

```
48-HOUR CLOUD-FIRST TIMELINE OVERVIEW:
[H00-H04] CLOUD DEPLOYMENT & FIRST DELIVERABLE:
          Deploy Supabase PostgreSQL, Render FastAPI backend, Vercel frontend,
          /api/v1 rewrite edge proxy, CI auto-deploy, /health live/ready check.
          Deliver OpenAPI 3.1 specification & typed mock fixtures.
          -> All subsequent development and tests run against deployed cloud!
[H05-H12] FOUNDATION LAYER (On Deployed Environment):
          17-Table Schema Migrations, Argon2 Auth, JWT Cookies, RLS Unset Workspace Test,
          Seed Script (Demo Workspace, Users, Active Policy v1.0, Reason Codes).
          -> [H12 GO/NO-GO CHECKPOINT]
[H13-H24] VERIFICATION PIPELINE & SUBMISSION WORKFLOW:
          Plain text / rules.json Ingestion, Injection Scan, Deterministic Engine,
          Submission Drafts API & UI, Split-Screen Findings Viewer with Double-Receipt.
          -> [H24 GO/NO-GO CHECKPOINT]
[H25-H36] INTELLIGENCE, GOVERNANCE & ACCEPTANCE TEST:
          LLM Adapter (Single Provider), Double-Receipt Verifier, Reviewer Overrides & Reason Codes,
          Rule Health Dashboard (SCR-07), Minimal Scope-Exception Proposal Generator (PROP-01),
          Backtest Simulation Engine, Policy v1.1 Approval Acceptance Test (SCR-08),
          Live AI Disclosure Panel (SCR-09).
          -> [H36 GO/NO-GO CHECKPOINT (FEATURE LOCK)]
[H37-H44] HARDENING, E2E VERIFICATION & BENCHMARK HARNESS:
          Run backend/tests/e2e/test_demo_flow.py against deployed environment.
          Execute make eval benchmark harness reporting measured rates.
          Second diff reviews on non-security backend code.
          Visual browser UAT (375px mobile & 1440px desktop).
[H45-H48] HARD CODE FREEZE (H46), 4-MINUTE DEMO REHEARSALS & SUBMISSION:
          Execute 3 consecutive successful 4-minute demo dry runs.
          Record single fallback MP4 video for network degradation protection.
          Final CodeNexus Round 2 package submission.
```

---

### Detailed Hour-by-Hour Workstream

#### Hours 00–06: Setup, Scaffolding, OpenAPI Contract & Mock Delivery
- **DP (Backend):**
  - H00–H02: Initialize monorepo structure, Docker Compose (PostgreSQL 16 + pgvector), `.env.example`, pre-commit hooks (`ruff`, `mypy`).
  - H02–H04: Write FastAPI baseline application, Pydantic schemas for all core entities.
  - H04–H06: **Deliver First Build Deliverable:** Export generated OpenAPI 3.1 schema (`docs/api/openapi.json`) and typed mock JSON fixtures to `frontend/src/lib/mocks/`. Unblocks frontend development immediately.
- **TB (Frontend):**
  - H00–H02: Scaffold Next.js App Router project, TypeScript strict config, Tailwind CSS with official design tokens (`DOC-10`).
  - H02–H04: Install and configure shadcn/ui primitives (`Button`, `Card`, `Table`, `Dialog`, `Badge`, `Tabs`, `Skeleton`).
  - H04–H06: Ingest mock JSON fixtures from DP; build toggleable mock API client (`NEXT_PUBLIC_USE_MOCK_DATA=true`).
- **PS (Domain & Fixtures):**
  - H00–H03: Assemble official fictional FinTech guideline document (`Acme_Brand_Guidelines_2026.pdf`) containing 12 explicit rules covering terminology, claims, tone, and contrast.
  - H03–H06: Assemble standard test draft submissions (1 clean submission, 1 submission with 4 intentional violations, 1 adversarial injection submission).
- **TG (Project Management & QA):**
  - H00–H02: Verify team access to GitHub repository, Vercel team, Render team, and Supabase organization.
  - H02–H04: Setup task tracking board mapped to `DOC-13` atomic task IDs (`TSK`).
  - H04–H06: Audit Hackathon Round 2 submission requirements and deadline timer.

---

#### Hours 07–12: Foundation Layer & First Go/No-Go Checkpoint
- **DP (Backend):**
  - H07–H09: Author Alembic migrations `0001` to `0006` (12 M1 tables, foreign keys, check constraints).
  - H09–H11: Implement Argon2 password hashing, JWT session cookie handling (`POST /auth/login`, `GET /auth/me`), and `require_role(...)` dependency.
  - H11–H12: Implement seed script (`scripts/seed_demo.py`) creating test workspace, 4 default users, active Policy `v1.0`, and reason codes.
- **TB (Frontend):**
  - H07–H09: Build `/login` screen (`SCR-01`) with form validation, error states, and session persistence.
  - H09–H11: Build role-aware application shell (`Sidebar`, `Header`, role badge, tenant switcher).
  - H11–H12: Build `/submissions/new` draft editor (`SCR-03`) with plain text editor and character count.
- **PS (Domain & Fixtures):**
  - H07–H10: Format seed claims ledger (`data/demo_policy/claims.csv`) and terminology catalog.
  - H10–H12: Validate that all 12 guideline rules contain verified page citations and source quote strings.
- **TG (Project Management & QA):**
  - H07–H11: Review frontend screen layouts against 8-point spatial grid and FinTech aesthetic standards.
  - H11–H12: Conduct **Checkpoint H12 Review**.

---

#### 🛑 GO/NO-GO CHECKPOINT H12 (Hour 12)
- **Review Target:** Database migrations execute clean in Docker; auth endpoints return session cookies; Next.js renders app shell with active mock data.
- **Acceptance Criteria:** `pytest tests/unit/test_auth.py` passes 100%; frontend login redirects to dashboard.
- **SCOPE CUT TO APPLY IF BEHIND:**  
  *If database migrations or auth are delayed, immediately drop DOCX file parsing from Milestone 1 scope; restrict M1 strictly to plain pasted text and single-page searchable PDF.*

---

#### Hours 13–24: Ingestion, Normalization, Deterministic Checks & Findings UI
- **DP (Backend):**
  - H13–H16: Implement text normalization engine (`STG-01`) with Unicode NFKC and bi-directional character offset mapping (`normalize.py`).
  - H16–H18: Implement Prompt Injection heuristic scanner (`STG-02`) detecting instruction overrides.
  - H18–H21: Implement Deterministic Rules Engine (`STG-03`): regex terms, RapidFuzz near-miss, claims ledger exact matching, WCAG contrast formula.
  - H21–H24: Implement check run orchestrator and `job` state polling endpoints (`POST /submissions/{id}/check`, `GET /jobs/{id}`).
- **TB (Frontend):**
  - H13–H18: Build split-screen Findings Canvas (`SCR-04`): Left document canvas with colored text highlight overlays bound to character offset ranges.
  - H18–H22: Build Right pane finding cards: Severity badges, Flagged quote, **Double-Receipt box** (Cited source quote, document title, page number), Suggestion box.
  - H22–H24: Implement interactive selection: clicking card auto-scrolls to and highlights text in left canvas.
- **PS (Domain & Fixtures):**
  - H13–H18: Construct table-driven test cases for deterministic rules (5 passing, 5 failing per rule).
  - H18–H24: Construct synthetic historical override dataset (`data/demo_policy/seeded_overrides.json`) for Rule Health demonstration.
- **TG (Project Management & QA):**
  - H13–H18: Author detailed live demo script covering the 3-minute judge presentation (`DOC-05, JRN-06`).
  - H18–H24: Verify offset highlight accuracy across varying text lengths. Conduct **Checkpoint H24 Review**.

---

#### 🛑 GO/NO-GO CHECKPOINT H24 (Hour 24 - Halfway Mark)
- **Review Target:** Deterministic pipeline runs end-to-end; findings display in UI with accurate character highlights and source receipts.
- **Acceptance Criteria:** `POST /submissions/{id}/check` processes draft in $< 2$ seconds; findings render on `SCR-04`.
- **SCOPE CUT TO APPLY IF BEHIND:**  
  *If LLM provider integration is unstable or failing, completely isolate semantic tone checking; execute Milestone 1 demonstration purely on deterministic terminology, claim contradictions, and prompt injection detection.*

---

#### Hours 25–36: AI Semantic Adapter, Double-Receipt Verifier & Human Review Workflow
- **DP (Backend):**
  - H25–H28: Implement LLM Provider Adapter (`STG-05`) with temperature 0, Pydantic JSON schema constraints, 1-retry fallback, and deterministic response caching.
  - H28–H31: Implement Programmatic Double-Receipt Verifier (`STG-06`): confirms flagged quote in submission and source quote in policy document; drops unverified candidate findings.
  - H31–H34: Implement Reviewer decisions API (`POST /findings/{id}/override`, `POST /submissions/{id}/approve`, `POST /submissions/{id}/send-back`) requiring Reason Codes.
  - H34–H36: Implement synchronous AI call logging to `ai_service_call` and append-only audit service.
- **TB (Frontend):**
  - H25–H28: Build Review Queue dashboard (`SCR-05`) with status filtering and finding counts.
  - H28–H31: Build Override Modal (`SCR-06`) requiring Reason Code selection and justification note.
  - H31–H34: Build Rule Health Dashboard (`SCR-07`) displaying seeded override trends and diagnostic badges.
  - H34–H36: Build Live AI Disclosure Panel (`SCR-09`) showing real provider telemetry and zero-retention confirmation.
- **PS (Domain & Fixtures):**
  - H25–H30: Verify that all seeded override records in `TERM-007` correctly trigger the `SCOPE_MISMATCH` diagnostic state.
  - H30–H36: Validate that prompt injection test case cleanly flags `CRITICAL` without model compliance.
- **TG (Project Management & QA):**
  - H25–H32: First full dry run of demo flow using local Docker environment.
  - H32–H36: Compile Defect Log; conduct **Checkpoint H36 Review (FINAL SCOPE LOCK)**.

---

#### 🛑 GO/NO-GO CHECKPOINT H36 (Hour 36 - Final Scope Lock)
- **Review Target:** Core loop fully functional (Draft $\to$ Check $\to$ Verified Receipts $\to$ Override $\to$ Audit Log $\to$ AI Disclosure).
- **Acceptance Criteria:** Full demo flow executes without manual database intervention.
- **HARD DIRECTIVE:** **ZERO NEW FEATURES PERMITTED AFTER H36.** All remaining time is dedicated strictly to cloud deployment, integration, bug fixing, and demo rehearsal.

---

#### Hours 37–44: Production Cloud Deployment & Live Integration
- **DP (Backend Deployment):**
  - H37–H39: Provision Supabase production database; run Alembic migrations `0001` to `0006`; execute RLS policies and role revocations.
  - H39–H41: Deploy FastAPI backend to Render / Railway container host; configure environment variables (database URL, JWT secret, model API keys).
  - H41–H44: Execute production database seed (`python scripts/seed_demo.py --prod`); verify API health endpoints.
- **TB (Frontend Deployment):**
  - H37–H40: Deploy Next.js to Vercel; configure `next.config.ts` edge rewrites to point `/api/v1/*` to live backend URL.
  - H40–H42: Verify single-origin `httpOnly` cookie transmission across production domain.
  - H42–H44: Perform mobile (375px) and desktop (1440px) visual responsive pass; assert zero horizontal scroll.
- **PS & TG (QA & Evidence Verification):**
  - H37–H42: Execute complete test plan on public production URL. Verify all 4 states on all screens.
  - H42–H44: Assemble Evidence Pack screenshots and final presentation deck.

---

#### Hours 45–48: Code Freeze, Demo Rehearsals & Final Submission
- **Hour 45:** Hard Git Code Freeze. Branch `main` locked. Zero code changes permitted except critical crash fixes.
- **Hour 46:** Demo Rehearsal #1 (Full 3-minute timing test with stopwatch).
- **Hour 47:** Demo Rehearsal #2 & #3 (Backup plan test: local Docker fallback ready in case of cloud network latency).
- **Hour 48:** Final Submission of Hackathon Round 2 deliverables by Tanishka Gawale:
  - Public Production URL (`https://canon-web.vercel.app`)
  - Public GitHub Repository with clean Conventional Commits
  - Pitch Deck & Evidence Pack PDF
  - 4-Minute Demo Video (uploaded as backup).

---

## 3. Post-Hackathon Milestones (Outline Plan)

### Milestone 2: Closed Beta Platform (Weeks 3 to 6)
- **Week 3 (Governance & Simulation):** Implement live `rule_change_proposal` diff generator and retrospective `backtest_run` simulation engine (`FN-BKT-01`, `FN-BKT-02`).
- **Week 4 (Vector Scaling):** Enable `pgvector` extension; implement local `sentence-transformers` (`bge-small`) embedding index for guideline scaling.
- **Week 5 (Evaluation & Benchmarks):** Build automated offline evaluation harness (`make eval`, `eval_case`, `eval_run`); publish empirical accuracy report.
- **Week 6 (Multi-Tenant Hardening):** Full multi-tenant onboarding, custom reason codes, and PDF audit trail export.

### Milestone 3: Enterprise Startup-Ready (Months 3 to 6)
- **Month 3:** Enterprise SAML 2.0 / Okta SSO; dedicated Celery/Redis queue workers.
- **Month 4:** Authoring plugins for Microsoft Word, Google Docs, and Figma.
- **Month 5:** Model Context Protocol (MCP) server exposing active brand rules to enterprise AI agents.
- **Month 6:** SOC 2 Type 1 certification and commercial B2B SaaS launch.
