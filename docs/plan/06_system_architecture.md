# Canon: Target System Architecture & Technical Design (06_system_architecture.md)

**Document ID:** `DOC-06`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [ARCH, Sec 1-17] `file:///E:/Software/codex/Docuements/Canon%20System%20Architecture%20Document.pdf`, [STD, Sec 4-8] `file:///E:/Software/codex/Docuements/Canon%20AI%20Rules%20and%20Engineering%20Standards.pdf`, [DHRUV-V3, Sec 2-3] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [DIAG] `file:///E:/Software/codex/Docuements/Brand%20Governance%20Review%20Architecture.png`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. High-Level Target Architecture & Topology

Canon is structured as a modular, unified multi-tenant platform with clear physical and logical boundaries.

```
+----------------------------------------------------------------------------------------------------+
|                                    TARGET SYSTEM TOPOLOGY                                          |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   AUTHENTICATED CLIENTS (Browser / Mobile)                                                         |
|   - Content Creator, Reviewer, Approver, Brand Manager, IT Admin                                    |
|                                       |                                                            |
|                                       v HTTPS                                                      |
|   +--------------------------------------------------------------------------------------------+   |
|   | SINGLE-ORIGIN EDGE LAYER (Next.js on Vercel)                                               |   |
|   | - Serves React / Next.js Web Application                                                   |   |
|   | - Edge Rewrite Proxy: Routes `/api/v1/*` to Backend API Host                               |   |
|   | - Handles `httpOnly`, `SameSite=Lax` Cookie Transmission on Single Origin                  |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                       |                                                            |
|                                       v HTTPS / Encrypted Tunnel                                   |
|   +--------------------------------------------------------------------------------------------+   |
|   | BACKEND APPLICATION SERVICE (FastAPI on Render (Single Host for M1))                 |   |
|   |                                                                                            |   |
|   |  +-----------------------+  +-----------------------+  +--------------------------------+  |   |
|   |  | API ROUTERS (/api/v1) |  | AUTH & SECURITY CORE  |  | BUSINESS SERVICES              |  |   |
|   |  | - Auth, Policy, Subs, |  | - JWT verification    |  | - Policy, Submission, Review,  |  |   |
|   |  | - Findings, Decisions,|  | - Argon2 hashing      |  | - Rule Health, Backtest, Audit |  |   |
|   |  | - Governance, Admin   |  | - `require_role` guard|  +--------------------------------+  |   |
|   |  +-----------------------+  +-----------------------+                  |                   |   |
|   |                                                                        v                   |   |
|   |  +--------------------------------------------------------------------------------------+  |   |
|   |  | IN-PROCESS JOB ORCHESTRATION & CHECK PIPELINE (FastAPI BackgroundTasks)              |  |   |
|   |  | [1. Normalize & Map] -> [2. Injection Scan] -> [3. Deterministic Rules Engine]     |  |   |
|   |  |               -> [4. Retrieval Engine] -> [5. LLM Adapter (Temp 0)]                  |  |   |
|   |  |               -> [6. Double-Receipt Verifier] -> [7. Deduplicate & Merge]            |  |   |
|   |  +--------------------------------------------------------------------------------------+  |   |
|   +--------------------------------------------------------------------------------------------+   |
|                  |                                       |                           |             |
|                  v SQL (Session RLS Context)             v Local / S3                v HTTPS (JSON)|
|   +-------------------------------+   +-----------------------------+   +----------------------+   |
|   | MANAGED POSTGRESQL (Supabase) |   | ASSET STORAGE               |   | HOSTED LLM PROVIDER  |   |
|   | - 26 Relational Tables (including `job` table)        |   | - SHA-256 Hashed Uploads    |   | - Model Provider API |   |
|   | - JSONB Semi-Structured Data  |   | - Guideline Source PDFs     |   | - Schema JSON Mode   |   |
|   | - `pgvector` Embeddings       |   | - Original Submissions      |   | - Data Retention Verified (`VER-11`) |   |
|   | - Row-Level Security (RLS)    |   +-----------------------------+   +----------------------+   |
|   | - Revoked Audit UPDATE/DELETE |                                                                |
|   +-------------------------------+                                                                |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Trust Boundaries & Two-Lane Security Architecture

- **FACT [STD, Sec 3.1-3.4, 7.1; ARCH, Sec 4]:** Canon enforces a strict physical and logical boundary separating trusted governance data from untrusted user content and probabilistic AI operations.

```
+--------------------------------------------------------------------------------------------------+
|                                  TWO-LANE TRUST BOUNDARIES                                       |
+--------------------------------------------------------------------------------------------------+
|  TRUSTED GOVERNANCE PLANE (Lane 1)              |  UNTRUSTED CONTENT REVIEW PLANE (Lane 2)       |
|  - Source Policy Documents (PDF/DOCX)           |  - Content Submissions (Text, DOCX, PDF)       |
|  - Active Policy Versions (v1.0, v1.1)          |  - Normalized Submission Spans                 |
|  - Approved Rules & Scope Filters               |  - User Comments & Dispute Notes               |
|  - Approved Claim Ledger (validity windows)     |  - External Retrieved Web Text                 |
|  - Approved Asset References                    |                                                |
|                                                 |  ACCESS RULE:                                  |
|  ACCESS RULE:                                   |  - Any authenticated workspace submitter       |
|  - Modified ONLY by authenticated humans        |  - Treated strictly as DATA, NEVER as          |
|    (`brand_manager`, `approver`)                |    instructions                                |
|  - Database application role enforces RLS       |  - Scanned for prompt injection prior to LLM   |
|  - Pipeline has READ-ONLY access                |                                                |
+--------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+--------------------------------------------------------------------------------------------------+
|  AI RUNTIME BOUNDARY (Stateless Execution Zone)                                                  |
|  - Input: Untrusted text wrapped in strict XML data delimiters + relevant retrieved rules.       |
|  - Execution: Provider adapter calling hosted model at Temperature 0; timeout enforced.          |
|  - Output: Schema-constrained candidate JSON; validated by Pydantic; max 1 retry on error.        |
|  - ZERO direct database access, ZERO network tools, ZERO authority to approve or mutate state.   |
|  - Output MUST pass programmatic Double-Receipt Verifier before entering human review lane.       |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Component Responsibilities

| Component Name | Physical Runtime | Core Technical Responsibilities | Prohibited Actions (Non-Goals) |
|:---|:---|:---|:---|
| **Web Frontend** | Next.js (Node 20 / Vercel Edge) | Role-aware presentation, split-screen PDF highlighting, review queues, Rule Health charts, form validation via Zod. | Never evaluates business rules; never holds master secrets; never acts as auth authority. |
| **Reverse Proxy / Edge** | Next.js API Rewrites / Caddy | TLS termination, single-origin proxying (`/api/v1/*` $\to$ backend), `httpOnly` cookie forwarding. | Does not parse or mutate request bodies. |
| **Backend API Core** | FastAPI / Uvicorn (Python 3.12) | REST routing, Pydantic request/response validation, JWT issuance, Argon2 password hashing, RBAC enforcement. | No raw SQL concatenation; thin routers delegate to services. |
| **Business Services** | Python Service Layer | Transaction management, policy compilation, audit emission, submission status transitions. | Does not expose internal database models directly to API responses. |
| **Check Pipeline** | Python in-process worker (`BackgroundTasks`) | Document parsing, text normalization, regex/spaCy checks, LLM adapter invocation, double-receipt verification. | Read-only to policy tables; cannot approve rules, publish versions, or modify audit logs. |
| **Managed Database** | PostgreSQL 16+ (`pgvector`, JSONB) | Relational integrity, foreign key constraints, workspace RLS, vector indexing, append-only audit enforcement. | Never accessed via superuser; no plaintext password storage. |
| **Asset Storage** | Supabase Storage / Volume | Content-addressed storage (`/sources/{sha256}`, `/submissions/{sha256}`). | Never stores unhashed or mutable files. |

---

## 4. Architectural Decisions & Trade-Offs (ADR Register)

### DEC-ARCH-01: Backend Web Framework & Language
- **Context:** Selecting the primary server-side runtime for Canon.
- **DECISION:** Python 3.12 with **FastAPI**, **Pydantic v2**, and **Uvicorn**.
- **Alternatives Considered:**
  1. *Node.js / NestJS:* Rejected. While excellent for general web APIs, the core of Canon is document NLP (PyMuPDF, spaCy, RapidFuzz) and local embeddings (`sentence-transformers`). Node.js lacks equivalent native NLP library ecosystems and would require awkward multi-process IPC bridges.
  2. *Go / Gin:* Rejected. Extremely fast, but severely deficient in document extraction (DOCX/PDF word coordinate bounding boxes) and Python NLP interoperability.
- **Trade-Off:** Python has slightly higher baseline memory consumption than Go, mitigated by running a single unified API process.

---

### DEC-ARCH-02: Database & Vector Architecture (Single vs. Multi-Store)
- **Context:** Deciding storage engine for relational data, semi-structured JSONB, and vector embeddings.
- **DECISION:** Standardize on a single **PostgreSQL** instance with **JSONB** and the **`pgvector`** extension.
- **Alternatives Considered:**
  1. *Separate Vector DB (Pinecone, Qdrant) + Postgres:* Rejected. Introduces distributed transaction overhead, multi-system network latency, synchronization bugs, and multiple distinct pricing tiers.
  2. *NoSQL (MongoDB):* Rejected. Fails to provide strict relational integrity, ACID transactions for audit logs, or foreign key cascades required for policy versioning.
- **Trade-Off:** Postgres `pgvector` has slightly lower index build throughput than dedicated vector engines at 10M+ scales. For Canon's operational scale (~1,000 rules and claims per tenant), `pgvector` executes in $< 10\text{ms}$ while maintaining single-database transactional consistency.

---

### DEC-ARCH-03: Local SQLite vs. Pure PostgreSQL (Resolution of `CONF-01`)
- **Context:** The uploaded architecture diagram depicted `SQLite (Local / Dev)` syncing bi-directionally with Supabase, whereas `Canon AI Rules and Engineering Standards` section 4.1 explicitly bans SQLite.
- **DECISION:** **Strictly Pure PostgreSQL Everywhere.** Docker Compose with PostgreSQL 16 + pgvector for local development and CI testing; managed PostgreSQL (Supabase/Neon) for cloud staging and production. **Zero SQLite usage.**
- **Rationale & Analysis:**
  - SQLite lacks Row-Level Security (`RLS`), database user role privilege separation (`REVOKE UPDATE/DELETE`), and native `pgvector` indexing.
  - Bi-directional sync between SQLite and Supabase is a notorious anti-pattern that creates distributed state conflicts and false development-vs-production test parity.
- **Trade-Off:** Requires running Docker on local development machines, which is standard senior engineering practice.

---

### DEC-ARCH-04: Authentication & Password Security (Resolution of `CONF-02`)
- **Context:** Diagram showed `Auth + RLS` inside Supabase, while engineering standards mandate custom FastAPI JWT with Argon2 password hashing.
- **DECISION:** Implement **Custom FastAPI Authentication** utilizing **Argon2** (`argon2-cffi`) for password hashing, **PyJWT** for token minting, and a centralized `require_role(...)` dependency on all API endpoints. The database acts strictly as a data store.
- **Rationale & Analysis:**
  - Supabase Auth couples the backend tightly to a proprietary vendor auth layer, complicating local container testing and offline evaluation.
  - Custom JWT in FastAPI allows precise control over token claims (`workspace_id`, `role`), enables seamless cookie proxying, and guarantees compliance with Argon2 standards.
  - PostgreSQL RLS is cleanly driven via `SET LOCAL app.current_workspace_id = '{workspace_id}'` inside each request's database transaction. When `app.current_workspace_id` is unset or null, RLS policies evaluate to false, returning zero rows or raising an authorization error (`test_rls_unset_workspace`).
- **Trade-Off:** Requires ~150 lines of standard Python security code rather than off-the-shelf hosted login widgets.

---

### DEC-ARCH-05: Background Job Orchestration (In-Process vs. Message Queue)
- **Context:** Orchestrating multi-second verification pipeline check runs.
- **DECISION:** Implement in-process asynchronous execution via **FastAPI `BackgroundTasks`** coupled with a transactional **`job`** database table.
- **Alternatives Considered:**
  1. *Celery + Redis / RabbitMQ:* Rejected for Milestone 1–2. Adds two additional long-running services, operational monitoring complexity, Redis connection state, and broker costs without necessity.
- **Rationale & Analysis:**
  - Content check runs execute in 2 to 6 seconds.
  - The `job` table tracks status (`QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`), error logs, and heartbeat timestamps. The frontend polls `/api/v1/jobs/{id}`.
  - If the server restarts during a run, a startup recovery hook marks orphaned `RUNNING` jobs as `FAILED` with an actionable retry button.
- **Trade-Off:** Heavy concurrent check loads could saturate the API event loop. Mitigated by offloading CPU-intensive parsing to a bounded `concurrent.futures.ThreadPoolExecutor`.

---

### DEC-ARCH-06: Reverse Proxy & Single-Origin Cookie Transport
- **Context:** Preventing Cross-Origin Resource Sharing (CORS) preflight friction and enabling secure, browser-native `httpOnly` cookie transmission.
- **DECISION:** Implement a **Single-Origin Edge Proxy** using Next.js `rewrites()` in `next.config.ts` for hosted cloud environments (and Caddy for Docker local development).
- **Architecture Flow:**
  - Client navigates to `https://canon.vercel.app` (Single Origin).
  - Web requests to `/api/v1/:path*` are transparently proxied to the FastAPI backend host (`https://canon-api.onrender.com/api/v1/:path*`).
  - Browser automatically attaches the `httpOnly`, `SameSite=Lax`, `Secure` cookie `access_token` to all `/api/*` requests without cross-origin cookie blocking.
- **Trade-Off:** Next.js serverless functions proxy API payloads, adding negligible $\sim 15\text{ms}$ latency while completely eliminating CORS vulnerabilities. Token storage in `localStorage` or `sessionStorage` is strictly prohibited and removed; tokens reside exclusively in `httpOnly` secure cookies.

---

### DEC-ARCH-07: LLM Provider Abstraction & Response Caching
- **Context:** Selecting and isolating generative language model providers.
- **DECISION:** Implement a strict **`LLMProvider` Protocol Adapter** (`backend/app/pipeline/llm/adapter.py`). Direct vendor SDK imports outside this file are banned. Responses are cached via a deterministic SHA-256 composite key.
- **Cache Key Formula:**  
  $$\text{CacheKey} = \text{SHA256}(\text{content\_chunk} + \text{rule\_set\_hash} + \text{model\_name} + \text{prompt\_version})$$
- **Rationale & Analysis:**
  - Makes live evaluations and demo runs instantaneous ($< 50\text{ms}$ on cache hit) and 100% cost-free.
  - Enables standardized switching between hosted model providers behind the adapter interface. Local models (Ollama) are deferred to M2.
- **Trade-Off:** Cache invalidation must be strictly tied to prompt and policy version increments.

---

### DEC-ARCH-08: Database Session Concurrency (Resolution of `CONF-07`)
- **Context:** Engineering Standards Section 15.2 notes "Confirm whether the project will use sync or async database sessions."
- **DECISION:** Standardize on **Sync SQLAlchemy 2.0 Sessions** (`sessionmaker`, `Session`) utilizing thread pools for background jobs.
- **Rationale & Analysis:**
  - Mixing `asyncpg` with synchronous CPU-bound NLP libraries (PyMuPDF, spaCy, RapidFuzz) frequently causes asyncio event loop starvation, thread safety bugs, and complex greenlet context issues.
  - Synchronous SQLAlchemy 2.0 with connection pooling (`QueuePool`) is rock-solid, well-documented, and trivially integrates with FastAPI threadpool dependencies (`def` endpoints).
- **Trade-Off:** Slightly lower theoretical I/O throughput under 10,000+ concurrent connections, which far exceeds startup requirements.

---

### DEC-ARCH-09: Policy Retrieval Architecture (Pass-All in M1; Embeddings Deferred to M2)
- **Context:** Selecting policy retrieval mechanism for Milestone 1 vs Milestone 2.
- **DECISION:** In Milestone 1, strictly use **Pass-All Mode** for active guideline rulesets ($\le 20$ rules). Vector embeddings, `pgvector`, and in-container embedding models (`bge-small`) are removed from M1 and deferred to Milestone 2.
- **Rationale & Analysis:**
  - Active rules in M1 are $\le 20$, easily fitting within a single LLM context window without chunking or vector search.
  - Eliminates container RAM bloat, model cold-start latency, sentence-transformers dependencies, and PyMuPDF coordinate parsing from M1.
  - Guarantees 100% rule recall in M1 with zero retrieval miss probability.
- **Trade-Off:** Pass-All does not scale past $\sim 100$ rules. In Milestone 2, local embeddings will be introduced alongside chunking.

---

## 5. Deployment Topology, Cloud-First Execution & Upgrade Path

### 5.1 Cloud Deployment Window (Hours 00–04)
- **Mandatory Directive:** Cloud Deployment is executed in Hours 00–04 of the 48-hour build.
- **Scope:** Supabase PostgreSQL instance (with initial schema migrations), Render FastAPI backend, Vercel frontend, `/api/v1` rewrite edge proxy, GitHub Actions CI auto-deploy pipelines, and the `/api/v1/health/live` + `/ready` check endpoints.
- **Contract:** All development from Hour 05 onward runs directly against the deployed environment. There is no isolated local demo profile or Railway mirror in Milestone 1; one host (Render) and one provider (Mistral or Groq behind the adapter). One pre-recorded fallback video is maintained for presentation backup.

```
+--------------------------------------------------------------------------------------------------+
|                               FREE TIER DEPLOYMENT TOPOLOGY (M1)                                 |
+--------------------------------------------------------------------------------------------------+
|  Layer               | Provider / Plan         | Technical Limits to Respect [VERIFY]            |
|:---------------------|:------------------------|:------------------------------------------------|
|  Frontend Web App    | Vercel Hobby Free Tier  | 100 GB bandwidth; Next.js App Router edge.     |
|  Edge Proxy          | Vercel Rewrites         | Transparent proxy of /api/v1 (body max VER-10). |
|  Backend API Service | Render Free (Single)    | 512 MB RAM; 0.1 CPU; spins down after 15m idle  |
|                      |                         | (Mitigated: warm-up ping / keepalive; VER-09). |
|  Relational Database | Supabase Free Project   | 500 MB DB; pauses after inactivity (VER-08);    |
|                      |                         | 26 tables deployed (including `job` table).     |
|  File / Guideline    | Ingested via JSON/Text  | Plain text / rules.json stored in DB (VER-01).  |
|  LLM Inference       | Mistral or Groq (Single)| Rate-limited tier behind adapter (VER-11).      |
|  Embeddings Engine   | Deferred to M2          | Pass-All mode in M1; 0 container memory cost.   |
|  Demo Fallback       | Single Recorded MP4     | Local/cloud hosted video for network failure.   |
+--------------------------------------------------------------------------------------------------+
```

### Commercial Paid Upgrade Path (Milestone 3+)
1. **Database:** Upgrade Supabase to Pro Tier ($25/mo) $\to$ unlocks daily automated backups, 8 GB compute RAM, unpausable instance, and connection pooler (PgBouncer/Supavisor).
2. **Backend API:** Upgrade Render to Starter VM ($7/mo) $\to$ eliminates cold starts, grants 2 GB dedicated RAM, supports multi-threaded Uvicorn workers.
3. **Storage:** Transition to AWS S3 / Cloudflare R2 (zero egress fees) for high-volume enterprise guideline assets.
4. **Queue Worker:** Provision standalone Redis instance ($5/mo) to decouple check pipeline execution from the web API process.

---

## 6. Observability, Logging & Failure Handling

### 6.1 Structured JSON Logging
- **FACT [STD, Sec 5.1.7, 5.2.8]:** All application logging is emitted as structured JSON to `stdout`.
- **Mandatory Fields:** `timestamp` (ISO-8601 UTC), `level` (`INFO`, `WARN`, `ERROR`), `request_id` (UUID), `workspace_id` (UUID), `check_run_id` (UUID, if in pipeline), `stage` (e.g., `STG-03`), `message`, `duration_ms`.
- **Absolute Privacy Prohibition [STD, Sec 5.1.7]:** Personal identifiable information (PII), plain passwords, API keys, and raw submitted document text are strictly forbidden in logs.

### 6.2 Health & Readiness Endpoints
- `GET /api/v1/health/live`: Returns `{"status": "ok"}` if the Uvicorn process is responsive.
- `GET /api/v1/health/ready`: Executes a database ping (`SELECT 1`) and verifies LLM adapter connectivity; returns `200 OK` or `503 SERVICE_UNAVAILABLE`.

### 6.3 Graceful Degradation Matrix
| Failure Mode | Impacted Stage | System Degradation Behavior | User-Facing Indication |
|:---|:---|:---|:---|
| **External LLM Outage / Timeout** | `STG-05` (AI Check) | Retries 1x; aborts AI check; marks run `PARTIAL`; retains all deterministic findings. | Warning banner on findings screen: *"Semantic tone checks unavailable. Terminology and claim rules verified successfully."* |
| **Model Returns Invalid JSON** | `STG-05` (AI Check) | Retries 1x with strict schema reminder; on failure, drops candidate AI findings; logs error. | No crash; deterministic findings displayed cleanly. |
| **Quote Verification Mismatch** | `STG-06` (Verifier) | Verifier fails to locate quote in submission or source doc; finding marked `DROPPED`. | Finding silently excluded from confirmed list; logged to accuracy telemetry. |
| **Database Transient Disconnect** | Database Session | Connection pool automatically reconnects on next request; returns standard error shape. | Toast: *"Temporary database connection error. Please retry."* (HTTP 503). |
| **Server Crash Mid-Job** | Background Task | On application startup, a recovery hook checks for orphaned `RUNNING` jobs older than 10 minutes. | Job status transitioned to `FAILED`; user presented with "Re-run Check" button. |

---

## 7. System Architecture Verification Register (VER)

- **FACT [STD, Sec 4.2.5; Project Framing]:** Free-tier operational limits and cloud provider behaviors must be empirically verified before the build window opens.

| Verify ID | Component | Operational Attribute to Verify (No Number Stated as Fact) | Verification Procedure | Status |
|:---|:---|:---|:---|:---:|
| **`VER-08`** | Supabase Free | Vendor-claimed inactivity pausing threshold and connection pool limits (`max_connections`); exact values to be empirically confirmed. | Supabase dashboard & direct ping | **UNVERIFIED** |
| **`VER-09`** | Render Free VM | Vendor-claimed container spin-down threshold and cold-start wake latency; to be measured empirically. | HTTP stopwatch curl script | **UNVERIFIED** |
| **`VER-10`** | Vercel Rewrites | Maximum request payload body size permitted through edge rewrites; to be tested prior to large uploads. | Payload size boundary test | **UNVERIFIED** |
| **`VER-11`** | Hosted LLM | Provider API rate limits (RPM/TPM), model data retention policy, and non-training terms. | Provider dashboard & TOS audit | **UNVERIFIED** |
| **`VER-12`** | Container RAM | Peak memory usage of FastAPI, spaCy, and RapidFuzz (without embeddings/PDF); to be profiled against host ceiling. | Memory profiler during check load | **UNVERIFIED** |
| **`VER-13`** | Supabase Conn | Database connection pool behavior under concurrent worker connections; to be tested under load. | Parallel connection load test | **UNVERIFIED** |
| **`VER-14`** | Trademark Search | External trademark lookup API latency and quota limits (deferred to M2). | Trademark registry sandbox | **UNVERIFIED** |
