# Canon: Testing Strategy, Quality Assurance & Evaluation (14_testing_and_qa.md)

**Document ID:** `DOC-14`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [STD, Sec 9] `file:///E:/Software/codex/Docuements/Canon%20AI%20Rules%20and%20Engineering%20Standards.pdf`, [ARCH, Sec 13] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [DHRUV-V3, Sec 6-7, 11] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Testing Philosophy & Binding Standards

In strict accordance with **Canon Engineering Standards Section 9**:
1. **Never Weaken Tests [STD, Sec 9.2]:** Never weaken, skip, or delete an existing test to make a build pass. If a test is fundamentally incorrect, explain why in writing and update it explicitly.
2. **Deterministic Table-Driven Tests [STD, Sec 9.4]:** Deterministic rule evaluations must be validated against comprehensive edge cases (plurals, punctuation, accents, numbers, currency symbols, diacritics).
3. **Mocking at Boundaries [STD, Sec 9.5]:** Unit tests mock external LLM provider calls. Integration tests replay recorded fixtures. Live external calls run only during scheduled smoke passes.
4. **Empirical Figures Only [STD, Sec 9.7]:** No accuracy, precision, or recall figures may be quoted in product marketing or pitches unless produced by Canon's internal evaluation harness (`make eval`).

---

## 2. Requirement-to-Test Traceability Matrix (TST)

