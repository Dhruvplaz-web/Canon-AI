# Canon: Stakeholders & User Roles Specification (02_stakeholders_and_users.md)

**Document ID:** `DOC-02`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [PRD, Sec 4] `file:///E:/Software/codex/Docuements/Canon%20Product%20Requirements%20Document.pdf`, [TASK, P1-T10] `file:///E:/Software/codex/Docuements/Canon%20Phased%20Project%20Task%20Document.pdf`, [DHRUV-V3, Sec 1.1, AD-07] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Stakeholder Ecosystem Analysis

Canon interacts with direct software users, enterprise decision-makers, external partners, and evaluators. Below is the comprehensive stakeholder analysis.

```
                                 +--------------------------------------------+
                                 |             ENTERPRISE BUYERS              |
                                 |  CMO / Marketing VP / Head of Governance   |
                                 +--------------------------------------------+
                                                       |
        +----------------------------------------------+----------------------------------------------+
        |                                              |                                              |
        v                                              v                                              v
+-------------------------------+              +-------------------------------+              +-------------------------------+
|       GOVERNANCE LANE         |              |        OPERATIONAL LANE       |              |        COMPLIANCE LANE        |
| Brand Manager: Policy setup,  |              | Creator: Draft submissions,   |              | Approver / Legal: Sign-off,   |
| Rule Health, Backtest diffs   |              | disputes, intent fixes.       |              | claim ledger, audit review.   |
|                               |              | Reviewer: Adjudicate findings,|              | IT/Security: AI disclosure,   |
|                               |              | reason codes, overrides.      |              | tenant isolation, auth.       |
+-------------------------------+              +-------------------------------+              +-------------------------------+
        |                                              |                                              |
        +----------------------------------------------+----------------------------------------------+
                                                       |
                                                       v
                                 +--------------------------------------------+
                                 |            EXTENDED ECOSYSTEM              |
                                 | External Agencies, Hackathon Judges,       |
                                 | Team Runtime Rebels, Future Investors      |
                                 +--------------------------------------------+
```

### 1.1 Internal Enterprise Stakeholders

#### STK-01: Content Creator (Internal Copywriter, Designer, Marketer)
- **Status:** FACT [PRD, Sec 4; PLAN, Sec 4].
- **Goals:** Rapidly draft marketing, sales, and corporate assets without delayed review cycles; receive actionable feedback that preserves creative intent.
- **Pains:** Feedback arrives days later right before publication; feedback is vague or subjective ("make it punchier", "doesn't feel like us"); brand guidelines are scattered across unreadable 80-page PDFs.
- **Organizational Influence:** Medium (primary operational end-users; driving initial adoption and daily submission volume).
- **What they need from Canon:** Immediate pre-submission feedback; pinpoint highlighted errors with exact source citations; suggested rewrites that preserve their voice and meaning.
- **What Canon must NEVER do to them:** Never silently mutate or auto-apply rewrites to their text; never block submissions on subjective aesthetic opinions without cited source evidence; never delete drafts.

#### STK-02: Human Reviewer (Brand Editor, Editorial Lead, Senior Marketer)
- **Status:** FACT [PRD, Sec 4; PLAN, Sec 4].
- **Goals:** Accelerate review turnaround; maintain voice and terminology consistency across hundreds of incoming drafts; prevent repeated manual checking of the same trivial errors.
- **Pains:** Drowning in routine grammatical, trademark, and term errors; context-switching between submissions and guideline decks; lack of audit trails for previous exception approvals.
- **Organizational Influence:** High (core operational gatekeepers; determine day-to-day workflow efficiency).
- **What they need from Canon:** High-precision finding cards with side-by-side evidence receipts; one-click reason-coded override workflow; consolidated review queues.
- **What Canon must NEVER do to them:** Never present model hallucinations as verified facts; never force opaque binary approvals without allowing granular item overrides; never lose decision comments.

