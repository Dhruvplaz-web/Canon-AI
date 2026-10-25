# Canon: Master Traceability Matrix & Gap Analysis (20_traceability_matrix.md)

**Document ID:** `DOC-20`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 2.0 (Direct TST Mapping & Gap Analysis Reconciliation)  
**Parent Trace:** All Canon Project Documents, [PRD, Sec 4-15] `file:///E:/Software/codex/Docuements/Canon%20Product%20Requirements%20Document.pdf`, [ARCH, Sec 6-13] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Traceability Methodology & Testing Integrity

In strict adherence to **Non-Negotiable Working Rule 4 (PERFECT LINKING)** and **Review Directive 6**:
- **Real, Distinct Tests Per Requirement:** Every functional requirement (`FR`) is mapped to a specific, dedicated automated test (`TST`) that explicitly verifies its contract. Catch-all test reuse (e.g., reusing `TST-09` across unrelated features) is strictly eliminated.
- **Explicit Gap Declaration:** Any functional requirement that is deferred to Milestone 2 or Milestone 3 and lacks an automated test in Milestone 1 is explicitly declared as a **TESTING GAP** in both the matrix and the Gap Analysis table.
- **FR-14 Clarification (Review Condition 3 & 4):** In accordance with Review Conditions 3 and 4, `FR-14` (Payload Redaction & Sensitive Data Masking) is explicitly declared as **NOT BUILT** in Milestone 1 and deferred to Milestone 2.

---

## 2. Master Bidirectional Traceability Matrix