| Test ID | Test Category | Target Component / Feature | Test Description & Verifiable Assertion | Linked FR / FN |
|:---|:---|:---|:---|:---|
| **`TST-01`** | Unit | Normalizer (`STG-01`) | Assert NFKC normalization and offset map accuracy across ligatures, Unicode quotes, and CRLF line breaks. Slicing raw text by mapped offset must yield the exact target word. | `FR-7`, `FN-SUB-02` |
| **`TST-02`** | Unit | Deterministic Terms (`STG-03`)| Table-driven test verifying forbidden terms ("guarantee", "guaranteed", "guaranteeing") and near-misses ("AcmeCloud" $\to$ "Acme Cloud"). | `FR-9`, `FN-CHK-03` |
| **`TST-03`** | Unit | Contrast Formula (`STG-03`) | Assert relative luminance calculation. Hex `#777777` on `#FFFFFF` ($4.48:1$) fails normal text AA ($4.5:1$); `#000000` on `#FFFFFF` ($21:1$) passes. | `FR-9`, `FN-CHK-03` |
| **`TST-04`** | Unit | Double-Receipt Verifier (`STG-06`)| Assert that a candidate finding with a fabricated quote or non-existent rule code is marked `DROPPED` and excluded from confirmed output. | `FR-11`, `FN-CHK-06` |
| **`TST-05`** | Adversarial| Security Scan (`STG-02`) | Feed 10 adversarial prompt injection payloads (e.g., embedded HTML comments, role overrides). Assert 100% are flagged as `CRITICAL (INJECTION)` and never obeyed. | `FR-12`, `FN-CHK-02` |
| **`TST-06`** | Security | Tenant RLS Isolation & Unset Invariant | Connect as `canon_app`. (1) In Workspace A, attempt access to Workspace B; assert 0 rows returned or modified. (2) Execute query with unset/null workspace context setting; assert 0 rows returned on SELECT and authorization error on INSERT (`test_rls_unset_workspace`). | `STD Sec 3.9`, `FN-USR-02`|
| **`TST-07`** | Security | Audit Log Tamper-Resistance | Connect as `canon_app`. Attempt `UPDATE audit_log SET action = 'tampered'` or `DELETE FROM audit_log`. Assert fatal PostgreSQL privilege violation. | `FR-23`, `FN-AUD-01` |
| **`TST-08`** | Security | RBAC Route Guard | Send HTTP request to `POST /api/v1/policy/versions` with valid JWT belonging to a `creator`. Assert HTTP 403 Forbidden. | `TASK P1-T10`, `API-07` |
| **`TST-09`** | Integration| Submission Core Loop | Submit text draft $\to$ trigger check run $\to$ poll `/jobs/{id}` to completion $\to$ fetch `/findings`. Assert response time $< 4\text{s}$ and findings count matches reference data. | `FR-07`, `FR-09`, `FR-15`, `JRN-02` |
| **`TST-10`** | Integration| Reviewer Override Flow | Submit finding override without Reason Code (assert HTTP 400); submit with Reason Code `APPROVED_CAMPAIGN_EXCEPTION` (assert HTTP 200 and audit row created). | `FR-19`, `FN-REV-02` |
| **`TST-11`** | Integration| Unresolved Critical Sign-off | Attempt `POST /submissions/{id}/approve` while an unaddressed Critical finding remains. Assert HTTP 409 Conflict. | `FR-22`, `FN-APP-01` |
| **`TST-12`** | Integration| AI Disclosure Logging | Execute a check run calling LLM adapter. Query `GET /transparency/disclosure`. Assert rolling call counter increments and recent call log reflects exact model used. | `FR-30`, `FN-DIS-02` |
| **`TST-13`** | Evaluation | Comparative Eval Harness | Execute `make eval` comparing hybrid pipeline against LLM-only baseline on synthetic cases. Records and reports measured rates (`[MEASURED_BASELINE]`, `[MEASURED_HYBRID]`, `[DELTA]`); reports verified rate without asserting arbitrary synthetic thresholds. | `FR-31`, `FN-EVL-01` |
| **`TST-14`** | E2E | 4-Minute Live Demo Flow & Acceptance Test | Single automated test location: [`backend/tests/e2e/test_demo_flow.py`](file:///E:/Software/codex/backend/tests/e2e/test_demo_flow.py) executing complete 4-minute walkthrough against deployed cloud environment: Login $\to$ Ingest Policy `v1.0` $\to$ Submit draft $\to$ Double-Receipt Highlights (inc. stale claim detection via `valid_until`) $\to$ Reviewer Override with Reason Code $\to$ Rule Health Diagnosis $\to$ Seeded Deterministic Draft Proposal `PROP-01` $\to$ Backtest Simulation $\to$ Policy `v1.1` Human Approval Acceptance Test (created only on human click) $\to$ AI Disclosure. Assert 100% pass across 3 runs. | `STD Sec 9.9`, `JRN-06` |
| **`TST-15`** | Integration| Scope-Exception Proposal API | Call `POST /api/v1/governance/proposals` targeting rule with `SCOPE_MISMATCH`. Assert generated candidate diff adds valid channel scope filter. | `FR-24`, `FN-BKT-01` |
| **`TST-16`** | Integration| Backtest Simulation Replay | Call `POST /api/v1/governance/proposals/{id}/backtest`. Replay past findings against candidate rule diff. Assert returned eliminated count $>0$ and critical regressions $== 0$. | `FR-25`, `FN-BKT-02` |
| **`TST-17`** | Integration| Policy v1.1 Human Approval & Seal | Call `POST /api/v1/governance/proposals/{id}/adopt`. Assert Policy `v1.1` is created only upon explicit human approval, verified by `approved_by` user ID and audit release event. | `FR-29`, `FN-BKT-03` |

---

## 3. Test Suites Catalog & File Layout

```
backend/tests/
  ├── conftest.py                   (Shared fixtures, test DB session, mock auth tokens)
  ├── unit/
  │   ├── test_auth.py              (Argon2 password hashing, JWT expiration, claims)
  │   ├── pipeline/
  │   │   ├── test_normalize.py     (NFKC, whitespace, offset map bidirectional math)
  │   │   ├── test_deterministic.py (Terms, lemmas, near-miss, contrast luminance)
  │   │   ├── test_llm_adapter.py   (Temperature 0, schema validation, 1-retry fallback)
  │   │   ├── test_verifier.py      (Receipt A & B string checks, sliding window fuzzy)
  │   │   └── test_merge.py         (Deterministic priority over semantic overlap)
  │   └── services/
  │       └── test_rule_health.py   (Diagnostic state math: NOISY, SCOPE_MISMATCH)
  ├── integration/
  │   ├── test_policy_api.py        (Source ingestion, rule compilation, publication)
  │   ├── test_submission_api.py    (Submissions, versioning, background check runner)
  │   ├── test_review_api.py        (Overrides, disputes, reason codes, approvals)
  │   └── test_rls_isolation.py     (Multi-tenant data isolation and role boundaries)
  └── adversarial/
      ├── test_injection.py         (10 synthetic prompt injection attack payloads)
      └── test_tamper_audit.py      (Attempted SQL UPDATE/DELETE on audit_log)

frontend/tests/
  ├── components/                   (Vitest component tests for UI primitives)
  └── e2e/
      └── demo_flow.spec.ts         (Playwright automated end-to-end demo flow)
```

---

## 4. Automated Evaluation Benchmark Harness (`make eval`)

- **FACT [STD, Sec 9.6, 9.7; ARCH, Sec 13; PRD, Sec 15]:** The offline evaluation harness runs via `python scripts/run_eval.py` (or `make eval`) and scores both pipeline configurations against a standardized reference set.
- **Reference Dataset:** `data/eval/cases.json` containing:
  - ~40 synthetic content submissions.
  - ~120 labelled violations across terminology, claims, tone, and contrast.
  - ~10 adversarial jailbreak/injection cases.
- **Comparative Output Matrix (Example Format from `eval_run`):**

```
================================================================================
CANON EVALUATION HARNESS: HYBRID PIPELINE vs. LLM-ONLY BASELINE
Executed: [TIMESTAMP] | Model: [MODEL_ID] | Dataset: v1.0 (Reference Set)
================================================================================
Metric                      LLM-Only Baseline    Canon Hybrid Pipeline    Delta
--------------------------------------------------------------------------------
Terminology Precision       [MEASURED_BASE_1]    [MEASURED_HYB_1]         [DELTA_1]
Terminology Recall          [MEASURED_BASE_2]    [MEASURED_HYB_2]         [DELTA_2]
Claim Verification Rate     [MEASURED_BASE_3]    [MEASURED_HYB_3]         [DELTA_3]
Evidence-Verified Rate      [MEASURED_BASE_4]    [MEASURED_HYB_4]         [DELTA_4]
Run-to-Run Consistency (5x) [MEASURED_BASE_5]    [MEASURED_HYB_5]         [DELTA_5]
Prompt Injection Resistance [MEASURED_BASE_6]    [MEASURED_HYB_6]         [DELTA_6]
Average Run Latency         [MEASURED_BASE_7] ms [MEASURED_HYB_7] ms      [DELTA_7] ms
================================================================================
```
*Note: In strict accordance with Engineering Standards Section 9.7 and Review Directive 5, synthetic figures are not quoted as established benchmarks prior to execution; all values represent empirical measurements produced during live harness execution.*

---

## 5. Live Demo Run-Through Checklist

- **FACT [STD, Sec 14]:** Prior to commencing the live presentation to hackathon judges or investors, the team must execute the following physical checklist:

1. [ ] **Cloud Connectivity:** Verify that both frontend (`https://canon-web.vercel.app`) and backend (`https://canon-api.onrender.com/api/v1/health/ready`) return HTTP 200 OK.
2. [ ] **Database Pre-Warming:** Ping the Supabase database to ensure the free instance is active and not paused due to inactivity.
3. [ ] **LLM Cache Warmed:** Run one test check on the demo submission text to prime the local response cache; ensures the live demo runs in $< 2$ seconds.
4. [ ] **Demonstration Watermarks Active:** Verify that the Rule Health screen explicitly displays the *"Demonstration Seed Data"* watermark.
5. [ ] **Browser State Clean:** Clear browser cookies or use an incognito window; verify test user accounts are logged out.
6. [ ] **Pre-Recorded Fallback Ready:** Verify that the 4-minute pre-recorded presentation video (MP4) is saved locally on the presenter laptop, ready to play immediately if venue Wi-Fi degrades.
7. [ ] **End-to-End Pass Verified:** Run `pytest backend/tests/e2e/test_demo_flow.py` and confirm 3 consecutive clean passes against the deployed cloud environment.

---

## 6. Standard Defect Log Format

All bugs identified during testing or demo rehearsals must be filed in `docs/defect_log.md` conforming to the strict structure below:

```markdown
### DEF-042: Verifier Drops Valid Near-Miss Term Due to Punctuation Offset Mismatch
- **Severity:** High (Blocks Milestone 1 Acceptance)
- **Component:** `backend/app/pipeline/verifier.py`
- **Discovered By:** Tanishka Bellale (Frontend Lead)
- **Assigned To:** Dhruv Patil (Backend Lead)
- **Reproduction Steps:**
  1. Submit draft text ending with punctuation: "We recommend AcmeCloud."
  2. Run verification check.
- **Expected Behavior:** Verifier locates "AcmeCloud" (offsets 14-23) and flags Near-Miss.
- **Actual Behavior:** Verifier included the period (offsets 14-24), causing Receipt A string match to fail; finding was marked `DROPPED`.
- **Root Cause:** Tokenizer boundary regex included trailing punctuation in candidate slice.
- **Remediation:** Strip trailing punctuation before calculating character offset slice in `terms.py`.
- **Regression Test:** `tests/unit/pipeline/test_verifier.py::test_trailing_punctuation_offset`.
- **Status:** RESOLVED (Commit: `fix(pipeline): strip trailing punctuation in offset calculation`)
```

---

## 7. Formal Definition of Done (DoD)

### 7.1 For an Individual Atomic Task (TSK)
- [ ] Code strictly follows Project Structure and Dependency Direction (`DOC-06`).
- [ ] Functions do one thing; no single-letter variable names outside tiny loops (`STD, Sec 5.1`).
- [ ] No hardcoded secrets, model names, or thresholds; uses configuration (`STD, Sec 5.1.5`).
- [ ] Automated tests written and passing (including at least one edge failure case).
- [ ] Python code passes `ruff check` and `mypy` with 0 warnings.
- [ ] TypeScript code passes `npm run lint` and `tsc --noEmit` with 0 errors (no `any`).

### 7.2 For a Pull Request (PR)
- [ ] One single engineering concern per PR (`STD, Sec 10.1`).
- [ ] Conventional Commit format citing the task ID (e.g., `feat(pipeline): implement double-receipt verifier [TSK-M1-17]`).
- [ ] GitHub Actions CI workflow passes 100% (lint, type check, unit tests).
- [ ] Reviewed and approved by the assigned human teammate.

### 7.3 For a Milestone Release (M1 / M2 / M3)
- [ ] Deployed and reachable on verified public URLs (no local-only deliverables).
- [ ] Zero unlabelled mock or seed data in production views.
- [ ] Single error envelope enforced across all failing routes.
- [ ] AI Rules Section 3 completely satisfied across all runtime code paths.
- [ ] 3 consecutive flawless end-to-end demo dry runs completed.
