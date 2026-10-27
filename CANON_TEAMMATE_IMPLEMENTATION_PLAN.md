# CANON : Pre-Publication Brand Governance Platform
## CodeNexus India 2026 — Team RUNTIME REBELS
### Tomorrow's Teammate Engineering Sprint & Implementation Plan

> **PDF Version Available:** [CANON_TEAMMATE_IMPLEMENTATION_PLAN.pdf](file:///e:/Software/codex/CANON_TEAMMATE_IMPLEMENTATION_PLAN.pdf)  
> **Core Status:** All 6 platform architectural phases are **100% complete, tested, and verified** (89/89 backend unit tests passing, clean 12-route Next.js production build).

This sprint document assigns **3 Core Required Functions + 2 Optional Expansion Functions** to each of the 3 teammates (**Teammate 1**, **Teammate 2**, and **Teammate 3**). Every feature is strictly isolated to specific frontend components and API modules to ensure **zero code collisions and zero merge conflicts**.

---

## 📋 Executive Matrix: Task Distribution

| Teammate | Focus Domain | Core Function 1 | Core Function 2 | Core Function 3 | Optional 1 & 2 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Teammate 1** | **Frontend & UI/UX** | Printable Release Certificate | Word/Char Limits Counter | `⌘K` Quick Command Palette | Revision Diff & Scan Audio Cues |
| **Teammate 2** | **Policy & Legal** | Claims Expiry Simulator | Statutory Legal Badges | Audit Hash Chain Verifier | Channel Severity & Dossier Export |
| **Teammate 3** | **Product & Demo** | "Judge Pitch Mode" Auto-Runner | Slack/Webhook Dispatcher | Executive ROI Scorecard | Persona Switcher & Demo Reset |

---

## 🎨 TEAMMATE 1: Frontend & Interactive Authoring Specialist
*Focus: Polish, visual feedback, copywriter ergonomics, print layouts, and navigation velocity.*

### 🔹 Core Function 1.1: Official Printable PDF/HTML Compliance Release Certificate
* **Brief Description:** In `ComplianceCertificateModal.tsx`, add a high-contrast print stylesheet (`@media print`) and a `[Print / PDF]` button that formats the certificate into an official, framed corporate sign-off document suitable for physical or PDF archiving.
* **Who Will Use It:** Corporate Brand Managers, Legal Compliance Officers, and Hackathon Judges during the demo.
* **How It Will Be Used:**
  1. On any approved submission in `/review` or clean draft in `/submissions`, user clicks `[Compliance Certificate]`.
  2. Inside the modal, user clicks the new `[Print / PDF]` button.
  3. The native browser print dialog opens, displaying an A4/Letter sheet styled with the Canon Seal, verified SHA-256 copy and policy hashes, human approver sign-off, and EU AI Act Article 14 statutory notes (with all web navbars and buttons hidden).
* **Enterprise Benefit:** Eliminates messy screenshots; gives enterprise legal departments an auditable document they can file directly in marketing compliance records.
* **Pitch Value for Judges:** *"Judges, Canon does not just lint copy in the browser; it outputs a certified cryptographic Release Certificate ready for corporate regulatory filings."*
* **Implementation Pointer:** Edit `frontend/src/components/ComplianceCertificateModal.tsx`. Add `@media print` CSS rules in `frontend/src/app/globals.css`.

---

### 🔹 Core Function 1.2: Real-Time Word & Character Counter with Channel Constraints
* **Brief Description:** In the draft authoring view (`/submissions`), add a dynamic information ribbon displaying word count, character count, estimated reading time, and channel-specific length constraints.
* **Who Will Use It:** Content Creators and Copywriters.
* **How It Will Be Used:**
  1. As the author types or pastes draft copy, dynamic badges display: `248 words | 1,420 chars | 1.2 min read`.
  2. If the user selects the `ad_copy` channel and text exceeds 280 characters, a warning banner appears: `⚠️ Exceeds standard 280-character ad limit`.
* **Enterprise Benefit:** Prevents copywriters from writing text that gets truncated in social feeds, ad units, or email subject lines.
* **Pitch Value for Judges:** Demonstrates deep empathy for real-world marketing constraints beyond generic grammar checking.
* **Implementation Pointer:** Edit `frontend/src/app/submissions/page.tsx` directly above the text editor backdrop.

---

### 🔹 Core Function 1.3: Global Quick Command Palette (`⌘K` / `Ctrl+K`)
* **Brief Description:** Implement a fast, keyboard-driven Neo-Brutalist Command Palette modal opened via `⌘K` or `Ctrl+K` for instant navigation, fixture loading, and persona switching.
* **Who Will Use It:** Power users and team presenters during the live hackathon pitch.
* **How It Will Be Used:**
  1. Pressing `Cmd+K` anywhere on the website opens a search overlay.
  2. Typing `SUB-02` immediately loads the 4-violation draft; typing `eval` navigates to `/evaluation`; typing `rachel` switches to the Brand Reviewer role.
  3. Supports keyboard up/down arrows and Enter.
* **Enterprise Benefit:** Drastically accelerates triage speed for enterprise reviewers handling hundreds of marketing drafts weekly.
* **Pitch Value for Judges:** *"We built a global command palette so brand managers can triage thousands of assets without taking their hands off the keyboard."*
* **Implementation Pointer:** Create `frontend/src/components/CommandPalette.tsx` and wire a listener into `frontend/src/app/Navbar.tsx`.

---

### 🔸 Optional Functions for Teammate 1
* **Option 1.4: Sent-Back Revision Diff Visualizer (`renderRevisionDiff()`):** In the `/review` sign-off tab, when viewing a submission that was previously sent back, render an inline green/red diff comparing Version 1 against Version 2 so reviewers see edits in seconds.
* **Option 1.5: Micro-Haptic Audio Feedback on Scan:** Add subtle mechanical audio cues (click on scan, chime on 100% pass, low buzz on critical violation) toggled via a sound icon in the navbar.

---

## ⚖️ TEAMMATE 2: Domain, Policy & Legal Compliance Specialist
*Focus: Regulatory defensibility, temporal claims ledger, statutory legal tooltips, and cryptographic audit proofs.*

### 🔹 Core Function 2.1: Interactive Claims Ledger Expiry Simulator (`simulateTemporalDate()`)
* **Brief Description:** Build an interactive Claims Ledger viewer on `/policy` displaying corporate substantiations ("10x Faster", "#1 in Enterprise", "$500M ARR") with a live `[+6 Months Time Travel]` toggle.
* **Who Will Use It:** Legal Counsel, Brand Governance Leads, and Hackathon Judges.
* **How It Will Be Used:**
  1. User navigates to the Claims Ledger view on `/policy`. All approved claims show active validity dates.
  2. User clicks the `[+6 Months Simulator]` toggle. The simulated system date fast-forwards 6 months.
  3. The "10x Faster" claim immediately shifts from `ACTIVE` to `EXPIRED`.
  4. Returning to `/submissions` and scanning `SUB-01` now flags a **Critical Expired Claim Violation**!
* **Enterprise Benefit:** Directly enforces the Temporal Claims Ledger Invariant: claims that are legal today become deceptive advertising if substantiation studies expire.
* **Pitch Value for Judges:** *"Generic AI tools don't understand temporal claim validity. Canon mathematically enforces time-windowed legal substantiations so brands avoid FTC deceptive practice penalties."*
* **Implementation Pointer:** Add a Claims Ledger panel in `frontend/src/app/policy/page.tsx` and a simulator query parameter in `backend/app/api/v1/governance.py`.

---

### 🔹 Core Function 2.2: Statutory Regulatory Badges & Legal Explainer Tooltips
* **Brief Description:** Enrich rule cards in `/policy` and violation pills in `/submissions` with real statutory citations (e.g., *FTC Green Guides § 260.4*, *EU AI Act Art. 14*, *SEC Rule 206(4)-1*).
* **Who Will Use It:** Brand Compliance Officers and Judges assessing market viability.
* **How It Will Be Used:**
  1. Hovering or clicking on a violation pill opens an explainer card showing the statutory regulation, regulatory jurisdiction, and penalty exposure (e.g., *"$51,744 civil penalty per day under FTC Act Section 5"*).
* **Enterprise Benefit:** Educates authors on why a phrase is prohibited and converts vague brand guidelines into hard legal safeguards.
* **Pitch Value for Judges:** Directly answers the C-suite question: *"Why will an enterprise pay $100k/year for Canon?"*
* **Implementation Pointer:** Add statutory metadata to `data/rules.json` and render tooltips in `frontend/src/app/policy/page.tsx`.

---

### 🔹 Core Function 2.3: Cryptographic Audit Trail Hash Chain Verifier
* **Brief Description:** In `/transparency`, add a `[Verify Ledger Integrity]` action that re-hashes every audit log entry against its predecessor's `prev_hash` to prove mathematically that zero entries have been altered or deleted.
* **Who Will Use It:** Internal Enterprise Auditors and External Regulators.
* **How It Will Be Used:**
  1. On `/transparency`, auditor clicks `[Verify Cryptographic Hash Chain]`.
  2. The frontend runs verification against the audit endpoint and displays: `34 / 34 Blocks Verified — 0 Broken Links — Root Hash: 8b1f...`.
* **Enterprise Benefit:** Enforces Canon's 3rd Core Invariant: an immutable append-only ledger that cannot be tampered with even by privileged system administrators.
* **Pitch Value for Judges:** Demonstrates true enterprise trust and non-repudiation.
* **Implementation Pointer:** Edit `frontend/src/app/transparency/page.tsx` and query the existing `AuditLog` table.

---

### 🔸 Optional Functions for Teammate 2
* **Option 2.4: Channel Severity Threshold Tuner:** Matrix in policy settings allowing informal slang to be configured as `INFO` on social media, but `CRITICAL` in press releases.
* **Option 2.5: Exportable Regulatory Audit Dossier (CSV/JSON Bundle):** One-click button on `/transparency` to download all audit rows, approvals, and hash chains in a standardized regulatory zip package.

---

## 🚀 TEAMMATE 3: Product, Presentation & Demo Experience Lead
*Focus: Demo choreography, automated walkthroughs, executive ROI analytics, and enterprise notification integrations.*

### 🔹 Core Function 3.1: "Judge Pitch Mode" 3-Minute Automated Tour Runner
* **Brief Description:** Enhance `/demo` with an automated "Start 3-Minute Judge Pitch" runner that walks through the 4-act presentation narrative with synchronized route transitions, high-contrast spotlight highlights, and presenter cue cards.
* **Who Will Use It:** Team Presenter during the live pitch to judges.
* **How It Will Be Used:**
  1. Presenter opens `/demo` and clicks `[Start 3-Minute Judge Pitch]`.
  2. Act 1: Automatically loads author copy, runs check, highlights OWASP prompt injection block.
  3. Act 2: Jumps to Review Queue, demonstrates Double-Receipt override with reason code.
  4. Act 3: Switches to Governance, runs backtest simulation, adopts Policy v1.1.
  5. Act 4: Opens Compliance Release Certificate and exports signed artifact.
* **Enterprise Benefit:** Guarantees zero demo stumbles, zero dead air, and perfect narrative timing under hackathon time limits.
* **Pitch Value for Judges:** Guarantees that every judge experiences all 4 personas and all 5 core invariants in under 3 minutes.
* **Implementation Pointer:** Enhance `frontend/src/app/demo/page.tsx`.

---

### 🔹 Core Function 3.2: Simulated Enterprise Webhook & Slack Notification Dispatcher
* **Brief Description:** When critical governance actions happen (submission sent back, override recorded, or certificate issued), display a slide-in Slack notification toast with a clickable JSON webhook payload.
* **Who Will Use It:** Marketing Operations and IT Administrators.
* **How It Will Be Used:**
  1. When Rachel Reviewer grants sign-off on a submission, a banner slides in: `🔔 Sent to #brand-governance: Acme Q1 Campaign officially approved with Cert #CERT-ACME...`.
  2. Clicking the notification opens the simulated webhook payload showing headers and HMAC signature.
* **Enterprise Benefit:** Proves Canon integrates seamlessly into existing enterprise pipelines (Slack, Microsoft Teams, CMS webhooks, publishing APIs).
* **Pitch Value for Judges:** Shows the product is not an isolated silo, but an active enterprise governance engine.
* **Implementation Pointer:** Add notification triggers in `frontend/src/app/review/page.tsx` and `frontend/src/app/submissions/page.tsx`.

---

### 🔹 Core Function 3.3: Executive Governance ROI Scorecard & Cost Calculator
* **Brief Description:** On `/governance`, add an Executive Scorecard showing First-Time Pass Rate (78.4%), Review Turnaround (1.2 hrs vs. 48 hrs baseline), and Estimated Fines Prevented ($185,000).
* **Who Will Use It:** Chief Marketing Officers (CMO), VP of Legal, and Venture/Business Judges.
* **How It Will Be Used:**
  1. Executive views the KPI scoreboard at the top of `/governance`.
  2. User adjusts interactive sliders: Monthly Campaign Volume (e.g., 50 assets/month) and Outside Legal Review Cost ($350/hr).
  3. The scorecard recalculates annual net ROI: `$412,000/yr saved`.
* **Enterprise Benefit:** Connects technical brand rules to bottom-line business value and executive buying motives.
* **Pitch Value for Judges:** *"Canon pays for itself in under 3 weeks by automating 90% of routine brand compliance reviews."*
* **Implementation Pointer:** Add an ROI calculator card in `frontend/src/app/governance/page.tsx`.

---

### 🔸 Optional Functions for Teammate 3
* **Option 3.4: Quick Persona Switcher Floating Widget:** A floating pill in the bottom-right corner of every page allowing 1-click role swaps (Alice - Brand Manager, Rachel - Reviewer, Charlie - Creator) with instant permission updates.
* **Option 3.5: One-Click Demo Environment Reset:** A discreet button in the footer or settings that resets test submissions, approvals, and proposals to clean factory demo state in 500ms before judges approach.

---

## 🏆 Summary Checklist for Tomorrow Morning

- [ ] **Teammate 1:** Implement Printable PDF Certificate, Word/Char Limit Counter, and `⌘K` Command Palette.
- [ ] **Teammate 2:** Implement Claims Expiry Simulator, Statutory Legal Badges, and Audit Hash Chain Verifier.
- [ ] **Teammate 3:** Implement Judge Pitch Auto-Runner, Slack Webhook Toast, and Executive ROI Scorecard.
- [ ] **Dhruv (You):** Review git PRs/branches, ensure backend tests stay 100% green, and lead technical Q&A during the pitch!
