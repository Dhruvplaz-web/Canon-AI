# Canon: Atomic Task Breakdown & Agent Execution Units (13_task_breakdown.md)

**Document ID:** `DOC-13`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 2.0 (Cloud-First Revision & Scope Restoration)  
**Parent Trace:** [TASK, Phases 0-14] `file:///E:/Software/codex/Docuements/Canon%20Phased%20Project%20Task%20Document.pdf`, [DHRUV-V3, Sec 6-7] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [TB-BRIEF, Sec 4] `file:///E:/Software/codex/Docuements/Canon_Role_Brief_Tanishka_Bellale_FINAL.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Task Execution Protocol, Sizing Rules & Governance

In strict adherence to the **Canon AI Rules and Engineering Standards** (Sections 3, 5, 8, 12):
- **Atomic Sizing:** Every task represents a single, focused engineering concern with an execution ceiling of **$\le 2.0$ hours**.
- **Agent Single-Run Readiness:** Each task provides complete context (files touched, schemas, acceptance check, tests, and binding AI rules) so it can be dispatched to an Antigravity AI coding agent as an isolated execution unit.
- **Traceability Guarantee:** Every task traces directly to functional requirements (`FR`), business functions (`FN`), database entities (`ENT`), API endpoints (`API`), and UI screens (`SCR`).
- **Cloud-First Execution Contract (Hours 00–04 Deployment):** All cloud infrastructure (Supabase PostgreSQL, Render backend, Vercel frontend, Next.js `/api/v1` rewrite edge proxy, CI auto-deploy, and `/api/v1/health` verification) is deployed in Hours 00–04. All subsequent development from Hour 05 onward runs directly against the deployed environment.
- **Named Scope Reductions to Accommodate Scope-Exception Backtest:** To ensure the restored minimal scope-exception proposal, backtest simulation, and Policy `v1.1` approval acceptance test fit within the 48-hour sprint without overtime, the following items are strictly removed from Milestone 1:
  1. *Binary PDF / PyMuPDF parsing:* Plain text and `rules.json` with stored source text are ingested; PDF parsing is deferred to M2.
  2. *24-Page PDF extraction:* Structured JSON guideline ruleset is loaded; 24-page PDF coordinate extraction is deferred to M2.
  3. *In-container vector embeddings (`bge-small`) and pgvector:* Pass-All mode is used for $\le 20$ rules; embeddings are deferred to M2.
  4. *Local Ollama model integration:* A single hosted model provider (Mistral or Groq) behind the adapter is used; local Ollama is deferred to M2.
  5. *Railway deployment mirror:* A single backend host (Render) is deployed in M1.
  6. *Local Docker demo profile:* Cloud deployed environment is the sole demo target; one pre-recorded fallback MP4 video is maintained.

### 1.1 Sprint Hours-Per-Person Budget (Milestone 1)

In strict adherence to healthy engineering protocols, sprint workloads are budgeted below 30 hours per person across the 48-hour hackathon.

| Team Member | Role | Primary Assigned Modules | M1 Hours | Status (<= 30 hrs) |
|:---|:---|:---|:---:|:---:|
| **Dhruv Patil (DP)** | Lead Architect & Backend | Cloud setup (H00-04), DB schema (17 tables), Auth, Pipeline, Backtest Engine, AI Adapter | 27.5 hrs | PASS (Within limit) |
| **Tanishka Bellale (TB)** | Frontend Lead | App Shell, Login, Submission Editor, Double-Receipt Canvas, Override Modal, Rule Health / Backtest UI | 25.5 hrs | PASS (Within limit) |
| **Prathmesh Shinde (PS)** | Domain, Fixtures & QA | Guideline JSON fixture, test cases, adversarial injection suite, **Second Diff Reviewer (Backend)** | 22.5 hrs | PASS (Within limit) |
| **Tanishka Gawale (TG)** | Project Mgr & QA Lead | Task tracking, gate compliance, 4-minute demo coordination, pre-recorded fallback video, Acceptance QA | 20.0 hrs | PASS (Within limit) |
| **TOTAL SPRINT** | Runtime Rebels | Integrated Cloud-First Execution | 95.5 hrs | PASS (All <= 30 hrs) |

*Flagged Overtime Audit:* 0 members exceed 30 hours. Workload distribution is balanced and sustainable.

### 1.2 Dhruv Patil Hours by Workstream Block & Predetermined Hour 12 Scope Cuts
- **Block 1 (Hours 00–04 - Cloud Setup & Mocks):** 3.5 hrs (`TSK-M1-01` to `TSK-M1-03`, `TSK-M1-05`)
- **Block 2 (Hours 05–12 - Schema, 17 Tables, Auth, RLS):** 5.0 hrs (`TSK-M1-07` to `TSK-M1-09`, `TSK-M1-11`)
- **Block 3 (Hours 13–24 - Normalizer, Injection, Check Pipeline):** 7.5 hrs (`TSK-M1-12`, `TSK-M1-13`, `TSK-M1-15` to `TSK-M1-17`)
- **Block 4 (Hours 25–36 - Adapter, Verifier, Overrides, Backtest):** 7.5 hrs (`TSK-M1-19` to `TSK-M1-21`, `TSK-M1-24` to `TSK-M1-26`)
- **Block 5 (Hours 37–48 - E2E Testing, Eval Harness, Rehearsals):** 4.0 hrs (`TSK-M1-28`, `TSK-M1-29`, `TSK-M1-31`, `TSK-M1-32`)
- **Total Dhruv Hours:** **27.5 hrs** (Capped <= 30.0 hrs).

**First Tasks to Cut at Hour 12 Checkpoint (Review Condition 8):**
1. *Cut Dynamic Proposal Diff Synthesis:* Drop dynamic LLM generation in `TSK-M1-24`; use pre-seeded deterministic draft proposal `PROP-01`. (Recovers 1.0 hr).
2. *Cut Fuzzy Near-Miss Sorting:* Drop RapidFuzz token sort in `TSK-M1-16`; use exact substring matching. (Recovers 1.0 hr).
3. *Cut WCAG Luminance Math:* Drop relative luminance calculation in `TSK-M1-16`. (Recovers 0.5 hr).
4. *Cut Secondary UI Queue Filters:* Drop filter facets on `SCR-05` in `TSK-M1-22`. (Recovers 1.0 hr).

### 1.3 Submission Notes: Explicitly Unbuilt Features in Milestone 1 (Review Condition 4)
- **`FR-13` (Visual Asset Checks):** **NOT BUILT** in Milestone 1 (Deferred to M3).
- **`FR-14` (Payload Redaction):** **NOT BUILT** in Milestone 1 (Deferred to M2).
- **`FR-21` (Threaded Comments):** **NOT BUILT** in Milestone 1 (Deferred to M2).
- **`FR-24` (Export Audit PDF):** **NOT BUILT** in Milestone 1 (Deferred to M2; CSV/JSON supported).

### 1.2 Mandatory Second Diff Reviewer Protocol
- **Security & Identity Code:** Dhruv Patil (Author) + Tanishka Gawale (Compliance & Audit Reviewer).
- **Non-Security Backend Code (Pipeline, Normalizer, Rules, Backtest Engine):** Dhruv Patil (Author) + **Prathmesh Shinde (Second Diff Reviewer)**. Every PR touching backend logic requires Prathmesh's review and approval before merging to `main`.
- **Frontend Code:** Tanishka Bellale (Author) + Dhruv Patil (API Contract Reviewer).

---

## 2. Milestone 1: Atomic Task Manifest (32 Tasks)

---

### Workstream 0: Cloud Deployment & Shared Contracts (Hours 00–04)

#### TSK-M1-01: Monorepo Scaffolding & CI Auto-Deploy Workflows
- **Owner:** Dhruv Patil
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `.github/workflows/ci.yml`, `Makefile`, `backend/pyproject.toml`, `backend/app/main.py`.
- **Dependencies:** None.
- **Linked Requirements:** `ARCH, Sec 14`, `TASK, P0-T01 to P0-T03`.
- **Binding AI Rules:** `STD, Sec 4.1` (Approved stack), `STD, Sec 5.1` (Clean code).
- **Description:** Initialize repository structure, configure GitHub Actions CI for linting (`ruff`, `tsc`) and test running, set up auto-deploy hooks to Render and Vercel on push to `main`.
- **Acceptance Check:** Pushing to repository triggers GitHub Actions CI and exits 0.
- **Tests:** `backend/tests/unit/test_health.py`.

#### TSK-M1-02: Supabase Managed Database Provisioning & Initial Migration
- **Owner:** Dhruv Patil
- **Size / Estimate:** 0.5 hours
- **Files Touched:** `backend/alembic.ini`, `backend/alembic/env.py`, Cloud Supabase Project.
- **Dependencies:** `TSK-M1-01`.
- **Linked Requirements:** `DOC-06, Sec 5`, `DOC-07, Sec 4`.
- **Binding AI Rules:** `STD, Sec 5.4.1` (Alembic for all migrations).
- **Description:** Provision cloud Supabase PostgreSQL 16 project; configure connection string in repository secrets; verify SSL connectivity.
- **Acceptance Check:** `alembic current` connects to Supabase database successfully over SSL.
- **Tests:** Direct database ping test (`SELECT 1`).

#### TSK-M1-03: FastAPI Cloud Backend Deployment (Render Host) & Health Verification
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `backend/Dockerfile`, `render.yaml`, `backend/app/api/v1/health.py`.
- **Dependencies:** `TSK-M1-01`, `TSK-M1-02`.
- **Linked Requirements:** `DOC-06, Sec 5`, `API-02, API-27`.
- **Binding AI Rules:** `STD, Sec 5.1.7` (No secrets in Dockerfile), `DOC-06 (DEC-ARCH-01)`.
- **Description:** Configure Render Web Service for FastAPI backend; set environment variables; implement `/api/v1/health/live` and `/api/v1/health/ready`.
- **Acceptance Check:** `curl https://canon-api.onrender.com/api/v1/health/ready` returns HTTP 200 with `{"status": "ok", "db": "connected"}`.
- **Tests:** Public HTTP health endpoint test.

