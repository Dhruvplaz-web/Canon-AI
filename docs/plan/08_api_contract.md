# Canon: REST API Specification & Contract (08_api_contract.md)

**Document ID:** `DOC-08`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [ARCH, Sec 5.5, 12] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [STD, Sec 5.5] `file:///E:/Software/codex/Docuements/Canon%20AI%20Rules%20and%20Engineering%20Standards.pdf`, [TB-BRIEF, Sec 4] `file:///E:/Software/codex/Docuements/Canon_Role_Brief_Tanishka_Bellale_FINAL.pdf`, [DHRUV-V3, Sec 8] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. API Architecture Conventions & Error Envelope

- **Base URL:** `/api/v1`
- **Protocol:** HTTPS, JSON request/response bodies, UTF-8 character encoding.
- **Session Transport:** Handled via `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie named `access_token`. No client JavaScript access to tokens.
- **Idempotency:** State-changing `POST` operations accept an optional `Idempotency-Key: UUID` header to prevent duplicate check runs or approvals.
- **First Build Deliverable [DHRUV-V3, Sec 8]:** Prior to writing frontend components or backend business logic in Milestone 1, Dhruv Patil delivers the complete, generated OpenAPI 3.1 specification (`docs/api/openapi.json`) alongside typed mock JSON fixtures, allowing Tanishka Bellale to begin frontend screen development in parallel on Day 1.

### 1.1 Single Standardized Error Shape
- **FACT [STD, Sec 5.5.3; TASK, P1-T15]:** Every error returned by Canon conforms to a unified envelope. Raw Python stack traces, database exceptions, or unhandled errors are strictly intercepted and sanitized before transmission.

```json
{
  "error": {
    "code": "REASON_CODE_REQUIRED",
    "message": "Overriding a policy finding requires a valid reason code and justification note.",
    "details": {
      "finding_id": "8f9b2c3d-0000-0000-0000-000000000000",
      "allowed_reason_codes": [
        "APPROVED_CAMPAIGN_EXCEPTION",
        "CONTEXT_MISUNDERSTOOD",
        "OUTDATED_RULE",
        "ENTERPRISE_CLIENT_EXCEPTION"
      ]
    }
  }
}
```

---

## 2. Master Endpoint Inventory & Contract

Legend:  
- **`[M1]`**: Included in Milestone 1 / Hackathon Vertical Slice.  
- **`[M2]`**: Milestone 2 / Beta Platform Expansion.  
- **`[M3]`**: Milestone 3 / Enterprise Hardening.  

---

### 2.1 Authentication & Session (`/api/v1/auth`)

#### API-01: User Login & Session Cookie [M1]
- **Method & Path:** `POST /api/v1/auth/login`
- **Role Requirement:** Public (Unauthenticated)
- **Request Body:**
  ```json
  {
    "email": "brand_manager@acme.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):** Sets `Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Path=/; Secure`.
- **Token Storage Rule:** Tokens reside exclusively in `httpOnly` secure cookies. Fallback to `localStorage` or `sessionStorage` is strictly prohibited and removed.
  ```json
  {
    "user": {
      "id": "u1a2b3c4-0000-0000-0000-000000000000",
      "workspace_id": "w1a2b3c4-0000-0000-0000-000000000000",
      "email": "brand_manager@acme.com",
      "full_name": "Sarah Connor",
      "role": "brand_manager"
    }
  }
  ```
- **Errors:** `401 UNAUTHORIZED (INVALID_CREDENTIALS)`

#### API-02: Get Current Authenticated Profile [M1]
- **Method & Path:** `GET /api/v1/auth/me`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):** User profile object identical to `API-01`.
- **Errors:** `401 UNAUTHORIZED (SESSION_EXPIRED)`

#### API-03: User Logout [M1]
- **Method & Path:** `POST /api/v1/auth/logout`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):** Sets `Set-Cookie: access_token=; Max-Age=0; Path=/`
  ```json
  { "status": "logged_out" }
  ```

---

