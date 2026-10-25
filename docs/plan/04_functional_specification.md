# Canon: Comprehensive Functional Specification (04_functional_specification.md)

**Document ID:** `DOC-04`  
**Status:** Complete / Authoritative (Revised)  
**Date:** 2026-10-25  
**Version:** 1.1  
**Parent Trace:** [PRD, Sec 7] `file:///E:/Software/codex/Docuements/Canon%20Product%20Requirements%20Document.pdf`, [TASK, Phases 1-14] `file:///E:/Software/codex/Docuements/Canon%20Phased%20Project%20Task%20Document.pdf`, [DHRUV-V3, Sec 6-7] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Specification Standards & Rule Conventions

In strict compliance with **Non-Negotiable Working Rule 6 (DEFINE EVERYTHING)**:
- Zero ambiguous terms (e.g., "handle", "manage", "support", "etc.") are used.
- Every function specifies exact inputs, outputs, preconditions, postconditions, business rules (`BR`), validations, HTTP status error envelopes, role permissions, and audit emissions.
- Priority rankings correspond to `P0` (Mandatory for Milestone 1 / Vertical Slice), `P1` (Milestone 2 / Beta), and `P2` (Milestone 3 / Enterprise).
- **Scope Note for Milestone 1:** PDF/PyMuPDF coordinate parsing is cut from M1 (deferred to M2); M1 operates on plain text submissions and structured `rules.json` policy fixtures with stored source text. In-container dense embeddings and Ollama are cut from M1 (retrieval operates in Pass-All mode). Restored to M1: minimal scope-exception proposal, backtest simulation, and v1.1 approval (the acceptance test).

---

## 2. Policy Setup & Knowledge Ingestion

### FN-POL-01: Ingest Source Document / Rule Fixture
- **Purpose:** Ingest an authoritative brand guideline document, claim ledger, or structured terminology file into the workspace repository.
- **Actor:** `brand_manager`, `it_admin`.
- **Trigger:** HTTP POST request to `/api/v1/policy/sources`.
- **Inputs:** `workspace_id: UUID`, `file: BinaryUpload` (JSON or plain text in M1; DOCX/PDF in M2), `document_title: String (max 255)`, `document_type: Enum [GUIDELINE, CLAIMS_LIST, TERMINOLOGY, ASSET_SPEC]`.
- **Outputs:** `source_document_id: UUID`, `content_hash: SHA256`, `extracted_character_count: Integer`, `status: Enum [UPLOADED, PARSED, PARSE_FAILED]`.
- **Business Rules (`BR`):**
  - `BR-POL-01`: Uploaded file size must not exceed 15 megabytes in M1.
  - `BR-POL-02`: File must be hashed via SHA-256 upon byte reception; duplicate hashes within the same workspace are rejected.
  - `BR-POL-03`: Files are stored by content hash in storage; original files are read-only.
- **Validations:** File must be valid UTF-8 text or JSON fixture in M1.
- **Error Cases:**
  - `400 BAD_REQUEST (INVALID_FILE_TYPE)`: File extension or content does not match approved types.
  - `413 PAYLOAD_TOO_LARGE (FILE_SIZE_EXCEEDED)`: File exceeds 15 MB limit.
  - `409 CONFLICT (DUPLICATE_SOURCE)`: A document with an identical SHA-256 hash already exists in this workspace.
- **Permissions:** Restricted to `brand_manager`, `it_admin`.
- **Audit Event:** `source_document.uploaded` (records user, filename, content hash, bytes).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-1`, `JRN-01`, `TSK-M1-10`.

---

### FN-POL-02: Compile & Propose Candidate Rules
- **Purpose:** Parse structured source rules and propose candidate brand rules for human review.
- **Actor:** `brand_manager`.
- **Trigger:** HTTP POST request to `/api/v1/policy/sources/{source_document_id}/compile`.
- **Inputs:** `source_document_id: UUID`, `extraction_mode: Enum [STRUCTURED_FIXTURE, DETERMINISTIC_TERMS]`.
- **Outputs:** `job_id: UUID`, `proposals_count: Integer`, `candidate_rules: List[CandidateRuleSchema]`.
- **Business Rules (`BR`):**
  - `BR-POL-04`: Candidate rules generated have status `DRAFT` and are non-binding.
  - `BR-POL-05`: Every candidate rule must contain an exact cited source quote and locator verified against the source text.
- **Validations:** Source document must exist and have status `PARSED`.
- **Error Cases:**
  - `404 NOT_FOUND (SOURCE_NOT_FOUND)`: Document ID does not exist in workspace.
- **Permissions:** Restricted to `brand_manager`.
- **Audit Event:** `policy.rules_proposed` (records document ID, rule count).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-2`, `JRN-01`, `TSK-M1-10`.

---

### FN-POL-03: Review & Adjudicate Candidate Rule
- **Purpose:** Authenticated human approval, modification, or rejection of a candidate brand rule.
- **Actor:** `brand_manager`, `approver`.
- **Trigger:** HTTP PATCH request to `/api/v1/policy/rules/{rule_id}`.
- **Inputs:** `rule_id: UUID`, `status: Enum [APPROVED, REJECTED]`, `rule_code: String (max 50)`, `rule_type: Enum [FORBIDDEN_TERM, REQUIRED_TERM, NEAR_MISS, CLAIM_ASSERTION, NUMBER_UNIT_MATCH, TONE_VOICE, CONTRAST]`, `severity: Enum [CRITICAL, MAJOR, MINOR]`, `rule_text: String`, `source_quote: String`, `page_number: Integer`, `scope_filters: JSONB (optional)`.
- **Outputs:** `updated_rule: RuleSchema`.
- **Business Rules (`BR`):**
  - `BR-POL-06` [STD, Sec 3.1; TASK, P1-T07]: Database constraint strictly prohibits `status = APPROVED` without an explicit foreign key link to `approved_by` (authenticated user ID).
  - `BR-POL-07` [ARCH, Sec 8]: A rule retains a stable `rule_code` (e.g., `TERM-001`) across policy revisions to preserve Rule Health historical continuity.
