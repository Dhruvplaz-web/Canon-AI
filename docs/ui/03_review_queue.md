# Canon UI Overhaul — Screen: Review Queue

## 1. Overview & Requirements
- **Route:** `/review` (View Mode: `queue`)
- **Feature Directory:** `src/features/review/`
  - `ReviewHeader.tsx`: Pending triage counter, view mode toggle ("Findings Queue" vs "Approver Signoff"), manual data refresh.
  - `ReviewTable.tsx`: Multi-select checkboxes for batch triage, severity badges, draft excerpt vs statutory policy citation preview, status indicator ("Pending Review", "Overridden").
  - `OverrideModals.tsx`:
    - `SingleOverrideModal`: Records human override with statutory reason codes (`RC-01` to `RC-04`) and justification notes.
    - `BulkOverrideModal`: **Enforces Standard F36** by automatically excluding Critical violations from batch overrides and providing informative explanations.
- **Entrypoint:** `src/app/review/page.tsx` (240 LOC, down from 1624 LOC).

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - Descriptive `EmptyState` when all queue items have been triaged or no findings match filter.
2. **Loading State:**
   - Skeleton layout preserving table columns and header dimensions.
3. **Multi-Selection State:**
   - Sticky action bar displaying number of selected items with single-click batch override trigger.
4. **Error & Feedback State:**
   - Toast notifications on override success or failure.

---

## 3. Defects & Jargon Remediation
- **Fixed F36:** Critical violations are strictly excluded from batch overrides.
- Dual Grounding citations displayed in plain English: "Flagged Draft Span" and "Statutory Policy Rule".
- Submissions and reason codes integrated from active backend endpoints.
