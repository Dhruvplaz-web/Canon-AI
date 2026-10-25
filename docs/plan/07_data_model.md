# Canon: Relational Data Model & Schema Specification (07_data_model.md)

**Document ID:** `DOC-07`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [TASK, P1-T01 to P1-T06] `file:///E:/Software/codex/Docuements/Canon%20Phased%20Project%20Task%20Document.pdf`, [ARCH, Sec 8] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [DHRUV-V3, Sec 5, R1-BE3] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Entity-Relationship Architecture Overview

Canon organizes all enterprise governance, submissions, and telemetry into **26 Relational Tables across 7 Functional Groups**.

```
+----------------------------------------------------------------------------------------------------+
|                                    ENTITY RELATIONSHIP OVERVIEW                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    [workspace] (Top-Level Tenant Boundary)                                                         |
|         |                                                                                          |
|         +---> [user] (RBAC Roles: creator, reviewer, approver, brand_manager, it_admin)            |
|         |                                                                                          |
|         +---> TRUSTED GOVERNANCE LANE                                                              |
|         |     [source_document] ---> [policy_version] (Immutable Snapshot)                         |
|         |                                   |                                                      |
|         |                                   +---> [rule] (Stable rule_code across versions)        |
|         |                                   +---> [approved_claim] (valid_from / valid_until)      |
|         |                                   +---> [term] & [brand_asset]                           |
|         |                                                                                          |
|         +---> CONTENT SUBMISSION LANE                                                              |
|         |     [submission] ---> [submission_version] (Immutable Content Snapshot)                  |
|         |                              |                                                           |
|         +---> CHECK RUN & FINDINGS     v                                                           |
|         |     [check_run] (Pins Policy ID & Model)                                                 |
|         |          |                                                                               |
|         |          +---> [finding] (Double Receipt: flagged span + source quote)                   |
|         |                     |                                                                    |
|         |                     +---> [decision] (Human Override requires reason_code)               |
|         |                     +---> [dispute] (Creator Contest)                                    |
|         |                     +---> [comment]                                                      |
|         |                                                                                          |
|         +---> GOVERNANCE INTELLIGENCE                                                              |
|         |     [rule_health_snapshot] (Aggregated overrides per rule_code)                          |
|         |          |                                                                               |
|         |          +---> [rule_change_proposal] ---> [backtest_run] ---> [backtest_result]         |
|         |                                                                                          |
|         +---> TRANSPARENCY, AUDIT & JOBS                                                           |
|               [audit_log] (Immutable Append-Only; REVOKE UPDATE/DELETE)                            |
|               [ai_service_call] (Model Telemetry for Disclosure Panel)                             |
|               [job] (In-Process Execution State)                                                   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Full Relational Entity Model (26 Tables in 7 Groups)

---

### Group 1: Tenancy & Identity (ENT-01 to ENT-02)

#### 1. `workspace` (Tenant Boundary)
- **Table Name:** `workspace`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `name`: `VARCHAR(255) NOT NULL`
  - `slug`: `VARCHAR(100) UNIQUE NOT NULL`
  - `settings`: `JSONB NOT NULL DEFAULT '{}'::jsonb` (contains `ai_mode`, `default_locale`, `min_sample_size`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
  - `updated_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:** `UNIQUE(slug)`
- **Indexes:** `idx_workspace_slug ON workspace(slug)`

#### 2. `user` (Tenant Member & Identity)
- **Table Name:** `user`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE RESTRICT`
  - `email`: `VARCHAR(255) NOT NULL`
  - `password_hash`: `VARCHAR(255) NOT NULL` (Argon2id format)
  - `full_name`: `VARCHAR(255) NOT NULL`
  - `role`: `VARCHAR(50) NOT NULL` (Enum: `creator`, `reviewer`, `approver`, `brand_manager`, `agency`, `it_admin`, `exec`)
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
  - `updated_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:** `UNIQUE(workspace_id, email)`
- **Indexes:** `idx_user_workspace_email ON user(workspace_id, email)`, `idx_user_role ON user(workspace_id, role)`

---

