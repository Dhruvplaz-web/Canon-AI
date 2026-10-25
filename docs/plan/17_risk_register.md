# Canon: Comprehensive Risk Register & Fallback Protocol (17_risk_register.md)

**Document ID:** `DOC-17`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [PRD, Sec 17] `file:///E:/Software/codex/Docuements/Canon%20Product%20Requirements%20Document.pdf`, [ARCH, Sec 12, 17] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [DHRUV-V3, Sec 10] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Risk Management Framework

Canon categorizes risks across technical architecture, model dependencies, cloud operations, startup viability, and competitive execution.

```
+----------------------------------------------------------------------------------------------------+
|                                      RISK SEVERITY MATRIX                                          |
+----------------------------------------------------------------------------------------------------+
|   IMPACT       |   LOW LIKELIHOOD        |   MEDIUM LIKELIHOOD         |   HIGH LIKELIHOOD         |
|:---------------|:------------------------|:----------------------------|:--------------------------|
|   CRITICAL     | RSK-06 (Injection Leak) | RSK-01 (LLM Outage)         | RSK-07 (Scope Creep)      |
|                | RSK-16 (RLS Leakage)    | RSK-04 (DB Pause)           |                           |
|   HIGH         | RSK-14 (Trademark)      | RSK-02 (Offset Drift)       | RSK-05 (VM Cold Start)    |
|                |                         | RSK-17 (Backend Bottleneck) | RSK-11 (Venue Wi-Fi Drop) |
|                |                         | RSK-03 (Verifier Drop)      |                           |
|   MEDIUM       | RSK-12 (PDF Memory)     | RSK-08 (CORS / Cookies)     | RSK-10 (Phantom Quotes)   |
|                | RSK-13 (PII in Logs)    | RSK-09 (Unverified Claims)  | RSK-15 (Competitor Move)  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Comprehensive Risk Register (17 Major Risks)

---

### RSK-01: External Hosted LLM Provider Outage or Rate Limit Depletion
- **Likelihood:** Medium | **Impact:** Critical
- **Owner:** Dhruv Patil
- **Description:** Cloud LLM provider (Mistral, Groq, or OpenAI) suffers service disruption, high API latency ($> 30\text{s}$), or rejects requests due to free-tier rate limits during judge evaluation.
- **Preventative Mitigation:** Implement deterministic SHA-256 response caching (`DOC-09, Sec 5`). Pre-warm cache with reference demo text.
- **Reactive Fallback:** If external call fails or times out after 1 retry, `STG-05` gracefully degrades: marks check run `status = PARTIAL`, preserves all deterministic findings (terms, claims, contrast), and renders an informational warning banner. Local containerized Ollama model profile ready as hot backup.
- **Activation Trigger:** API call returns HTTP 429/500/503 or elapsed time exceeds 15 seconds.

---

### RSK-02: Text Normalization & Character Offset Drift
- **Likelihood:** Medium | **Impact:** High
- **Owner:** Dhruv Patil (Assisted by Tanishka Bellale)
- **Description:** Character offset positions computed on normalized text (after stripping ligatures, line breaks, or diacritics) do not align with original document indices, causing highlights in `SCR-04` to shift or truncate text.
- **Preventative Mitigation:** Build and unit-test the bi-directional offset map (`TSK-M1-09`) on Day 1 before any check rules are wired. Test with Unicode edge cases.
- **Reactive Fallback:** Fall back to sentence-level boundary highlighting instead of precise character-span highlighting.
- **Activation Trigger:** Unit test `test_normalize.py` detects offset mismatch between target word and original document slice.

---

### RSK-03: Double-Receipt Verifier Over-Pruning (False Negative Drop)
- **Likelihood:** Medium | **Impact:** High
- **Owner:** Dhruv Patil
- **Description:** Strict fuzzy matching thresholds in `STG-06` fail to match valid, genuine findings because of minor punctuation or line-wrap variations, incorrectly dropping real violations.
- **Preventative Mitigation:** Implement two-tiered matching (exact substring first; sliding window fuzzy second with configurable threshold `0.85`). Strip leading/trailing punctuation from candidate slices.
- **Reactive Fallback:** Lower `SUBMISSION_FUZZY_MATCH_THRESHOLD` in `config.py` from `0.85` to `0.75` for the demo session.
- **Activation Trigger:** Evaluation harness reports verified drop rate exceeding 10% on known true-positive test cases.

---

### RSK-04: Free-Tier Database Inactivity Pausing (Supabase Pause)
- **Likelihood:** Medium | **Impact:** Critical
- **Owner:** Dhruv Patil
- **Description:** Supabase automatically pauses inactive free-tier PostgreSQL projects after 7 days of inactivity, causing live demo connections to fail.
- **Preventative Mitigation:** Schedule an automated daily heartbeat script (`curl https://canon-api.onrender.com/api/v1/health/ready`) or GitHub Actions cron to ping database daily.
- **Reactive Fallback:** Unpause project from Supabase console prior to presentation; keep local Docker Compose demo profile running on laptop as immediate instant failover.
- **Activation Trigger:** Database health endpoint returns connection timeout or connection refused.

