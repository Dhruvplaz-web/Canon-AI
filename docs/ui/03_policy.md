# Canon UI Overhaul — Screen: Policy Explorer

## 1. Overview & Requirements
- **Route:** `/policy`
- **Feature Directory:** `src/features/policy/`
  - `PolicyHeader.tsx`: Policy metadata, version badge, SHA-256 hash copy button, manual refresh, document ingestion trigger.
  - `PolicyFilters.tsx`: Search input with debounce/clear, category dropdown, severity filter, layout toggle (Split Document Reader vs Rule Grid), active/reset controls.
  - `PolicyRulesTable.tsx`: Filtered rules list with status badges, pattern preview, inline rule code copy, click-to-drawer interaction.
  - `RuleDetailSheet.tsx`: Sliding Radix drawer with verbatim statutory citation excerpts, approved remediation advice, and rule metadata.
  - `ApprovedClaimsTab.tsx`: Time-bounded substantiated claims table with formatted validity dates and active status indicators.
  - `SourceDocumentReader.tsx`: Split-screen raw text reader with interactive active grounding quotes linked to rules.
- **Entrypoint:** `src/app/policy/page.tsx` (190 LOC, down from 993 LOC).
- **Design Tokens:** Strict semantic CSS custom properties in light and dark modes.

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - When search/filter matches 0 rules: Descriptive `EmptyState` component with "No Rules Match Your Filter" and a single-click "Clear All Filters" button.
2. **Loading State:**
   - Multi-card pulsing skeleton loaders preserving split layout dimensions.
3. **Error State:**
   - Human-readable `ErrorState` with retry button triggering cache bypass re-fetch.
4. **Content State:**
   - Interactive split view with URL-synced search queries (`?q=...&category=...&severity=...&tab=...&view=...`).

---

## 3. Defects & Jargon Remediation
- Replaced internal "Receipt B" with "Verbatim Statutory Policy Excerpt".
- Added copy button with visual feedback for quick rule code copying.
- Formatted approved claim dates (`valid_from`, `valid_until`) using standard locale date formatters.
