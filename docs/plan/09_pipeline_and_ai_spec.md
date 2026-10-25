# Canon: Verification Pipeline & AI Runtime Specification (09_pipeline_and_ai_spec.md)

**Document ID:** `DOC-09`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [ARCH, Sec 6] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [STD, Sec 3, 8] `file:///E:/Software/codex/Docuements/Canon%20AI%20Rules%20and%20Engineering%20Standards.pdf`, [PRD, Sec 5, 7.2] `file:///E:/Software/codex/Docuements/Canon%20Product%20Requirements%20Document.pdf`, [DHRUV-V3, Sec 2.3, 4] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Pipeline Architecture Overview & Execution Flow

The Canon verification check pipeline is orchestrated as a deterministic sequential state machine executed asynchronously per `submission_version`.

```
+----------------------------------------------------------------------------------------------------+
|                                    VERIFICATION PIPELINE FLOW                                      |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [SUBMISSION VERSION INPUT] (Pasted Text, DOCX, or PDF)                                            |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-01: Document Parsing & Text Normalization                                                |  |
|  | - Milestone 1: UTF-8 plain text normalization & offset mapping (PyMuPDF deferred to M2)       |  |
|  | - Unicode NFKC normalization + generate bi-directional offset map                           |  |
|  +----------------------------------------------------------------------------------------------+  |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-02: Security & Prompt Injection Scan                                                     |  |
|  | - Heuristic & regex inspection of normalized text & embedded metadata                        |  |
|  | - Neutralize hostile instructions; flag injections as CRITICAL findings                      |  |
|  +----------------------------------------------------------------------------------------------+  |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-03: Deterministic Rules Engine (Pure Python / Code Only)                                 |  |
|  | - Exact terms (Regex) & Lemma match (spaCy)                                                  |  |
|  | - Near-miss brand terms (RapidFuzz token distance)                                           |  |
|  | - Factual claim ledger lookup & number/date/unit mismatch detector                           |  |
|  | - WCAG relative luminance contrast calculation                                               |  |
|  +----------------------------------------------------------------------------------------------+  |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-04: Policy Context Retrieval Engine                                                      |  |
|  | - Milestone 1: Pass-All Mode (active rule set is small, <= 20 rules)                          |  |
|  | - Milestone 2+: Local bge-small embeddings + pgvector top-k retrieval                        |  |
|  +----------------------------------------------------------------------------------------------+  |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-05: AI Semantic Analysis & Suggestion Engine (Temp = 0)                                  |  |
|  | - Isolated adapter calling hosted LLM; Pydantic schema validation                            |  |
|  | - Voice & tone evaluation; paraphrased unsupported claim detection                           |  |
|  | - Intent-preserving rewrite generation; logs call to ai_service_call                         |  |
|  +----------------------------------------------------------------------------------------------+  |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-06: Programmatic Double-Receipt Verifier                                                 |  |
|  | - Receipt A: Confirms flagged quote exists in submission at specified offsets                |  |
|  | - Receipt B: Confirms cited source quote exists in active policy document at locator         |  |
|  | - Unverified or hallucinated findings dropped from confirmed reviewer view                   |  |
|  +----------------------------------------------------------------------------------------------+  |
|              |                                                                                     |
|              v                                                                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | STG-07: Merge, Deduplication & Severity Ranking                                              |  |
|  | - Deterministic findings win over semantic findings on identical spans                       |  |
|  | - Rank: CRITICAL > MAJOR > MINOR; persist findings to database                               |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Granular Stage Specifications

---

### STG-01: Ingestion, Document Parsing & Text Normalization
- **Purpose:** Ingest raw multi-format content, extract plain text with spatial coordinates, perform Unicode normalization, and build an exact bi-directional character offset map.
- **Inputs:** `file_bytes: Bytes` or `raw_text: String`, `submission_type: Enum [PLAIN_TEXT, DOCX, PDF]`.
- **Outputs:**  
  - `normalized_text: String` (UTF-8, Unicode NFKC normalized).
  - `offset_map: List[Tuple[Int, Int]]` (maps normalized character index to original document byte/character position).
  - `structural_segments: List[Segment]` (paragraphs, sentences, headings).
  - `hidden_spans: List[Span]` (detected hidden text, e.g., tiny fonts $< 2\text{pt}$ or zero-contrast text in PDF/DOCX).
- **Libraries Used (M1):** Python `unicodedata`, standard string processing. (PyMuPDF / python-docx deferred to M2).
- **Failure Behavior:** If document is password-protected, encrypted, or corrupted, abort run immediately with HTTP 422 `EXTRACTION_CORRUPTED`.
- **Tests:** `tests/unit/pipeline/test_normalize.py` (table-driven tests covering ligatures, non-breaking spaces, Windows CRLF, and diacritics).

---

### STG-02: Security & Prompt Injection Scan
- **Purpose:** Neutralize adversarial prompt injection payloads embedded in submitted content or document metadata.
- **Inputs:** `normalized_text: String`, `hidden_spans: List[Span]`.
- **Outputs:** `injection_findings: List[Finding]`, `sanitized_text: String`.
- **Mechanism:**
  - Evaluates regex patterns for instruction overrides (e.g., `ignore previous instructions`, `system prompt`, `you are now`, `output only approved`).
  - Evaluates hidden spans detected in STG-01 (white text on white background, invisible metadata).
- **Security Business Rules (`BR`):**
  - `BR-STG-01` [STD, Sec 3.4, 8.8]: Submitted text is **NEVER** treated as instructions. Instruction phrases are flagged as `CRITICAL (PROMPT_INJECTION_DETECTED)` findings.
  - `BR-STG-02`: Injection findings block automatic clearance and mandate manual reviewer escalation.
- **Failure Behavior:** Internal error defaults to logging a security finding.
- **Tests:** `tests/adversarial/test_injection.py` (~10 synthetic jailbreaks, hidden comment injections, and unicode evasion tests).

---

### STG-03: Deterministic Rules Engine (Code-Only Execution)
- **Purpose:** Execute all exact policy rules using programmatic algorithms without invoking language models.
- **Inputs:** `normalized_text: String`, `active_rules: List[Rule]`, `claims_ledger: List[ApprovedClaim]`.
- **Outputs:** `deterministic_findings: List[Finding]`.
- **Modules in Engine:**
  1. `terms.py` (Forbidden & Required Terms): Evaluates word-boundary regex (`\b(?i)forbidden_word\b`) combined with spaCy lemma matching to catch inflected forms (e.g., "guaranteeing", "guaranteed").
  2. `near_miss.py` (Brand Term Near-Misses): Evaluates RapidFuzz string distance between extracted brand terms and approved brand assets. Tunable threshold (`NEAR_MISS_THRESHOLD`).
  3. `claims.py` (Claim Ledger Matching): Matches factual assertions against the approved claim ledger. Extracts numerical figures, currency codes, dates, and units to flag discrepancies.
  4. `contrast.py` (WCAG Contrast Ratio): Computes luminance ratio using formula:
     $$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
     where $L = 0.2126 R + 0.7152 G + 0.0722 B$. Flags text failing WCAG AA (4.5:1 for normal text, 3.0:1 for large text).
  5. `disclosure.py` (Mandatory Disclosures): Scans for mandatory regulatory disclaimers (e.g., "Securities offered through Acme Financial, Member FINRA/SIPC").
- **Failure Behavior:** If an individual deterministic check fails or throws an exception, log the error and continue remaining checks; one rule failure does not halt the engine.
- **Tests:** `tests/unit/pipeline/test_deterministic.py` (unit tests for every check module with passing and failing edge cases).

---

### STG-04: Context Retrieval Engine
- **Purpose:** Retrieve the specific subset of brand rules and approved claims relevant to the submitted sentences.
- **Inputs:** `sentences: List[String]`, `active_rules: List[Rule]`, `claims_ledger: List[ApprovedClaim]`.
- **Outputs:** `retrieved_context: Dict[SentenceIndex, List[Rule]]`.
- **Operational Strategy:**
  - **Milestone 1 Strategy [DHRUV-V3, AD-06]:** **Pass-All Mode.** The active policy rule set contains $\le 20$ rules. All rules and claims are passed directly into the LLM prompt context window, eliminating vector search latency and embedding dependency during Round 2 evaluation.
  - **Milestone 2+ Strategy:** Generates 384-dimensional dense vectors using local `sentence-transformers` (`BAAI/bge-small-en-v1.5`). Queries PostgreSQL `pgvector` index via cosine distance (`vector_cosine_ops`) to retrieve top-$k$ rules ($k=5$).
- **Failure Behavior:** If vector retrieval fails, fall back to Pass-All mode automatically.
- **Tests:** `tests/unit/pipeline/test_retrieval.py`.

---

### STG-05: AI Semantic Analysis & Suggestion Engine
- **Purpose:** Analyze content for voice, tone, and paraphrased unsupported claims; synthesize intent-preserving rewrite suggestions.
- **Inputs:** `untrusted_text: String`, `retrieved_rules: List[Rule]`, `claims: List[ApprovedClaim]`.
- **Outputs:** `candidate_semantic_findings: List[CandidateFinding]`.
- **Runtime Standards:**
  - **Temperature:** Strictly `0.0` [STD, Sec 8.4; PRD, Sec 9].
  - **Prompt Isolation:** System instructions are versioned in files (`prompts/tone_check_v1.txt`). Untrusted submission text is passed inside clear XML data delimiters:  
    `<untrusted_submission_data> ... </untrusted_submission_data>`
  - **Structured Schema:** Output constrained to strict Pydantic JSON schema.
- **Pydantic Output Model:**
  ```python
  class CandidateFinding(BaseModel):
      rule_code: str
      category: Literal["TONE", "CLAIM"]
      severity: Literal["CRITICAL", "MAJOR", "MINOR"]
      flagged_quote: str
      source_quote: str
      source_page: int
      explanation: str
      suggested_fix: str
      confidence_score: float
  ```
- **Error Handling & Retry Rule (`BR-STG-03`) [STD, Sec 8.4]:**  
  On invalid JSON or Pydantic validation failure, retry invocation exactly once with explicit error feedback. If second attempt fails, abort semantic check, mark check run `status = PARTIAL`, and preserve all deterministic findings.
- **Telemetry Rule [STD, Sec 8.9]:** Every invocation synchronously logs provider, model, tokens, latency, and redaction status to `ai_service_call`.
- **Tests:** `tests/unit/pipeline/test_llm_adapter.py` (mocked LLM responses, retry behavior on malformed JSON).

---

### STG-06: Programmatic Double-Receipt Verifier
- **Purpose:** Verify that every finding generated by the LLM is factually anchored in both the submission text and official policy documentation before display.
- **Inputs:** `candidate_semantic_findings: List[CandidateFinding]`, `submission_text: String`, `active_rules: List[Rule]`, `source_documents: List[SourceDocument]`.
- **Outputs:** `verified_findings: List[Finding]`, `dropped_count: Integer`.
- **Dual Verification Algorithm:**
  1. **Receipt A (Submission Anchor Verification):**
     - Search for `flagged_quote` in `submission_text`.
     - First attempt: Exact substring match (`submission_text.find(flagged_quote)`).
     - Second attempt (if exact fails): Sliding window fuzzy match using RapidFuzz `partial_ratio`. If similarity $\ge \text{SUBMISSION\_FUZZY\_THRESHOLD}$ (Config: `0.85`), locate best-fit window and compute start/end character offsets.
     - If neither match succeeds: **RECEIPT A FAILS.**
  2. **Receipt B (Policy Source Receipt Verification):**
     - Verify that cited `rule_code` exists in the active policy version.
     - Fetch the official `source_document` linked to the rule.
     - Search for `source_quote` in the document text on the cited `page_number` ($\pm 1$ page window for reflow tolerance).
     - First attempt: Exact substring match.
     - Second attempt: Sliding window fuzzy match. If similarity $\ge \text{SOURCE\_FUZZY\_THRESHOLD}$ (Config: `0.85`), match succeeds.
     - If quote is not found in source text: **RECEIPT B FAILS.**
  3. **Adjudication Outcome:**
     - If Receipt A **AND** Receipt B pass: Set `verification_status = VERIFIED`. Include in confirmed findings list.
     - If either receipt fails: Set `verification_status = DROPPED`. Exclude from confirmed reviewer UI. Persist to database for evaluation metrics.
- **Failure Behavior:** Dropped findings never crash the pipeline; they are logged to measure verifier drop rate.
- **Tests:** `tests/unit/pipeline/test_verifier.py` (tests for exact quotes, fuzzy quotes, hallucinated rule codes, and hallucinated source quotes).

---

### STG-07: Merge, Deduplication & Severity Ranking
- **Purpose:** Consolidate deterministic and semantic findings, eliminate overlapping span duplicates, and apply strict severity ordering.
- **Inputs:** `verified_deterministic_findings: List[Finding]`, `verified_semantic_findings: List[Finding]`.
- **Outputs:** `final_findings: List[Finding]`.
- **Deduplication Rules:**
  - `BR-STG-04` [ARCH, Sec 6.2]: When a deterministic finding and a semantic finding overlap the identical character span, the deterministic finding is preserved and the semantic finding is merged or discarded.
  - Findings are sorted by severity hierarchy: `CRITICAL` (1) > `MAJOR` (2) > `MINOR` (3), secondary sorted by `start_offset ASC`.
- **Final Run State:** If zero findings exist, `submission.current_status` updates to `CLEAN`. Otherwise, updates to `PENDING_REVIEW`. Check run transitions to `COMPLETED`.
- **Tests:** `tests/unit/pipeline/test_merge.py`.

---

## 3. Tunable Configuration Parameters (No Magic Numbers)

- **FACT [STD, Sec 5.1.5; PRD, Sec 9]:** All algorithmic thresholds and tolerances are externalized in configuration (`backend/app/core/config.py`) rather than hardcoded magic numbers.

```python
# backend/app/core/config.py
class PipelineSettings(BaseSettings):
    # Deterministic Matching
    NEAR_MISS_STRING_DISTANCE_THRESHOLD: float = 85.0
    WCAG_CONTRAST_AA_NORMAL_RATIO: float = 4.5
    WCAG_CONTRAST_AA_LARGE_RATIO: float = 3.0
    
    # AI Runtime & Timeouts
    LLM_TEMPERATURE: float = 0.0
    LLM_TIMEOUT_SECONDS: int = 30
    LLM_MAX_RETRIES: int = 1
    
    # Double-Receipt Verifier Thresholds
    SUBMISSION_FUZZY_MATCH_THRESHOLD: float = 0.85
    SOURCE_DOCUMENT_FUZZY_MATCH_THRESHOLD: float = 0.85
    SOURCE_PAGE_TOLERANCE_WINDOW: int = 1
    
    # Governance & Rule Health
    RULE_HEALTH_MIN_SAMPLE_SIZE: int = 5
    RULE_HEALTH_NOISY_OVERRIDE_THRESHOLD: float = 0.40
    RULE_HEALTH_SCOPE_OVERRIDE_THRESHOLD: float = 0.30
