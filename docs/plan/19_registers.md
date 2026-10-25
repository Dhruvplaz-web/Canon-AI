# Canon: Master Project Registers (19_registers.md)

**Document ID:** `DOC-19`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** All Canon Project Documents, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Assumption Register (ASM)

In accordance with **Non-Negotiable Working Rule 1 (NO SILENT ASSUMPTIONS)**, every assumption made during architectural planning is formally recorded below with its rationale, potential failure impact, and verification mechanism.

| ID | Stated Assumption | Underlying Rationale | Impact if Invalid | Verification Mechanism |
|:---|:---|:---|:---|:---|
| **`ASM-01`** | FinTech and HealthTech are the highest-affinity initial target verticals. | Both industries operate under strict statutory truth-in-advertising rules and severe regulatory penalties for unverified claims. | May need to pivot messaging toward general B2B SaaS or creative agency marketing. | Customer discovery interviews with 10 enterprise marketing heads post-hackathon (`VER-01`). |
| **`ASM-02`** | English-language single-locale scope is sufficient for Milestone 1 and early beta pilots. | English represents the vast majority of global enterprise marketing collateral; multilingual parsing introduces substantial pipeline complexity. | Multi-national enterprises requiring French/German/Spanish will defer adoption until Milestone 3. | Validate enterprise pilot pipeline requirements. |
| **`ASM-03`** | Average marketing submission size is $\le 2,000$ words; 15 MB file size limit covers 98% of collateral. | Blog posts, press releases, landing pages, and email copy rarely exceed 15 MB unless containing raw uncompressed video. | Submissions containing large embedded graphics will be rejected at upload. | Monitor upload payload telemetry in `SCR-03`. |
| **`ASM-04`** | Free cloud tiers (Vercel, Render, Supabase) provide sufficient bandwidth and compute for the 48-hour evaluation. | Live hackathon traffic is limited to judges, team members, and evaluation bots ($< 1,000$ total requests). | Cloud compute limits or rate caps could degrade live demo performance. | Pre-warm instances and verify quotas in `DOC-18`. |
| **`ASM-05`** | All four team members possess local environments capable of running Docker Compose. | Modern laptops easily run a containerized Postgres instance and Node/Python runtimes. | Teammates without Docker must rely on cloud development instances. | Pre-development environment verification (`DOC-18`). |
| **`ASM-06`** | Antigravity AI coding subagents can execute individual atomic tasks in $< 15$ minutes per run. | Restricting task size to $\le 2.0$ hours with explicit schemas keeps prompt context focused and prevents token exhaustion. | Tasks requiring multiple agent retries could compress the 48-hour schedule. | Enforce atomic task boundaries (`DOC-13`). |

---

## 2. Verification Register (VER)

In accordance with **Non-Negotiable Working Rule 2**, no pricing, library versions, free-tier limits, competitor features, or quotas may be invented. All items requiring empirical verification against official sources are tracked below.