- **Validations:** If `status = APPROVED`, `rule_text` and `source_quote` must not be empty.
- **Error Cases:**
  - `400 BAD_REQUEST (MISSING_REQUIRED_FIELDS)`: Approving a rule without assigning a stable rule code or severity.
  - `404 NOT_FOUND (RULE_NOT_FOUND)`: Rule ID does not exist.
- **Permissions:** Restricted to `brand_manager`, `approver`.
- **Audit Event:** `rule.adjudicated` (records rule ID, status, approver ID, previous vs new values).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-3`, `FR-4`, `FR-5`, `JRN-01`, `TSK-M1-10`.

---

### FN-POL-04: Publish Policy Version
- **Purpose:** Freeze active approved rules into an immutable, versioned policy snapshot (e.g., `v1.0`, `v1.1`).
- **Actor:** `brand_manager`, `approver`.
- **Trigger:** HTTP POST request to `/api/v1/policy/versions`.
- **Inputs:** `workspace_id: UUID`, `version_tag: String (e.g., 'v1.0')`, `changelog_summary: String`.
- **Outputs:** `policy_version_id: UUID`, `version_tag: String`, `is_active: Boolean`, `approved_rules_count: Integer`, `published_at: Timestamp`.
- **Business Rules (`BR`):**
  - `BR-POL-08` [ARCH, Sec 8]: A published policy version is completely immutable. Updates can only occur by creating a new version (`v1.1`).
  - `BR-POL-09`: Exactly one policy version may have `is_active = TRUE` per workspace at any given time.
  - `BR-POL-10`: Publishing requires at least one approved rule in the policy.
- **Validations:** Semantic version string format (`vX.Y`).
- **Error Cases:**
  - `400 BAD_REQUEST (EMPTY_POLICY)`: Attempting to publish a policy with zero approved rules.
  - `409 CONFLICT (VERSION_TAG_EXISTS)`: Version tag already published in workspace.
- **Permissions:** Restricted to `brand_manager`, `approver`.
- **Audit Event:** `policy_version.published` (records version ID, tag, rule count, approver ID).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-4`, `JRN-01`, `JRN-06`, `TSK-M1-10`.

---

### FN-POL-05: Manage Approved Claim Ledger
- **Purpose:** Create, edit, and expire factual claims, statistics, and product assertions in the trusted claims ledger.
- **Actor:** `approver`, `brand_manager`.
- **Trigger:** HTTP POST or PATCH to `/api/v1/claims`.
- **Inputs:** `claim_id: UUID (optional on create)`, `claim_text: String`, `claim_category: Enum [PRICING, METRIC, PRODUCT_CAPABILITY, PARTNERSHIP, LEGAL]`, `valid_from: Date`, `valid_until: Date (nullable)`, `source_document_id: UUID`, `source_locator: String`.
- **Outputs:** `claim_record: ClaimSchema`.
- **Business Rules (`BR`):**
  - `BR-POL-11` [PRD, FR-6]: Factual claims carry effective dates. When `valid_until < CURRENT_DATE`, the claim is classified as `EXPIRED/STALE`.
  - `BR-POL-12`: Claims without a cited `source_document_id` cannot be marked active.
- **Validations:** `valid_until` (if present) must be greater than or equal to `valid_from`.
- **Error Cases:**
  - `422 UNPROCESSABLE_ENTITY (INVALID_DATE_RANGE)`: `valid_until` precedes `valid_from`.
- **Permissions:** Restricted to `approver`, `brand_manager`.
- **Audit Event:** `claim.mutated` (records claim ID, text excerpt, validity window).
- **Priority & Milestone:** P1 | Milestone 2 (M2) (Pass-all fixture used in M1).
- **Linked Requirements & Journeys:** `FR-6`, `FR-18`, `TSK-M2-01`.

---

## 3. Submission & Content Versioning

### FN-SUB-01: Ingest Content Submission Draft
- **Purpose:** Ingest draft marketing content (pasted text or uploaded `.txt` file) for automated brand checking.
- **Actor:** `creator`, `reviewer`, `brand_manager`, `agency`.
- **Trigger:** HTTP POST request to `/api/v1/submissions`.
- **Inputs:** `workspace_id: UUID`, `title: String (max 255)`, `campaign_tag: String (optional)`, `submission_type: Enum [PLAIN_TEXT]`, `raw_text: String`.
- **Outputs:** `submission_id: UUID`, `submission_version_id: UUID`, `version_number: Integer (= 1)`, `status: Enum [PENDING_CHECK]`.
- **Business Rules (`BR`):**
  - `BR-SUB-01` [STD, Sec 7.1]: All submitted content is treated as untrusted, hostile data.
  - `BR-SUB-02`: Submission records are immutable containers. Content changes always create an incremented `submission_version`.
- **Validations:** Maximum raw text length 500,000 characters.
- **Error Cases:**
  - `400 BAD_REQUEST (MISSING_CONTENT)`: `raw_text` is empty.
  - `413 PAYLOAD_TOO_LARGE (SUBMISSION_TOO_LARGE)`: Text exceeds size limits.
- **Permissions:** Restricted to authenticated workspace users (`creator`, `reviewer`, `brand_manager`, `agency`).
- **Audit Event:** `submission.created` (records submission ID, author ID, title, type).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-7`, `JRN-02`, `TSK-M1-14`.

---

### FN-SUB-02: Normalize Text & Generate Offset Map
- **Purpose:** Apply Unicode normalization (NFKC) and construct a bi-directional character offset index between normalized and raw text spans.
- **Actor:** Automated Pipeline Stage (`STG-01`).
- **Trigger:** Invoked internally by pipeline orchestrator upon submission ingestion.
- **Inputs:** `raw_content: String`.
- **Outputs:** `normalized_text: String`, `offset_map: List[Tuple[Int, Int]]`, `structural_segments: List[SegmentSchema]`.
- **Business Rules (`BR`):**
  - `BR-SUB-03` [ARCH, Sec 6.3]: Normalization standardizes whitespace and Unicode ligatures while preserving an exact offset mapping so UI highlights land on precise characters.
- **Validations:** Non-empty string.
- **Error Cases:**
  - `422 UNPROCESSABLE_ENTITY (EXTRACTION_CORRUPTED)`: Content returned unreadable encoding.
- **Permissions:** System process.
- **Audit Event:** None (pure functional data transformation).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-7`, `ARCH, Sec 6.3`, `TSK-M1-09`.

