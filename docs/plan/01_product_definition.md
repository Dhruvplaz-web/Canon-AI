# Canon: Product Definition, Vision & Scope (01_product_definition.md)

**Document ID:** `DOC-01`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [PRD, Sec 1-5, 15] `file:///E:/Software/codex/Docuements/Canon%20Product%20Requirements%20Document.pdf`, [PLAN, Sec 1-3] `file:///E:/Software/codex/Docuements/Canon%20Project%20Plan.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Product Vision & Executive Summary

- **FACT [PRD, Sec 1]:** Canon is a pre-publication brand-governance and content-verification platform designed to inspect marketing, product, and corporate communications against verified organizational guidelines, facts, terminology, and assets before public distribution.
- **FACT [PRD, Sec 1; PLAN, Sec 1]:** The central value proposition of Canon is captured in its core principle: *Every finding comes with its receipt (verified evidence), and when human reviewers repeatedly override a rule, Canon identifies that the rule itself is defective and programmatically backtests an improved rule on past submissions before a brand manager approves it.*
- **DECISION [DEC-01]:** Canon is engineered as a stand-alone enterprise B2B SaaS platform rather than a disposable hackathon demo. While Milestone 1 delivers a strictly bounded vertical slice for the CodeNexus Round 2 evaluation, the system architecture, domain boundary definitions, data schemas, and security controls are designed for enterprise longevity and multi-tenant scaling.

```
                    +-------------------------------------------------------+
                    |                      CANON VISION                     |
                    |    Pre-Publication Brand Governance & Verification    |
                    +-------------------------------------------------------+
                                                |
          +-------------------------------------+-------------------------------------+
          |                                                                           |
          v                                                                           v