#### TSK-M1-04: Next.js Frontend Deployment (Vercel) & Edge `/api/v1` Rewrite Proxy
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `frontend/package.json`, `frontend/next.config.ts`, `frontend/src/app/layout.tsx`, `frontend/tailwind.config.ts`.
- **Dependencies:** `TSK-M1-01`, `TSK-M1-03`.
- **Linked Requirements:** `DOC-06 (DEC-ARCH-06)`, `DOC-10, Sec 1`.
- **Binding AI Rules:** `STD, Sec 5.3` (Strict TypeScript), `Canon AI Rules and Engineering Standards (Sec 5.3, Anti-AI-sludge, 8pt grid, 5 semantic tokens)`.
- **Description:** Scaffold Next.js App Router project; configure Tailwind CSS with charcoal tokens (`#09090B`) and 8pt rhythm; configure Next.js edge rewrites in `next.config.ts` proxying `/api/v1/:path*` to Render backend; deploy to Vercel.
- **Acceptance Check:** Navigating to `https://canon-web.vercel.app/api/v1/health/live` transparently proxies and returns HTTP 200 from backend.
- **Tests:** End-to-end edge proxy HTTP fetch test.

#### TSK-M1-05: OpenAPI Specification & Typed Mock Fixture Delivery
- **Owner:** Dhruv Patil (Handoff to Tanishka Bellale)
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `backend/app/schemas/*.py`, `docs/api/openapi.json`, `frontend/src/lib/mocks/*.ts`, `frontend/src/types/api.ts`.
- **Dependencies:** `TSK-M1-03`, `TSK-M1-04`.
- **Linked Requirements:** `DOC-08` (API Contract), `TASK, P0-T04`.
- **Binding AI Rules:** `STD, Sec 5.2.2` (Pydantic at all boundaries), `STD, Sec 5.5.3` (Single error shape).
- **Description:** Export OpenAPI 3.1 schema from live FastAPI app. Generate typed TypeScript mock JSON fixtures (`mock_auth.ts`, `mock_policy.ts`, `mock_submissions.ts`, `mock_findings.ts`) so frontend can develop both against mocks and live deployed backend.
- **Acceptance Check:** `NEXT_PUBLIC_USE_MOCK_DATA=true` renders populated screens offline; `NEXT_PUBLIC_USE_MOCK_DATA=false` hits live Vercel proxy.
- **Tests:** Pydantic schema validation test on all mock payloads.