---

### FN-SUB-03: Create Resubmission Revision Version
- **Purpose:** Ingest an edited revision of a previously reviewed submission, linking it to the parent version.
- **Actor:** `creator`, `agency`.
- **Trigger:** HTTP POST to `/api/v1/submissions/{submission_id}/versions`.
- **Inputs:** `submission_id: UUID`, `raw_text: String`, `change_notes: String (optional)`.
- **Outputs:** `new_version_id: UUID`, `version_number: Integer (e.g., 2)`.
- **Business Rules (`BR`):**
  - `BR-SUB-04`: New version automatically inherits previous submission metadata and increments `version_number`.
  - `BR-SUB-05`: Past findings linked to previous versions remain permanently locked to their respective version ID.
- **Validations:** Submission must not be in `APPROVED` status.
- **Error Cases:**
  - `409 CONFLICT (SUBMISSION_ALREADY_APPROVED)`: Cannot resubmit content that has already received final sign-off.
- **Permissions:** Author of submission, `reviewer`, or `brand_manager`.
- **Audit Event:** `submission_version.created` (records submission ID, new version number).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-8`, `JRN-03`, `TSK-M1-14`.

---

## 4. Verification Check Pipeline

### FN-CHK-01: Orchestrate Check Run
- **Purpose:** Initiate and monitor an asynchronous background verification job against a submission version.
- **Actor:** `creator`, `reviewer`, `brand_manager`.
- **Trigger:** HTTP POST to `/api/v1/submissions/{submission_id}/versions/{version_id}/check`.
- **Inputs:** `submission_version_id: UUID`, `active_policy_version_id: UUID (optional, defaults to active)`.
- **Outputs:** `job_id: UUID`, `check_run_id: UUID`, `status: Enum [QUEUED, RUNNING]`.
- **Business Rules (`BR`):**
  - `BR-CHK-01` [ARCH, Sec 6.8]: Check execution runs in-process via FastAPI `BackgroundTasks` updating the `job` and `check_run` tables.
  - `BR-CHK-02`: A check run pins the exact `policy_version_id`, `model_name`, and `pipeline_version` at time of execution to ensure reproducibility.
- **Validations:** Submission version must exist and not have an active `RUNNING` job.
- **Error Cases:**
  - `409 CONFLICT (CHECK_ALREADY_RUNNING)`: A check job is currently executing for this version.
- **Permissions:** Authenticated workspace users.
- **Audit Event:** `check_run.started` (records run ID, version ID, policy version).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-9`, `FR-10`, `JRN-02`, `TSK-M1-14`.

---

### FN-CHK-02: Execute Prompt Injection Security Scan
- **Purpose:** Scan submitted text for prompt injection or system override attacks.
- **Actor:** Pipeline Security Stage (`STG-02`).
- **Trigger:** Internal pipeline invocation prior to any LLM analysis.
- **Inputs:** `normalized_text: String`.
- **Outputs:** `injection_findings: List[FindingSchema]`, `has_critical_injection: Boolean`.
- **Business Rules (`BR`):**
  - `BR-CHK-03` [STD, Sec 3.4, 8.8]: Submitted text is never treated as instructions. Instruction phrases are detected via pattern heuristics and flagged as `CRITICAL` findings.
  - `BR-CHK-04`: An injection finding never stops pipeline execution, but triggers an immediate critical flag blocking automated clearance.
- **Validations:** Evaluated on all text inputs.
- **Error Cases:** Handled internally; errors default to logging an unverified security finding.
- **Permissions:** Pipeline role.
- **Audit Event:** `security.injection_detected` (if pattern matched).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-12`, `ARCH, Sec 4`, `TSK-M1-12`.

---

### FN-CHK-03: Execute Deterministic Rules Engine
- **Purpose:** Evaluate content against active deterministic policy rules (forbidden terms, required terms, claim ledger match, numbers/dates/units, contrast).
- **Actor:** Pipeline Deterministic Engine (`STG-03`).
- **Trigger:** Internal pipeline step post-normalization.
- **Inputs:** `normalized_text: String`, `active_rules: List[Rule]`, `claims_ledger: List[ApprovedClaim]`.
- **Outputs:** `deterministic_findings: List[FindingSchema]`.
- **Business Rules (`BR`):**
  - `BR-CHK-05` [STD, Sec 2.5; ARCH, Sec 6.4]: Exact and near-miss terms are evaluated in code using regex word boundaries, spaCy lemmatization, and RapidFuzz (threshold tuned to prevent noise).
  - `BR-CHK-06`: Contrast ratios are calculated using the exact WCAG relative luminance formula $(L1 + 0.05) / (L2 + 0.05)$; no AI model is used.
  - `BR-CHK-07`: Deterministic findings always take precedence over semantic findings covering identical text spans.
- **Validations:** None (internal code).
- **Error Cases:** Internal stage failures are caught and logged; individual check failure does not crash the pipeline.
- **Permissions:** Pipeline role.
- **Audit Event:** None (findings persisted in bulk).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-9`, `ARCH, Sec 6.4`, `TSK-M1-13`.

---