| Functional Requirement (`FR`) | System Function (`FN`) | Relational Entities (`ENT`) | API Endpoint (`API`) | Screen / UI (`SCR`) | Task (`TSK`) | Dedicated Test (`TST`) | Status in M1 |
|:---|:---|:---|:---|:---|:---|:---|:---:|
| **`FR-01`** (Import guidelines & rules) | `FN-POL-01` | `source_document`, `workspace` | `API-04` (`POST /policy/sources`) | `SCR-01` | `TSK-M1-13` | `test_policy_source_ingestion` (`test_policy_api.py`) | **VERIFIED** |
| **`FR-02`** (Propose candidate rules with citations) | `FN-POL-02` | `rule`, `source_document` | `API-05` (`POST /policy/sources/{id}/compile`) | `SCR-02` | `TSK-M1-13` | `test_candidate_rule_compilation` (`test_policy_api.py`) | **VERIFIED** |
| **`FR-03`** (Manager approves/rejects rule; human gate)| `FN-POL-03` | `rule`, `user` | `API-06` (`PATCH /policy/rules/{id}`) | `SCR-02` | `TSK-M1-13` | `test_rule_adjudication_human_gate` (`test_policy_api.py`) | **VERIFIED** |
| **`FR-04`** (Immutable policy releases v1.0, v1.1) | `FN-POL-04` | `policy_version`, `rule` | `API-07` (`POST /policy/versions`) | `SCR-02` | `TSK-M1-13` | `test_policy_version_publication` (`test_policy_api.py`) | **VERIFIED** |
| **`FR-05`** (Rule scope filters: channel, audience) | `FN-POL-03` | `rule.scope_filters` | `API-06` (`PATCH /policy/rules/{id}`) | `SCR-02` | `TSK-M1-13` | `test_rule_scope_filtering` (`test_deterministic.py`) | **VERIFIED** |
| **`FR-06`** (Claims carry valid_from & valid_until) | `FN-POL-05` | `approved_claim` | `API-09, API-10` (`/claims`) | `SCR-02` | `TSK-M1-06` | `test_claim_temporal_validity` (`test_deterministic.py`) | **VERIFIED** |
| **`FR-07`** (Submit plain text & normalize offsets) | `FN-SUB-01, 02` | `submission`, `submission_version` | `API-11` (`POST /submissions`) | `SCR-03` | `TSK-M1-12` | `test_submission_ingestion_and_offsets` (`test_normalize.py`)| **VERIFIED** |
| **`FR-08`** (Resubmission stored as new version v2) | `FN-SUB-03` | `submission_version` | `API-14` (`POST /submissions/{id}/versions`)| `SCR-03` | `TSK-M1-17` | `test_submission_versioning` (`test_submission_api.py`) | **VERIFIED** |
| **`FR-09`** (Deterministic checks: terms, near-miss) | `FN-CHK-03` | `rule`, `finding` | `API-15` (`POST /submissions/{id}/check`) | `SCR-04` | `TSK-M1-16` | `test_deterministic_engine_execution` (`test_deterministic.py`)| **VERIFIED** |
| **`FR-10`** (Semantic tone & style checks via adapter) | `FN-CHK-05` | `finding`, `ai_service_call` | `API-15` (`POST /submissions/{id}/check`) | `SCR-04` | `TSK-M1-19` | `test_semantic_tone_check` (`test_llm_adapter.py`) | **VERIFIED** |
| **`FR-11`** (Programmatic Double-Receipt verification) | `FN-CHK-06` | `finding.verification_status` | `API-17` (`GET /findings`) | `SCR-04` | `TSK-M1-20` | `test_double_receipt_verification` (`test_verifier.py`) | **VERIFIED** |
| **`FR-12`** (Prompt injection neutralization stage) | `FN-CHK-02` | `finding (category=INJECTION)` | `API-15` (`POST /submissions/{id}/check`) | `SCR-04` | `TSK-M1-15` | `test_prompt_injection_neutralization` (`test_injection.py`) | **VERIFIED** |
| **`FR-13`** (Visual palette, contrast & logo checks) | `FN-CHK-08` | `brand_asset`, `finding` | `API-15` (`POST /submissions/{id}/check`) | `SCR-04` | `TSK-M3-05` | *None in M1 (Deferred to Milestone 3 Visual Engine)* | **NOT BUILT (M3)** |
| **`FR-14`** (Payload redaction & sensitive data masking)| `FN-CHK-05` | `ai_service_call.redacted_flag`| `API-27` (`/transparency`) | `SCR-09` | `TSK-M2-09` | *None in M1 (Deferred to Milestone 2)* | **NOT BUILT (M2)** |
| **`FR-15`** (Finding card displays span & cited quote)| `FN-FND-01` | `finding` | `API-17` (`GET /findings`) | `SCR-04` | `TSK-M1-18` | `test_finding_double_receipt_card` (`test_submission_api.py`)| **VERIFIED** |
| **`FR-16`** (Suggestions preserve intent; no auto-apply)| `FN-FND-02` | `finding.suggested_fix` | `API-17` (`GET /findings`) | `SCR-04` | `TSK-M1-16` | `test_suggestion_intent_preservation` (`test_deterministic.py`)| **VERIFIED** |
| **`FR-17`** (Severity ranking: Critical > Major > Minor)| `FN-CHK-07` | `finding.severity` | `API-17` (`GET /findings`) | `SCR-04` | `TSK-M1-17` | `test_findings_severity_ordering` (`test_submission_api.py`) | **VERIFIED** |
| **`FR-18`** (Unknown claims escalated to legal review)| `FN-FND-03` | `finding (category=CLAIM)` | `API-17` (`GET /findings`) | `SCR-04` | `TSK-M1-16` | `test_unknown_claim_escalation` (`test_deterministic.py`)| **VERIFIED** |
| **`FR-19`** (Reviewer override requires Reason Code) | `FN-REV-02` | `decision`, `reason_code` | `API-19` (`POST /findings/{id}/override`) | `SCR-06` | `TSK-M1-21` | `test_reviewer_override_reason_code` (`test_review_api.py`) | **VERIFIED** |
| **`FR-20`** (Creator disputes finding with reason code)| `FN-REV-03` | `dispute` | `API-20` (`POST /findings/{id}/dispute`) | `SCR-04` | `TSK-M1-21` | `test_creator_dispute_submission` (`test_review_api.py`) | **VERIFIED** |
| **`FR-21`** (Threaded collaboration comments on findings)| `FN-REV-04` | `comment` | `API-18` (`/comments`) | `SCR-06` | `TSK-M2-06` | *None in M1 (Deferred to Milestone 2 Collaboration)* | **NOT BUILT (M2)** |
| **`FR-22`** (Formal sign-off blocked on Critical finding)| `FN-APP-01, 02` | `approval`, `submission.status` | `API-21, API-22` (`/approve`, `/send-back`)| `SCR-06` | `TSK-M1-21` | `test_signoff_critical_finding_block` (`test_review_api.py`)| **VERIFIED** |
| **`FR-23`** (Append-only immutable audit log) | `FN-AUD-01, 02` | `audit_log` | `API-28` (`GET /audit-log`) | `SCR-10` | `TSK-M1-07` | `test_audit_log_tamper_resistance` (`test_tamper_audit.py`)| **VERIFIED** |
| **`FR-24`** (Export compliance audit log as PDF) | `FN-AUD-03` | `audit_log` | `API-28` (`POST /audit-log/export`) | `SCR-10` | `TSK-M2-08` | *None in M1 (CSV/JSON supported; PDF export in M2)* | **NOT BUILT (M2)** |
| **`FR-25`** (Rule Health telemetry: flags, overrides) | `FN-RHL-01` | `rule_health_snapshot` | `API-23` (`GET /governance/health`) | `SCR-07` | `TSK-M1-23` | `test_rule_health_metrics_aggregation` (`test_rule_health.py`)| **VERIFIED** |
| **`FR-26`** (Rule flaw diagnosis: noisy, scope mismatch)| `FN-RHL-02` | `rule_health_snapshot.diagnosis`| `API-23` (`GET /governance/health`) | `SCR-07` | `TSK-M1-23` | `test_rule_health_diagnosis_state` (`test_rule_health.py`)| **VERIFIED** |
| **`FR-27`** (Scope-exception proposal generation PROP-01)| `FN-BKT-01` | `rule_change_proposal` | `API-24` (`POST /governance/proposals`) | `SCR-08` | `TSK-M1-24` | `test_scope_exception_proposal_generation` (`test_gov_api.py`)| **VERIFIED** |
| **`FR-28`** (Backtest simulation replay on past findings)| `FN-BKT-02` | `backtest_run`, `backtest_result`| `API-25` (`POST /proposals/{id}/backtest`)| `SCR-08` | `TSK-M1-25` | `test_backtest_simulation_execution` (`test_backtest.py`) | **VERIFIED** |
| **`FR-29`** (Adopt backtested proposal into Policy v1.1)| `FN-BKT-03` | `policy_version`, `rule` | `API-26` (`POST /proposals/{id}/adopt`) | `SCR-08` | `TSK-M1-26` | `test_adopt_proposal_policy_v1_1` (`test_gov_api.py`) | **VERIFIED** |
| **`FR-30`** (Live AI Disclosure Panel telemetry logging)| `FN-DIS-01, 02` | `ai_service_call` | `API-27` (`/transparency/disclosure`)| `SCR-09` | `TSK-M1-27` | `test_ai_disclosure_telemetry_logging` (`test_transparency.py`)| **VERIFIED** |
| **`FR-31`** (Comparative offline evaluation benchmark) | `FN-EVL-01, 02` | `eval_case`, `eval_run` | CLI (`make eval`) | Pitch / CLI | `TSK-M1-29` | `test_comparative_eval_harness` (`test_eval_runner.py`) | **VERIFIED** |

