# Canon UI Overhaul — Screen: Review Detail & Approver View

## 1. Overview & Requirements
- **Route:** `/review?view=signoff`
- **Component File:** `src/features/review/ApproverSignoffView.tsx`
- **Rendered Inside:** `/review` when Approver Signoff view is active
- **Dual Grounding:**
  - Verbatim Flagged Draft Citation side-by-side with Statutory Policy Excerpt.
- **Enforcement & Blockers:**
  - Approval is strictly disabled if unresolved Critical violations exist.
  - Informative banner lists active blocker count with remediation guidance.
- **Approver Actions:**
  - **Approve & Sign Off:** Emits release approval and allows issuing signed HMAC certificates.
  - **Send Back with Revision Notes:** Opens modal prompting approver for required edits; updates submission status to `SENT_BACK`.

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - Prompt to select a submission from the pending list when none is active.
2. **Blocked State:**
   - Warning banner when critical violations exist; disabled "Approve & Sign Off" button.
3. **Approved State:**
   - Status badge transitions to "Approved", action button switches to "Release Certificate".
4. **Send Back State:**
   - Accessible modal requiring notes before submission can be returned.