### FN-CHK-04: Execute Policy Context Retrieval
- **Purpose:** Select policy rules relevant to specific submission sentences for LLM semantic analysis.
- **Actor:** Pipeline Retrieval Engine (`STG-04`).
- **Trigger:** Internal pipeline step preceding LLM call.
- **Inputs:** `submission_sentences: List[String]`, `active_rules: List[Rule]`.
- **Outputs:** `retrieved_rules_per_sentence: Dict[SentenceIndex, List[Rule]]`.
- **Business Rules (`BR`):**
  - `BR-CHK-08` [ARCH, Sec 6.2; DHRUV-V3, AD-06]: In Milestone 1, the system operates strictly in **Pass-All Mode** because the active rule set is small ($\le 20$ rules). Dense vector embeddings and `pgvector` index are deferred to Milestone 2.
- **Validations:** Active rules list not empty.
- **Error Cases:** None.
- **Permissions:** Pipeline role.
- **Audit Event:** None.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-10`, `ARCH, Sec 6.2`, `TSK-M1-16`.

---

### FN-CHK-05: Execute AI Semantic Check via Provider Adapter
- **Purpose:** Analyze content for voice, tone, and paraphrased unsupported claims using an LLM behind the provider adapter.
- **Actor:** Pipeline LLM Adapter (`STG-05`).
- **Trigger:** Internal pipeline step post-retrieval.
- **Inputs:** `untrusted_text: String` (wrapped in strict XML data delimiters), `retrieved_rules: List[Rule]`, `output_schema: PydanticModel`.
- **Outputs:** `candidate_findings: List[CandidateFindingSchema]`.
- **Business Rules (`BR`):**
  - `BR-CHK-09` [STD, Sec 8.4]: LLM temperature is set to 0. Output is schema-constrained JSON validated via Pydantic.
  - `BR-CHK-10` [STD, Sec 8.4]: On schema validation failure, the adapter retries exactly once. On second failure, semantic checking is aborted, the run status is marked `PARTIAL`, and deterministic findings are retained.
  - `BR-CHK-11` [STD, Sec 8.9]: Every external LLM call emits an immutable `ai_service_call` log record.
- **Validations:** Untrusted text passed strictly as data parameters, never in system instructions.
- **Error Cases:** Handled via retry and graceful degradation to deterministic-only findings.
- **Permissions:** Pipeline role.
- **Audit Event:** Emits `ai_service_call` database record.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-10`, `STD, Sec 8`, `ARCH, Sec 6.5`, `TSK-M1-16`.

---

### FN-CHK-06: Programmatic Double-Receipt Verification
- **Purpose:** Validate that every generated finding is grounded in both the submitted content and the approved policy document before presentation.
- **Actor:** Pipeline Verifier Engine (`STG-06`).
- **Trigger:** Internal pipeline step post-AI check.
- **Inputs:** `candidate_findings: List[CandidateFindingSchema]`, `submission_text: String`, `source_documents: List[SourceDocument]`.
- **Outputs:** `verified_findings: List[Finding]`, `dropped_findings_count: Integer`.
- **Business Rules (`BR`):**
  - `BR-CHK-12` [STD, Sec 2.6, 8.5; PRD, FR-11; ARCH, Sec 6.6]:  
    A candidate finding is confirmed `VERIFIED` if and only if:
    1. The `flagged_quote` exists in the submission text at the declared offsets (exact or fuzzy threshold $\ge 0.85$).
    2. The cited `rule_id` exists in the active policy version.
    3. The cited `source_quote` exists in the source document at the declared locator.
  - `BR-CHK-13`: If receipt validation fails, the finding is marked `DROPPED` or `UNVERIFIED`. Dropped findings are recorded in the database for accuracy telemetry but are NEVER displayed in the reviewer's confirmed findings view.
- **Validations:** Programmatic string and offset matching in Python.
- **Error Cases:** Internal failures mark finding as `UNVERIFIED`.
- **Permissions:** Pipeline role.
- **Audit Event:** None (persisted in `check_run` summary).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-11`, `PRD, Sec 5.2`, `ARCH, Sec 6.6`, `TSK-M1-17`.

---

### FN-CHK-07: Merge, Deduplicate & Rank Findings
- **Purpose:** Deduplicate overlapping findings, sort by severity hierarchy (`CRITICAL` > `MAJOR` > `MINOR`), and finalize check run status.
- **Actor:** Pipeline Ranking Engine (`STG-07`).
- **Trigger:** Terminal pipeline step.
- **Inputs:** `verified_deterministic_findings: List[Finding]`, `verified_semantic_findings: List[Finding]`.
- **Outputs:** `final_findings: List[Finding]`, `check_run_status: Enum [COMPLETED, PARTIAL]`.
- **Business Rules (`BR`):**
  - `BR-CHK-14` [ARCH, Sec 6.2]: When a deterministic finding and a semantic finding overlap the identical character span, the deterministic finding is preserved and the semantic finding is merged or discarded.
  - `BR-CHK-15`: If zero findings are detected, the submission status transitions to `CLEAN`.
- **Validations:** All findings must have valid foreign keys to `check_run_id`.
- **Error Cases:** None.
- **Permissions:** Pipeline role.
- **Audit Event:** `check_run.completed` (records findings count by severity).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-17`, `ARCH, Sec 6.2`, `TSK-M1-14`.

---

## 5. Findings & Intent-Preserving Suggestions

### FN-FND-01: Retrieve Findings with Evidence Receipts
- **Purpose:** Fetch structured findings for a submission version with side-by-side textual evidence receipts.
- **Actor:** `creator`, `reviewer`, `approver`, `brand_manager`.
- **Trigger:** HTTP GET to `/api/v1/submissions/{id}/findings`.
- **Inputs:** `submission_id: UUID`, `severity_filter: String (optional)`.
- **Outputs:** `findings: List[FindingResponseSchema]`, each containing: `id`, `category`, `severity`, `flagged_quote`, `start_offset`, `end_offset`, `rule_code`, `source_document_title`, `source_page`, `source_quote`, `confidence_category`, `suggestion`, `verification_status`.
- **Business Rules (`BR`):**
  - `BR-FND-01` [PRD, FR-15]: Every finding card displayed in the UI must render both the flagged quote and source quote receipt.