#### STK-03: Brand Manager (Brand Custodian, Corporate Communications Director)
- **Status:** FACT [PRD, Sec 4; PLAN, Sec 4].
- **Goals:** Establish and maintain consistent brand integrity across all channels; keep brand guidelines up to date; understand which guidelines are functioning versus failing.
- **Pains:** Guidelines are static and ignored; zero visibility into why rules are bypassed; updating a guideline requires manual consensus without knowing retrospective impact.
- **Organizational Influence:** Very High (primary internal champion and governance authority).
- **What they need from Canon:** Ingestion compiler to convert documents into machine-verifiable rules; Rule Health dashboard pinpointing failing rules; automated backtest engine to simulate rule diffs before rollout.
- **What Canon must NEVER do to them:** Never activate an unapproved rule automatically; never delete historical policy versions; never obscure the root cause of rule overrides.

#### STK-04: Approver / Legal & Compliance Officer
- **Status:** FACT [PRD, Sec 4; R1-PROP, Sec 4; DHRUV-V3, AD-07] *(Note: Re-introduced to resolve `CONF-03`)*.
- **Goals:** Mitigate regulatory liability, false advertising claims, trademark infringement, and compliance fines; ensure strict factual accuracy before public dissemination.
- **Pains:** Content teams invent unsupported statistics and superlatives; lack of an immutable audit trail for legal discovery; manual verification of every numerical claim is exhausting.
- **Organizational Influence:** Veto Power (executive gatekeeper; final authority to block or authorize publication).
- **What they need from Canon:** Verified claim ledger; automatic critical escalation of unverified/unknown claims; immutable, timestamped audit log of all decisions and sign-offs.
- **What Canon must NEVER do to them:** Never auto-approve an unsupported factual claim; never allow deletion or tampering of audit records; never allow unauthorized roles to bypass legal sign-off.

#### STK-05: IT & Enterprise Security Lead
- **Status:** FACT [PRD, Sec 4; STD, Sec 7, 8; ARCH, Sec 4].
- **Goals:** Enforce tenant isolation, least-privilege database access, data loss prevention (DLP), and transparency regarding third-party AI sub-processors.
- **Pains:** Shadow AI tools exfiltrating confidential corporate IP to public model providers; opaque prompt injection attacks manipulating internal tools; loose credential handling.
- **Organizational Influence:** Gatekeeper / Approval Authority (controls software procurement and deployment authorization).
- **What they need from Canon:** Complete AI Disclosure Panel backed by real execution logs; strict workspace isolation via PostgreSQL Row-Level Security; Argon2 password hashing; containerized local-model execution option.
- **What Canon must NEVER do to them:** Never transmit customer data to unlogged external endpoints; never bypass workspace isolation; never store plaintext secrets or API keys in repository or database.

#### STK-06: Enterprise Buyer (CMO, VP of Marketing, Chief Communications Officer)
- **Status:** INFERRED [PRD, Sec 4; PLAN, Sec 4].
- **Goals:** Protect corporate brand equity; eliminate brand review bottlenecks that slow product launches; demonstrate measurable compliance across distributed global teams.
- **Pains:** Public embarrassment from off-brand viral blunders; massive agency billing hours spent on manual review; lack of centralized governance metrics.
- **Organizational Influence:** Economic Buyer (holds the budget and purchasing sign-off authority).
- **What they need from Canon:** High-level executive compliance posture; demonstrable reduction in review cycle times; defensible ROI on governance automation.
- **What Canon must NEVER do to them:** Never present ungrounded or fabricated vanity statistics; never disrupt mission-critical marketing release schedules with false-positive deadlocks.

### 1.2 External Stakeholders

#### STK-07: External Creative Agencies & Freelance Partners
- **Status:** FACT [PRD, Sec 4; PLAN, Sec 4].
- **Goals:** Deliver client work on time and within scope; understand complex client brand rules without reading endless PDF revisions.
- **Pains:** Subjective feedback and delayed client rejections; lack of access to client internal claim ledgers.
- **Organizational Influence:** Low to Medium (external submitters).
- **What they need from Canon:** Sandboxed submission access; immediate automated pre-check against client guidelines before client handover.
- **What Canon must NEVER do to them:** Never expose confidential internal client policies, other agency submissions, or unredacted internal reviewer discussions.