### 2.2 Policy Knowledge & Rule Management (`/api/v1/policy`)

#### API-04: Upload Policy Source Document [M1]
- **Method & Path:** `POST /api/v1/policy/sources`
- **Role Requirement:** `brand_manager`, `it_admin`
- **M1 Implementation Scope:** In Milestone 1, policy source text is ingested via structured `rules.json` (containing stored guideline source text and quotes) or plain text upload (`application/json` or `text/plain`). Complex binary PDF/PyMuPDF coordinate parsing and 24-page PDF extraction are removed from M1 and deferred to M2.
- **Request Body (JSON / Multipart):**
  ```json
  {
    "title": "Acme Fintech Brand Guidelines 2026",
    "document_type": "GUIDELINE",
    "source_text": "Official guideline text...",
    "rules_seed": [ ... ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "s1a2b3c4-0000-0000-0000-000000000000",
    "title": "Acme Fintech Brand Guidelines 2026",
    "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "rule_count": 12,
    "status": "PARSED"
  }
  ```
- **Errors:** `400 BAD_REQUEST (INVALID_FILE_TYPE)`, `413 PAYLOAD_TOO_LARGE`

#### API-05: Compile & Propose Candidate Rules [M1]
- **Method & Path:** `POST /api/v1/policy/sources/{source_document_id}/compile`
- **Role Requirement:** `brand_manager`
- **Response (200 OK):**
  ```json
  {
    "job_id": "j1a2b3c4-0000-0000-0000-000000000000",
    "proposals_count": 14,
    "candidate_rules": [
      {
        "id": "r1a2b3c4-0000-0000-0000-000000000000",
        "rule_code": "TERM-001",
        "rule_type": "FORBIDDEN_TERM",
        "severity": "CRITICAL",
        "rule_text": "Always write 'Acme Cloud' with a space. Never write 'AcmeCloud'.",
        "source_quote": "Our flagship product is Acme Cloud. Never concatenate as AcmeCloud.",
        "page_number": 4,
        "status": "DRAFT"
      }
    ]
  }
  ```

#### API-06: Adjudicate Candidate Rule [M1]
- **Method & Path:** `PATCH /api/v1/policy/rules/{id}`
- **Role Requirement:** `brand_manager`, `approver`
- **Request Body:**
  ```json
  {
    "status": "APPROVED",
    "rule_code": "TERM-001",
    "rule_type": "FORBIDDEN_TERM",
    "severity": "CRITICAL",
    "rule_text": "Always write 'Acme Cloud' with a space. Never write 'AcmeCloud'.",
    "scope_filters": { "department": "All" }
  }
  ```
- **Response (200 OK):** Updated Rule Object with `approved_by` set to authenticated user ID.
- **Errors:** `400 BAD_REQUEST (MISSING_REQUIRED_FIELDS)`, `403 FORBIDDEN`

#### API-07: Publish Policy Version [M1]
- **Method & Path:** `POST /api/v1/policy/versions`
- **Role Requirement:** `brand_manager`, `approver`
- **Request Body:**
  ```json
  {
    "version_tag": "v1.0",
    "changelog_summary": "Initial baseline brand policy compiled from official PDF guidelines."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "p1a2b3c4-0000-0000-0000-000000000000",
    "version_tag": "v1.0",
    "is_active": true,
    "approved_rules_count": 12,
    "published_at": "2026-10-25T14:30:00Z"
  }
  ```
- **Errors:** `400 BAD_REQUEST (EMPTY_POLICY)`, `409 CONFLICT (VERSION_TAG_EXISTS)`

#### API-08: List Policy Rules [M1]
- **Method & Path:** `GET /api/v1/policy/rules`
- **Role Requirement:** Any authenticated role
- **Query Parameters:** `status=APPROVED|DRAFT`, `version_id=UUID`, `page=1`, `page_size=50`
- **Response (200 OK):**
  ```json
  {
    "total": 12,
    "page": 1,
    "rules": [ ... ]
  }
  ```