- **Validations:** Submission must belong to user's workspace.
- **Error Cases:** `404 NOT_FOUND (SUBMISSION_NOT_FOUND)`.
- **Permissions:** Authenticated workspace users.
- **Audit Event:** None.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-15`, `JRN-02`, `TSK-M1-15`.

---

### FN-FND-02: Generate Intent-Preserving Suggestion
- **Purpose:** Produce an alternative phrasing that resolves a policy violation without mutating author intent or introducing unapproved claims.
- **Actor:** Pipeline Suggestion Engine.
- **Trigger:** Invoked during semantic analysis or on-demand via HTTP POST `/api/v1/findings/{id}/suggest`.
- **Inputs:** `flagged_sentence: String`, `violated_rule: Rule`, `approved_claims: List[ApprovedClaim]`.
- **Outputs:** `suggested_rewrite: String`, `explanation: String`.
- **Business Rules (`BR`):**
  - `BR-FND-02` [STD, Sec 3.10; PRD, FR-16]: Suggestions are strictly advisory. The system is prohibited from automatically mutating submission text.
  - `BR-FND-03` [STD, Sec 8.6]: The suggestion must preserve author intent and must never introduce a new factual claim absent from the approved claims ledger.
- **Validations:** Input sentence length $\le 1,000$ characters.
- **Error Cases:** Internal timeout falls back to empty suggestion.
- **Permissions:** Pipeline role / Authenticated users.
- **Audit Event:** None.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-16`, `PRD, Sec 7.3`, `TSK-M1-15`.

---

### FN-FND-03: Detect & Escalate Unknown Claims
- **Purpose:** Identify factual claims lacking an entry in the approved claims ledger and escalate them as Critical findings.
- **Actor:** Pipeline Claims Stage.
- **Trigger:** Invoked during claim verification.
- **Inputs:** `detected_claims: List[String]`, `approved_claims_ledger: List[ApprovedClaim]`.
- **Outputs:** `escalated_findings: List[Finding]`.
- **Business Rules (`BR`):**
  - `BR-FND-04` [STD, Sec 3.6; PRD, FR-18]: Any detected factual assertion that lacks an exact or validated semantic match in the claim ledger is classified as `SEVERITY = CRITICAL` and designated `UNKNOWN_CLAIM_ESCALATION`.
  - `BR-FND-05`: Unknown claims cannot be auto-cleared; they mandate human reviewer or approver sign-off.
- **Validations:** Evaluated on all declarative sentences.
- **Error Cases:** Handled via standard pipeline error trapping.
- **Permissions:** Pipeline role.
- **Audit Event:** `claim.escalated` (records claim text, submission ID).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-18`, `PRD, Sec 5.5`, `TSK-M1-13`.

---

## 6. Human Review, Overrides & Decisions

### FN-REV-01: Adjudicate Finding (Accept / Reject / Edit)
- **Purpose:** Record a human decision on an individual finding.
- **Actor:** `reviewer`, `brand_manager`, `approver`.
- **Trigger:** HTTP POST to `/api/v1/findings/{id}/decision`.
- **Inputs:** `finding_id: UUID`, `action: Enum [ACCEPT, REJECT, EDIT]`, `modified_text: String (optional)`, `comment: String (optional)`.
- **Outputs:** `decision_id: UUID`, `finding_id: UUID`, `status: Enum [ACCEPTED, REJECTED, EDITED]`, `decided_at: Timestamp`.
- **Business Rules (`BR`):**
  - `BR-REV-01`: Recording a decision updates the finding's review state and is tied to the authenticated user's ID.
- **Validations:** Action must match enum.
- **Error Cases:** `404 NOT_FOUND (FINDING_NOT_FOUND)`.
- **Permissions:** Restricted to `reviewer`, `brand_manager`, `approver`.
- **Audit Event:** `finding.decided` (records finding ID, action, user ID).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-19`, `JRN-02`, `TSK-M1-18`.

---

### FN-REV-02: Override Finding with Standard Reason Code
- **Purpose:** Authorize an intentional policy exception by overriding a verified finding, requiring a standardized Reason Code.
- **Actor:** `reviewer`, `brand_manager`, `approver`.
- **Trigger:** HTTP POST to `/api/v1/findings/{id}/override`.
- **Inputs:** `finding_id: UUID`, `reason_code: Enum [APPROVED_CAMPAIGN_EXCEPTION, CONTEXT_MISUNDERSTOOD, OUTDATED_RULE, ENTERPRISE_CLIENT_EXCEPTION]`, `justification_note: String (min 10 chars)`.
- **Outputs:** `decision_id: UUID`, `finding_id: UUID`, `override_status: Boolean (= TRUE)`.
- **Business Rules (`BR`):**
  - `BR-REV-02` [PRD, FR-19]: Overriding a finding mandates both a recognized `reason_code` and a non-empty `justification_note`.
  - `BR-REV-03` [PRD, FR-25]: Every override event updates historical counters for the associated `rule_code` to feed the Rule Health intelligence engine.
- **Validations:** `justification_note` length $\ge 10$ characters.
- **Error Cases:**
  - `400 BAD_REQUEST (REASON_CODE_REQUIRED)`: Missing reason code or empty justification.
- **Permissions:** Restricted to `reviewer`, `brand_manager`, `approver`.
- **Audit Event:** `finding.overridden` (records finding ID, rule code, reason code, justification).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-19`, `FR-25`, `JRN-02`, `TSK-M1-18`.

---

### FN-REV-03: Lodge Creator Finding Dispute
- **Purpose:** Allow a content creator to formally dispute a finding and request human reviewer adjudication.
- **Actor:** `creator`, `agency`.
- **Trigger:** HTTP POST to `/api/v1/findings/{id}/dispute`.
- **Inputs:** `finding_id: UUID`, `dispute_reason_code: Enum [FALSE_POSITIVE, CONTEXT_IGNORED, APPROVED_BY_DIRECTOR]`, `creator_argument: String (min 10 chars)`.
- **Outputs:** `dispute_id: UUID`, `finding_id: UUID`, `dispute_status: Enum [OPEN]`.
- **Business Rules (`BR`):**
  - `BR-REV-04` [PRD, FR-20]: Creators cannot override rules directly, but can open a structured dispute that surfaces in the reviewer's queue.
- **Validations:** Submission must be in `PENDING_REVIEW` status and authored by the user.
- **Error Cases:** `403 FORBIDDEN (NOT_SUBMISSION_AUTHOR)`.
- **Permissions:** Submission author (`creator`, `agency`).
- **Audit Event:** `finding.disputed` (records finding ID, dispute reason).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-20`, `JRN-02`, `TSK-M1-18`.