#### STK-08: Hackathon Organizers & Judges (CodeNexus India 2026)
- **Status:** FACT [JUDGE, Sec 0-2; TG-BRIEF, Sec 1-2].
- **Goals:** Evaluate the technical depth, novelty, feasibility, and architectural rigor of Team Runtime Rebels under the Inkloom AI brand-governance problem statement.
- **Pains:** Evaluating over-promised AI wrappers with fake benchmark numbers, broken local environments, or unverifiable demo slides.
- **Organizational Influence:** Critical (determines advancement and final scoring in Milestone 1 / Round 2).
- **What they need from Canon:** Working public deployed vertical slice; reproducible evaluation harness; transparent disclosure of all AI usage; clear evidence receipts for every finding.
- **What Canon must NEVER do to them:** Never show unlabelled mock/seed data as live results; never claim benchmark numbers not generated by our harness; never break during live evaluation walkthrough.

#### STK-09: Team Runtime Rebels (Builders & Planners)
- **Status:** FACT [DHRUV-V3, Sec 1.1; TB-BRIEF, Sec 1; TG-BRIEF, Sec 1; JUDGE, Sec 1].
- **Team Composition:**
  - *Dhruv Patil (AI-Assisted Developer):* Backend architecture, check pipeline, database, security, deployment.
  - *Tanishka Bellale (Frontend Developer):* Next.js UI, shadcn/ui components, screen state flows, client API integration.
  - *Prathmesh Shinde (Literature & Domain Expert):* Brand fixtures, test sample datasets, adversarial test cases, competitor research.
  - *Tanishka Gawale (Project Manager & Pitch Lead):* Milestones, schedule tracking, QA audit, pitch presentation, submission compliance.
- **What they need from Canon:** Modular, decoupled specifications enabling parallel development without blocking dependencies; strict TypeScript contracts and OpenAPI schemas.
- **What Canon must NEVER do to them:** Never require complex distributed infrastructure for Milestone 1 that cannot be debugged and deployed within 48 hours.

#### STK-10: Future Venture Investors & Enterprise Design Partners
- **Status:** INFERRED [Project Framing Directives].
- **Goals:** Evaluate startup defensibility, market differentiation against Adobe/Bynder, unit economics, and enterprise expansion potential.
- **What they need from Canon:** Clear IP defensibility (override-to-backtest loop); clear data network effects; clean modular software architecture ready for enterprise scale.

---

## 2. User Roles & RBAC Definition

- **FACT [TASK, P1-T10; DHRUV-V3, AD-07]:** Canon defines seven formal roles in its database enumeration (`RoleEnum`). For Milestone 1, the primary operational roles are activated in the UI, while all seven exist at the schema and security level.