+-----------------------------+                                             +-----------------------------+
|    VERIFIED EVIDENCE FIRST  |                                             |   OVERRIDE-DRIVEN LEARNING  |
| Every flag cites exact text |                                             | Human overrides pinpoint    |
| & approved source receipts; |                                             | bad rules; proposed diffs   |
| no unverifiable findings.   |                                             | backtested before adoption. |
+-----------------------------+                                             +-----------------------------+
```

---

## 2. Problem Statement & Root Cause Analysis

### 2.1 The Core Industry Problem
- **FACT [PRD, Sec 2; R1-PROP, Sec 1]:** Organizations now generate and distribute communications through distributed workforces, external creative agencies, freelance copywriters, and generative AI tooling.
- **FACT [PRD, Sec 2]:** Generative AI and automated tooling have lowered the marginal cost of producing written and visual content to near zero, creating an exponential content volume surge.
- **FACT [PRD, Sec 2; PLAN, Sec 1]:** Organizational review capacity (brand managers, legal counsels, compliance officers) remains fundamentally bounded by human time. Consequently, inaccurate factual claims, expired pricing, unapproved brand terminology, non-compliant disclaimers, and off-brand visual assets slip into public publication, causing regulatory penalties, legal exposure, and brand erosion.

### 2.2 Structural Root Causes
- **FACT [PRD, Sec 2]:** Brand guidelines, factual claim ledgers, and editorial standards exist primarily as static, unstructured artifacts (multi-page PDF brand manuals, slide decks, and shared cloud folders) that are disconnected from authoring environments.
- **FACT [PRD, Sec 2]:** Content creators do not read or cross-reference 80-page guideline PDFs at the moment of content creation.
- **FACT [PRD, Sec 2; R1-PROP, Sec 2]:** Human reviewers perform tedious, manual cross-checking of identical repetitive errors, causing review backlogs, reviewer fatigue, inconsistent subjective judgments, and friction between creative and compliance teams.

---

## 3. Target Organization & Market Fit

- **FACT [PRD, Sec 4]:** The target organization is a growing mid-size to large enterprise publishing multi-channel content through distributed teams, regional departments, and external agency partners.
- **FACT [PRD, Sec 4]:** Regulated, compliance-intensive, and claim-sensitive industries represent the highest initial product affinity.
- **ASSUMPTION [ASM-01]:** Initial go-to-market beachheads comprise:
  1. *Financial Services & FinTech:* Mandatory regulatory disclaimers, strict product fee claims, audit trail mandates.
  2. *HealthTech & Healthcare:* High-liability claims, terminology restrictions, strict proof-of-efficacy requirements.
  3. *Enterprise B2B SaaS:* Rapid release cycles, complex multi-tier pricing, partner marketing consistency.
- **VERIFY [VER-01]:** Validate willingness-to-pay and procurement security requirements through primary customer discovery interviews during post-hackathon acceleration.

---

## 4. Product Boundaries: In-Scope vs. Explicit Non-Goals

```
+--------------------------------------------------------------------------------------------------+
|                                    CANON SYSTEM BOUNDARIES                                       |
+--------------------------------------------------------------------------------------------------+
|  IN-SCOPE (Core Governance Platform)             |  EXPLICIT NON-GOALS (Out of Scope)            |
|  - Ingestion & compilation of guideline sources  |  - Digital Asset Management (DAM)             |
|  - Rule, claim, and terminology lifecycle mgmt   |  - Content generation / generative writing    |
|  - Multi-format ingestion (Text, DOCX, PDF)      |  - Live authoring canvas plugins (Figma/Adobe)|
|  - Deterministic-first check pipeline            |  - Video and audio content checks             |
|  - LLM semantic checks with schema constraints   |  - Multilingual localization beyond English   |
|  - Programmatic double-receipt verifier          |  - Enterprise SSO/SAML (Milestone 1-2)        |
|  - Human review, overrides, disputes & approvals |  - Billing & payment subscription gateways    |
|  - Rule Health analytics & diagnosis             |  - General conversational chatbot / assistant |
|  - Rule change diff generation & backtesting     |  - Single vanity "Brand Score" as primary UI  |
|  - AI call disclosure panel & append-only audit  |  - Legal advice or compliance guarantees      |
|  - Strict multi-tenant workspace isolation       |  - Autonomous publishing without human signoff|
+--------------------------------------------------------------------------------------------------+
```

### 4.1 In-Scope Features (Target Full Platform)
1. **Trusted Policy Ingestion:** Structured extraction of brand rules, terms, and claims from official documents with mandatory human verification before activation.
2. **Multi-Format Content Checking:** Ingestion and parsing of plain text, Microsoft Word (`.docx`), and Adobe Portable Document Format (`.pdf`).
3. **Hybrid Verification Pipeline:** Deterministic rules executed in code for exact terms, banned phrases, claim matching, numbers, dates, units, and WCAG contrast, combined with LLM semantic checks for voice, tone, and paraphrased claims.
4. **Programmatic Double-Receipt Verifier:** Automated code engine confirming both the flagged submission span and the cited source quote span before findings are displayed.
5. **Human Decision Workflow:** Role-based human review supporting Accept, Edit, Reject, and Override actions, mandating standardized Reason Codes.
6. **Rule Health Intelligence:** Aggregation of reviewer overrides to identify defective brand guidelines (noisy, unclear, stale, scope mismatch).
7. **Backtest Simulation Engine:** Automated replay of past content submissions against proposed rule diffs to measure impact and catch unintended regressions.
8. **Enterprise Transparency & Safety:** Visible AI disclosure panel sourced from real execution logs, immutable append-only audit logging, and tenant isolation via PostgreSQL Row-Level Security.

### 4.2 Explicit Non-Goals (Out of Scope)
- **FACT [PRD, Sec 3]:** Canon is **NOT** a Digital Asset Management (DAM) system (does not replace Bynder or Brandfolder).
- **FACT [PRD, Sec 3]:** Canon is **NOT** a content generator or creative copywriting AI (does not replace Jasper or Copy.ai).
- **FACT [PRD, Sec 3]:** Canon does **NOT** build Figma, Canva, or Adobe InDesign plugins in initial milestones.
- **FACT [PRD, Sec 3]:** Canon does **NOT** evaluate audio, video, or rich multi-modal animation assets.
- **FACT [PRD, Sec 3]:** Canon does **NOT** provide multilingual translation or cross-lingual checking (English-only scope initially).
- **FACT [PRD, Sec 3]:** Canon does **NOT** provide legal advice or an absolute warranty of statutory regulatory compliance.
- **FACT [PRD, Sec 3]:** Canon will **NEVER** autonomously publish or deploy user content without authenticated human sign-off.
- **FACT [PRD, Sec 3]:** Canon does **NOT** present a single opaque composite "Brand Score" (e.g., "78/100") as its primary interface, rejecting vanity metrics in favor of actionable, receipt-backed findings.

---

## 5. Non-Negotiable Product & Engineering Principles

1. **Principle 1: Deterministic First [STD, Sec 2.5; PRD, Sec 5.1]:**  
   If business logic can be evaluated deterministically in code (regular expressions, lemmatization, string distance, mathematical formulas, exact ledger queries), an LLM must never be invoked to make that decision. The LLM is restricted to tone assessment, paraphrased claim reasoning, and intent-preserving rewrite generation.
2. **Principle 2: Evidence or Nothing [STD, Sec 2.6; PRD, Sec 5.2]:**  
   A finding is displayed to a human reviewer as confirmed *only if programmatic code verifies both receipts*: (a) the flagged excerpt exists in the submission, and (b) the cited rule quote exists in the active approved policy. Unverifiable model outputs are discarded or explicitly tagged as unverified.
3. **Principle 3: Two-Lane Trust Architecture [STD, Sec 3.1, 7.1; ARCH, Sec 4]:**  
   The platform operates across two strictly segregated trust lanes:
   - *Trusted Lane:* Official policy documents, active rules, claim ledgers, and approved assets—authored and modified exclusively by authenticated humans.
   - *Untrusted Lane:* Submissions, user comments, and external files—treated strictly as passive data and never as executable instructions.
4. **Principle 4: AI Has Zero Authority [STD, Sec 3.1-3.3; ARCH, Sec 4]:**  
   The runtime LLM is a stateless analysis component. It possesses zero tool access, zero direct database connection, zero network access, and zero authority to create rules, approve policies, mutate finding statuses, or publish content.
5. **Principle 5: Escalate Uncertainty [STD, Sec 3.6, 8.7; PRD, Sec 5.5]:**  
   When a factual claim in content cannot be matched to an entry in the approved claim ledger, Canon never guesses or auto-approves. It flags the claim as *Critical* and escalates it to human compliance officers.
6. **Principle 6: Smallest Working Change (Ponytail Frugality) [STD, Sec 2.4]:**  
   Build the minimal necessary code to satisfy requirements reliably. Avoid premature microservice decomposition, complex distributed message queues, or unnecessary dependencies until measured metrics prove their necessity.
7. **Principle 7: Full Transparency & Disclosed Operations [STD, Sec 8.9, 8.11; PRD, FR-30]:**  
   Every external AI API call, provider name, data payload summary, and retention policy is logged and exposed to users in real time via an interactive Disclosure Panel.

---

## 6. Measurable Success Metrics (Evaluation Harness)

- **FACT [PRD, Sec 15; STD, Sec 9.7]:** No target percentages or accuracy claims may be invented or borrowed from vendor marketing. Target benchmarks must be measured directly using Canon's built-in evaluation harness.

| Metric ID | Metric Name | Operational Definition & Measurement Formula | Target Baseline |
|:---|:---|:---|:---|
| **`MET-01`** | **Precision per Category** | $\frac{\text{True Positive Findings}}{\text{True Positive Findings} + \text{False Positive Findings}}$ evaluated against the labelled reference dataset of ~120 synthetic test cases. | To be measured via `make eval` |
| **`MET-02`** | **Recall per Category** | $\frac{\text{True Positive Findings}}{\text{True Positive Findings} + \text{False Negative Findings}}$ across terminology, claims, tone, accessibility, and visual checks. | To be measured via `make eval` |
| **`MET-03`** | **Evidence-Verified Rate** | $\frac{\text{Findings with both receipts programmatically verified}}{\text{Total findings generated by check pipeline}}$ | 100% of findings shown as confirmed |
| **`MET-04`** | **Run-to-Run Consistency** | Percentage of identical findings produced when the identical submission is executed across 5 consecutive runs at temperature 0. | High consistency target (to be quantified) |
| **`MET-05`** | **Prompt Injection Resistance** | $\frac{\text{Adversarial injection attempts neutralized as findings}}{\text{Total adversarial test cases in evaluation harness}}$ (tested against ~10 embedded jailbreaks). | 100% (zero instruction compliance) |
| **`MET-06`** | **Policy Extraction Accuracy** | $\frac{\text{Compiler-proposed rules approved without edit by human}}{\text{Total compiler-proposed rules across benchmark policies}}$ | To be measured on sample policy docs |
| **`MET-07`** | **Rule Health Detection Rate** | $\frac{\text{Seeded defective rules flagged in Rule Health}}{\text{Total seeded defective rules in test set}}$ | 100% detection of seeded flaws |
| **`MET-08`** | **Reviewer Cycle Time** | Average elapsed seconds required for a human reviewer to review, adjudicate, and sign off on a standard submission. | To be benchmarked against manual baseline |

---

## 7. Master Domain Glossary

To prevent semantic ambiguity and eliminate vague terminology, every technical and domain concept within Canon is defined below with authoritative precision:

1. **Active Policy Version:** The specific, immutable policy version (e.g., `v1.0`) currently designated as legally binding for a given workspace.
2. **Approved Claim Ledger:** The trusted relational catalog (`approved_claim`) of verified facts, statistics, pricing, and product capabilities, including effective date windows (`valid_from`, `valid_until`).
3. **Backtest Engine:** An automated verification service that executes historical submissions against a candidate rule modification to identify affected findings and detect new critical misses before live rollout.
4. **Check Run:** A single execution instance of the verification pipeline against a specific `submission_version` under a specific `policy_version`.
5. **Decision:** An authenticated human action (`accept`, `reject`, `edit`, `override`) recorded against an individual finding, requiring an associated `reason_code` for overrides.
6. **Deterministic Check:** A rule evaluation implemented entirely in algorithmic code (regex, string distance, set logic, WCAG luminance formula) without invoking probabilistic language models.
7. **Dispute:** A structured objection lodged by a content creator against a specific finding, citing a reason code and counter-argument.
8. **Double Receipt:** The dual cryptographic and textual proof required for confirmed findings: (Receipt A) flagged excerpt verified in submitted text; (Receipt B) cited rule and text verified in approved policy document.
9. **Finding:** An identified discrepancy between submitted content and approved policy, characterized by severity (`critical`, `major`, `minor`), category, exact character offsets, and verified quotes.
10. **Flagged Quote:** The exact substring in the submitted document identified as violating brand policy.
11. **Intent-Preserving Suggestion:** An alternative phrasing generated by the system that resolves a policy violation while strictly preserving the creator's semantic intent and introducing zero unapproved claims.
12. **Policy Ingestion / Compiler:** The privileged administrative process that extracts draft candidate rules, claims, and terms from unstructured source documents for human approval.
13. **Reason Code:** A standardized taxonomic classification (e.g., `APPROVED_EXCEPTION`, `CONTEXT_MISUNDERSTOOD`, `OUTDATED_RULE`) mandated whenever a human reviewer overrides a finding.
14. **Rule Code:** A stable identifier (e.g., `TERM-001`, `CLAIM-042`) assigned to a brand rule that persists across successive policy versions to preserve continuous Rule Health analytics.
15. **Rule Health:** Continuous governance analytics that monitor override and dispute frequencies per `rule_code` to classify rules into diagnostic states: `NOISY`, `SCOPE_MISMATCH`, `UNCLEAR`, or `STALE`.
16. **Severity Hierarchy:**
    - `CRITICAL`: Factual contradictions, unsupported claims, mandatory legal disclaimer omissions, prompt injection attempts. Blocks publication.
    - `MAJOR`: Off-brand voice/tone, severe terminology violations, significant contrast failures. Requires explicit reviewer sign-off.
    - `MINOR`: Stylistic inconsistencies, minor formatting defects, recommended terminology improvements. Advisory only.
17. **Source Locator:** The exact structural reference in an approved policy document, consisting of `document_id`, `page_number`, and normalized character offsets.
18. **Two-Lane Trust Model:** The fundamental security boundary separating privileged, human-approved governance data from untrusted, hostile user content and external LLM interactions.
19. **Unknown Claim:** A factual assertion detected in content that has no corresponding match in the active approved claim ledger, triggering mandatory escalation.
20. **Workspace:** The top-level logical tenant boundary (`workspace_id`) that isolates all policies, users, submissions, findings, and audit logs within the multi-tenant architecture.