---

### FN-REV-04: Add Contextual Comment
- **Purpose:** Add threaded collaborative comments on a submission or individual finding.
- **Actor:** Authenticated workspace users.
- **Trigger:** HTTP POST to `/api/v1/comments`.
- **Inputs:** `submission_id: UUID`, `finding_id: UUID (optional)`, `comment_text: String (max 2,000 chars)`.
- **Outputs:** `comment_id: UUID`, `created_at: Timestamp`, `author_name: String`.
- **Business Rules (`BR`):** Comments are treated as untrusted text and rendered safely without raw HTML execution.
- **Validations:** Comment text 1–2,000 characters.
- **Error Cases:** `400 BAD_REQUEST (EMPTY_COMMENT)`.
- **Permissions:** All authenticated workspace roles.
- **Audit Event:** `comment.created`.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-21`, `TSK-M1-18`.

---

## 7. Final Approvals & Sign-off

### FN-APP-01: Sign-off Content Submission
- **Purpose:** Grant final formal sign-off to publish or distribute the submission.
- **Actor:** `approver`, `brand_manager`.
- **Trigger:** HTTP POST to `/api/v1/submissions/{id}/approve`.
- **Inputs:** `submission_id: UUID`, `version_id: UUID`, `approval_notes: String (optional)`.
- **Outputs:** `approval_id: UUID`, `submission_status: Enum [APPROVED]`, `signed_off_at: Timestamp`.
- **Business Rules (`BR`):**
  - `BR-APP-01` [TASK, P1-T04; PRD, FR-22]: A submission cannot be approved if any unaddressed `CRITICAL` findings remain without an explicit human override.
  - `BR-APP-02`: Reviewers may recommend approval; only authenticated `approver` or `brand_manager` roles may execute final sign-off.
- **Validations:** Submission must not be in `ARCHIVED` status.
- **Error Cases:**
  - `409 CONFLICT (UNRESOLVED_CRITICAL_FINDINGS)`: Attempting to sign off while unaddressed Critical findings remain.
- **Permissions:** Restricted to `approver`, `brand_manager`.
- **Audit Event:** `submission.approved` (records submission ID, version ID, approver ID).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-22`, `JRN-02`, `TSK-M1-18`.

---

### FN-APP-02: Send Back Submission for Revision
- **Purpose:** Reject the current draft submission and return it to the creator with required remediation notes.
- **Actor:** `reviewer`, `approver`, `brand_manager`.
- **Trigger:** HTTP POST to `/api/v1/submissions/{id}/send-back`.
- **Inputs:** `submission_id: UUID`, `version_id: UUID`, `send_back_notes: String (min 10 chars)`.
- **Outputs:** `submission_status: Enum [SENT_BACK]`, `updated_at: Timestamp`.
- **Business Rules (`BR`):** Transitions submission state to `SENT_BACK` and notifies creator.
- **Validations:** `send_back_notes` $\ge 10$ characters.
- **Error Cases:** `400 BAD_REQUEST (NOTES_REQUIRED)`.
- **Permissions:** Restricted to `reviewer`, `approver`, `brand_manager`.
- **Audit Event:** `submission.sent_back` (records submission ID, notes).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-22`, `JRN-03`, `TSK-M1-18`.

---

## 8. Rule Health & Continuous Governance Intelligence

### FN-RHL-01: Generate Rule Health Snapshot
- **Purpose:** Aggregate override frequencies, dispute rates, and reason code distributions per `rule_code`.
- **Actor:** `brand_manager`, `approver`, `it_admin`.
- **Trigger:** HTTP GET to `/api/v1/governance/health`.
- **Inputs:** `workspace_id: UUID`, `min_sample_size: Integer (default = 5)`.
- **Outputs:** `rule_health_table: List[RuleHealthSnapshotSchema]`, including `rule_code`, `rule_text`, `times_flagged`, `times_overridden`, `override_rate: Float`, `top_reason_codes: List[String]`, `diagnostic_state: Enum [HEALTHY, NOISY, SCOPE_MISMATCH, UNCLEAR, STALE]`.
- **Business Rules (`BR`):**
  - `BR-RHL-01` [PRD, FR-25; ARCH, Sec 11]: Override rates are suppressed until a rule reaches the `min_sample_size` threshold.
  - `BR-RHL-02` [ARCH, Sec 11]: Diagnostic classification: `SCOPE_MISMATCH` (high overrides with dominant departmental reason), `NOISY` (high overrides with mixed reasons), `UNCLEAR` (high disputes), `STALE` (past validity date).
- **Validations:** `min_sample_size` $\ge 1$.
- **Error Cases:** None.
- **Permissions:** Restricted to `brand_manager`, `approver`, `it_admin`, `exec`.
- **Audit Event:** None.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-25`, `FR-26`, `JRN-04`, `TSK-M1-20`.

---

### FN-BKT-01: Generate Scope-Exception Rule Change Proposal (Restored to M1)
- **Purpose:** Automatically synthesize a candidate rule modification adding a departmental scope exception based on accumulated override patterns.
- **Actor:** `brand_manager`.
- **Trigger:** HTTP POST to `/api/v1/governance/proposals`.
- **Inputs:** `rule_code: String`, `target_diagnosis: Enum [SCOPE_MISMATCH]`, `exception_scope: JSONB (e.g., {"exclude_department": "Social_Media"})`.
- **Outputs:** `proposal_id: UUID`, `original_rule_text: String`, `proposed_rule_diff: String`, `scope_modifications: JSONB`, `rationale: String`.
- **Business Rules (`BR`):**
  - `BR-BKT-01` [STD, Sec 3.1; PRD, FR-27]: Proposals are strictly `DRAFT` and cannot mutate active policies without human approval.