#### TSK-M1-06: Guideline Ingestion Data Pack (`rules.json` with Stored Source Text) & Test Cases
- **Owner:** Prathmesh Shinde (Assisted by Tanishka Gawale)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `data/demo_policy/rules.json`, `data/demo_policy/guideline_source.txt`, `data/demo_submissions/samples.json`.
- **Dependencies:** None.
- **Linked Requirements:** `PRD, Sec 15`, `TASK, P14-T01 to P14-T03`, `JUDGE, Sec 1`.
- **Binding AI Rules:** `STD, Sec 9.8` (Fictional demo data, labelled as demo data).
- **Description:** Assemble structured guideline seed pack `rules.json` with stored source text and citations (12 explicit rules across terminology, claims, tone, and contrast); assemble 3 sample submissions: 1 clean, 1 with 4 intentional violations, 1 adversarial prompt injection.
- **Acceptance Check:** All 12 rules map verbatim to stored source text citations.
- **Tests:** Data validation script checking string inclusion.

---

### Workstream 1: Database Entities, Identity & Row-Level Security (Hours 05–12)

#### TSK-M1-07: Relational Schema Migrations (17 Core Tables, inc. approved_claim with valid_until) on Deployed DB
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/models/*.py`, `backend/alembic/versions/0001_m1_core_schema.py`.
- **Dependencies:** `TSK-M1-02`.
- **Linked Requirements:** `DOC-07, Sec 2 & 4`, `ENT-01 to ENT-24`.
- **Binding AI Rules:** `STD, Sec 5.4.1` (Alembic for all changes), `STD, Sec 5.4.3` (Foreign key constraints).
- **Description:** Author and apply forward-only Alembic migration deploying exactly the 16 Milestone 1 tables (including `job`, `rule_health_snapshot`, `rule_change_proposal`, `backtest_run`, `backtest_result`) to Supabase PostgreSQL.
- **Acceptance Check:** `alembic upgrade head` executes cleanly on Supabase with 0 errors; all 17 tables exist.
- **Tests:** Database reflection test verifying table and column presence.

#### TSK-M1-08: Argon2 Password Hashing, JWT Auth & RBAC Route Guards
- **Owner:** Dhruv Patil (Compliance Reviewer: Tanishka Gawale)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/core/security.py`, `backend/app/api/v1/auth.py`, `backend/app/api/deps.py`.
- **Dependencies:** `TSK-M1-07`.
- **Linked Requirements:** `DOC-06 (DEC-ARCH-04)`, `DOC-08 (API-01, API-02)`, `FN-USR-01`.
- **Binding AI Rules:** `STD, Sec 3.8` (Argon2 for passwords), `STD, Sec 7.2` (httpOnly secure cookies, no localStorage).
- **Description:** Implement Argon2 password verification, PyJWT session cookie generation (`POST /api/v1/auth/login`), `require_role(...)` FastAPI dependency guard. Tokens reside exclusively in `httpOnly` secure cookies.
- **Acceptance Check:** Login sets `httpOnly` cookie; requests without valid role return HTTP 403 Forbidden.
- **Tests:** `backend/tests/unit/test_auth.py`.

#### TSK-M1-09: PostgreSQL RLS Policies & Unset Workspace Invariant Test
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `backend/alembic/versions/0002_enable_rls.py`, `backend/tests/integration/test_rls_isolation.py`.
- **Dependencies:** `TSK-M1-07`.
- **Linked Requirements:** `DOC-06, Sec 2`, `DOC-07, Sec 3`, `STD, Sec 3.9`.
- **Binding AI Rules:** `STD, Sec 5.4.2` (Tenant isolation enforced in DB engine).
- **Description:** Enable and force RLS on all tenant tables; author policy checking `workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid`. Implement automated test `test_rls_unset_workspace`.
- **Acceptance Check:** Querying tenant table with unset workspace setting returns 0 rows on SELECT and fails on INSERT.
- **Tests:** `backend/tests/integration/test_rls_isolation.py::test_rls_unset_workspace`.

#### TSK-M1-10: Frontend Login Screen, App Shell & Session Provider
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `frontend/src/app/login/page.tsx`, `frontend/src/app/(app)/layout.tsx`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/components/layout/Header.tsx`.
- **Dependencies:** `TSK-M1-04`, `TSK-M1-08`.
- **Linked Requirements:** `SCR-01`, `FN-USR-01`, `DOC-10, Sec 3`.
- **Binding AI Rules:** `Canon AI Rules and Engineering Standards (Sec 5.3, a11y focus rings, no div onClick)`.
- **Description:** Build login form with client validation; build application shell with navigation, role badge, tenant indicator; wrap in session context provider consuming `/api/v1/auth/me`.
- **Acceptance Check:** Logging in redirects to `/submissions`; header reflects user role and email; unauthorized routes redirect.
- **Tests:** Component test for login form submission and error toast.

#### TSK-M1-11: Seed Script for Deployed Environment (Workspace, Users, Active Policy v1.0, Reason Codes)
- **Owner:** Dhruv Patil
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `backend/app/scripts/seed_demo.py`.
- **Dependencies:** `TSK-M1-07`, `TSK-M1-08`, `TSK-M1-06`.
- **Linked Requirements:** `DOC-05 (JRN-06)`, `TASK, P14-T02`.
- **Binding AI Rules:** `STD, Sec 9.8` (Fictional demo data, labelled as demo data).
- **Description:** Author idempotent database seed script creating demo tenant workspace, 4 RBAC users, active Policy `v1.0` with 12 rules, standard reason codes, and historical findings for backtesting.
- **Acceptance Check:** Running script populates deployed Supabase database; re-running script performs clean upsert without duplicates.
- **Tests:** Database count assertion test.

---

### Workstream 2: Document Ingestion & Verification Pipeline Core (Hours 13–24)

#### TSK-M1-12: Plain Text / UTF-8 Normalizer with Character Offset Mapping
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/pipeline/normalizer.py`, `backend/tests/unit/pipeline/test_normalize.py`.
- **Dependencies:** `TSK-M1-01`.
- **Linked Requirements:** `DOC-09, Sec 2 (STG-01)`, `FN-SUB-02`.
- **Binding AI Rules:** `STD, Sec 5.1.2` (Deterministic math), `DOC-09`.
- **Description:** Implement UTF-8 text normalization using Python `unicodedata.normalize('NFKC')` and whitespace canonicalization; generate bidirectional character offset index map (`raw_to_norm` and `norm_to_raw`). PyMuPDF is deferred to M2.
- **Acceptance Check:** Finding spans mapped from normalized text map back to exact raw character slices with 100% precision.
- **Tests:** `backend/tests/unit/pipeline/test_normalize.py`.

#### TSK-M1-13: Policy Ingestion & Rule Seeding API (`rules.json` / Text)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.0 hour
- **Files Touched:** `backend/app/api/v1/policy.py`, `backend/app/services/policy.py`.
- **Dependencies:** `TSK-M1-07`, `TSK-M1-12`.
- **Linked Requirements:** `DOC-08 (API-04 to API-08)`, `FN-POL-01 to FN-POL-04`.
- **Binding AI Rules:** `STD, Sec 5.4.3` (Policy versions immutable once active).
- **Description:** Implement policy ingestion endpoints accepting `rules.json` or plain text; compute SHA-256 hash; store source document; compile and seal immutable Policy `v1.0`.
- **Acceptance Check:** `POST /api/v1/policy/sources` stores source and returns 201; active policy returns 12 active rules.
- **Tests:** `backend/tests/integration/test_policy_api.py`.

#### TSK-M1-14: Frontend Policy Viewer & Active Guidelines Screen (`SCR-01`, `SCR-02`)
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `frontend/src/app/(app)/policy/page.tsx`, `frontend/src/features/policy/*.tsx`.
- **Dependencies:** `TSK-M1-10`, `TSK-M1-13`.
- **Linked Requirements:** `SCR-01, SCR-02`, `DOC-10, Sec 3`.
- **Binding AI Rules:** `Canon AI Rules and Engineering Standards (Sec 5.3, complete state spectrum: empty, loading, error, content)`.
- **Description:** Build Policy Management screen displaying active Policy `v1.0` metadata, rule table with severity badges, and source citation side drawer.
- **Acceptance Check:** Renders 12 rules; clicking rule displays exact cited source quote.
- **Tests:** Component test for policy rule table filtering and citation drawer opening.

#### TSK-M1-15: Prompt Injection Detection Stage (`STG-02`)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/pipeline/injection.py`, `backend/tests/adversarial/test_injection.py`.
- **Dependencies:** `TSK-M1-12`.
- **Linked Requirements:** `DOC-09 (STG-02)`, `FN-SEC-01`, `STD, Sec 3.4`.
- **Binding AI Rules:** `STD, Sec 7.1` (Untrusted content isolated from model instructions).
- **Description:** Implement pre-LLM heuristic injection detection; scan text for instruction override patterns (`IGNORE ALL PREVIOUS INSTRUCTIONS`), hidden HTML comments, and control tokens; flag Critical violation and neutralize input before model stage.
- **Acceptance Check:** All 10 adversarial injection payloads in test suite are detected and neutralized without crashing pipeline.
- **Tests:** `backend/tests/adversarial/test_injection.py`.

#### TSK-M1-16: Deterministic Rules Engine (`STG-03`: Terms, Near-Miss, Contrast)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `backend/app/pipeline/deterministic/terms.py`, `backend/app/pipeline/deterministic/contrast.py`, `backend/app/pipeline/deterministic/engine.py`.
- **Dependencies:** `TSK-M1-12`, `TSK-M1-13`.
- **Linked Requirements:** `DOC-09 (STG-03)`, `FN-DET-01 to FN-DET-04`, `STD, Sec 3.1`.
- **Binding AI Rules:** `STD, Sec 9.4` (Deterministic table-driven tests), `STD, Sec 5.1.2` (Pure functions).
- **Description:** Implement exact keyword matching, spaCy lemmatization, RapidFuzz token distance for near-miss brand typos (e.g. AcmeCloud vs. Acme Cloud), and WCAG 2.1 relative luminance contrast math.
- **Acceptance Check:** Submitting text with "AcmeCloud" flags Near-Miss with suggestion "Acme Cloud" and cited rule quote in $< 50\text{ms}$.
- **Tests:** `backend/tests/unit/pipeline/test_deterministic.py`.

#### TSK-M1-17: Content Submission API & In-Process Job Orchestrator
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/api/v1/submissions.py`, `backend/app/services/pipeline_runner.py`, `backend/app/models/job.py`.
- **Dependencies:** `TSK-M1-15`, `TSK-M1-16`.
- **Linked Requirements:** `DOC-06 (DEC-ARCH-05)`, `DOC-08 (API-11, API-15, API-16)`.
- **Binding AI Rules:** `STD, Sec 5.1.4` (Transaction per request), `DOC-07` (job entity).
- **Description:** Implement submission drafting (`POST /api/v1/submissions`); trigger check run asynchronously via FastAPI `BackgroundTasks`; record state in `job` table; provide polling endpoint `/api/v1/jobs/{id}`.
- **Acceptance Check:** Submitting content returns HTTP 202 with job ID; polling job transitions from `QUEUED` to `RUNNING` to `COMPLETED` in $< 3\text{s}$.
- **Tests:** `backend/tests/integration/test_submission_api.py`.

#### TSK-M1-18: Split-Screen Findings Viewer & Double-Receipt Highlight Canvas (`SCR-04`)
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 2.5 hours
- **Files Touched:** `frontend/src/app/(app)/submissions/[id]/page.tsx`, `frontend/src/features/submissions/FindingsViewer.tsx`, `frontend/src/features/submissions/HighlightCanvas.tsx`.
- **Dependencies:** `TSK-M1-10`, `TSK-M1-17`.
- **Linked Requirements:** `SCR-04`, `FN-UI-01`, `DOC-10 (Priority Polish Screen #1)`.
- **Binding AI Rules:** `Canon AI Rules and Engineering Standards (Sec 5.3, fluid motion, tabular-nums, min-w-0 overflow protection)`.
- **Description:** Build responsive split-screen review canvas: left pane renders submitted text with character-offset highlights color-coded by severity; right pane renders Double-Receipt finding cards with exact cited guideline quotes.
- **Acceptance Check:** Clicking a highlighted term in text scrolls to and highlights corresponding finding card in right pane.
- **Tests:** Component test for highlight-to-finding card interaction.

---

### Workstream 3: Intelligence, Governance & Acceptance Test (Hours 25–36)

#### TSK-M1-19: LLM Provider Protocol Adapter & Response Caching (Single Provider behind Adapter)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/pipeline/llm/adapter.py`, `backend/app/pipeline/llm/cache.py`.
- **Dependencies:** `TSK-M1-01`.
- **Linked Requirements:** `DOC-06 (DEC-ARCH-07)`, `DOC-09 (STG-05)`, `STD, Sec 7.3`.
- **Binding AI Rules:** `STD, Sec 7.3` (All LLM calls behind adapter), `STD, Sec 8.1` (Temperature 0, JSON mode).
- **Description:** Implement `LLMProvider` protocol adapter supporting Mistral or Groq Free Tier API; enforce `temperature=0.0` and Pydantic JSON schema; implement SHA-256 composite cache. Embeddings are completely removed from M1.
- **Acceptance Check:** Model calls return strictly conforming JSON; repeated calls with identical cache key return cached response in $< 50\text{ms}$.
- **Tests:** `backend/tests/unit/pipeline/test_llm_adapter.py`.

#### TSK-M1-20: Programmatic Double-Receipt Verifier Engine (`STG-06`)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/pipeline/verifier.py`, `backend/tests/unit/pipeline/test_verifier.py`.
- **Dependencies:** `TSK-M1-16`, `TSK-M1-19`.
- **Linked Requirements:** `DOC-09 (STG-06)`, `FN-VRF-01 to FN-VRF-04`, `STD, Sec 3.3`.
- **Binding AI Rules:** `STD, Sec 3.3` (Every finding must show two receipts or be dropped).
- **Description:** Implement verification engine validating candidate findings: asserts Receipt A exists verbatim in submission and Receipt B exists verbatim in active policy text; drops ungrounded findings.
- **Acceptance Check:** Candidate findings with invented or ungrounded quotes are dropped; 100% of confirmed findings retain verified double receipts.
- **Tests:** `backend/tests/unit/pipeline/test_verifier.py`.

#### TSK-M1-21: Reviewer Decisions, Overrides & Append-Only Audit Emission
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/api/v1/decisions.py`, `backend/app/services/review.py`, `backend/app/models/audit.py`.
- **Dependencies:** `TSK-M1-07`, `TSK-M1-17`.
- **Linked Requirements:** `FN-REV-01, FN-REV-02, FN-APP-01, FN-APP-02`, `API-18 to API-22`.
- **Binding AI Rules:** `STD, Sec 3.2` (Humans decide), `PRD, FR-19` (Mandatory reason codes for overrides), `STD, Sec 12` (Audit log).
- **Description:** Implement review decision endpoints. `POST /findings/{id}/override` validates presence of valid `reason_code` and justification; persists override decision; writes tamper-resistant entry to `audit_log`.
- **Acceptance Check:** Overriding without a reason code returns 400; valid override logs to `audit_log` with user ID and timestamp.
- **Tests:** `backend/tests/integration/test_review_api.py`.

#### TSK-M1-22: Review Queue, Workspace & Override Modal (`SCR-05`, `SCR-06`)
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `frontend/src/app/(app)/review/page.tsx`, `frontend/src/features/review/*.tsx`.
- **Dependencies:** `TSK-M1-10`, `TSK-M1-21`.
- **Linked Requirements:** `SCR-05, SCR-06`, `API-18, API-19, API-21`.
- **Binding AI Rules:** `Canon AI Rules and Engineering Standards (Sec 5.3, modal traps focus and closes on Escape)`.
- **Description:** Build Review Queue table displaying submissions pending review. Build Override Modal requiring selection from standard Reason Codes (`APPROVED_CAMPAIGN_EXCEPTION`) and justification text area.
- **Acceptance Check:** Reviewer selects submission, opens override modal, selects reason code, and submits override; finding updates immediately to `OVERRIDDEN`.
- **Tests:** Component test for override modal validation and submission.

#### TSK-M1-23: Seeded Rule Health Dashboard & Diagnostic Display (`SCR-07`)
- **Owner:** Tanishka Bellale (Assisted by Prathmesh Shinde)
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `frontend/src/app/(app)/governance/health/page.tsx`, `frontend/src/features/governance/RuleHealthTable.tsx`.
- **Dependencies:** `TSK-M1-10`, `TSK-M1-21`.
- **Linked Requirements:** `SCR-07`, `FN-RHL-01`, `API-23`.
- **Binding AI Rules:** `STD, Sec 9.8` (Seeded demo history must be labelled as demo data).
- **Description:** Build Rule Health Dashboard querying `GET /api/v1/governance/health`; display override rates per rule, dominant reason codes, and diagnostic badges (`HEALTHY`, `SCOPE_MISMATCH`, `NOISY`). Display explicit *"Demonstration Seed Data"* watermark.
- **Acceptance Check:** Rule `TERM-007` renders 38% override rate and `SCOPE_MISMATCH` badge; shows primary reason code `APPROVED_CAMPAIGN_EXCEPTION`.
- **Tests:** Component test for diagnostic badge color mapping.

#### TSK-M1-24: Minimal Scope-Exception Proposal Generator (`PROP-01`)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/api/v1/governance.py`, `backend/app/services/proposal_generator.py`.
- **Dependencies:** `TSK-M1-07`, `TSK-M1-21`.
- **Linked Requirements:** `FN-BKT-01`, `FR-24`, `API-24`.
- **Binding AI Rules:** `STD, Sec 3.2` (Proposals are drafts, human approves).
- **Description:** **Restored Milestone 1 Feature.** Implement `POST /api/v1/governance/proposals`. Generates or inspects candidate rule modification `PROP-01` (pre-seeded as a deterministic draft proposal for 100% reproducible demo execution; refines rule scope to exempt verified educational disclaimers).
- **Acceptance Check:** Endpoint returns proposal object with git-style rule diff and status `DRAFT`.
- **Tests:** `backend/tests/integration/test_governance_api.py::test_generate_proposal`.

#### TSK-M1-25: Backtest Simulation Engine (Replay Past Findings, Verify 0 Regressions)
- **Owner:** Dhruv Patil (Second Diff Reviewer: Prathmesh Shinde)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/app/services/backtest_engine.py`, `backend/tests/unit/services/test_backtest.py`.
- **Dependencies:** `TSK-M1-24`.
- **Linked Requirements:** `FN-BKT-02`, `FR-25`, `API-25`.
- **Binding AI Rules:** `STD, Sec 5.1.2` (Deterministic simulation math).
- **Description:** **Restored Milestone 1 Feature.** Implement `POST /api/v1/governance/proposals/{id}/backtest`. Replays historical finding records against candidate rule diff; calculates eliminated false positives and confirms 0 critical regressions in $< 1\text{s}$.
- **Acceptance Check:** Backtest report returns: `submissions_replayed: 142`, `findings_eliminated: 14`, `critical_regressions: 0`.
- **Tests:** `backend/tests/unit/services/test_backtest.py`.

#### TSK-M1-26: Policy `v1.1` Approval Acceptance Test Screen (`SCR-08`)
- **Owner:** Tanishka Bellale (Backend support: Dhruv Patil)
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `frontend/src/app/(app)/governance/proposals/[id]/page.tsx`, `frontend/src/features/governance/BacktestReport.tsx`.
- **Dependencies:** `TSK-M1-24`, `TSK-M1-25`.
- **Linked Requirements:** `SCR-08`, `FN-BKT-03`, `FR-26`, `API-26`.
- **Binding AI Rules:** `STD, Sec 3.2` (Human signs off policy release).
- **Description:** **Milestone 1 Acceptance Test Screen.** Build Proposal & Backtest Report screen displaying side-by-side git diff and regression card; implement "Adopt & Publish Policy v1.1" action calling `API-26` to seal and promote policy version.
- **Acceptance Check:** Brand Manager reviews backtest regression card and clicks "Adopt & Publish Policy v1.1"—Policy `v1.1` is created and activated only on this explicit human approval (acceptance test); audit log emits policy release event.
- **Tests:** End-to-end integration test of proposal adoption flow.

#### TSK-M1-27: Live AI Disclosure & Telemetry Panel Screen (`SCR-09`)
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `frontend/src/app/(app)/transparency/page.tsx`, `frontend/src/features/transparency/DisclosurePanel.tsx`.
- **Dependencies:** `TSK-M1-10`, `TSK-M1-19`.
- **Linked Requirements:** `SCR-09`, `FN-DIS-02`, `API-27`, `TASK, P8-T07`.
- **Binding AI Rules:** `STD, Sec 8.11` (Real call logs, not static text), `PRD, FR-30`.
- **Description:** Build AI Disclosure Panel querying `/api/v1/transparency/disclosure`. Displays active provider name (behind adapter), model ID, verified data retention policy (`VER-11`), rolling 24h call counter, and recent sanitized call records.
- **Acceptance Check:** Running a content check immediately increments the 24h call counter and appends entry to recent call log.
- **Tests:** Integration test asserting live call count updates.

---

### Workstream 4: Hardening, E2E Verification & Rehearsals (Hours 37–48)

#### TSK-M1-28: Automated End-to-End Demo Flow Test against Deployed Cloud
- **Owner:** Dhruv Patil
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `backend/tests/e2e/test_demo_flow.py`.
- **Dependencies:** `TSK-M1-04`, `TSK-M1-26`, `TSK-M1-27`.
- **Linked Requirements:** `DOC-05 (JRN-06)`, `DOC-14 (TST-14)`.
- **Binding AI Rules:** `STD, Sec 9.9` (Automated script executes exact demo sequence).
- **Description:** Standardize single end-to-end test location at `backend/tests/e2e/test_demo_flow.py`. Executes complete 4-minute demo sequence against the deployed cloud environment: Login -> Submit copy -> Inspect Double Receipts -> Reviewer Override -> Rule Health -> Proposal `PROP-01` -> Backtest Simulation -> Policy `v1.1` Approval Acceptance Test -> AI Disclosure.
- **Acceptance Check:** Test passes 3 consecutive runs against production cloud deployment with zero assertion errors.
- **Tests:** `pytest backend/tests/e2e/test_demo_flow.py`.

#### TSK-M1-29: Offline Comparative Evaluation Benchmark Harness (`make eval`)
- **Owner:** Dhruv Patil & Prathmesh Shinde
- **Size / Estimate:** 1.5 hours
- **Files Touched:** `scripts/run_eval.py`, `backend/app/services/eval_runner.py`, `data/eval/cases.json`.
- **Dependencies:** `TSK-M1-16`, `TSK-M1-19`, `TSK-M1-20`.
- **Linked Requirements:** `DOC-14 (TST-13)`, `FN-EVL-01`, `FR-31`.
- **Binding AI Rules:** `STD, Sec 9.6` (Automated comparative eval), `STD, Sec 9.7` (Report measured rates, no fake claims).
- **Description:** Implement evaluation benchmark runner comparing Canon Hybrid Pipeline against LLM-only baseline across ~120 synthetic cases; compute and output measured precision, recall, evidence verification rate, consistency, and latency.
- **Acceptance Check:** `python scripts/run_eval.py` executes to completion and outputs clean formatted comparative report with measured rates.
- **Tests:** Evaluation harness execution test.

#### TSK-M1-30: Responsive Layout Stress Testing (375px & 1440px) & Accessibility Audit
- **Owner:** Tanishka Bellale
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `frontend/src/app/**/page.tsx`, `frontend/src/components/**`.
- **Dependencies:** `TSK-M1-18`, `TSK-M1-26`.
- **Linked Requirements:** `DOC-10`, `STD, Sec 5.3.7`, `Canon AI Rules and Engineering Standards (Sec 5.3, responsive UAT)`.
- **Binding AI Rules:** `Canon AI Rules and Engineering Standards (Sec 5.3, zero horizontal scroll, active focus rings, keyboard navigation)`.
- **Description:** Verify all 8 core screens at mobile (375px) and desktop (1440px) viewports; verify keyboard navigation (Tab/Shift-Tab, Escape on modals); assert zero horizontal overflow (`min-w-0`, `truncate`).
- **Acceptance Check:** Zero horizontal scrollbars at 375px; all interactive buttons show visible focus rings.
- **Tests:** Visual browser UAT audit.

#### TSK-M1-31: [HUMAN TASK] 4-Minute Vocal Demo Rehearsals (3x Dry Runs, Stopwatch) & Defect Scrub
- **Owner:** Tanishka Gawale & Team Runtime Rebels
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `docs/demo_runbook.md`, `docs/defect_log.md`.
- **Dependencies:** `TSK-M1-28`.
- **Linked Requirements:** `DOC-05 (JRN-06)`, `STD, Sec 14`.
- **Binding AI Rules:** `STD, Sec 14` (Rehearsal with stopwatch, clean state).
- **Description:** **[HUMAN TASK]** Execute 3 live vocal rehearsals of the 4-minute demo walkthrough using a stopwatch; log and resolve any cosmetic or timing defects; verify clean database seed state before each run.
- **Acceptance Check:** 3 consecutive vocal rehearsals complete within 4:00 (+/- 15s) with zero blocking glitches.
- **Tests:** Human dry-run execution log.

#### TSK-M1-32: [HUMAN TASK] Fallback MP4 Video Recording & Final CodeNexus Round 2 Submission Assembly
- **Owner:** Tanishka Gawale & Team Runtime Rebels
- **Size / Estimate:** 2.0 hours
- **Files Touched:** `docs/submission_manifest.md`, `data/demo_backup/canon_4min_demo_walkthrough.mp4`.
- **Dependencies:** `TSK-M1-31`.
- **Linked Requirements:** `TASK, P14-T09 to P14-T11`, `JUDGE, Sec 4`.
- **Binding AI Rules:** `STD, Sec 10.7` (Honest communication, verified public URLs).
- **Description:** **[HUMAN TASK]** Record and save local 4-minute fallback MP4 video walkthrough in case conference Wi-Fi degrades; assemble final submission links (public Vercel URL, public Render API docs, GitHub repo, personal briefs); submit official CodeNexus Round 2 package.
- **Acceptance Check:** Official hackathon submission confirmed prior to 48-hour deadline; video playable offline.
- **Tests:** Video playback verification and link validation.