---

## 3. Gap Analysis & Submission Notes: Explicitly Unbuilt Requirements in Milestone 1

In strict adherence to Review Condition 4, all functional requirements not built in Milestone 1 are declared as **NOT BUILT** in the official submission notes and scheduled for subsequent milestones:

| Requirement ID | Requirement Name & Scope | Reason for Milestone 1 Deferral | Scheduled Delivery | Mitigating Implementation in M1 |
|:---|:---|:---|:---:|:---|
| **`FR-13`** | Image palette, contrast, and logo compliance | Computer vision and image bounding box analysis require specialized libraries (OpenCV / Pillow) that exceed M1 sprint capacity. | Milestone 3 | Deterministic text contrast guidelines are fully implemented and tested under `FR-09`. |
| **`FR-14`** | Payload redaction & sensitive data masking | External redaction proxy introduces architectural dependencies; in M1, prompts are constructed strictly from validated, non-PII marketing text. | Milestone 2 | LLM adapter isolates model calls and logs sanitized prompts to `ai_service_call`. |
| **`FR-21`** | Threaded collaboration comments on findings | Threaded messaging and notification cascades are secondary collaboration features not required for the core verification loop. | Milestone 2 | Reviewer overrides with mandatory reason codes and justifications (`FR-19`) are fully implemented and immutably audited. |
| **`FR-24`** | Export compliance audit trail as formatted PDF | Binary PDF generation via Weasyprint / ReportLab introduces heavy headless browser or rendering dependencies. | Milestone 2 | Audit log data is queryable via API (`API-28`) and exportable in standard machine-readable JSON/CSV formats in M1. |

---

## 4. Traceability Integrity Sign-Off

- **Total Functional Requirements:** 31 (`FR-01` to `FR-31`).
- **Verified with Dedicated Automated Tests in M1:** 27 requirements (87.1%).
- **Explicitly Declared as NOT BUILT in Submission Notes:** 4 requirements (`FR-13`, `FR-14`, `FR-21`, `FR-24`).
- **Catch-All Test Reuse (`TST-09`):** 0 instances. Every implemented FR has an independent, dedicated test function.
- **Traceability Verification:** PASS.