- **Validations:** Rule code must exist in active policy.
- **Error Cases:** `404 NOT_FOUND (RULE_CODE_NOT_FOUND)`.
- **Permissions:** Restricted to `brand_manager`.
- **Audit Event:** `rule_proposal.created` (records proposal ID, rule code).
- **Priority & Milestone:** P0 (Minimal Scope Exception) | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-27`, `JRN-04`, `JRN-06`, `TSK-M1-21`.

---

### FN-BKT-02: Execute Backtest Simulation Run (Restored to M1)
- **Purpose:** Replay past content submissions against a proposed scope exception rule change to compute empirical impact and detect newly missed issues.
- **Actor:** `brand_manager`.
- **Trigger:** HTTP POST to `/api/v1/governance/proposals/{id}/backtest`.
- **Inputs:** `proposal_id: UUID`.
- **Outputs:** `backtest_run_id: UUID`, `submissions_replayed_count: Integer`, `findings_eliminated_count: Integer`, `newly_flagged_count: Integer`, `critical_regressions_count: Integer`.
- **Business Rules (`BR`):**
  - `BR-BKT-02` [ARCH, Sec 11]: To ensure 100% reproducibility and zero external API costs, the backtest replays deterministic rules on stored submission text and replays cached semantic findings from database history.
- **Validations:** Proposal must exist and be in `DRAFT` status.
- **Error Cases:** `404 NOT_FOUND (PROPOSAL_NOT_FOUND)`.
- **Permissions:** Restricted to `brand_manager`.
- **Audit Event:** `backtest.executed` (records proposal ID, replayed count).
- **Priority & Milestone:** P0 (Minimal Scope Exception) | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-28`, `JRN-04`, `JRN-06`, `TSK-M1-21`.

---

### FN-BKT-03: Adopt Backtested Proposal & Publish Policy v1.1 (Restored to M1)
- **Purpose:** Formally review and approve a backtested rule proposal. Policy `v1.1` is created and activated only upon explicit human Brand Manager approval (The Acceptance Test).
- **Actor:** `brand_manager`, `approver`.
- **Trigger:** HTTP POST to `/api/v1/governance/proposals/{id}/adopt`.
- **Inputs:** `proposal_id: UUID`, `approval_comment: String`.
- **Outputs:** `new_policy_version_id: UUID`, `version_tag: String (= 'v1.1')`.
- **Business Rules (`BR`):**
  - `BR-BKT-03` [PRD, FR-29; Review Condition 2]: Policy `v1.1` is never automatically created or activated. Compilation and activation occur strictly upon explicit human Brand Manager approval, retiring `v1.0` while maintaining continuous historical telemetry under identical `rule_code` tags.
- **Validations:** Proposal must have an executed backtest run.
- **Error Cases:**
  - `400 BAD_REQUEST (BACKTEST_REQUIRED)`: Cannot adopt proposal without backtest simulation.
- **Permissions:** Restricted to `brand_manager`, `approver`.
- **Audit Event:** `rule_proposal.adopted` (records proposal ID, new version ID).
- **Priority & Milestone:** P0 (Minimal Scope Exception) | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-29`, `JRN-04`, `JRN-06`, `TSK-M1-21`.

---

## 9. Transparency, AI Disclosure & Audit

### FN-DIS-01: Log AI Service Invocation
- **Purpose:** Record operational metadata for every model execution.
- **Actor:** Internal LLM Adapter (`pipeline/llm/adapter.py`).
- **Trigger:** Invoked upon every model completion.
- **Inputs:** `workspace_id: UUID`, `provider_name: String`, `model_name: String`, `prompt_tokens: Integer`, `completion_tokens: Integer`, `latency_ms: Integer`, `payload_summary: String`, `redacted_flag: Boolean`.
- **Outputs:** `call_id: UUID`.
- **Business Rules (`BR`):**
  - `BR-DIS-01` [STD, Sec 8.9]: Personal identifiable information (PII) and raw confidential document text must NEVER be written to the `ai_service_call` log; only structural IDs and token summaries are stored.
  - Retention terms are recorded as a verified policy note (`VER-11`), not an unverified guarantee.
- **Validations:** Valid workspace and provider name.
- **Error Cases:** Log failure is trapped and written to system fallback logger.
- **Permissions:** Pipeline role.
- **Audit Event:** None (this table is the AI audit log).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-30`, `STD, Sec 8.9`, `TSK-M1-16`.

---

### FN-DIS-02: Query AI Disclosure Panel
- **Purpose:** Provide users and auditors with transparency regarding active AI models, data routing, and call telemetry.
- **Actor:** All authenticated users (`creator`, `reviewer`, `brand_manager`, `it_admin`, `exec`).
- **Trigger:** HTTP GET to `/api/v1/transparency/disclosure`.
- **Inputs:** `workspace_id: UUID`.
- **Outputs:** `provider: String`, `model: String`, `total_calls_24h: Integer`, `average_latency_ms: Float`, `recent_calls: List[AICallSummarySchema]`.
- **Business Rules (`BR`):**
  - `BR-DIS-02` [STD, Sec 8.11; PRD, FR-30]: The disclosure panel reflects real, live database call logs; rendering hardcoded static claims is strictly prohibited.
