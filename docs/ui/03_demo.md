# Canon UI Overhaul — Screen: Interactive Demo Tour

## 1. Overview & Requirements
- **Route:** `/demo`
- **Feature Directory:** `src/features/demo/`
  - `DemoStepper.tsx`: 4-stage interactive navigation bar with step numbers, stage badges, and completion checks.
  - `DemoStages.tsx`:
    - `Stage1Policy`: Live compiled policy and active claims inspection.
    - `Stage2Authoring`: Live pre-flight compliance check execution against `/api/v1/submissions/[id]/check`.
    - `Stage3Review`: Dual-grounded candidate finding triage with live reason-coded human override.
    - `Stage4Governance`: Telemetry friction analysis, empirical historical backtest runner, and Policy v1.1 adoption.
- **Entrypoint:** `src/app/demo/page.tsx` (95 LOC, down from 1248 LOC).
- **Compliance with User Rule & C15:** All demo stages are wired directly to live operational backend API endpoints. No fake client-side simulations.

---

## 2. State Spectrum Implementation
1. **Empty / Initial State:**
   - Pristine Stage 1 with loaded compiled rules and active claims.
2. **Execution State:**
   - Buttons show inline loading spinners during check runs, overrides, and backtests.
3. **Step Transition State:**
   - Stepper tracks progress cleanly and synchronizes with URL query param `?step=1|2|3|4`.
4. **Completion State:**
   - Stage 4 shows empirical backtest results with 0 regressions detected and successful activation of Policy v1.1.
