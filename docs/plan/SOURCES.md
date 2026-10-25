# Canon: Master Source Reference & Citation Index (SOURCES.md)

**Project:** Canon — Pre-Publication Brand Governance Platform  
**Status:** Living Document  
**Date:** 2026-10-25  
**Version:** 1.0  
**Scope:** Authoritative mapping of all architectural, product, engineering, security, and process claims to primary source documents in `E:\Software\codex\Docuements/`.

---

## 1. Document Inventory and Key Codes

| Doc Key | Canonical Filename | Version / Date | Pages | Primary Authors / Owners | Core Focus |
|:---|:---|:---|:---|:---|:---|
| **`[STD]`** | `Canon AI Rules and Engineering Standards.pdf` | Version 1.0 draft, 24 Oct 2026 | 12 | Dhruv Patil / Antigravity Team | Binding engineering standards, Section 3 AI product rules, Section 8 AI runtime rules, Section 12 stop-and-ask. |
| **`[PRD]`** | `Canon Product Requirements Document.pdf` | Draft v1, 24 Oct 2026 | 13 | Product Team | Problem statement, functional requirements (FR-1 to FR-31), NFRs, scope boundaries, core metrics. |
| **`[ARCH]`** | `Canon System Architecture Document.pdf` | Version 1.0 draft, 24 Oct 2026 | 18 | Dhruv Patil / Architecture Lead | Target system design, 2-lane trust boundaries, check pipeline, database, deployment, folder layout. |
| **`[PLAN]`** | `Canon Project Plan.pdf` | 24 Oct 2026 | 13 | Tanishka Gawale / PM | High-level roadmap, value proposition, persona summaries, milestones, risk mitigations. |
| **`[TASK]`** | `Canon Phased Project Task Document.pdf` | 24 Oct 2026 | 22 | Engineering & Product Team | 15 Phases (0 to 14), 200 granular tasks (P0-T01 to P14-T08), acceptance checks, deliverables. |
| **`[R1-PROP]`** | `Canon_final_document.pdf` | Round 1 Proposal, Oct 2026 | 12 | Team Runtime Rebels | Problem statement breakdown, 10-step end-to-end user flow, market need, solution overview. |
| **`[JUDGE]`** | `Canon_Judge_Briefing_and_Evidence_Pack_FINAL.pdf` | Final Edition, Oct 2026 | 31 | Prathmesh Shinde | Literature & domain research, competitor breakdown, pitch script, verified evidence requirements. |
| **`[DHRUV-V3]`** | `Dhruv_Patil_Canon_Engineering_Plan_v3.pdf` | Revision 3, 25 Oct 2026 | 37 | Dhruv Patil | Backend vertical slice plan, ADRs, database schema (26 tables in 7 groups), cut order, test plan. |
| **`[TB-BRIEF]`** | `Canon_Role_Brief_Tanishka_Bellale_FINAL.pdf` | Final Edition, 25 Oct 2026 | 18 | Tanishka Bellale | Frontend architecture, screen inventory, shadcn/ui integration, task handoffs, mock strategies. |
| **`[TG-BRIEF]`** | `Canon Role Brief for Tanishka Gawale.pdf` | 25 Oct 2026 | 9 | Tanishka Gawale | Project management, QA, pitch leadership, Round 1 submission rules, demo script, judge defense. |
| **`[DIAG]`** | `Brand Governance Review Architecture.png` | Architecture Diagram, Oct 2026 | Image | Engineering / Architecture | Visual diagram showing planes, data layer, pipeline, components, and user roles. |

---

## 2. Topic-to-Source Mapping Matrix

### 2.1 Core Product Definition & Problem Space
- **Problem Statement (Inkloom AI):** Rapid AI and human content generation outstrips human review capacity, leading to brand drift, incorrect claims, and regulatory fines.  
  *Sources:* `[PRD, Sec 1-2]`, `[PLAN, Sec 1]`, `[R1-PROP, Sec 1-2]`.
- **Root Cause:** Brand guidelines, claims, and terminology sit trapped in unstructured, unindexed decks and PDFs that creators do not read and reviewers struggle to manually check.  
  *Sources:* `[PRD, Sec 2]`, `[R1-PROP, Sec 2]`.