```
+--------------------------------------------------------------------------------------------------+
|                                  CANON USER ROLES (RBAC)                                         |
+--------------------------------------------------------------------------------------------------+
|  Role Code        | Human Description            | Primary Responsibilities                      |
|:------------------|:-----------------------------|:----------------------------------------------|
|  `creator`        | Content Creator              | Create drafts, submit for review, view        |
|                   |                              | findings, accept suggestions, lodge disputes. |
|  `reviewer`       | Brand Reviewer               | Inspect findings, accept/reject, execute      |
|                   |                              | overrides with reason codes, comment.        |
|  `approver`       | Final Approver / Legal       | Final sign-off or send-back, claim ledger    |
|                   |                              | management, audit log inspection.             |
|  `brand_manager`  | Brand Custodian / Admin      | Ingest guidelines, approve active rules,      |
|                   |                              | monitor Rule Health, backtest rule proposals. |
|  `agency`         | External Submitter           | Sandboxed submission access; view only own    |
|                   |                              | submissions and findings.                     |
|  `it_admin`       | System Administrator         | User/role provisioning, AI disclosure         |
|                   |                              | verification, workspace configuration.        |
|  `exec`           | Executive Observer           | Read-only access to high-level compliance,    |
|                   |                              | Rule Health trends, and audit summaries.      |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Permissions Matrix (Role x Function)

- **FACT [DHRUV-V3, Sec 5, R1-BE3; TASK, P1-T10]:** Every API route in Canon enforces a strict role dependency (`require_role(...)`). Role checks in the UI exist strictly for user experience; the backend is the sole security authority.
- **Legend:**
  - **`ALLOW`**: Unconditional access for this role within their tenant workspace.
  - **`DENY`**: Access rejected with HTTP 403 Forbidden.
  - **`COND`**: Conditional access governed by ownership, assignment, or submission state.

| Functional Area | Specific Function | `creator` | `reviewer` | `approver` | `brand_manager` | `agency` | `it_admin` | `exec` | Condition Rule |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **Policy Setup** | Upload source documents (`POST /policy/sources`) | DENY | DENY | COND | ALLOW | DENY | ALLOW | DENY | Approver allowed only if co-assigned as legal admin |
| | Propose/Compile rules from doc (`POST /policy/compile`) | DENY | DENY | DENY | ALLOW | DENY | ALLOW | DENY | Automated AI extraction tool |
| | Approve/Reject candidate rule (`PATCH /policy/rules/{id}`) | DENY | DENY | ALLOW | ALLOW | DENY | DENY | DENY | Must record `approved_by` user ID |
| | Publish Policy Version (`POST /policy/versions`) | DENY | DENY | ALLOW | ALLOW | DENY | DENY | DENY | Requires at least 1 approved rule |
| | Manage Claim Ledger (`POST/PATCH /claims`) | DENY | DENY | ALLOW | ALLOW | DENY | DENY | DENY | Approver owns factual/legal claims |
| **Submissions** | Submit content draft (`POST /submissions`) | ALLOW | ALLOW | ALLOW | ALLOW | COND | DENY | DENY | Agency restricted to assigned campaigns |
| | Create resubmission version (`POST /submissions/{id}/version`)| COND | ALLOW | ALLOW | ALLOW | COND | DENY | DENY | Creator/Agency must be submission author |
| | View own submission & findings (`GET /submissions/{id}`) | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | Scoped to tenant workspace |
| | View all workspace submissions (`GET /submissions`) | COND | ALLOW | ALLOW | ALLOW | DENY | ALLOW | ALLOW | Creator sees only own or public team drafts |
| **Checking** | Trigger check run (`POST /submissions/{id}/check`) | COND | ALLOW | ALLOW | ALLOW | COND | DENY | DENY | Must be submission author or assigned reviewer |
| | View double-receipt evidence (`GET /findings/{id}`) | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | Scoped to submission access |
| | Lodge finding dispute (`POST /findings/{id}/dispute`) | COND | DENY | DENY | DENY | COND | DENY | DENY | Allowed only for submission author before signoff |
| **Review Workflow**| Accept/Reject finding suggestion (`PATCH /findings/{id}`) | COND | ALLOW | ALLOW | ALLOW | COND | DENY | DENY | Creator can accept suggestions; Reviewer decides |
| | Override finding with Reason Code (`POST /decisions`) | DENY | ALLOW | ALLOW | ALLOW | DENY | DENY | DENY | Mandatory `reason_code` required |
| | Add comment to submission/finding (`POST /comments`) | ALLOW | ALLOW | ALLOW | ALLOW | COND | DENY | DENY | Agency restricted to own submissions |
| | Final Sign-off (`POST /submissions/{id}/approve`) | DENY | DENY | ALLOW | ALLOW | DENY | DENY | DENY | Reviewer can recommend; only Approver signs off |
| | Send Back for Revision (`POST /submissions/{id}/send-back`) | DENY | ALLOW | ALLOW | ALLOW | DENY | DENY | DENY | Reviewer or Approver rejects with notes |
| **Rule Health** | View Rule Health Dashboard (`GET /governance/health`) | DENY | ALLOW | ALLOW | ALLOW | DENY | ALLOW | ALLOW | Reviewer sees health; Creator does not |
| | Trigger Backtest Simulation (`POST /governance/backtest`) | DENY | DENY | COND | ALLOW | DENY | DENY | DENY | Approver can view; Brand Manager triggers |
| | Approve Rule Change Proposal (`POST /governance/proposals/{id}/adopt`)| DENY | DENY | ALLOW | ALLOW | DENY | DENY | DENY | Creates new policy version diff |
| **Transparency** | View AI Disclosure Panel (`GET /transparency/disclosure`) | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | All workspace users can inspect AI usage |
| | View Audit Log (`GET /audit-log`) | DENY | COND | ALLOW | ALLOW | DENY | ALLOW | ALLOW | Reviewer sees own; Approver/Admin sees all |
| | Manage Users and Roles (`GET/POST /users`) | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | Strict IT Admin domain |
| | Execute Evaluation Harness (`POST /eval/run`) | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | System Admin / Engineering role only |