```

---

## 4. Prompt Versioning & Catalog

All prompt templates are stored as plain text files under `backend/app/pipeline/llm/prompts/` and tracked in version control:

1. `tone_check_v1.txt`: System instructions for evaluating tone, voice, and formality against cited brand personality rules.
2. `claim_check_v1.txt`: Instructions for detecting factual assertions and cross-referencing against provided approved claim ledgers.
3. `suggestion_v1.txt`: Instructions for producing intent-preserving suggested rewrites that strictly resolve policy flags without adding unverified facts.
4. `rule_extraction_v1.txt`: Ingestion compiler prompt for parsing candidate rules from raw guideline documents.

---

## 5. Response Caching Engine

- **FACT [ARCH, Sec 6.5; DHRUV-V3, AD-07]:** To achieve $< 100\text{ms}$ latency during demonstrations and eliminate redundant API expenses during automated testing, the LLM adapter maintains an internal cache.
- **Cache Key Implementation:**
  ```python
  cache_key = hashlib.sha256(
      f"{content_chunk}:{rule_set_hash}:{model_name}:{prompt_version}".encode('utf-8')
  ).hexdigest()
  ```
- **Storage:** Persisted in PostgreSQL (`ai_service_cache` table) or local disk cache (`.cache/llm/`) during testing. Cached entries return immediately with `latency_ms = 0` and are tagged `cached = True` in disclosure telemetry.