- **One-Line Pitch:** "Every finding comes with its receipt, and when reviewers keep overriding a rule, Canon shows that the rule is the problem and tests the fix before it ships."  
  *Sources:* `[PRD, Sec 1]`, `[TG-BRIEF, Sec 2]`.
- **Non-Goals (Full Scope):** DAM, content generator, Figma/Adobe plugin, video/audio checks, multilingual support, SSO/SAML, billing engine, general chatbot, single vanity "brand score" as the primary screen, legal advice, autonomous publishing.  
  *Sources:* `[PRD, Sec 3]`, `[ARCH, Sec 17]`.

### 2.2 Non-Negotiable Product Principles & AI Standards
- **Deterministic First:** If deterministic code can evaluate a rule (regex, lemma, exact ledger match, WCAG formula), an LLM must NOT decide it. The model only handles tone, semantic claim paraphrase, and intent-preserving rewrites.  
  *Sources:* `[STD, Sec 2.5, 8.1]`, `[PRD, Sec 5.1]`, `[ARCH, Sec 2.1]`.
- **Evidence or Nothing:** A finding is shown as confirmed only after programmatic verification confirms that the flagged text exists in the submission and the source quote exists in an approved document. Unverifiable findings are dropped or explicitly tagged unverified.  
  *Sources:* `[STD, Sec 2.6, 8.5]`, `[PRD, Sec 5.2, FR-11]`, `[ARCH, Sec 2.2, 6.6]`.
- **Two-Lane Trust Model:** Policy and rules are trusted (written and approved by authenticated humans only). Submissions, uploads, and comments are hostile/untrusted data (never instructions).  
  *Sources:* `[STD, Sec 3.1, 7.1]`, `[PRD, Sec 5.3]`, `[ARCH, Sec 4]`.
- **No Autonomous Authority for AI:** The runtime LLM has zero database access, zero network/tool access, cannot create/edit/activate rules, cannot change finding statuses, and cannot sign off or publish content.  
  *Sources:* `[STD, Sec 3.1-3.3, 8.2]`, `[ARCH, Sec 4]`.
- **Uncertainty Escalation:** Unsupported or unknown claims that do not match the approved claim ledger escalate to human review as Critical findings; they are never auto-approved.  
  *Sources:* `[STD, Sec 3.6, 8.7]`, `[PRD, Sec 5.5, FR-18]`, `[ARCH, Sec 6.7]`.
- **Append-Only Audit Log:** Database role permissions prevent UPDATE or DELETE on audit logs. Consequential actions (rule change, decision, approval) generate immutable audit records.  
  *Sources:* `[STD, Sec 3.8, 5.4.4]`, `[PRD, FR-23]`, `[ARCH, Sec 8]`, `[DHRUV-V3, Sec 9.2]`.
- **Workspace Isolation:** Every tenant entity is scoped by `workspace_id`. PostgreSQL Row-Level Security (RLS) is strictly enforced with non-owner, non-bypass database roles.  
  *Sources:* `[STD, Sec 3.9, 5.4.2]`, `[ARCH, Sec 8]`, `[DHRUV-V3, Sec 3, AD-04]`.
- **Never Auto-Apply Rewrites:** Suggestions are presented for creator/reviewer consideration and must never mutate submission content automatically.  
  *Sources:* `[STD, Sec 3.10]`, `[PRD, FR-16]`.

### 2.3 System Architecture & Tech Stack Choices
- **Frontend Stack:** Next.js (App Router), React, TypeScript (strict, no `any`), Tailwind CSS, shadcn/ui, TanStack Query & Table, React Hook Form, Zod, react-pdf.  
  *Sources:* `[STD, Sec 4.1, 5.3]`, `[ARCH, Sec 5]`, `[TB-BRIEF, Sec 4]`.
- **Backend Stack:** Python, FastAPI, Pydantic (all boundaries), SQLAlchemy 2.0 (sync session style with scoped session), Alembic migrations, PyJWT with Argon2 password hashing.  
  *Sources:* `[STD, Sec 4.1, 5.2]`, `[ARCH, Sec 5]`, `[DHRUV-V3, Sec 2.1, AD-08]`.
- **Database & Vectors:** PostgreSQL with JSONB and `pgvector`. Local open-source embeddings via `sentence-transformers` (`bge-small-en-v1.5`) to prevent sending private brand guidelines to third-party embedding APIs.  
  *Sources:* `[STD, Sec 4.1]`, `[ARCH, Sec 5, 8]`, `[DHRUV-V3, Sec 3, AD-06]`.