---

### 2.3 Approved Claims Ledger (`/api/v1/claims`)

#### API-09: List Approved Claims [M1]
- **Method & Path:** `GET /api/v1/claims`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):** List of claims with `claim_text`, `claim_category`, `valid_from`, `valid_until`, `source_locator`.

#### API-10: Create or Update Claim [M2]
- **Method & Path:** `POST /api/v1/claims`
- **Role Requirement:** `approver`, `brand_manager`
- **Request Body:**
  ```json
  {
    "claim_text": "Delivers 99.9% availability backed by SLA.",
    "claim_category": "PRODUCT_CAPABILITY",
    "valid_from": "2026-01-01",
    "valid_until": "2026-12-31",
    "source_locator": "Infrastructure Whitepaper, Section 3, p. 12"
  }
  ```
- **Response (201 Created):** Claim Object.

---

### 2.4 Submissions & Revisions (`/api/v1/submissions`)

#### API-11: Create Content Submission Draft [M1]
- **Method & Path:** `POST /api/v1/submissions`
- **Role Requirement:** `creator`, `reviewer`, `brand_manager`, `agency`
- **Request Body:**
  ```json
  {
    "title": "Q4 Enterprise Marketing Announcement",
    "campaign_tag": "Q4_Launch",
    "submission_type": "PLAIN_TEXT",
    "raw_text": "AcmeCloud guarantees 100% uptime with zero processing fees on all international transactions."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "submission_id": "s1a2b3c4-0000-0000-0000-000000000000",
    "version_id": "v1a2b3c4-0000-0000-0000-000000000000",
    "version_number": 1,
    "current_status": "DRAFT"
  }
  ```

#### API-12: List Workspace Submissions [M1]
- **Method & Path:** `GET /api/v1/submissions`
- **Role Requirement:** Any authenticated role
- **Query Parameters:** `status=PENDING_REVIEW|APPROVED`, `author_id=UUID`, `page=1`, `page_size=20`
- **Response (200 OK):** Paginated list of submissions with author details and findings counts.

#### API-13: Get Submission Details & Version History [M1]
- **Method & Path:** `GET /api/v1/submissions/{id}`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):** Detailed submission container including full `versions` array, active version text, and current workflow status.

#### API-14: Upload Resubmission Revision [M1]
- **Method & Path:** `POST /api/v1/submissions/{id}/versions`
- **Role Requirement:** Author of submission, `reviewer`, `brand_manager`
- **Request Body:**
  ```json
  {
    "raw_text": "Acme Cloud delivers 99.9% SLA uptime with zero hidden fees on international wire transactions.",
    "change_notes": "Resolved terminology flag and corrected SLA uptime claim."
  }
  ```
- **Response (201 Created):** Returns new `version_id` with incremented `version_number = 2`.

---

### 2.5 Verification Pipeline & Job Execution (`/api/v1/...`)

#### API-15: Trigger Verification Check Run [M1]
- **Method & Path:** `POST /api/v1/submissions/{id}/versions/{version_id}/check`
- **Role Requirement:** Submitter, `reviewer`, `brand_manager`
- **Response (202 Accepted):**
  ```json
  {
    "job_id": "j1a2b3c4-0000-0000-0000-000000000000",
    "check_run_id": "c1a2b3c4-0000-0000-0000-000000000000",
    "status": "QUEUED"
  }
  ```

#### API-16: Poll Job Status [M1]
- **Method & Path:** `GET /api/v1/jobs/{id}`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):**
  ```json
  {
    "job_id": "j1a2b3c4-0000-0000-0000-000000000000",
    "job_type": "CHECK_RUN",
    "status": "COMPLETED",
    "progress_percent": 100,
    "completed_at": "2026-10-25T14:35:03Z"
  }
  ```

