# Canon UI Overhaul — Screen: Findings List

## 1. Overview & Requirements
- **Location:** `src/features/submissions/FindingsList.tsx`
- **Rendered Inside:** `/submissions` right rail
- **Design Tokens:** Strict adherence to semantic status tokens (Critical, Warning, Info).
- **Dual Grounding:**
  - **Draft Citation Span:** Exact matched text excerpt from user's copy.
  - **Statutory Policy Excerpt:** Verbatim quote from the governing regulatory document.
- **Interactivity:**
  - Click-to-scroll: Selecting any finding focuses the textarea and sets the selection range directly to `[start_offset, end_offset]`.
  - Instant Remediation: "Apply Fix" button replaces the offending text with the approved substitute and updates findings in place.
  - Batch Remediation: "Apply All Minor Fixes" with accessible Radix confirmation dialog.
  - Passed State: Clean celebratory state with trigger to launch `ComplianceCertificateModal`.

---

## 2. State Spectrum Implementation
1. **Initial / Unchecked State:**
   - Informative card prompting user to run compliance verification.
2. **Loading State:**
   - Pulsing skeleton cards matching finding layout.
3. **Clean / Passed State (0 Violations):**
   - Celebratory banner with green checkmark, "0 Violations" badge, and "Generate Compliance Release Certificate" button.
4. **Violations List State:**
   - Grouped breakdown bar (Critical, Major, Minor counts), followed by interactive cards with dual grounding receipts.

---

## 3. Defects & Jargon Remediation
- Converted internal "Receipt A" and "Receipt B" labels to user-friendly "Draft Citation Span" and "Statutory Policy Excerpt".
- Added safe batch remediation confirmation dialog preventing inadvertent bulk edits.
- Added visual feedback toast notifications when remediations are applied.
