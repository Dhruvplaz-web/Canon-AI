# Canon UI Overhaul — Screen: Governance & Rule Health

## 1. Overview & Requirements
- **Route:** `/governance`
- **Feature Directory:** `src/features/governance/`
  - `RuleHealthGrid.tsx`: Rule friction telemetry cards with diagnostic badges (`HEALTHY`, `HIGH_OVERRIDE_DRIFT`, `SCOPE_MISMATCH`), evaluation counts, and formatted override rates.
  - `ProposalAndBacktestSection.tsx`: Multiple candidate proposal selector, visual before/after diff viewer, empirical backtest simulation runner with metrics, and Policy v1.1 adoption action.
- **Entrypoint:** `src/app/governance/page.tsx` (180 LOC, down from 540 LOC).
- **Security & Authorization:** Restricted by middleware to `brand_manager` role.

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - Graceful fallback cards if no health metrics are reported.
2. **Loading State:**
   - Skeleton cards matching telemetry grid and diff viewer dimensions.
3. **Simulation State:**
   - Real-time backtest runner with animated spinner, displaying comparative metrics (prior pass rate vs simulated pass rate, regressions detected, safety score).
4. **Adoption State:**
   - Single-click adoption updates active badge to "Policy v1.1 Active" and disables redundant execution.

---

## 3. Defects & Jargon Remediation
- **Fixed NEW-01:** Resolved 8920% math bug by utilizing `formatPercent` from `src/lib/formatters.ts`, which normalizes both decimals (0.41 &rarr; 41.0%) and integer percentages.
- **Removed Hardcoded Proposal:** Eliminated `proposals[0]` hardcoding; users can seamlessly browse and evaluate all available AST revision proposals.
- Clean design tokens in light and dark mode replacing harsh hardcoded borders.
