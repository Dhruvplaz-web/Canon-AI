# Canon: Prompt Pack Outline & Agent Instructions (16_prompt_pack_outline.md)

**Document ID:** `DOC-16`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 2.0 (Cloud-First Revision & Scope Restoration)  
**Parent Trace:** [TASK, Phases 0-14] `file:///E:/Software/codex/Docuements/Canon%20Phased%20Project%20Task%20Document.pdf`, [DHRUV-V3, Sec 6-7] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [DOC-13](file:///E:/Software/codex/docs/plan/13_task_breakdown.md), [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Prompt Execution Architecture & Rules

In strict adherence to the **Canon AI Rules and Engineering Standards** (Sections 3, 5, 8, 12):
- **1-to-1 Task Mapping:** Every atomic task in `DOC-13` maps to an explicit agent execution prompt.
- **Self-Contained Prompts:** Each prompt contains its exact Goal, Input Files, Expected Output Files, Verification Criteria, and Binding Standards so it can execute cleanly in an isolated context window.
- **Cloud-First Execution:** Cloud infrastructure (Supabase, Render, Vercel, edge proxy, CI auto-deploy, health check) is provisioned in Prompts 01–04. All subsequent development runs against the deployed cloud environment.
- **Human Tasks Delimited:** Rehearsal, vocal presentation, video recording, and final portal submission are explicitly designated as `[HUMAN TASK]`.
- **Zero Embedding Overhead in M1:** Embeddings and in-container embedding models (`bge-small`) are deferred to M2. In M1, policy retrieval utilizes deterministic Pass-All mode.

---

## 2. Milestone 1 Prompt Catalog (32 Prompts)

### Workstream 0: Cloud Deployment & Shared Contracts (Hours 00–04)

#### PRMPT-01: Monorepo Scaffolding & CI Auto-Deploy Workflows
- **Goal:** Set up monorepo directory layout, backend dependencies, Makefile, and GitHub Actions CI workflow auto-deploying to Render and Vercel.
- **Inputs:** `DOC-06, Sec 1`, `DOC-13 (TSK-M1-01)`.
- **Expected Outputs:** `.github/workflows/ci.yml`, `Makefile`, `backend/pyproject.toml`, `backend/app/main.py`.
- **Verification Criteria:** CI runs and passes on push; `ruff` and `mypy` execute cleanly.
- **Linked Task:** `TSK-M1-01`.

#### PRMPT-02: Supabase Managed PostgreSQL Database Provisioning
- **Goal:** Configure cloud Supabase PostgreSQL 16 project; configure database URL and SSL connection parameters in repository secrets.
- **Inputs:** `DOC-06, Sec 5`, `DOC-07, Sec 1`.
- **Expected Outputs:** `backend/alembic/env.py`, `backend/alembic.ini`.
- **Verification Criteria:** Direct database ping returns 200; `alembic current` runs over SSL.
- **Linked Task:** `TSK-M1-02`.

#### PRMPT-03: FastAPI Cloud Backend Deployment (Render Host) & Health Verification
- **Goal:** Deploy containerized FastAPI service to Render Free Tier; configure environment variables; implement `/api/v1/health/live` and `/api/v1/health/ready`.
- **Inputs:** `backend/Dockerfile`, `backend/app/api/v1/health.py`, `DOC-06 (DEC-ARCH-01)`.
- **Expected Outputs:** Public backend URL (`https://canon-api.onrender.com/api/v1/health/ready` returning 200 OK). Zero embedding models in container.
- **Verification Criteria:** Public HTTP GET returns `{"status": "ok", "db": "connected"}`.
- **Linked Task:** `TSK-M1-03`.

#### PRMPT-04: Next.js Frontend Deployment (Vercel) & Edge `/api/v1` Rewrite Proxy
- **Goal:** Scaffold Next.js App Router project; configure Tailwind CSS with charcoal tokens (`#09090B`) and 8pt rhythm; configure Next.js edge rewrites in `next.config.ts` proxying `/api/v1/*` to live Render backend; deploy to Vercel.
- **Inputs:** `frontend/next.config.ts`, `frontend/tailwind.config.ts`, `DOC-10, Sec 1`.
- **Expected Outputs:** Live public web URL (`https://canon-web.vercel.app`).
- **Verification Criteria:** `curl https://canon-web.vercel.app/api/v1/health/live` proxies and returns 200.
- **Linked Task:** `TSK-M1-04`.

#### PRMPT-05: OpenAPI Specification & Typed Mock Fixture Delivery
- **Goal:** Write Pydantic request/response models for all M1 endpoints; export OpenAPI 3.1 specification; generate typed TypeScript mock fixtures in `frontend/src/lib/mocks/`.
- **Inputs:** `DOC-08` (API Contract), `TASK, P0-T04`.
- **Expected Outputs:** `docs/api/openapi.json`, `frontend/src/types/api.ts`, `frontend/src/lib/mocks/*.ts`.
- **Verification Criteria:** Mock data passes schema validation; mock toggle renders populated views offline.
- **Linked Task:** `TSK-M1-05`.

#### PRMPT-06: Guideline Ingestion Data Pack (`rules.json` with Stored Source Text) & Test Cases
- **Goal:** Create structured guideline seed pack `rules.json` with stored source text and citations (12 explicit rules, approved claims ledger with `valid_until` expiration dates (including a stale figure for the demo), tone, and contrast); assemble 3 sample submissions: clean, 4 violations, prompt injection.
- **Inputs:** `PRD, Sec 15`, `DOC-04, Sec 2`.
- **Expected Outputs:** `data/demo_policy/rules.json`, `data/demo_policy/guideline_source.txt`, `data/demo_submissions/samples.json`.
- **Verification Criteria:** All 12 rules map verbatim to stored source text citations.
- **Linked Task:** `TSK-M1-06`.

---

### Workstream 1: Database Entities, Identity & Row-Level Security (Hours 05–12)

#### PRMPT-07: Relational Schema Migrations (16 Core Tables) on Deployed DB
- **Goal:** Author and execute forward-only Alembic migration deploying exactly the 16 Milestone 1 tables (including `job`, `rule_health_snapshot`, `rule_change_proposal`, `backtest_run`, `backtest_result`) to cloud Supabase PostgreSQL.
- **Inputs:** `DOC-07, Sec 2 & 4`, `backend/app/models/*.py`.
- **Expected Outputs:** `backend/alembic/versions/0001_m1_core_schema.py`.
- **Verification Criteria:** `alembic upgrade head` executes cleanly on cloud DB; all 17 tables exist.
- **Linked Task:** `TSK-M1-07`.

#### PRMPT-08: Argon2 Password Hashing, JWT Auth & RBAC Route Guards
- **Goal:** Implement Argon2 password hashing, JWT session cookies, and `require_role(...)` dependency guard. Tokens reside exclusively in `httpOnly` secure cookies; no localStorage/sessionStorage fallback.
- **Inputs:** `DOC-06 (DEC-ARCH-04)`, `DOC-08 (API-01, API-02)`.
- **Expected Outputs:** `backend/app/core/security.py`, `backend/app/api/v1/auth.py`, `backend/app/api/deps.py`.
- **Verification Criteria:** Unit tests in `backend/tests/unit/test_auth.py` pass 100%.
- **Linked Task:** `TSK-M1-08`.

#### PRMPT-09: PostgreSQL RLS Policies & Unset Workspace Invariant Test
- **Goal:** Apply Row-Level Security policies to all tenant tables in Supabase; implement automated test asserting that queries executed with unset workspace context return zero rows or fail.
- **Inputs:** `DOC-07, Sec 3`, `DOC-14 (TST-06)`.
- **Expected Outputs:** `backend/alembic/versions/0002_enable_rls.py`, `backend/tests/integration/test_rls_isolation.py`.
- **Verification Criteria:** `pytest backend/tests/integration/test_rls_isolation.py::test_rls_unset_workspace` passes.
- **Linked Task:** `TSK-M1-09`.

#### PRMPT-10: Frontend Login Screen, App Shell & Session Provider
- **Goal:** Build login page with client validation and error handling; build application shell (Sidebar, Header, role badge) consuming session cookie.
- **Inputs:** `DOC-10, Sec 3 (SCR-01)`, `Canon AI Rules and Engineering Standards (Sec 5.3)`.
- **Expected Outputs:** `frontend/src/app/login/page.tsx`, `frontend/src/app/(app)/layout.tsx`, navigation components.
- **Verification Criteria:** Login sets cookie, redirects to submissions, header displays active user role.
- **Linked Task:** `TSK-M1-10`.

#### PRMPT-11: Seed Script for Deployed Environment
- **Goal:** Implement idempotent seed script creating demo tenant workspace, 4 users, active Policy `v1.0` with 12 rules, standard reason codes, and historical findings for backtesting.
- **Inputs:** `DOC-05 (JRN-06)`, `DOC-07, Sec 4`.
- **Expected Outputs:** `backend/app/scripts/seed_demo.py`.
- **Verification Criteria:** Running seed script against deployed Supabase DB populates tables cleanly without duplicates.
- **Linked Task:** `TSK-M1-11`.

---

### Workstream 2: Document Ingestion & Verification Pipeline Core (Hours 13–24)

#### PRMPT-12: Plain Text / UTF-8 Normalizer with Character Offset Mapping
- **Goal:** Implement UTF-8 text normalizer using Python `unicodedata.normalize('NFKC')` and whitespace canonicalization; generate bidirectional character offset index map (`raw_to_norm` and `norm_to_raw`). PyMuPDF is deferred to M2.
- **Inputs:** `DOC-09, Sec 2 (STG-01)`.
- **Expected Outputs:** `backend/app/pipeline/normalizer.py`, `backend/tests/unit/pipeline/test_normalize.py`.
- **Verification Criteria:** Finding spans map back to exact raw character slices with 100% precision.
- **Linked Task:** `TSK-M1-12`.

#### PRMPT-13: Policy Ingestion & Rule Seeding API (`rules.json` / Text)
- **Goal:** Implement policy ingestion endpoints accepting `rules.json` or plain text; compute SHA-256 hash; store source document; compile and seal immutable Policy `v1.0`.
- **Inputs:** `DOC-08 (API-04 to API-08)`, `DOC-04, Sec 2`.
- **Expected Outputs:** `backend/app/api/v1/policy.py`, `backend/app/services/policy.py`.
- **Verification Criteria:** `POST /api/v1/policy/sources` stores source and returns 201; active policy returns 12 active rules.
- **Linked Task:** `TSK-M1-13`.

#### PRMPT-14: Frontend Policy Viewer & Active Guidelines Screen (`SCR-01`, `SCR-02`)
- **Goal:** Build Policy Management screen displaying active Policy `v1.0` metadata, rule table with severity badges, and source citation side drawer.
- **Inputs:** `DOC-10, Sec 3 (SCR-01, SCR-02)`.
- **Expected Outputs:** `frontend/src/app/(app)/policy/page.tsx`, `frontend/src/features/policy/*.tsx`.
- **Verification Criteria:** Renders 12 rules; clicking rule displays exact cited source quote.
- **Linked Task:** `TSK-M1-14`.

#### PRMPT-15: Prompt Injection Detection Stage (`STG-02`)
- **Goal:** Implement pre-LLM heuristic injection detection; scan text for instruction override patterns, hidden HTML comments, and control tokens; flag Critical violation and neutralize input before model stage.
- **Inputs:** `DOC-09 (STG-02)`, `STD, Sec 3.4`.
- **Expected Outputs:** `backend/app/pipeline/injection.py`, `backend/tests/adversarial/test_injection.py`.
- **Verification Criteria:** 10 adversarial injection test payloads are detected and neutralized without crashing pipeline.
- **Linked Task:** `TSK-M1-15`.

#### PRMPT-16: Deterministic Rules Engine (`STG-03`: Terms, Near-Miss, Contrast)
- **Goal:** Implement exact keyword matching, spaCy lemmatization, RapidFuzz token distance for near-miss brand typos (e.g. AcmeCloud vs. Acme Cloud), and WCAG 2.1 relative luminance contrast math.
- **Inputs:** `DOC-09 (STG-03)`, `FN-DET-01 to FN-DET-04`.
- **Expected Outputs:** `backend/app/pipeline/deterministic/*.py`, `backend/tests/unit/pipeline/test_deterministic.py`.
- **Verification Criteria:** Submitting text with "AcmeCloud" flags Near-Miss with suggestion "Acme Cloud" and cited rule quote in $< 50\text{ms}$.
- **Linked Task:** `TSK-M1-16`.

#### PRMPT-17: Content Submission API & In-Process Job Orchestrator
- **Goal:** Implement submission drafting (`POST /api/v1/submissions`); trigger check run asynchronously via FastAPI `BackgroundTasks`; record state in `job` table; provide polling endpoint `/api/v1/jobs/{id}`.
- **Inputs:** `DOC-06 (DEC-ARCH-05)`, `DOC-08 (API-11, API-15, API-16)`.
- **Expected Outputs:** `backend/app/api/v1/submissions.py`, `backend/app/services/pipeline_runner.py`.
- **Verification Criteria:** Submitting content returns HTTP 202 with job ID; polling job transitions from `QUEUED` to `RUNNING` to `COMPLETED` in $< 3\text{s}$.
- **Linked Task:** `TSK-M1-17`.

#### PRMPT-18: Split-Screen Findings Viewer & Double-Receipt Highlight Canvas (`SCR-04`)
- **Goal:** Build responsive split-screen review canvas: left pane renders submitted text with character-offset highlights color-coded by severity; right pane renders Double-Receipt finding cards with exact cited guideline quotes.
- **Inputs:** `DOC-10 (SCR-04)`, `DOC-09, Sec 2`.
- **Expected Outputs:** `frontend/src/app/(app)/submissions/[id]/page.tsx`, `frontend/src/features/submissions/*.tsx`.
- **Verification Criteria:** Clicking a highlighted term in text scrolls to and highlights corresponding finding card in right pane.
- **Linked Task:** `TSK-M1-18`.

---

### Workstream 3: Intelligence, Governance & Acceptance Test (Hours 25–36)

#### PRMPT-19: LLM Provider Protocol Adapter & Response Caching (Single Provider behind Adapter)
- **Goal:** Implement `LLMProvider` protocol adapter supporting Mistral or Groq Free Tier API; enforce `temperature=0.0` and Pydantic JSON schema; implement SHA-256 composite cache. Embeddings are completely removed from M1.
- **Inputs:** `DOC-06 (DEC-ARCH-07)`, `DOC-09 (STG-05)`.
- **Expected Outputs:** `backend/app/pipeline/llm/adapter.py`, `backend/app/pipeline/llm/cache.py`.
- **Verification Criteria:** Model calls return strictly conforming JSON; repeated calls with identical cache key return cached response in $< 50\text{ms}$.
- **Linked Task:** `TSK-M1-19`.

#### PRMPT-20: Programmatic Double-Receipt Verifier Engine (`STG-06`)
- **Goal:** Implement verification engine validating candidate findings: asserts Receipt A exists verbatim in submission and Receipt B exists verbatim in active policy text; drops ungrounded findings.
- **Inputs:** `DOC-09 (STG-06)`, `STD, Sec 3.3`.
- **Expected Outputs:** `backend/app/pipeline/verifier.py`, `backend/tests/unit/pipeline/test_verifier.py`.
- **Verification Criteria:** Candidate findings with invented or ungrounded quotes are dropped; 100% of confirmed findings retain verified double receipts.
- **Linked Task:** `TSK-M1-20`.

#### PRMPT-21: Reviewer Decisions, Overrides & Append-Only Audit Emission
- **Goal:** Implement review decision endpoints. `POST /findings/{id}/override` validates presence of valid `reason_code` and justification; persists override decision; writes tamper-resistant entry to `audit_log`.
- **Inputs:** `DOC-08 (API-18 to API-22)`, `DOC-07 (audit_log)`.
- **Expected Outputs:** `backend/app/api/v1/decisions.py`, `backend/app/services/review.py`.
- **Verification Criteria:** Overriding without a reason code returns 400; valid override logs to `audit_log` with user ID and timestamp.
- **Linked Task:** `TSK-M1-21`.

#### PRMPT-22: Review Queue, Workspace & Override Modal (`SCR-05`, `SCR-06`)
- **Goal:** Build Review Queue table displaying submissions pending review. Build Override Modal requiring selection from standard Reason Codes (`APPROVED_CAMPAIGN_EXCEPTION`) and justification text area.
- **Inputs:** `DOC-10 (SCR-05, SCR-06)`, `Canon AI Rules and Engineering Standards (Sec 5.3, modal traps focus)`.
- **Expected Outputs:** `frontend/src/app/(app)/review/page.tsx`, `frontend/src/features/review/*.tsx`.
- **Verification Criteria:** Reviewer selects submission, opens override modal, selects reason code, and submits override; finding updates immediately to `OVERRIDDEN`.
- **Linked Task:** `TSK-M1-22`.

#### PRMPT-23: Seeded Rule Health Dashboard & Diagnostic Display (`SCR-07`)
- **Goal:** Build Rule Health Dashboard querying `GET /api/v1/governance/health`; display override rates per rule, dominant reason codes, and diagnostic badges (`HEALTHY`, `SCOPE_MISMATCH`, `NOISY`). Display explicit *"Demonstration Seed Data"* watermark.
- **Inputs:** `DOC-10 (SCR-07)`, `DOC-08 (API-23)`.
- **Expected Outputs:** `frontend/src/app/(app)/governance/health/page.tsx`, `frontend/src/features/governance/RuleHealthTable.tsx`.
- **Verification Criteria:** Rule `TERM-007` renders 38% override rate and `SCOPE_MISMATCH` badge; shows primary reason code `APPROVED_CAMPAIGN_EXCEPTION`.
- **Linked Task:** `TSK-M1-23`.

#### PRMPT-24: Minimal Scope-Exception Proposal Generator (`PROP-01`)
- **Goal:** **Restored Milestone 1 Feature.** Implement `POST /api/v1/governance/proposals`. Inspects pre-seeded deterministic draft proposal `PROP-01` (pre-configured from historical override data to guarantee 100% reproducible judging; refines rule scope to exempt verified educational disclaimers).
- **Inputs:** `DOC-04, Sec 2 (FN-BKT-01)`, `DOC-08 (API-24)`.
- **Expected Outputs:** `backend/app/api/v1/governance.py`, `backend/app/services/proposal_generator.py`.
- **Verification Criteria:** Endpoint returns proposal object with git-style rule diff and status `DRAFT`.
- **Linked Task:** `TSK-M1-24`.

#### PRMPT-25: Backtest Simulation Engine (Replay Past Findings, Verify 0 Regressions)
- **Goal:** **Restored Milestone 1 Feature.** Implement `POST /api/v1/governance/proposals/{id}/backtest`. Replays historical finding records against candidate rule diff; calculates eliminated false positives and confirms 0 critical regressions in $< 1\text{s}$.
- **Inputs:** `DOC-04, Sec 2 (FN-BKT-02)`, `DOC-08 (API-25)`.
- **Expected Outputs:** `backend/app/services/backtest_engine.py`, `backend/tests/unit/services/test_backtest.py`.
- **Verification Criteria:** Backtest report returns: `submissions_replayed: 142`, `findings_eliminated: 14`, `critical_regressions: 0`.
- **Linked Task:** `TSK-M1-25`.

#### PRMPT-26: Policy `v1.1` Approval Acceptance Test Screen (`SCR-08`)
- **Goal:** **Milestone 1 Acceptance Test Screen.** Build Proposal & Backtest Report screen displaying side-by-side git diff and regression card; implement "Adopt & Publish Policy v1.1" action calling `API-26` to seal and promote policy version.
- **Inputs:** `DOC-10 (SCR-08)`, `DOC-08 (API-26)`.
- **Expected Outputs:** `frontend/src/app/(app)/governance/proposals/[id]/page.tsx`, `frontend/src/features/governance/BacktestReport.tsx`.
- **Verification Criteria:** Brand Manager reviews backtest regression report and clicks "Adopt & Publish Policy v1.1"—Policy `v1.1` is compiled and activated only upon this explicit human approval (acceptance test); audit log emits policy release event.
- **Linked Task:** `TSK-M1-26`.

#### PRMPT-27: Live AI Disclosure & Telemetry Panel Screen (`SCR-09`)
- **Goal:** Build AI Disclosure Panel querying `/api/v1/transparency/disclosure`. Displays active provider name (behind adapter), model ID, verified data retention policy (`VER-11`), rolling 24h call counter, and recent sanitized call records.
- **Inputs:** `DOC-10 (SCR-09)`, `DOC-08 (API-27)`.
- **Expected Outputs:** `frontend/src/app/(app)/transparency/page.tsx`, `frontend/src/features/transparency/DisclosurePanel.tsx`.
- **Verification Criteria:** Running a content check immediately increments the 24h call counter and appends entry to recent call log.
- **Linked Task:** `TSK-M1-27`.

---

### Workstream 4: Hardening, E2E Verification & Rehearsals (Hours 37–48)

#### PRMPT-28: Automated End-to-End Demo Flow Test against Deployed Cloud
- **Goal:** Standardize single end-to-end test location at `backend/tests/e2e/test_demo_flow.py`. Executes complete 4-minute demo sequence against the deployed cloud environment: Login -> Submit copy -> Inspect Double Receipts -> Reviewer Override -> Rule Health -> Proposal `PROP-01` -> Backtest Simulation -> Policy `v1.1` Approval Acceptance Test -> AI Disclosure.
- **Inputs:** `DOC-05 (JRN-06)`, `DOC-14 (TST-14)`.
- **Expected Outputs:** `backend/tests/e2e/test_demo_flow.py`.
- **Verification Criteria:** `pytest backend/tests/e2e/test_demo_flow.py` passes 3 consecutive runs against production cloud deployment with zero assertion errors.
- **Linked Task:** `TSK-M1-28`.

#### PRMPT-29: Offline Comparative Evaluation Benchmark Harness (`make eval`)
- **Goal:** Implement evaluation benchmark runner comparing Canon Hybrid Pipeline against LLM-only baseline across ~120 synthetic cases; compute and output measured precision, recall, evidence verification rate, consistency, and latency.
- **Inputs:** `DOC-14 (TST-13)`, `data/eval/cases.json`.
- **Expected Outputs:** `scripts/run_eval.py`, `backend/app/services/eval_runner.py`.
- **Verification Criteria:** `python scripts/run_eval.py` executes to completion and outputs clean formatted comparative report with measured rates.
- **Linked Task:** `TSK-M1-29`.

#### PRMPT-30: Responsive Layout Stress Testing (375px & 1440px) & Accessibility Audit
- **Goal:** Verify all 8 core screens at mobile (375px) and desktop (1440px) viewports; verify keyboard navigation (Tab/Shift-Tab, Escape on modals); assert zero horizontal overflow (`min-w-0`, `truncate`).
- **Inputs:** `DOC-10`, `Canon AI Rules and Engineering Standards (Sec 5.3)`.
- **Expected Outputs:** Responsive audit test report, accessibility verification log.
- **Verification Criteria:** Zero horizontal scrollbars at 375px; all interactive buttons show visible focus rings.
- **Linked Task:** `TSK-M1-30`.

#### PRMPT-31: [HUMAN TASK] 4-Minute Vocal Demo Rehearsals (3x Dry Runs, Stopwatch) & Defect Scrub
- **Goal:** **[HUMAN TASK]** Execute 3 live vocal rehearsals of the 4-minute demo walkthrough using a stopwatch; log and resolve any cosmetic or timing defects; verify clean database seed state before each run.
- **Inputs:** `docs/demo_runbook.md`, `docs/defect_log.md`.
- **Expected Outputs:** 3 consecutive vocal rehearsals complete within 4:00 (+/- 15s) with zero blocking glitches.
- **Linked Task:** `TSK-M1-31`.

#### PRMPT-32: [HUMAN TASK] Fallback MP4 Video Recording & Final CodeNexus Round 2 Submission Assembly
- **Goal:** **[HUMAN TASK]** Record and save local 4-minute fallback MP4 video walkthrough in case conference Wi-Fi degrades; assemble final submission links (public Vercel URL, public Render API docs, GitHub repo, personal briefs); submit official CodeNexus Round 2 package.
- **Inputs:** Hackathon Portal Form, `TG-BRIEF, Sec 1-2`.
- **Expected Outputs:** Official hackathon submission confirmed prior to 48-hour deadline; video playable offline.
- **Linked Task:** `TSK-M1-32`.