- **Processing & Parsers:** PyMuPDF (`fitz`) for PDF with word bounding boxes and style spans; `python-docx` for Word documents; spaCy + RapidFuzz + regex for deterministic text matching; Pillow + OpenCV for exact image/logo/contrast checks; WCAG luminance formula for accessibility.  
  *Sources:* `[STD, Sec 4.1]`, `[ARCH, Sec 5, 6.4]`.
- **In-Process Jobs:** FastAPI `BackgroundTasks` orchestrated via a database `job` table (queued, running, completed, partial, failed) for seconds-long checks; avoids Redis/Celery queue bloat in MVP.  
  *Sources:* `[STD, Sec 4.1]`, `[ARCH, Sec 6.8]`, `[DHRUV-V3, Sec 3, AD-08]`.
- **Single-Origin Proxy:** Caddy or Nginx reverse proxy routing web app and `/api/v1` on one origin, enabling secure `httpOnly`, `SameSite=Lax/Strict` cookie transmission without CORS complexity.  
  *Sources:* `[STD, Sec 5.5, 7.5]`, `[ARCH, Sec 3, 11]`, `[DHRUV-V3, Sec 3, AD-10]`.

### 2.4 Data Architecture (26 Tables in 7 Groups; `job` added as Table #24)
- **Group 1: Tenancy & Users:** `workspace`, `user`.  
  *Sources:* `[TASK, P1-T01]`, `[DHRUV-V3, Sec 5, R1-BE3]`.
- **Group 2: Trusted Policy:** `source_document`, `policy_version`, `rule`, `approved_claim`, `term`, `brand_asset`.  
  *Sources:* `[TASK, P1-T02]`, `[ARCH, Sec 8]`, `[DHRUV-V3, Sec 5, R1-BE3]`.
- **Group 3: Content Submissions:** `submission`, `submission_version`.  
  *Sources:* `[TASK, P1-T03]`, `[ARCH, Sec 8]`, `[DHRUV-V3, Sec 5, R1-BE3]`.
- **Group 4: Check Runs & Decisions:** `check_run`, `finding`, `decision`, `dispute`, `reason_code`, `comment`, `approval`.  
  *Sources:* `[TASK, P1-T04]`, `[ARCH, Sec 8]`, `[DHRUV-V3, Sec 5, R1-BE3]`.
- **Group 5: Governance & Rule Health:** `rule_health_snapshot`, `rule_change_proposal`, `backtest_run`, `backtest_result`.  
  *Sources:* `[TASK, P1-T05]`, `[ARCH, Sec 8, 11]`, `[DHRUV-V3, Sec 5, R1-BE3]`.
- **Group 6: Transparency & Job Orchestration:** `audit_log`, `ai_service_call`, `job`.  
  *Sources:* `[TASK, P1-T06]`, `[ARCH, Sec 6.8, 8]`, `[DHRUV-V3, Sec 5, R1-BE3]`.
- **Group 7: Offline Evaluation:** `eval_case`, `eval_run`.  
  *Sources:* `[TASK, P1-T06]`, `[ARCH, Sec 13]`, `[DHRUV-V3, Sec 5, R1-BE3]`.

### 2.5 Market Differentiation & Competitive Claims
- **Competitors Researched:** Adobe GenStudio, Bynder, Frontify, Markup AI (Acrolinx), Writer, Canva, IntelligenceBank, Red Marker.  
  *Sources:* `[PRD, Sec 14]`, `[JUDGE, Sec 4, 7]`.
- **Standard Commoditised Features:** Guideline upload, chatbot over rules, single composite brand score, tone/terminology linting, approval ticketing.  
  *Sources:* `[PRD, Sec 14]`, `[JUDGE, Sec 4]`.
- **True Canon Differentiators:**
  1. *Receipt-Backed Verification:* Every shown finding is verified by code against both the submission span and cited source span.
  2. *Override-to-Rule-Learning Loop:* Reviewer overrides are tracked by `rule_code`, aggregated into Rule Health diagnoses (noisy, unclear, stale, scope mismatch), synthesized into draft rule change diffs, backtested on past submissions, and human-approved.  
  *Sources:* `[PRD, Sec 1, 14]`, `[PLAN, Sec 2]`, `[JUDGE, Sec 4]`.