---

### RSK-05: Free-Tier Cloud VM Cold-Start Latency (Render 50-Second Spin-Up)
- **Likelihood:** High | **Impact:** High
- **Owner:** Dhruv Patil
- **Description:** Render / Railway free compute instances spin down after 15 minutes of inactivity. When a judge loads the URL, the initial request hangs for 45–60 seconds.
- **Preventative Mitigation:** Team executes warm-up ping 5 minutes prior to live presentation.
- **Reactive Fallback:** If public cloud instance experiences cold start, immediately switch screen share to local Docker demo instance (`localhost:3000`) running identical code.
- **Activation Trigger:** Live API response latency $> 5$ seconds during pre-demo check.

---

### RSK-06: Prompt Injection Evasion through Unicode Obfuscation
- **Likelihood:** Low | **Impact:** Critical
- **Owner:** Dhruv Patil
- **Description:** A malicious draft evades regex filters using zero-width spaces, Cyrillic homoglyphs, or base64 encoding to trick the LLM into auto-approving content.
- **Preventative Mitigation:** Unicode NFKC normalization flattens homoglyphs before scanner execution. Two-lane trust boundary treats content as data; the LLM has zero authority to approve or mutate state.
- **Reactive Fallback:** Human reviewer gate catches unverified text; unsupported claims automatically escalate as Critical.
- **Activation Trigger:** Adversarial test suite detects model compliance with an embedded command.

---