### Group 2: Trusted Governance Policy (ENT-03 to ENT-08)

#### 3. `source_document` (Brand Guidelines & Manuals)
- **Table Name:** `source_document`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `title`: `VARCHAR(255) NOT NULL`
  - `document_type`: `VARCHAR(50) NOT NULL` (Enum: `GUIDELINE`, `CLAIMS_LIST`, `TERMINOLOGY`, `ASSET_SPEC`)
  - `storage_path`: `VARCHAR(512) NOT NULL`
  - `content_hash`: `VARCHAR(64) NOT NULL` (SHA-256)
  - `page_count`: `INTEGER NOT NULL DEFAULT 1`
  - `extracted_text`: `TEXT NOT NULL`
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'PARSED'` (Enum: `UPLOADED`, `PARSED`, `FAILED`)
  - `uploaded_by`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:** `UNIQUE(workspace_id, content_hash)`
- **Indexes:** `idx_source_doc_workspace ON source_document(workspace_id)`

#### 4. `policy_version` (Immutable Policy Release)
- **Table Name:** `policy_version`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `parent_version_id`: `UUID REFERENCES policy_version(id) ON DELETE SET NULL`
  - `version_tag`: `VARCHAR(50) NOT NULL` (e.g., `'v1.0'`, `'v1.1'`)
  - `changelog_summary`: `TEXT NOT NULL`
  - `is_active`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `approved_by`: `UUID REFERENCES user(id) ON DELETE RESTRICT`
  - `published_at`: `TIMESTAMP WITH TIME ZONE`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:**  
  - `UNIQUE(workspace_id, version_tag)`
  - `CHECK (is_active = FALSE OR (is_active = TRUE AND approved_by IS NOT NULL))` (`BR-POL-09`)
- **Indexes:** `idx_policy_version_active ON policy_version(workspace_id, is_active)`

#### 5. `rule` (Executable Policy Rule)
- **Table Name:** `rule`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `policy_version_id`: `UUID NOT NULL REFERENCES policy_version(id) ON DELETE CASCADE`
  - `source_document_id`: `UUID NOT NULL REFERENCES source_document(id) ON DELETE RESTRICT`
  - `rule_code`: `VARCHAR(50) NOT NULL` (e.g., `'TERM-001'`; stable across versions)
  - `rule_type`: `VARCHAR(50) NOT NULL` (Enum: `FORBIDDEN_TERM`, `REQUIRED_TERM`, `NEAR_MISS`, `CLAIM_ASSERTION`, `NUMBER_UNIT_MATCH`, `TONE_VOICE`, `CONTRAST`, `ALT_TEXT`)
  - `severity`: `VARCHAR(50) NOT NULL` (Enum: `CRITICAL`, `MAJOR`, `MINOR`)
  - `rule_text`: `TEXT NOT NULL`
  - `source_quote`: `TEXT NOT NULL`
  - `page_number`: `INTEGER NOT NULL DEFAULT 1`
  - `scope_filters`: `JSONB NOT NULL DEFAULT '{}'::jsonb` (e.g., `{"department": "Sales"}`)
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'DRAFT'` (Enum: `DRAFT`, `APPROVED`, `REJECTED`, `ARCHIVED`)
  - `approved_by`: `UUID REFERENCES user(id) ON DELETE RESTRICT`
  - `embedding`: `vector(384)` (bge-small-en-v1.5 embedding of `rule_text`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:**  
  - `CHECK (status != 'APPROVED' OR (status = 'APPROVED' AND approved_by IS NOT NULL))` (`BR-POL-06`)
- **Indexes:**  
  - `idx_rule_workspace_code ON rule(workspace_id, rule_code)`
  - `idx_rule_policy_version ON rule(policy_version_id)`
  - `idx_rule_embedding ON rule USING hnsw (embedding vector_cosine_ops)`

#### 6. `approved_claim` (Verified Factual Claims Ledger)
- **Table Name:** `approved_claim`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `claim_text`: `TEXT NOT NULL`
  - `claim_category`: `VARCHAR(50) NOT NULL` (Enum: `PRICING`, `METRIC`, `PRODUCT_CAPABILITY`, `PARTNERSHIP`, `LEGAL`)
  - `valid_from`: `DATE NOT NULL`
  - `valid_until`: `DATE` (Nullable; if null, indefinitely valid)
  - `source_document_id`: `UUID REFERENCES source_document(id) ON DELETE SET NULL`
  - `source_locator`: `VARCHAR(255) NOT NULL` (e.g., `'Section 4.2, p. 18'`)
  - `embedding`: `vector(384)`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:** `CHECK (valid_until IS NULL OR valid_until >= valid_from)` (`BR-POL-11`)
- **Indexes:** `idx_claim_workspace ON approved_claim(workspace_id)`, `idx_claim_validity ON approved_claim(workspace_id, valid_until)`

#### 7. `term` (Approved Terminology & Prohibited Variants)
- **Table Name:** `term`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `preferred_term`: `VARCHAR(255) NOT NULL`
  - `prohibited_variants`: `JSONB NOT NULL DEFAULT '[]'::jsonb` (e.g., `["AcmeCloud", "Acme-Cloud"]`)
  - `case_sensitive`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `context_scope`: `VARCHAR(100)`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_term_workspace ON term(workspace_id)`

#### 8. `brand_asset` (Approved Logos & Color Palette Specs)
- **Table Name:** `brand_asset`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `asset_name`: `VARCHAR(255) NOT NULL`
  - `asset_type`: `VARCHAR(50) NOT NULL` (Enum: `LOGO_TEMPLATE`, `COLOR_PALETTE`, `FONT_SPEC`)
  - `properties`: `JSONB NOT NULL` (e.g., `{"hex": "#0F172A", "min_width_px": 120}`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_asset_workspace ON brand_asset(workspace_id)`

---

### Group 3: Content Submissions & Versioning (ENT-09 to ENT-10)

#### 9. `submission` (Content Container)
- **Table Name:** `submission`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `title`: `VARCHAR(255) NOT NULL`
  - `campaign_tag`: `VARCHAR(100)`
  - `author_id`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `assigned_reviewer_id`: `UUID REFERENCES user(id) ON DELETE SET NULL`
  - `current_status`: `VARCHAR(50) NOT NULL DEFAULT 'DRAFT'` (Enum: `DRAFT`, `CHECKING`, `CLEAN`, `PENDING_REVIEW`, `SENT_BACK`, `APPROVED`, `ARCHIVED`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
  - `updated_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_submission_workspace_status ON submission(workspace_id, current_status)`, `idx_submission_author ON submission(author_id)`

#### 10. `submission_version` (Immutable Content Revision)
- **Table Name:** `submission_version`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `submission_id`: `UUID NOT NULL REFERENCES submission(id) ON DELETE CASCADE`
  - `version_number`: `INTEGER NOT NULL DEFAULT 1`
  - `submission_type`: `VARCHAR(50) NOT NULL` (Enum: `PLAIN_TEXT`, `DOCX`, `PDF`)
  - `raw_content`: `TEXT NOT NULL`
  - `normalized_content`: `TEXT NOT NULL`
  - `content_hash`: `VARCHAR(64) NOT NULL` (SHA-256)
  - `offset_map`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
  - `created_by`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:** `UNIQUE(submission_id, version_number)`
- **Indexes:** `idx_sub_version_submission ON submission_version(submission_id)`

---

### Group 4: Checking, Findings & Decisions (ENT-11 to ENT-17)

#### 11. `check_run` (Execution Instance)
- **Table Name:** `check_run`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `submission_version_id`: `UUID NOT NULL REFERENCES submission_version(id) ON DELETE CASCADE`
  - `policy_version_id`: `UUID NOT NULL REFERENCES policy_version(id) ON DELETE RESTRICT`
  - `pipeline_version`: `VARCHAR(50) NOT NULL` (e.g., `'v1.0.0'`)
  - `model_name`: `VARCHAR(100) NOT NULL`
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'QUEUED'` (Enum: `QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`)
  - `duration_ms`: `INTEGER`
  - `critical_findings_count`: `INTEGER NOT NULL DEFAULT 0`
  - `major_findings_count`: `INTEGER NOT NULL DEFAULT 0`
  - `minor_findings_count`: `INTEGER NOT NULL DEFAULT 0`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_check_run_version ON check_run(submission_version_id)`

#### 12. `finding` (Double-Receipt Violation Card)
- **Table Name:** `finding`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `check_run_id`: `UUID NOT NULL REFERENCES check_run(id) ON DELETE CASCADE`
  - `rule_id`: `UUID NOT NULL REFERENCES rule(id) ON DELETE RESTRICT`
  - `category`: `VARCHAR(50) NOT NULL` (Enum: `TERMINOLOGY`, `CLAIM`, `TONE`, `ACCESSIBILITY`, `VISUAL`, `INJECTION`)
  - `severity`: `VARCHAR(50) NOT NULL` (Enum: `CRITICAL`, `MAJOR`, `MINOR`)
  - `flagged_quote`: `TEXT NOT NULL`
  - `start_offset`: `INTEGER NOT NULL`
  - `end_offset`: `INTEGER NOT NULL`
  - `source_quote`: `TEXT NOT NULL`
  - `source_locator`: `VARCHAR(255) NOT NULL`
  - `confidence_score`: `FLOAT NOT NULL DEFAULT 1.0`
  - `verification_status`: `VARCHAR(50) NOT NULL DEFAULT 'VERIFIED'` (Enum: `CANDIDATE`, `VERIFIED`, `UNVERIFIED`, `DROPPED`)
  - `review_status`: `VARCHAR(50) NOT NULL DEFAULT 'OPEN'` (Enum: `OPEN`, `ACCEPTED`, `REJECTED`, `EDITED`, `OVERRIDDEN`, `DISPUTED`)
  - `suggested_fix`: `TEXT`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:**  
  - `CHECK (verification_status IN ('CANDIDATE', 'VERIFIED', 'UNVERIFIED', 'DROPPED'))`
  - `CHECK (start_offset >= 0 AND end_offset >= start_offset)`
- **Indexes:**  
  - `idx_finding_check_run ON finding(check_run_id)`
  - `idx_finding_verification ON finding(verification_status, review_status)`

#### 13. `decision` (Human Adjudication & Override)
- **Table Name:** `decision`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `finding_id`: `UUID NOT NULL REFERENCES finding(id) ON DELETE CASCADE`
  - `decided_by`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `action`: `VARCHAR(50) NOT NULL` (Enum: `ACCEPT`, `REJECT`, `EDIT`, `OVERRIDE`)
  - `reason_code`: `VARCHAR(100)` (Required if `action = 'OVERRIDE'`)
  - `justification_note`: `TEXT`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:**  
  - `CHECK (action != 'OVERRIDE' OR (action = 'OVERRIDE' AND reason_code IS NOT NULL AND justification_note IS NOT NULL))` (`BR-REV-02`)
- **Indexes:** `idx_decision_finding ON decision(finding_id)`

#### 14. `dispute` (Creator Contest of Finding)
- **Table Name:** `dispute`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `finding_id`: `UUID NOT NULL REFERENCES finding(id) ON DELETE CASCADE`
  - `creator_id`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `reason_code`: `VARCHAR(100) NOT NULL` (Enum: `FALSE_POSITIVE`, `CONTEXT_IGNORED`, `APPROVED_BY_DIRECTOR`)
  - `argument`: `TEXT NOT NULL`
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'OPEN'` (Enum: `OPEN`, `RESOLVED`, `DISMISSED`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_dispute_finding ON dispute(finding_id)`

#### 15. `reason_code` (Standardized Taxonomy)
- **Table Name:** `reason_code`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `code`: `VARCHAR(100) NOT NULL` (e.g., `'APPROVED_CAMPAIGN_EXCEPTION'`)
  - `description`: `VARCHAR(255) NOT NULL`
  - `category`: `VARCHAR(50) NOT NULL` (Enum: `EXCEPTION`, `DEFECTIVE_RULE`, `CONTEXT_SPECIFIC`)
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- **Constraints:** `UNIQUE(workspace_id, code)`
- **Indexes:** `idx_reason_code_workspace ON reason_code(workspace_id, code)`

#### 16. `comment` (Threaded Collaboration)
- **Table Name:** `comment`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `submission_id`: `UUID NOT NULL REFERENCES submission(id) ON DELETE CASCADE`
  - `finding_id`: `UUID REFERENCES finding(id) ON DELETE SET NULL`
  - `author_id`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `comment_text`: `TEXT NOT NULL`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_comment_submission ON comment(submission_id)`

#### 17. `approval` (Formal Sign-off Certificate)
- **Table Name:** `approval`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `submission_id`: `UUID NOT NULL REFERENCES submission(id) ON DELETE CASCADE`
  - `submission_version_id`: `UUID NOT NULL REFERENCES submission_version(id) ON DELETE CASCADE`
  - `approved_by`: `UUID NOT NULL REFERENCES user(id) ON DELETE RESTRICT`
  - `approval_type`: `VARCHAR(50) NOT NULL DEFAULT 'FINAL_SIGNOFF'` (Enum: `REVIEWER_RECOMMENDATION`, `FINAL_SIGNOFF`)
  - `notes`: `TEXT`
  - `signed_off_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_approval_submission ON approval(submission_id)`

---

### Group 5: Governance & Rule Health (ENT-18 to ENT-21)

#### 18. `rule_health_snapshot` (Continuous Metric Aggregation)
- **Table Name:** `rule_health_snapshot`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `rule_code`: `VARCHAR(50) NOT NULL`
  - `snapshot_date`: `DATE NOT NULL`
  - `times_flagged`: `INTEGER NOT NULL DEFAULT 0`
  - `times_overridden`: `INTEGER NOT NULL DEFAULT 0`
  - `times_disputed`: `INTEGER NOT NULL DEFAULT 0`
  - `override_rate`: `FLOAT NOT NULL DEFAULT 0.0`
  - `top_reason_codes`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
  - `diagnostic_state`: `VARCHAR(50) NOT NULL DEFAULT 'HEALTHY'` (Enum: `HEALTHY`, `NOISY`, `SCOPE_MISMATCH`, `UNCLEAR`, `STALE`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Constraints:** `UNIQUE(workspace_id, rule_code, snapshot_date)`
- **Indexes:** `idx_rule_health_code ON rule_health_snapshot(workspace_id, rule_code)`

#### 19. `rule_change_proposal` (Candidate Rule Diff)
- **Table Name:** `rule_change_proposal`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `rule_code`: `VARCHAR(50) NOT NULL`
  - `original_rule_id`: `UUID REFERENCES rule(id) ON DELETE RESTRICT`
  - `proposed_diff`: `TEXT NOT NULL`
  - `proposed_scope_filters`: `JSONB NOT NULL DEFAULT '{}'::jsonb`
  - `target_diagnosis`: `VARCHAR(50) NOT NULL`
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'DRAFT'` (Enum: `DRAFT`, `BACKTESTING`, `BACKTESTED`, `ADOPTED`, `REJECTED`)
  - `created_by`: `UUID REFERENCES user(id) ON DELETE SET NULL`
  - `adopted_policy_version_id`: `UUID REFERENCES policy_version(id) ON DELETE SET NULL`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_proposal_workspace ON rule_change_proposal(workspace_id, rule_code)`

#### 20. `backtest_run` (Simulation Instance)
- **Table Name:** `backtest_run`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `proposal_id`: `UUID NOT NULL REFERENCES rule_change_proposal(id) ON DELETE CASCADE`
  - `submissions_replayed`: `INTEGER NOT NULL DEFAULT 0`
  - `findings_eliminated`: `INTEGER NOT NULL DEFAULT 0`
  - `newly_flagged_findings`: `INTEGER NOT NULL DEFAULT 0`
  - `critical_regressions`: `INTEGER NOT NULL DEFAULT 0`
  - `execution_duration_ms`: `INTEGER NOT NULL DEFAULT 0`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_backtest_proposal ON backtest_run(proposal_id)`

#### 21. `backtest_result` (Granular Per-Finding Simulation Outcome)
- **Table Name:** `backtest_result`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `backtest_run_id`: `UUID NOT NULL REFERENCES backtest_run(id) ON DELETE CASCADE`
  - `submission_version_id`: `UUID NOT NULL REFERENCES submission_version(id) ON DELETE CASCADE`
  - `original_finding_id`: `UUID REFERENCES finding(id) ON DELETE SET NULL`
  - `simulation_outcome`: `VARCHAR(50) NOT NULL` (Enum: `ELIMINATED`, `PRESERVED`, `NEWLY_INTRODUCED`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_backtest_res_run ON backtest_result(backtest_run_id)`

---

### Group 6: Transparency & Job Orchestration (ENT-22 to ENT-24)

#### 22. `audit_log` (Append-Only System Log)
- **Table Name:** `audit_log`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `actor_user_id`: `UUID REFERENCES user(id) ON DELETE SET NULL`
  - `action`: `VARCHAR(100) NOT NULL` (e.g., `'rule.approved'`, `'submission.signed_off'`)
  - `entity_type`: `VARCHAR(50) NOT NULL` (e.g., `'rule'`, `'finding'`, `'submission'`)
  - `entity_id`: `UUID NOT NULL`
  - `before_state`: `JSONB`
  - `after_state`: `JSONB`
  - `ip_address`: `VARCHAR(45)`
  - `user_agent`: `VARCHAR(255)`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Security Rule [STD, Sec 3.8, 5.4.4]:** Revoke `UPDATE` and `DELETE` privileges from application database role.
- **Indexes:** `idx_audit_workspace_date ON audit_log(workspace_id, created_at DESC)`, `idx_audit_entity ON audit_log(entity_type, entity_id)`

#### 23. `ai_service_call` (Model Disclosure Telemetry)
- **Table Name:** `ai_service_call`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `check_run_id`: `UUID REFERENCES check_run(id) ON DELETE SET NULL`
  - `provider_name`: `VARCHAR(100) NOT NULL`
  - `model_name`: `VARCHAR(100) NOT NULL`
  - `prompt_tokens`: `INTEGER NOT NULL DEFAULT 0`
  - `completion_tokens`: `INTEGER NOT NULL DEFAULT 0`
  - `latency_ms`: `INTEGER NOT NULL DEFAULT 0`
  - `payload_summary`: `VARCHAR(255) NOT NULL` (Structural summary; zero document text or PII)
  - `redacted_flag`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `retention_note`: `VARCHAR(255) NOT NULL DEFAULT 'Zero data retained for training per provider agreement'`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_ai_call_workspace ON ai_service_call(workspace_id, created_at DESC)`

#### 24. `job` (In-Process Asynchronous Job State)
- **Table Name:** `job`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `workspace_id`: `UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE`
  - `job_type`: `VARCHAR(50) NOT NULL` (Enum: `CHECK_RUN`, `POLICY_COMPILE`, `BACKTEST_SIMULATION`)
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'QUEUED'` (Enum: `QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`)
  - `progress_percent`: `INTEGER NOT NULL DEFAULT 0`
  - `error_message`: `TEXT`
  - `heartbeat_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
  - `completed_at`: `TIMESTAMP WITH TIME ZONE`
- **Indexes:** `idx_job_status ON job(workspace_id, status)`

---

### Group 7: Offline Evaluation (ENT-25 to ENT-26)

#### 25. `eval_case` (Benchmark Reference Dataset)
- **Table Name:** `eval_case`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `dataset_version`: `VARCHAR(50) NOT NULL DEFAULT 'v1.0'`
  - `category`: `VARCHAR(50) NOT NULL` (Enum: `TERMINOLOGY`, `CLAIM`, `TONE`, `ACCESSIBILITY`, `VISUAL`, `INJECTION`)
  - `submission_snippet`: `TEXT NOT NULL`
  - `expected_rule_code`: `VARCHAR(50)`
  - `expected_severity`: `VARCHAR(50)`
  - `is_adversarial`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_eval_case_cat ON eval_case(dataset_version, category)`

#### 26. `eval_run` (Benchmark Results Log)
- **Table Name:** `eval_run`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `eval_mode`: `VARCHAR(50) NOT NULL` (Enum: `HYBRID_PIPELINE`, `LLM_ONLY_BASELINE`)
  - `model_name`: `VARCHAR(100) NOT NULL`
  - `precision_overall`: `FLOAT NOT NULL`
  - `recall_overall`: `FLOAT NOT NULL`
  - `evidence_verified_rate`: `FLOAT NOT NULL`
  - `consistency_score`: `FLOAT NOT NULL`
  - `injection_resistance_rate`: `FLOAT NOT NULL`
  - `metrics_by_category`: `JSONB NOT NULL`
  - `executed_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- **Indexes:** `idx_eval_run_date ON eval_run(executed_at DESC)`

---

## 3. Row-Level Security (RLS) Policy Specifications

- **FACT [STD, Sec 5.4.2; ARCH, Sec 8; DHRUV-V3, AD-04]:** All 24 tenant-scoped tables enforce PostgreSQL Row-Level Security.

### 3.1 Session Variable Convention & Unset Workspace Invariant
At the boundary of every database transaction, the FastAPI database session executes:
```sql
SET LOCAL app.current_workspace_id = 'e2b3c4d5-0000-0000-0000-000000000000';
```
- **Tested Invariant (`test_rls_unset_workspace`):** When `app.current_workspace_id` is unset, null, or empty, `NULLIF(current_setting('app.current_workspace_id', true), '')` evaluates to `NULL`. Because `workspace_id = NULL` is falsy in SQL three-valued logic, any query executed without an explicit workspace context returns **zero rows** on `SELECT` and raises an RLS check violation error on `INSERT`/`UPDATE`. This invariant is asserted in automated unit/integration tests.

### 3.2 Canonical DDL RLS Policy Script
```sql
-- Enforce RLS on all tenant tables (example: submission)
ALTER TABLE submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission FORCE ROW LEVEL SECURITY;

CREATE POLICY submission_workspace_isolation_policy ON submission
    FOR ALL
    USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid)
    WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);
```

### 3.3 Database User Roles & Revocation DDL
```sql
-- Privileged Migration Role
CREATE ROLE canon_migrator WITH LOGIN PASSWORD '...';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO canon_migrator;

-- Unprivileged Application Web Role
CREATE ROLE canon_app WITH LOGIN PASSWORD '...';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO canon_app;

-- REVOKE UPDATE AND DELETE ON AUDIT LOG
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM canon_app;

-- Dedicated Pipeline Role (Zero access to policy or decision mutations)
CREATE ROLE canon_pipeline WITH LOGIN PASSWORD '...';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO canon_pipeline;
GRANT INSERT ON finding, ai_service_call, rule_change_proposal TO canon_pipeline;
REVOKE INSERT, UPDATE, DELETE ON rule, policy_version, decision, approval, user, workspace FROM canon_pipeline;
```

---

## 4. Milestone 1 Relational Subset (Strict Mathematical Subset)

- **FACT [Project Framing; DHRUV-V3, Sec 6; Review Condition 1]:** Milestone 1 deploys **17 tables** of the 26-table full platform design.
- **Table Count Reconciliation:** The full platform comprises **26 relational tables across 7 groups**. `job` is table #24 (added to reconcile background pipeline execution with architecture).
- **Milestone 1 Scope & Claims Ledger Inclusion:** To support verification of factual statements against temporal validity limits (and demonstrate detection of expired/stale statistical claims during the demo), **`approved_claim` with `valid_until`** is confirmed in Milestone 1. Group 5 governance intelligence tables (`rule_health_snapshot`, `rule_change_proposal`, `backtest_run`, `backtest_result`) are deployed for the scope-exception backtest acceptance test.
- **Human Approval Invariant (Review Condition 2):** Policy `v1.1` is never automatically created or activated. It is compiled and promoted to active status **only upon explicit human Brand Manager approval** (`POST /api/v1/governance/proposals/{id}/adopt`).
- **MATHEMATICAL SUBSET VERIFICATION:**  
  Every table and column in the Milestone 1 schema exists **verbatim** in the Full Model above. In Milestone 2 and 3, remaining tables (`term`, `brand_asset`, `dispute`, `comment`, `approval`, `eval_case`, `eval_run`) are added via forward-only Alembic migrations. **Zero tables, columns, or types built in Milestone 1 will be dropped or refactored.**

```
+--------------------------------------------------------------------------------------------------+
|                                MILESTONE 1 SCHEMA SUBSET (17 TABLES)                             |
+--------------------------------------------------------------------------------------------------+
|  Table Name                 | Milestone 1 Role                                                   |
|:----------------------------|:-------------------------------------------------------------------|
|  1. `workspace`             | Tenant boundary seeded for live evaluation.                        |
|  2. `user`                  | 4 RBAC users (`brand_manager`, `creator`, `reviewer`, `it_admin`).  |
|  3. `source_document`       | Stores source guideline text and SHA-256 hash.                    |
|  4. `policy_version`        | Stores immutable active `v1.0` and approved `v1.1` releases.       |
|  5. `rule`                  | 12 executable rules with stable `rule_code` and source citations.  |
|  6. `approved_claim`        | Verified claim ledger with `valid_from` and `valid_until` checks.  |
|  7. `submission`            | Submission container.                                              |
|  8. `submission_version`    | Plain text submission content with character offset map.           |
|  9. `check_run`             | Pipeline check instance pinning policy version and model name.     |
|  10. `finding`              | Double-receipt violation cards with flagged text & guideline quote.|
|  11. `decision`             | Human override with mandatory `reason_code` and justification.     |
|  12. `reason_code`          | Standardized reason code taxonomy (`APPROVED_CAMPAIGN_EXCEPTION`).|
|  13. `rule_health_snapshot` | Aggregates override and false-positive rates per rule.             |
|  14. `rule_change_proposal` | Scoped exception proposal (`PROP-01`) seeded/generated.           |
|  15. `backtest_run`         | Simulation execution on past findings.                             |
|  16. `backtest_result`      | Per-finding backtest simulation outcome (resolved vs regression).  |
|  17. `job`                  | Status and error tracking for in-process background pipeline runs.  |
|  [Audit & Disclosure]       | `audit_log` (append-only) and `ai_service_call` (telemetry).        |
+--------------------------------------------------------------------------------------------------+
```

---

## 5. Alembic Migration Execution Sequence

All schema changes are tracked in linear, forward-only Alembic migrations under `backend/alembic/versions/`:

1. `0001_initial_tenancy_and_users.py`: Creates `workspace` and `user` tables.
2. `0002_trusted_policy_tables.py`: Creates `source_document`, `policy_version`, `rule`, and `approved_claim` tables (enforcing `valid_from`, `valid_until`, and `CHECK (status != 'APPROVED' OR approved_by IS NOT NULL)`).
3. `0003_content_submissions.py`: Creates `submission` and `submission_version` tables.
4. `0004_checking_and_findings.py`: Creates `check_run`, `finding`, `decision`, `reason_code`, and `job` tables; configures foreign keys.
5. `0005_transparency_and_audit.py`: Creates `audit_log` and `ai_service_call`; executes SQL DDL revoking `UPDATE` and `DELETE` on `audit_log` from `canon_app`.
6. `0006_enable_row_level_security.py`: Executes `ALTER TABLE ... ENABLE/FORCE ROW LEVEL SECURITY` on all M1 tables and defines tenant isolation policies.
7. `0007_governance_and_backtest.py` *(Milestone 1)*: Creates `rule_health_snapshot`, `rule_change_proposal`, `backtest_run`, and `backtest_result` for M1 acceptance test.
8. `0008_terms_and_governance.py` *(Milestone 2)*: Creates `term`, `brand_asset`, `dispute`, `comment`, `approval`.
9. `0009_evaluation_and_vectors.py` *(Milestone 2)*: Enables `pgvector` extension; adds `vector(384)` columns; creates `eval_case` and `eval_run`.