#### API-17: Get Findings with Double-Receipt Evidence [M1]
- **Method & Path:** `GET /api/v1/submissions/{id}/findings`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):**
  ```json
  {
    "check_run_id": "c1a2b3c4-0000-0000-0000-000000000000",
    "total_findings": 2,
    "findings": [
      {
        "id": "f1a2b3c4-0000-0000-0000-000000000000",
        "rule_code": "TERM-001",
        "category": "TERMINOLOGY",
        "severity": "CRITICAL",
        "flagged_quote": "AcmeCloud",
        "start_offset": 0,
        "end_offset": 9,
        "source_document_title": "Acme Brand Guidelines 2026",
        "source_page": 4,
        "source_quote": "Our flagship product is Acme Cloud. Never concatenate as AcmeCloud.",
        "confidence_score": 1.0,
        "verification_status": "VERIFIED",
        "review_status": "OPEN",
        "suggested_fix": "Acme Cloud"
      }
    ]
  }
  ```

---

### 2.6 Human Review, Overrides & Decisions (`/api/v1/...`)

#### API-18: Adjudicate Finding (Accept / Reject / Edit) [M1]
- **Method & Path:** `POST /api/v1/findings/{id}/decision`
- **Role Requirement:** `reviewer`, `brand_manager`, `approver`
- **Request Body:**
  ```json
  {
    "action": "ACCEPT",
    "comment": "Agreed, author should apply suggested fix."
  }
  ```
- **Response (200 OK):** Updated decision record.

#### API-19: Override Finding with Reason Code [M1]
- **Method & Path:** `POST /api/v1/findings/{id}/override`
- **Role Requirement:** `reviewer`, `brand_manager`, `approver`
- **Request Body:**
  ```json
  {
    "reason_code": "APPROVED_CAMPAIGN_EXCEPTION",
    "justification_note": "VP Marketing authorized relaxed conversational tone for this promotional video script."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "finding_id": "f1a2b3c4-0000-0000-0000-000000000000",
    "review_status": "OVERRIDDEN",
    "decision_id": "d1a2b3c4-0000-0000-0000-000000000000"
  }
  ```
- **Errors:** `400 BAD_REQUEST (REASON_CODE_REQUIRED)`

#### API-20: Lodge Creator Finding Dispute [M1]
- **Method & Path:** `POST /api/v1/findings/{id}/dispute`
- **Role Requirement:** Author of submission (`creator`, `agency`)
- **Request Body:**
  ```json
  {
    "reason_code": "CONTEXT_IGNORED",
    "argument": "This sentence is quoting a third-party customer testimonial verbatim."
  }
  ```
- **Response (201 Created):** Dispute record with `status = OPEN`.

#### API-21: Sign-off Submission [M1]
- **Method & Path:** `POST /api/v1/submissions/{id}/approve`
- **Role Requirement:** `approver`, `brand_manager`
- **Request Body:**
  ```json
  {
    "version_id": "v1a2b3c4-0000-0000-0000-000000000000",
    "notes": "All compliance claims verified; approved for public syndication."
  }
  ```
- **Response (200 OK):** Approval Object; submission transitions to `APPROVED`.
- **Errors:** `409 CONFLICT (UNRESOLVED_CRITICAL_FINDINGS)`

#### API-22: Send Back Submission [M1]
- **Method & Path:** `POST /api/v1/submissions/{id}/send-back`
- **Role Requirement:** `reviewer`, `approver`, `brand_manager`
- **Request Body:**
  ```json
  {
    "version_id": "v1a2b3c4-0000-0000-0000-000000000000",
    "send_back_notes": "Please correct the unapproved zero-fee claim and resubmit version 2."
  }
  ```
- **Response (200 OK):** Submission transitions to `SENT_BACK`.

---

### 2.7 Governance, Rule Health & Backtest (`/api/v1/governance`)