### RSK-07: Scope Creep Exceeding 48-Hour Hackathon Capacity
- **Likelihood:** High | **Impact:** Critical
- **Owner:** Tanishka Gawale (Project Manager)
- **Description:** Team attempts to build secondary features (image analysis, threaded comments, PDF export, binary PDF parsing, embeddings), jeopardizing delivery of the core double-receipt verification and backtest acceptance test.
- **Preventative Mitigation:** Hard scope governance: Milestone 1 is strictly capped at **17 tables** (including `approved_claim` with `valid_until` and Group 5 governance intelligence tables; `job` is table #24). Binary PDF parsing, embeddings, Ollama, Railway, and localhost Docker profile are cut upfront. Mandatory Go/No-Go checkpoints enforced at Hours 12, 24, and 36.
- **Predetermined Hour 12 Scope Cuts (Review Condition 8):** If behind schedule at Hour 12, immediately execute the predetermined cut list: (1) cut dynamic proposal generation and use static seeded proposal `PROP-01`, (2) cut WCAG relative luminance contrast math from Stage 3, (3) cut fuzzy near-miss token sorting (retain exact keyword matching only), and (4) freeze secondary review queue filters.
- **Activation Trigger:** Any critical backend or frontend task falling behind by $> 1.5$ hours at the H12 checkpoint.

---

### RSK-08: Single-Origin Cookie-Proxy Routing / Rewrite Failure
- **Likelihood:** Medium | **Impact:** High
- **Owner:** Dhruv Patil & Tanishka Bellale
- **Description:** Next.js App Router edge rewrites fail to proxy request bodies or drop the `Set-Cookie` / `Cookie` header between Vercel and Render, breaking authentication.
- **Preventative Mitigation:** Deploy and verify cloud edge rewrites in Hours 00–04 (`TSK-M1-04`); assert `Set-Cookie` header persistence and body transmission using `backend/tests/e2e/test_proxy.py`. Session tokens reside strictly in `httpOnly` secure cookies; no localStorage or sessionStorage token storage is permitted.
- **Reactive Fallback:** If Vercel edge rewrites fail, configure FastAPI with explicit CORS credentials (`allow_origins=["https://canon-web.vercel.app"]`, `allow_credentials=True`) with `SameSite=None; Secure` cookies, keeping tokens in httpOnly cookies without falling back to client storage.
- **Activation Trigger:** Edge proxy test in Hour 04 fails to pass cookies or returns 502 Bad Gateway.

---

### RSK-09: Unverified or Borrowed Benchmark Claims in Pitch Materials
- **Likelihood:** Medium | **Impact:** Medium
- **Owner:** Tanishka Gawale & Prathmesh Shinde
- **Description:** Team members inadvertently quote unmeasured marketing claims (e.g., "Canon achieves 99% accuracy") during the live presentation, damaging credibility with technical judges.
- **Preventative Mitigation:** Strict enforcement of `STD, Sec 9.7` and `DOC-11, Sec 5` ("Claims We May Make / May NOT Make"). All pitch numbers must trace directly to an immutable `eval_run` record.
- **Reactive Fallback:** Pitch lead intervenes immediately to state: *"That figure represents vendor-stated industry claims; our own measured evaluation on synthetic benchmarks is X%."*
- **Activation Trigger:** Pre-presentation dry run audit detects unverified claims in slides.

---

### RSK-10: Hallucinated Guideline Quotes & Page Citations
- **Likelihood:** High | **Impact:** Medium
- **Owner:** Dhruv Patil
- **Description:** Generative LLM invents a plausible-sounding brand rule or cites page 42 in an 8-page guideline PDF.
- **Preventative Mitigation:** Programmatic Double-Receipt Verifier (`STG-06`) verifies Receipt B. The verifier checks that cited `rule_code` exists in active policy and searches the document text for the exact quote.
- **Reactive Fallback:** Verifier drops the finding before it reaches the UI; dropped count logged to telemetry.
- **Activation Trigger:** Verifier string matching returns zero matches in source document text.

---

### RSK-11: Presentation Venue Wi-Fi Failure / Network Severance
- **Likelihood:** High | **Impact:** High
- **Owner:** Entire Team
- **Description:** Presentation venue loses internet connectivity during the live 3-minute hackathon evaluation.
- **Preventative Mitigation:** Laptop hotspot ready; local Docker Compose profile (`infra/docker-compose.local-demo.yml`) running in background; pre-recorded 3-minute offline video walkthrough stored on desktop.
- **Reactive Fallback:** Instantly switch projector display to local Docker demo instance; if computer hangs, play pre-recorded offline walkthrough video.
- **Activation Trigger:** Network disconnect notification or browser connection error during presentation.

---

### RSK-12: High-Volume PDF Extraction Memory Saturation
- **Likelihood:** Low | **Impact:** Medium
- **Owner:** Dhruv Patil
- **Description:** Uploading an uncompressed 50 MB PDF causes PyMuPDF to exceed the 512 MB memory ceiling of the free-tier cloud container, triggering an OOM crash.
- **Preventative Mitigation:** Enforce strict file size limits in reverse proxy and FastAPI (`MAX_UPLOAD_SIZE = 15 MB`). Process pages in streaming generator batches.
- **Reactive Fallback:** Fast error return: HTTP 413 `FILE_SIZE_EXCEEDED` before attempting extraction.
- **Activation Trigger:** Uploaded file size exceeds 15 MB or container memory usage $> 80\%$.

---

### RSK-13: Inadvertent PII or Confidential Text Leakage in Logs
- **Likelihood:** Low | **Impact:** Medium
- **Owner:** Dhruv Patil
- **Description:** Sensitive customer text or plain passwords are logged to application console outputs, violating enterprise privacy standards.
- **Preventative Mitigation:** Custom log formatter strips request bodies and formats structural IDs only (`workspace_id`, `check_run_id`).
- **Reactive Fallback:** Automated pre-commit hook scans codebase for `print()` statements and unescaped payload logging.
- **Activation Trigger:** Static analysis scan or CI log inspection detects string matching document text in logs.

---

### RSK-14: Trademark Conflict on "Canon" Working Name
- **Likelihood:** Low | **Impact:** Medium
- **Owner:** Prathmesh Shinde & Tanishka Gawale
- **Description:** Camera manufacturer Canon Inc. or existing software vendors contest the trademark name "Canon".
- **Preventative Mitigation:** All documents and pitch materials explicitly designate "Canon" as a **"Working Title (Trademark Check Pending)"**.
- **Reactive Fallback:** Brand pivot to secondary pre-cleared working name (e.g., "BrandCanon", "LexBrand", "Veritas Governance") prior to commercial SaaS launch.
- **Activation Trigger:** Post-hackathon legal trademark clearance search indicates potential confusion.

---

### RSK-15: Incumbent Competitor Moves into Evidence-Backed Verification
- **Likelihood:** High | **Impact:** Medium
- **Owner:** Product Team
- **Description:** Adobe GenStudio or Bynder announces receipt-backed verification or override rule learning.
- **Preventative Mitigation:** Deepen defensibility through ecosystem neutrality (integrating across Figma, Word, Google Docs, Notion) and open Model Context Protocol (MCP) server integration.
- **Reactive Fallback:** Position Canon as the independent, enterprise-wide verification standard that referees across multiple competing content creation tools.
- **Activation Trigger:** Major enterprise competitor product announcement.

---

### RSK-16: Database Schema / RLS Misconfiguration Leaking Multi-Tenant Data
- **Likelihood:** Low | **Impact:** Critical
- **Owner:** Dhruv Patil
- **Description:** A missing `WHERE workspace_id = ...` clause or failure to invoke `SET LOCAL app.current_workspace_id` allows Tenant A to see Tenant B's draft copy or leaked governance policies.
- **Preventative Mitigation:** Enforce `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all 17 tenant tables in PostgreSQL. The application database user (`canon_app`) lacks `BYPASSRLS`. Crucially, author and enforce the tested invariant: when `app.current_workspace_id` is unset or null, `NULLIF(current_setting('app.current_workspace_id', true), '')::uuid` evaluates to NULL, returning zero rows on `SELECT` and raising an authorization error on `INSERT`/`UPDATE` (`test_rls_unset_workspace`).
- **Reactive Fallback:** Any query executed without explicit workspace session context returns 0 rows or terminates with a database check violation.
- **Activation Trigger:** Integration test `backend/tests/integration/test_rls_isolation.py::test_rls_unset_workspace` fails in CI.


---

### RSK-17: Single-Backend-Developer Bottleneck & Knowledge Concentration
- **Likelihood:** Medium | **Impact:** High
- **Owner:** Dhruv Patil & Prathmesh Shinde (Assisted by Tanishka Gawale)
- **Description:** Dhruv Patil is the primary author of backend services, database migrations, check pipeline, and backtest engine. If Dhruv encounters unexpected blockers, fatigue, or delays, the entire backend critical path stalls.
- **Preventative Mitigation:**
  1. **Mandatory Second Diff Reviewer:** Prathmesh Shinde is assigned as active Second Diff Reviewer on all non-security backend code, ensuring duplicate architectural understanding across two team members.
  2. **Early Contract & Mock Delivery (Hour 04):** Export OpenAPI 3.1 schema and typed TypeScript mock fixtures in `TSK-M1-05`, decoupling frontend development from backend velocity.
  3. **Strict Task Sizing (<= 2.0h):** Tasks are bounded so Prathmesh Shinde or Tanishka Bellale can take over modules if needed.
  4. **Predetermined Hour 12 Cut List:** Hard triggers at Hour 12 checkpoint to drop optional backend algorithmic complexity.
- **Reactive Fallback:** If backend velocity falls behind schedule at Hour 12, immediately execute predetermined scope cuts: switch to seeded static proposal `PROP-01`, freeze optional deterministic checks, and allow frontend to run against mock fixtures for secondary views.
- **Activation Trigger:** Backend critical path falls $> 1.5$ hours behind schedule at the Hour 12 or Hour 24 checkpoint.