- **Honest Language Standard:** Never claim "unique"; always state "we found no equivalent in the published literature and product documentation reviewed."  
  *Sources:* `[STD, Sec 10.7]`, `[PRD, Sec 14]`, `[TG-BRIEF, Sec 2.5]`.

---

## 3. Register of Identified Document Conflicts

| Conflict ID | Document A | Document B | Core Contradiction | Impact / Required Resolution |
|:---|:---|:---|:---|:---|
| **`CONF-01`** | `[DIAG]` Architecture Diagram | `[STD, Sec 4.1]`, `[DHRUV-V3, AD-02]` | Diagram depicts `SQLite (Local / Dev)` with two-way sync to Supabase. Standards explicitly ban SQLite and require PostgreSQL with JSONB and pgvector. | **DECISION:** Pure PostgreSQL everywhere (Docker Compose locally, Supabase/Neon in cloud). SQLite lacks RLS, DB roles, JSONB indexing, and pgvector. Sync arrows are an architectural anti-pattern. |
| **`CONF-02`** | `[DIAG]` Architecture Diagram | `[STD, Sec 4.1, 7.3]`, `[ARCH, Sec 5]` | Diagram depicts `Auth + RLS` inside Supabase. Standards require application-level JWT with Argon2 password hashing in FastAPI. | **DECISION:** Use custom FastAPI JWT + Argon2 auth. Database acts strictly as storage; RLS is configured via `SET LOCAL app.current_workspace_id`. |
| **`CONF-03`** | `[DIAG]` Architecture Diagram | `[PRD, Sec 4, FR-22]`, `[TASK, P1-T10]` | Diagram omits the `Approver` role in the USERS box (shows only Creator, Reviewer, Brand Manager, IT/Admin). PRD and Tasks mandate separate `approver` role. | **DECISION:** Restore `approver` as a first-class role in both data model and UI. Approver represents final sign-off authority distinct from Reviewer. |
| **`CONF-04`** | `[TG-BRIEF, Sec 1]` | `[TASK, How to use]` | TG-Brief highlights that Hackathon Round 1 instructions require individual submission per person, whereas Task doc says team leader submits once. | **DECISION:** Align with official Hackathon rule: Each member submits individually with identical team name (`RUNTIME REBELS`) and personal contribution brief. |
| **`CONF-05`** | User Prompt / Hackathon Brief | `[DHRUV-V3, Sec 1.1]` | Prompt states Round 2 build window is 48 hours. Dhruv V3 engineering plan notes Round 2 as 6–9 Nov (72 to 96 hours). | **DECISION:** Hard-cap Milestone 1 plan at strictly **48 hours** execution window with checkpoints at H12, H24, H36. |
| **`CONF-06`** | `[TASK, P1-T01-T06]` (26 Tables with `job`) | 48-Hour Hackathon Capacity | Building and wiring 25 database tables with full UI in 48 hours risks catastrophic non-delivery. | **DECISION:** Create Milestone 1 as a **strict subset** (12 core tables) while maintaining the 25-table schema design so zero migrations are thrown away. |
| **`CONF-07`** | `[STD, Sec 15.2]` | `[DHRUV-V3, AD-08]` | Standards list "Confirm whether project will use sync or async database sessions" as an open item. | **DECISION:** Standardize on **Sync SQLAlchemy 2.0** sessions. Simplifies thread-pool background jobs and prevents greenlet/asyncio event loop deadlocks. |
| **`CONF-08`** | `[DIAG]` Architecture Diagram | `[DHRUV-V3, AD-06]` | Diagram depicts a full RAG retrieval pipeline for all content checks. | **DECISION:** In Milestone 1, execute **Pass-All Mode** for active policy rules (~10–20 rules fits easily in context). Defer pgvector embedding retrieval to Milestone 2. |
| **`CONF-09`** | `[PRD, Sec 4]` | `[TASK, P1-T10]` | PRD lists 4 core personas + 3 extended. Task doc defines 7 enum roles (`brand_manager`, `creator`, `reviewer`, `approver`, `agency`, `it_admin`, `exec`). | **DECISION:** Implement all 7 in the DB enum; activate 4 primary roles (`creator`, `reviewer`, `approver`, `brand_manager`) + `it_admin` in M1 UI. |
