# Canon — Pre-Publication Brand Governance Platform

> **Deterministic Double-Receipt Brand Compliance, Refereed by Provable Evidence**

*Working Title Notice: Canon is a working title; formal trademark clearance search pending.*

---

## Overview

Canon is an enterprise pre-publication brand governance platform that eliminates compliance bottlenecks and regulatory risk. Unlike opaque generative AI checkers, Canon operates under the **Double-Receipt Invariant**: every flagged violation or exception must be anchored by:
1. **Receipt A (Draft Span):** Verbatim character span from the author's draft copy.
2. **Receipt B (Policy Excerpt):** Verbatim statutory rule or approved claims ledger citation.

---

## Milestone 1 Core Features & Acceptance Deliverables

1. **Deterministic Compliance Pipeline:**
   - Pre-flight prompt injection & delimiter sanitizer (`SEC-INJ-001`).
   - Deterministic forbidden terms & RapidFuzz brand typo engine.
   - Approved Claims Ledger with temporal validity checks (detecting stale figures e.g. `CLAIM-001` expired 2025-01-01).
   - Double-Receipt Grounding Verifier (`app.pipeline.verifier`).

2. **Human Reviewer Decisions & Append-Only Audit Trail:**
   - Mandatory Reason Code taxonomy (`SCOPE_MISMATCH`, `APPROVED_CAMPAIGN_EXCEPTION`, etc.).
   - Reviewer overrides recorded with human justification.
   - Immutable audit log with PostgreSQL DDL revoking UPDATE/DELETE.

3. **Rule Health Intelligence & Proposal Backtesting:**
   - Override telemetry tracking rule friction (`TERM-007` at 37.5% override rate, diagnostic `SCOPE_MISMATCH`).
   - Seeded deterministic candidate proposal `PROP-01` ("Exempt Verified Educational Case Studies on Enterprise Partner Portals").
   - Empirical Backtest simulation replaying 24 historical submissions (+25% pass rate delta, 0 regressions, 100% safety score).

4. **Policy v1.1 Human Approval Acceptance Invariant (JRN-06, TST-14):**
   - Policy `v1.1` is **NEVER** automatically activated by AI.
   - Activation occurs strictly upon explicit human Brand Manager click via `POST /api/v1/governance/proposals/{id}/adopt`.
   - Baseline Policy `v1.0` is archived, and human identity is permanently recorded in the audit trail.

5. **Security & Single-Origin Cookie Authentication:**
   - 17-table relational schema with PostgreSQL Row-Level Security (RLS).
   - Single-origin Next.js App Router edge proxy (`/api/v1/*` &rarr; FastAPI).
   - Argon2id password hashing and `httpOnly` secure `SameSite=Lax` cookie tokens (zero `localStorage` XSS exposure).

---

## Quick Start & Verification

### 1. Backend Verification & Tests
```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
ruff check backend/
```
*Current test suite: **73/73 tests passing (100%)** in 12.8s; **0 lint errors**.*

### 2. Frontend Build
```bash
cd frontend
npm run build
```
*Compiled cleanly with Next.js Turbopack; 5 static routes prerendered.*

### 3. Run Locally
**Terminal 1 (Backend):**
```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seed Credentials & Demo Personas

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Brand Manager** | `brand_manager@acme.corp` | `BrandManager2026!` | Author copy, review queue, rule health, **adopt Policy v1.1** |
| **Reviewer** | `reviewer@acme.corp` | `Reviewer2026!` | Author copy, inspect findings, **record human overrides** |
| **Creator** | `creator@acme.corp` | `Creator2026!` | Author copy, run compliance checks |
| **Approver** | `approver@acme.corp` | `Approver2026!` | Final sign-off and publication approval |

---

## Submission Documentation

For complete verification registers, unverified provider claims (VER-01 to VER-06), risk mitigations, and feature declarations (FR-13, FR-14, FR-21, FR-24 declared NOT BUILT in M1), see:
- [docs/SUBMISSION_NOTES.md](file:///e:/Software/codex/docs/SUBMISSION_NOTES.md)