| ID | Item Requiring Verification | Category | Target Source / Official Procedure | Status |
|:---|:---|:---|:---|:---|
| **`VER-01`** | Enterprise willingness-to-pay and procurement security requirements. | Market Viability | Primary customer discovery interviews with enterprise CMOs and compliance heads. | Pending M2 |
| **`VER-02`** | Scope of Adobe GenStudio brand scoring and exposure of underlying receipts. | Competitor | Official Adobe GenStudio product documentation and technical release notes. | Recorded |
| **`VER-03`** | Bynder AI Content Compliance Agent text claim extraction autonomy. | Competitor | Bynder official technical release papers and knowledge base. | Recorded |
| **`VER-04`** | Frontify brand guidelines MCP server schema and transport protocols. | Competitor | Frontify developer portal and official GitHub repository. | Recorded |
| **`VER-05`** | Markup AI (Acrolinx) implementation timeline and enterprise pricing structure. | Competitor | Analyst reports (Gartner/Forrester) and vendor whitepapers. | Recorded |
| **`VER-06`** | Writer document ingestion independence without proprietary text editor. | Competitor | Writer enterprise documentation and platform API specifications. | Recorded |
| **`VER-07`** | Red Marker capabilities regarding intent-preserving suggested rewrites. | Competitor | Red Marker public product demonstration videos and patent filings. | Recorded |
| **`VER-08`** | Supabase Free Tier inactivity pausing threshold and connection limits. | Infrastructure | Supabase platform guides (`supabase.com/docs/guides/platform/free-plan`). | **VERIFIED** |
| **`VER-09`** | Render Free Web Service spin-down latency after 15 minutes of inactivity. | Infrastructure | Empirical stopwatch measurement of HTTP request after idle timeout. | **VERIFIED** |
| **`VER-10`** | Vercel Edge Rewrites maximum request body payload size for PDF uploads. | Infrastructure | Vercel documentation on Edge Network limits (15 MB verified limit). | **VERIFIED** |
| **`VER-11`** | Hosted LLM provider rate limits (RPM/TPM) and data retention policies and non-training terms. | AI Runtime | Provider official developer terms of service and dashboard quota tier. | Pending Provider Lock |
| **`VER-12`** | Container peak memory consumption under PyMuPDF, spaCy, and bge-small. | Performance | Docker stats memory profiler during concurrent document parsing. | Scheduled H12 |
| **`VER-13`** | PyMuPDF AGPLv3 open-source license implications vs. commercial license. | Legal/License | Official Artifex PyMuPDF licensing terms (AGPL requires open release or commercial waiver).| Flagged for M3 |
| **`VER-14`** | Exact pinned library versions for Next.js, FastAPI, SQLAlchemy 2.0, and Pydantic. | Engineering | Official package lockfiles generated on Day 1 of Round 2 build. | Scheduled H00 |
| **`VER-15`** | Exact CodeNexus Round 2 hackathon build window start and end timestamps. | Process | Official CodeNexus hackathon organizer communication channels. | Blocking Q-01 |

---

## 3. Conflict Register (CONF)

In accordance with **Non-Negotiable Working Rule 3 (SURFACE EVERY CONFLICT)**, all contradictions discovered across the 11 uploaded project documents are surfaced below with their technical impact and authoritative resolution.

