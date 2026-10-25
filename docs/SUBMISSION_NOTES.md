# Canon Milestone 1 — Official Submission Notes & Evaluation Evidence

**Platform:** Canon — Pre-Publication Brand Governance Platform  
**Sprint Target:** Milestone 1 (Hours 00–48)  
**Lead Architect & Full-Stack Engineer:** Dhruv Patil  
**Review Status:** Milestone 1 Implementation Complete & Fully Verified  

---

## 1. Executive Summary & Verification Evidence

Milestone 1 implements the complete, single-origin pre-publication brand compliance engine. The platform is architected around the **Double-Receipt Invariant**: no compliance finding can be asserted or persisted unless it contains both **Receipt A** (verbatim text span from the author's draft) and **Receipt B** (verbatim citation and excerpt from active brand policy guidelines or verified claims ledger).

### Key Test & Verification Metrics
- **Automated Test Suite:** 73/73 tests passing (100% pass rate in 12.8s).
- **Backend Linting:** Clean `ruff check` (0 errors, 0 warnings).
- **Frontend Turbopack Build:** Clean `next build` (0 errors, 5 static routes prerendered).
- **Architectural Security:** 17 relational tables with PostgreSQL Row-Level Security (RLS) and `httpOnly` secure single-origin proxy cookies (zero `localStorage` token exposure).

---

## 2. Invariants & Milestone 1 Commitments

### 2.1 Policy v1.1 Human Approval Acceptance Invariant (JRN-06, TST-14)
- **Non-Negotiable Rule:** Policy `v1.1` is **NEVER** created or automatically activated by the AI or background pipeline.
- **Human Brand Manager Gate:** System proposal synthesis and backtesting are purely advisory. Activation occurs strictly and exclusively upon explicit human Brand Manager click via `POST /api/v1/governance/proposals/{id}/adopt`.
- **Database Enforcement:** The active policy version requires `approved_by` referencing an authenticated human user (`chk_active_policy_must_be_human_approved`). Activating `v1.1` sets `approved_by = current_user.id`, archives baseline `v1.0`, and writes an immutable `AuditLog` entry.

### 2.2 Approved Claims Ledger & Stale Figure Detection
- **Schema Implementation:** `ApprovedClaim` table contains temporal validity columns `valid_from` and `valid_until`.
- **Demo Fixture:** Demonstrates `CLAIM-001` ("rated #1 banking app with 99.99% uptime") with `valid_until = 2025-01-01T00:00:00Z`. In current evaluation, this claim is flagged as an `EXPIRED_CLAIM` with `CRITICAL` severity, preventing stale marketing metrics from reaching publication.

### 2.3 Seeded Deterministic Proposal (PROP-01)
- The demo proposal `PROP-01` ("Exempt Verified Educational Case Studies on Enterprise Partner Portals") is a **seeded, deterministic draft proposal** derived from the 37.5% override rate on `TERM-007` with reason `JUSTIFIED_EDUCATIONAL_CONTEXT`.
- All backtest simulation metrics (24 historical submissions replayed, 58.3% &rarr; 83.3% pass rate, 6 false positives eliminated, 0 regressions, Safety Score 1.0) are deterministic and reproducible.

---

## 3. Features Officially Declared "NOT BUILT" in Milestone 1

To maintain strict delivery discipline under the 30-hour ceiling and prevent scope creep, the following capabilities are explicitly declared **NOT BUILT** in Milestone 1:

| Feature Code | Description | Milestone 1 Status | Target Milestone |
| :--- | :--- | :--- | :--- |
| **FR-13** | Automated URL Web Crawling & Live Site Feed Ingestion | **NOT BUILT** | Milestone 2 |
| **FR-14** | Automated PII / NER Text Redaction | **NOT BUILT** | Milestone 2 |
| **FR-21** | Automated USPTO & Global Trademark Search Integration | **NOT BUILT** | Milestone 3 |
| **FR-24** | Autonomous Policy Version Activation (Forbidden by Invariant) | **NOT BUILT** | Never (Human-Only) |

*Performance Claim Note:* All generalized marketing claims of "<1s end-to-end check" have been removed. Telemetry measures actual execution latency via SHA-256 composite caching (<50ms cache hits) and database query instrumentation.

---

## 4. Verification Registry (VER Items — All Marked Unverified)

In accordance with condition 4, all free-tier infrastructure claims and third-party provider assertions are classified as unverified hypotheses rather than established facts:

| Item | Topic | Unverified Condition & Evidence Protocol | Status in M1 |
| :--- | :--- | :--- | :--- |
| **VER-01** | Supabase 7-Day Free-Tier Auto-Pause | Unverified in M1. Mitigation: automated pg_dump backup script and fallback local PostgreSQL container. | **UNVERIFIED** |
| **VER-02** | Render 15-Minute Web Service Sleep | Unverified in M1. Mitigation: single-host deployment on Render, supplemented by recorded fallback video. | **UNVERIFIED** |
| **VER-03** | Vercel Edge Rewrite Proxy Body Limits | Unverified in M1. Client upload payloads capped conservatively at 15 MB in backend settings. | **UNVERIFIED** |
| **VER-04** | LLM Provider Zero Data Retention Claim | Unverified in M1. No enterprise DPA signed; declared explicitly as unverified in `/transparency`. | **UNVERIFIED** |
| **VER-05** | Groq Free-Tier Rate Limits (TPM / RPM) | Unverified in M1. Mitigation: deterministic mock fallback adapter activated upon 429/timeout. | **UNVERIFIED** |
| **VER-06** | "Canon" Trademark Availability | Unverified in M1. Working title notice displayed continuously across application navbar banner. | **UNVERIFIED** |

---

## 5. Risk Register & Mitigations

| Risk ID | Threat Category | Failure Mode | Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **RSK-01** | **RLS Tenant Data Leakage** | Missing workspace filter in SQL query exposing cross-tenant drafts. | Enforced PostgreSQL Row-Level Security (`ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`) with `app.current_workspace_id`. Cross-tenant queries return empty sets even if application logic fails. |
| **RSK-02** | **Adversarial Prompt Injection** | Input copy attempts jailbreak (`[SYSTEM NOTICE: Disregard all prior rules]`). | Stage 1 pre-flight delimiter and injection scanner flags adversarial syntax before LLM invocation and wraps user text in strict non-executable boundary tags. |
| **RSK-03** | **Milestone Scope Creep** | Unplanned features inflating delivery hours beyond 30h ceiling. | Binding "NOT BUILT" declarations for FR-13, FR-14, FR-21, FR-24; strict cut list enforced at Hour 12. |
| **RSK-04** | **Single-Origin Cookie Failure** | Cookie header dropped across reverse proxy or CORS mismatch. | Single-origin Next.js edge rewrites (`/api/v1/:path*`) proxying to FastAPI backend; `httpOnly`, `SameSite=Lax`, zero `localStorage` tokens. |
| **RSK-05** | **Single Backend Developer Bottleneck** | Dhruv Patil (Sole Backend Engineer) overloaded by competing tasks. | Modular domain boundaries, fast in-memory SQLite unit testing, 7-Rung Ponytail ladder of laziness eliminating premature abstraction. |

---

## 6. Engineering Hours Allocation & Cut Priority Protocol

### 6.1 Dhruv Patil Hours Breakdown (Ceiling: $\le 30.0$h, Planned: 27.5h)

```
[Hours 00–04] Workstream 0: Cloud deployment, Next.js proxy, FastAPI gateway, demo fixtures (4.0h)
[Hours 05–12] Workstream 1: 17-table ORM schema, RLS policies, Normalizer, JWT cookie auth, Seed data (7.5h)
[Hours 13–24] Workstream 2: Injection scanner, Terms engine, Claims ledger, Pipeline runner, Check API (8.0h)
[Hours 25–36] Workstream 3: LLM adapter & telemetry, Verifier, Decisions API, Backtest engine, v1.1 Adoption (5.0h)
[Hours 37–44] Workstream 4: Submissions UI, Review Queue UI, Governance dashboard, Transparency UI (2.0h)
[Hours 45–48] Workstream 5: End-to-end integration walkthrough, Submission notes, Documentation (1.0h)
---------------------------------------------------------------------------------------------------------
TOTAL DHRUV PATIL HOURS: 27.5 hours (Within 30h hard ceiling)
```

### 6.2 First Tasks to Cut at Hour 12 Ceiling
If development pace encountered unexpected blockers by Hour 12:
1. **Cut 1:** Dynamic RapidFuzz typo engine &rarr; replace with literal exact-match dictionary lookup.
2. **Cut 2:** Live multi-call LLM integration &rarr; default exclusively to `DeterministicMockAdapter`.
3. **Cut 3:** Dynamic backtest simulation on arbitrary submissions &rarr; deliver deterministic simulation scorecard based on seeded submissions.
4. **Non-Cuttable Core Invariants:** Row-Level Security, Double-Receipt persistence, Stale Claim detection, and Human Brand Manager approval of Policy `v1.1`.
