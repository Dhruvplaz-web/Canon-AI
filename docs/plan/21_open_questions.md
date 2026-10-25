# Canon: Master Open Questions Register for Human Review (21_open_questions.md)

**Document ID:** `DOC-21`  
**Status:** Complete / Awaiting Human Approval  
**Date:** 2026-10-25  
**Version:** 2.0 (Directives Reconciliation)  
**Parent Trace:** All Canon Project Documents, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Questions Classification & Protocol

In strict adherence to **Non-Negotiable Working Rule 1 (NO SILENT ASSUMPTIONS)**:
- Open questions are explicitly categorized into **BLOCKING** (must be answered by the human lead before the first line of application code is written) and **NON-BLOCKING** (architectural or business decisions that can be finalized during or after Milestone 1).
- For every question, the operational impact ("Why it matters") and the technical lead's recommendation ("Recommended answer") are provided.

---

## 2. BLOCKING Questions (Required Before Coding Starts)

---

### Q-BLOCK-01: Exact CodeNexus Hackathon Round 2 Build Window Timestamps
- **Question:** What are the exact official starting date, start time, and submission deadline for CodeNexus Round 2?
- **Why It Matters:**  
  The hour-by-hour Milestone 1 execution schedule (`DOC-12`) enforces strict go/no-go checkpoints at Hours 12, 24, and 36, and a hard code freeze at Hour 46. While Dhruv Patil's Engineering Plan v3 noted Round 2 as "6–9 Nov 2026" (72–96 hours), the user prompt specifies a strict 48-hour build window. We must lock the exact start timestamp to anchor the countdown timer.
- **Recommended Answer:**  
  Anchor the build schedule strictly to a **48-hour countdown** commencing the exact moment the hackathon organizer officially releases the Round 2 start signal. If the organizer permits 72 hours, retain the 48-hour internal schedule to guarantee a 24-hour buffer for deployment stability, demo rehearsals, and slide preparation.

---

### Q-BLOCK-02: Hosted LLM Provider Selection & Data Retention Verification
- **Question:** Which hosted LLM provider API key will be configured in production for the pipeline adapter (`pipeline/llm/adapter.py`)?
- **Why It Matters:**  
  `Canon AI Rules and Engineering Standards` section 8.9 and 8.11 mandate that the live AI Disclosure Panel reflect real provider call logs and empirically verified data retention policies (`VER-11`). The provider must support JSON schema mode and temperature 0.
- **Recommended Answer:**  
  Configure a single hosted model provider behind the `LLMProvider` protocol adapter (e.g., Mistral AI or Groq Free Tier API). Empirically verify provider API rate limits, data retention policies, and non-training terms under `VER-11` prior to development. All model invocations are strictly routed through Canon's protocol adapter; direct vendor SDK calls outside the adapter are banned.

---

### Q-BLOCK-03: Primary Cloud Hosting Provider for Backend API
- **Question:** Shall we standardize on Render as the single cloud backend host for Milestone 1?
- **Why It Matters:**  
  The public URL must be reachable by hackathon judges and evaluators. Render's free tier has a 15-minute idle spin-down resulting in cold starts if not pre-warmed (`VER-09`).
- **Recommended Answer:**  
  Standardize on **Render Free Web Service (Single Host for M1)** deployed in Hours 00–04. Execute an automated keep-alive warm-up ping script (`python scripts/warmup_ping.py`) 5 minutes prior to live evaluation. The secondary Railway mirror is removed from M1 to reduce operational complexity and stay strictly on a single host.

---

### Q-BLOCK-04: PyMuPDF Coordinate Parsing Scope for Milestone 1
- **Question:** Does the team approve deferring complex binary PDF coordinate parsing to Milestone 2, utilizing plain text and structured `rules.json` with stored source text for Milestone 1?
- **Why It Matters:**  
  Binary PDF parsing, bounding box calculations, and font style extraction via PyMuPDF introduce substantial container image bloat, AGPL licensing considerations, and complex coordinate mapping math that risk sprint delivery.
- **Recommended Answer:**  
  **Yes, approve deferral.** Milestone 1 ingests policy guidelines via structured `rules.json` (with stored guideline text and citations) and evaluates plain text marketing copy submissions with exact character offset mapping. Full binary PDF/PyMuPDF coordinate parsing and 24-page PDF extraction are cleanly scheduled for Milestone 2.

---

## 3. NON-BLOCKING Questions (Can Be Finalized During Build)

---

### Q-NONBLOCK-01: Fictional Guideline Domain Selection
- **Question:** Does the team confirm B2B FinTech / Payments ("Acme Financial / Acme Cloud") as the official demonstration industry?
- **Why It Matters:**  
  Prathmesh Shinde must format the reference guideline seed pack and sample claims ledger (`DOC-13, TSK-M1-06`). FinTech was recommended in the PRD due to strict disclaimer and fee claim regulations.
- **Recommended Answer:**  
  Confirm **Acme Financial / Acme Cloud (FinTech)**. The combination of mandatory SLA availability rules ("99.9% availability, never 100% guarantee"), fee claims ("$0 transfer fees"), and regulatory disclaimers ("Member FINRA/SIPC") creates an undeniable demonstration of double-receipt verification.

---

### Q-NONBLOCK-02: Commercial Trademark Clearance & Entity Name Pivot
- **Question:** When should the formal legal trademark clearance search for the name "Canon" be initiated, and what is our fallback naming strategy?
- **Why It Matters:**  
  "Canon" is widely registered by Canon Inc. in photography and optical equipment. While software brand governance operates in a distinct commercial class, trademark confusion could arise during commercial venture funding.
- **Recommended Answer:**  
  Retain **"Canon (Working Title; Trademark Pending)"** throughout the hackathon. Post-hackathon, conduct a formal USPTO and WIPO trademark search (`VER-14`). If contested, pivot commercially to alternative candidate names (e.g., BrandCanon, LexBrand, or Veritas Governance).

---

### Q-NONBLOCK-03: Post-Hackathon Commercial Pricing Architecture
- **Question:** What commercial pricing model architecture should be adopted post-hackathon?
- **Why It Matters:**  
  Judges and investors evaluate whether the platform has realistic SaaS monetization unit economics.
- **Recommended Answer:**  
  **Explicitly Deferred.** Per project directives, pricing numbers and specific subscription tiers are deferred until empirical data is gathered from closed enterprise customer pilots in Milestone 2. No arbitrary SaaS dollar figures ($49/mo) are invented upfront.

---

### Q-NONBLOCK-04: Offline Live Presentation Contingency Protocol
- **Question:** Does the team approve standardizing on a single pre-recorded fallback presentation video rather than a mandatory local Docker demo stack?
- **Why It Matters:**  
  Hackathon venue Wi-Fi networks frequently become congested or disconnect during presentations. Running local Docker alongside live browser tabs adds memory pressure and operational friction.
- **Recommended Answer:**  
  **Yes, approve single fallback video.** The live pitch targets the public deployed Vercel URL. A **single pre-recorded 4-minute presentation video (MP4)** is pre-staged locally on the presenter laptop as the official fallback in case conference Wi-Fi degrades. Mandatory localhost Docker fallback is removed from Milestone 1.