| Conflict ID | Document A | Document B | Core Contradiction | Technical Impact & Authoritative Resolution | Human Decision Needed? |
|:---|:---|:---|:---|:---|:---:|
| **`CONF-01`** | Architecture Diagram (`[DIAG]`) | AI Rules & Engineering Standards (`[STD, Sec 4.1]`) | Diagram depicts `SQLite (Local / Dev)` with two-way sync to Supabase. Standards explicitly ban SQLite and require pure PostgreSQL with JSONB and pgvector. | **RESOLVED [DEC-ARCH-03]:** Standardize on **Pure PostgreSQL Everywhere** (Docker locally; Supabase in cloud). SQLite lacks RLS, DB roles, and pgvector. Bi-directional sync is an architectural anti-pattern. | **NO (Resolved by Standards)** |
| **`CONF-02`** | Architecture Diagram (`[DIAG]`) | Engineering Standards (`[STD, Sec 4.1, 7.3]`) & Arch Doc (`[ARCH, Sec 5]`) | Diagram shows `Auth + RLS` inside Supabase. Standards require custom application-level JWT with Argon2 password hashing in FastAPI. | **RESOLVED [DEC-ARCH-04]:** Implement **Custom FastAPI JWT + Argon2 Auth**. Supabase acts strictly as a data store. Prevents vendor lock-in and allows seamless local testing. | **NO (Resolved by Standards)** |
| **`CONF-03`** | Architecture Diagram (`[DIAG]`) | PRD (`[PRD, Sec 4]`) & Tasks (`[TASK, P1-T10]`) | Diagram omits the `Approver` role in the USERS box (shows only Creator, Reviewer, Brand Manager, IT/Admin). PRD and Tasks mandate separate `approver` role. | **RESOLVED [DEC-PROC-01]:** Restore `approver` as a first-class user role in both database enum and UI. Reviewers review; Approvers grant final legal sign-off. | **NO (Resolved by PRD)** |
| **`CONF-04`** | Role Brief for Tanishka Gawale (`[TG-BRIEF, Sec 1]`) | Phased Task Document (`[TASK, How to use]`) | TG-Brief highlights that Hackathon Round 1 instructions require individual submission per person, whereas Task doc says team leader submits once. | **RESOLVED [DEC-PROC-02]:** Align with official Hackathon rule: Each member submits individually with identical team name (`RUNTIME REBELS`) and personal contribution brief. | **NO (Resolved by Hackathon Form)** |
| **`CONF-05`** | User Prompt / Hackathon Brief | Dhruv Patil Engineering Plan v3 (`[DHRUV-V3, Sec 1.1]`) | Prompt states Round 2 build window is strictly 48 hours. Dhruv V3 plan lists Round 2 dates as 6–9 Nov (72 to 96 hours). | **RESOLVED [DEC-PROC-03]:** Hard-cap Milestone 1 schedule at strictly **48 Hours** with checkpoints at H12, H24, and H36. 72h scope is trimmed. | **NO (Resolved by Prompt)** |
| **`CONF-06`** | Phased Task Document (`[TASK, P1-T01-T06]`) | 48-Hour Hackathon Capacity | Building and wiring all 26 database tables with full UI in 48 hours risks non-delivery. | **RESOLVED [DEC-PROC-04]:** Milestone 1 is engineered as a **strict 17-table mathematical subset** of the 26-table full platform design (with `job` as table #24; restoring Group 5 governance intelligence tables for scope-exception proposal, backtest, and Policy v1.1 approval). Zero throwaway code. | **NO (Resolved by Architecture)** |
| **`CONF-07`** | Engineering Standards (`[STD, Sec 15.2]`) | Dhruv Patil Engineering Plan v3 (`[DHRUV-V3, AD-08]`) | Standards list "Confirm whether project will use sync or async database sessions" as an open item. | **RESOLVED [DEC-ARCH-08]:** Standardize on **Sync SQLAlchemy 2.0 Sessions** with thread pools. Prevents greenlet/asyncio event loop deadlocks with CPU-bound NLP libraries. | **NO (Resolved by ADR)** |
| **`CONF-08`** | Architecture Diagram (`[DIAG]`) | Dhruv Patil Engineering Plan v3 (`[DHRUV-V3, AD-06]`) | Diagram depicts a full RAG retrieval pipeline with vector embeddings for all content checks. | **RESOLVED [DEC-PROC-05]:** In Milestone 1, execute **Pass-All Mode** for active policy rules ($\le 20$ rules). Embeddings, in-container `bge-small` weights, and `pgvector` retrieval are removed from M1 and deferred to Milestone 2. Guarantees 100% rule recall and prevents container memory bloat. | **NO (Resolved by ADR)** |
| **`CONF-09`** | Architecture Diagram (`[DIAG]`) | Phased Task Document (`[TASK, P1-T10]`) | Diagram shows 4 user roles. Task document defines 7 enum roles (`brand_manager`, `creator`, `reviewer`, `approver`, `agency`, `it_admin`, `exec`). | **RESOLVED [DEC-PROC-06]:** Implement all 7 roles in the database enum; activate 4 primary roles (`creator`, `reviewer`, `approver`, `brand_manager`) + `it_admin` in M1 UI. | **NO (Resolved by Schema)** |
| **`CONF-10`** | Architecture Diagram (`[DIAG]`) | Engineering Standards (`[STD, Sec 2.2]`) & Dhruv Plan (`[DHRUV-V3, AD-09]`) | Diagram shows "Explain why with confidence score". Standards warn that displaying an arbitrary percentage (e.g., "78%") invites users to treat it as a probability. | **RESOLVED [DEC-PROC-07]:** Do not display numerical probability scores in the UI. Render calibrated categorical evidence badges: `VERIFIED RECEIPT`, `UNVERIFIED CITATION`, or `DROPPED`. | **NO (Resolved by Standards)** |

---

## 4. Decision Log (DEC)

| Decision ID | Area | Decision Taken | Alternatives Considered & Rejected | Key Trade-Off & Rationale | Status |
|:---|:---|:---|:---|:---|:---:|
| **`DEC-01`** | Scope | Plan the full enterprise startup product; build Milestone 1 as a strict vertical slice subset. | Hackathon-only throwaway prototype. | Designing for longevity requires rigorous schema planning upfront, but guarantees zero throwaway work. | **APPROVED** |
| **`DEC-02`** | Pricing | Evaluate 3 structural pricing architectures (Seat-based, Usage-based, Hybrid); zero invented numbers. | Inventing arbitrary SaaS dollar figures ($49/mo). | Preserves credibility with judges; real pricing determined post-pilot. | **APPROVED** |
| **`DEC-ARCH-01`** | Backend | Python 3.12 with FastAPI, Pydantic v2, and Uvicorn. | Node.js/NestJS, Go/Gin. | Python is mandatory for native document NLP (PyMuPDF, spaCy, RapidFuzz) and local embeddings. | **APPROVED** |
| **`DEC-ARCH-02`** | Database | Single PostgreSQL 16 instance with JSONB and `pgvector`. | Separate Vector DB (Pinecone) + Postgres. | Single database eliminates distributed transaction failures and extra operational costs. | **APPROVED** |
| **`DEC-ARCH-03`** | Local DB | Pure PostgreSQL everywhere via Docker; zero SQLite. | SQLite for dev / Supabase for cloud. | Eliminates cross-database sync anti-patterns; guarantees RLS and role parity. | **APPROVED** |
| **`DEC-ARCH-04`** | Auth | Custom FastAPI JWT with Argon2 password hashing. | Supabase Auth. | Custom auth keeps backend vendor-agnostic and simplifies offline testing. | **APPROVED** |
| **`DEC-ARCH-05`** | Jobs | In-process FastAPI `BackgroundTasks` + relational `job` table. | Celery + Redis / RabbitMQ. | Eliminates broker infrastructure complexity for 2–4 second check runs in MVP. | **APPROVED** |
| **`DEC-ARCH-06`** | Proxy | Next.js `rewrites()` in `next.config.ts` edge proxying `/api/v1/*`. | Standalone Caddy VM, Cross-origin CORS. | Eliminates CORS preflight latency; guarantees first-party `httpOnly` cookie delivery. | **APPROVED** |
| **`DEC-ARCH-07`** | LLM | `LLMProvider` protocol adapter with SHA-256 composite caching. | Direct OpenAI/Mistral SDK imports. | Decouples codebase from specific providers; caching makes live demos instant and free. | **APPROVED** |
| **`DEC-ARCH-08`** | Session | Synchronous SQLAlchemy 2.0 sessions with connection pooling. | Asyncio / asyncpg. | Prevents greenlet event-loop deadlocks with CPU-bound document NLP libraries. | **APPROVED** |
| **`DEC-ARCH-09`** | Embeddings | Local `bge-small-en-v1.5` embeddings in container CPU. | Third-party embedding APIs (OpenAI). | Guarantees brand guideline text is never sent to external embedding services. | **APPROVED** |
| **`DEC-PROC-01`** | Roles | Restore `approver` as a first-class role in schema and UI. | Merging Reviewer and Approver into one role. | Preserves separation of duties between content review and formal legal sign-off. | **APPROVED** |
| **`DEC-PROC-02`** | Submission | Each member submits individually to hackathon with identical team name. | Single team leader submission. | Strictly complies with CodeNexus Hackathon submission portal rules. | **APPROVED** |
| **`DEC-PROC-03`** | Schedule | Hard-cap Milestone 1 execution schedule at strictly 48 hours. | 72–96 hour window from Dhruv V3 plan. | Aligns with strict 48-hour hackathon build timer; enforces checkpoints at H12, H24, H36. | **APPROVED** |
| **`DEC-PROC-04`** | Schema | Deploy 12 core tables in Milestone 1 as a strict subset of 26 target tables. | Deploying all 26 tables simultaneously in M1. | Prevents non-delivery in 48h while guaranteeing zero migrations are rewritten later. | **APPROVED** |
| **`DEC-PROC-05`** | Retrieval | Pass-All Mode for Milestone 1 active policy rules ($\le 20$ rules). | pgvector dense indexing in Round 2. | Drastically simplifies pipeline latency and eliminates embedding failures in M1 demo. | **APPROVED** |
| **`DEC-PROC-06`** | RBAC | 7 Enum roles in DB; 4 operational roles active in M1 UI. | 4 roles only. | Enables future agency and enterprise expansion without database schema alterations. | **APPROVED** |
| **`DEC-PROC-07`** | UI Badges | Render qualitative evidence receipts; no arbitrary percentage confidence scores. | "Confidence: 87%". | Eliminates false-precision hallucinations; focuses on verifiable receipt proof. | **APPROVED** |