#### API-23: Get Rule Health Snapshot [M1 - Seeded / M2 - Live]
- **Method & Path:** `GET /api/v1/governance/health`
- **Role Requirement:** `brand_manager`, `approver`, `it_admin`, `exec`
- **Query Parameters:** `min_sample_size=5`
- **Response (200 OK):**
  ```json
  {
    "rules": [
      {
        "rule_code": "TERM-007",
        "rule_text": "Never use informal colloquialisms in public communications.",
        "times_flagged": 37,
        "times_overridden": 14,
        "override_rate": 0.378,
        "top_reason_codes": [
          { "code": "APPROVED_CAMPAIGN_EXCEPTION", "count": 12 },
          { "code": "CONTEXT_MISUNDERSTOOD", "count": 2 }
        ],
        "diagnostic_state": "SCOPE_MISMATCH",
        "is_demo_data": true
      }
    ]
  }
  ```

#### API-24: Generate Rule Change Proposal [M1]
- **Demo Note (Review Condition 7):** For the Milestone 1 evaluation walkthrough, the proposal is a pre-seeded deterministic draft (`PROP-01`) to ensure 100% reproducible judging without model variance.
- **Method & Path:** `POST /api/v1/governance/proposals`
- **Role Requirement:** `brand_manager`
- **Request Body:**
  ```json
  {
    "rule_code": "TERM-007",
    "target_diagnosis": "SCOPE_MISMATCH"
  }
  ```
- **Response (201 Created):** Returns proposed rule diff adding scope exception for Social Media.

#### API-25: Execute Backtest Simulation [M1]
- **Method & Path:** `POST /api/v1/governance/proposals/{id}/backtest`
- **Role Requirement:** `brand_manager`
- **Response (200 OK):**
  ```json
  {
    "backtest_run_id": "b1a2b3c4-0000-0000-0000-000000000000",
    "submissions_replayed": 142,
    "findings_eliminated": 14,
    "newly_flagged_findings": 0,
    "critical_regressions": 0,
    "execution_duration_ms": 1240
  }
  ```

#### API-26: Adopt Backtested Proposal into New Policy Version [M1]
- **Method & Path:** `POST /api/v1/governance/proposals/{id}/adopt`
- **Role Requirement:** `brand_manager`, `approver`
- **Human Approval Contract (Review Condition 2):** Policy `v1.1` is created and activated strictly upon explicit human Brand Manager approval; no automated compilation or activation occurs.
- **Response (200 OK):** Seals and promotes Policy `v1.1` to ACTIVE status; archives superseded rule; emits immutable release event to `audit_log`.

---

### 2.8 Transparency & Audit (`/api/v1/...`)

#### API-27: Get Live AI Disclosure Telemetry [M1]
- **Method & Path:** `GET /api/v1/transparency/disclosure`
- **Role Requirement:** Any authenticated role
- **Response (200 OK):**
  ```json
  {
    "active_provider": "Mistral AI (Behind Adapter)",
    "active_model": "mistral-large-latest",
    "hosting_mode": "HOSTED_CLOUD",
    "data_retention_policy": "Provider retention verified under VER-11; no customer data stored beyond operational limits.",
    "total_calls_24h": 48,
    "average_latency_ms": 842.5,
    "recent_calls": [
      {
        "timestamp": "2026-10-25T14:35:02Z",
        "model_name": "mistral-large-latest",
        "tokens": 480,
        "redacted": false
      }
    ]
  }
  ```

#### API-28: Query Append-Only Audit Log [M1]
- **Method & Path:** `GET /api/v1/audit-log`
- **Role Requirement:** `approver`, `brand_manager`, `it_admin`
- **Query Parameters:** `page=1`, `page_size=50`, `entity_type=rule|submission`
- **Response (200 OK):** Deterministic paginated array of immutable audit events.

---

## 3. Milestone 1 API Subset Verification

- **FACT [Project Framing; DHRUV-V3, Sec 8]:** Milestone 1 activates exactly **18 of the 28 endpoints** (marked `[M1]` above).
- **SUBSET FIDELITY CONFIRMATION:**  
  All 18 Milestone 1 endpoints maintain full request/response schema identity with the target specification. In Milestone 2, remaining endpoints (Claims management, automated backtest simulation, PDF export) are introduced without mutating existing route signatures or response shapes.