- **Validations:** None.
- **Error Cases:** None.
- **Permissions:** All authenticated workspace roles.
- **Audit Event:** None (read operation).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-30`, `JRN-05`, `TSK-M1-22`.

---

### FN-AUD-01: Record Append-Only Audit Event
- **Purpose:** Write an immutable audit log entry for every consequential system mutation.
- **Actor:** Central Audit Service (`backend/app/services/audit.py`).
- **Trigger:** Internal service invocation on all write transactions.
- **Inputs:** `workspace_id: UUID`, `actor_user_id: UUID`, `action: String`, `entity_type: String`, `entity_id: UUID`, `before_state: JSONB (optional)`, `after_state: JSONB (optional)`.
- **Outputs:** `audit_log_id: UUID`, `created_at: Timestamp`.
- **Business Rules (`BR`):**
  - `BR-AUD-01` [STD, Sec 3.8, 5.4.4; TASK, P1-T12]: The database application role is granted `INSERT` and `SELECT` rights only; `UPDATE` and `DELETE` privileges on `audit_log` are strictly revoked.
- **Validations:** Actor user ID and workspace ID must be valid foreign keys.
- **Error Cases:** Database write failure aborts the parent transaction.
- **Permissions:** System service role.
- **Audit Event:** Self-emitted.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-23`, `STD, Sec 5.4`, `TSK-M1-07`.

---

### FN-AUD-02: Query & Inspect Audit Trail
- **Purpose:** Provide compliance officers and administrators with a searchable, filtered log of all organizational actions.
- **Actor:** `approver`, `brand_manager`, `it_admin`.
- **Trigger:** HTTP GET to `/api/v1/audit-log`.
- **Inputs:** `workspace_id: UUID`, `entity_type: String (optional)`, `action: String (optional)`, `actor_id: UUID (optional)`, `page: Integer (default = 1)`, `page_size: Integer (default = 50)`.
- **Outputs:** `total_records: Integer`, `records: List[AuditLogEntrySchema]`.
- **Business Rules (`BR`):** Deterministic descending chronological sort (`created_at DESC`).
- **Validations:** Page size $\le 100$.
- **Error Cases:** None.
- **Permissions:** Restricted to `approver`, `brand_manager`, `it_admin`.
- **Audit Event:** None (read operation).
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `FR-23`, `JRN-05`, `TSK-M1-07`.

---

## 10. Workspace Administration & Identity

### FN-USR-01: Authenticate User & Issue Token Cookie
- **Purpose:** Verify user credentials via Argon2 and issue an authenticated session token in an `httpOnly` cookie.
- **Actor:** Unauthenticated user.
- **Trigger:** HTTP POST to `/api/v1/auth/login`.
- **Inputs:** `email: String`, `password: String`.
- **Outputs:** `user_profile: UserSchema`, Set-Cookie header with `access_token` (`httpOnly`, `SameSite=Lax`, `Secure` in prod).
- **Business Rules (`BR`):**
  - `BR-USR-01` [STD, Sec 5.2, 7.3; DHRUV-V3, AD-03]: Passwords hashed using Argon2 (`argon2-cffi`). Passwords are never logged.
  - `BR-USR-02` [STD, Sec 7.5]: Tokens transmitted strictly via `httpOnly`, `SameSite` cookies to prevent client-side JavaScript exfiltration. Session-storage token fallback is prohibited.
- **Validations:** Valid email format; non-empty password.
- **Error Cases:**
  - `401 UNAUTHORIZED (INVALID_CREDENTIALS)`: Email not found or hash mismatch.
- **Permissions:** Public route.
- **Audit Event:** `auth.login_success` / `auth.login_failure`.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `ARCH, Sec 5`, `TSK-M1-06`.

---

### FN-USR-02: Enforce Tenant Row-Level Security
- **Purpose:** Isolate all relational database queries to the active user's workspace.
- **Actor:** Database Session Dependency (`backend/app/db/session.py`).
- **Trigger:** Executed at the boundary of every database transaction.
- **Inputs:** `active_workspace_id: UUID`.
- **Outputs:** Session context with `SET LOCAL app.current_workspace_id = '{active_workspace_id}'`.
- **Business Rules (`BR`):**
  - `BR-USR-03` [STD, Sec 5.4.2; ARCH, Sec 8; DHRUV-V3, AD-04]: Every tenant table enforces PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`). The application connects as a non-superuser role without `BYPASSRLS`.
  - `BR-USR-04`: If `app.current_workspace_id` is unset or empty, all queries on tenant tables return zero rows or throw an error. This is a verified, tested behavior.
- **Validations:** Workspace ID must exist.
- **Error Cases:** Missing workspace context rejects query execution.
- **Permissions:** System database dependency.
- **Audit Event:** None.
- **Priority & Milestone:** P0 | Milestone 1 (M1).
- **Linked Requirements & Journeys:** `STD, Sec 5.4`, `ARCH, Sec 8`, `TSK-M1-07`.

---

## 11. Offline Evaluation Harness

### FN-EVL-01: Execute Comparative Evaluation Run
- **Purpose:** Execute a standardized offline benchmark comparing the Canon hybrid pipeline against an LLM-only baseline across ~120 synthetic test cases.
- **Actor:** `it_admin`, Engineering Team.
- **Trigger:** CLI execution (`make eval`) or HTTP POST to `/api/v1/eval/run`.
- **Inputs:** `dataset_path: String (default = 'data/eval/cases.json')`.
- **Outputs:** `eval_run_id: UUID`, `precision_per_category: Dict`, `recall_per_category: Dict`, `evidence_verified_rate: Float`, `consistency_score: Float`, `injection_resistance_rate: Float`.
- **Business Rules (`BR`):**
  - `BR-EVL-01` [STD, Sec 9.6, 9.7; PRD, Sec 15]: The harness reports empirical measured figures without hardcoded target assertions.
- **Validations:** Dataset must conform to `EvalCaseSchema`.
- **Error Cases:** `400 BAD_REQUEST (DATASET_NOT_FOUND)`.
- **Permissions:** Restricted to `it_admin`.
- **Audit Event:** `eval.executed` (records run ID, summary metrics).
- **Priority & Milestone:** P1 | Milestone 2 (M2).
- **Linked Requirements & Journeys:** `FR-31`, `STD, Sec 9`, `ARCH, Sec 13`, `TSK-M2-07`.
