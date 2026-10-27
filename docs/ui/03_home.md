# Canon UI Overhaul — Screen: Home Dashboard

## 1. Overview & Requirements
- **Route:** `/`
- **Feature Directory:** `src/features/home/`
  - `HeroSection.tsx`: Platform overview, live telemetry ping, pending review count, primary CTA buttons.
  - `RoleGreetingBanner.tsx`: Role-tailored action guidance for Creator, Reviewer, and Brand Manager; clean guest mode prompt for unauthenticated visitors.
  - `HomeSections.tsx`: 4-Pillar interactive workflow Bento grid, high-override rule telemetry spotlight, AI evaluation suite shortcut.
- **Entrypoint:** `src/app/page.tsx` (66 LOC, down from 415 LOC).
- **Design Tokens:** Strict adherence to semantic surface/text/border tokens in light and dark modes.

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - Graceful fallback when pending reviews are 0 or unauthenticated.
2. **Loading State:**
   - Client fetches execute asynchronously with layout-preserving placeholders.
3. **Error State:**
   - Individual subcomponents fail silently to cached/default metrics without crashing the root page (fault isolation).
4. **Content State:**
   - Live API ping latency and real item counts populated from `/api/v1/health/live` and `/api/v1/review/queue`.

---

## 3. Copy & Jargon Compliance
- Eliminated internal labels ("Deterministic Double-Receipt Brand Governance" -> "Evidence-Based Brand Governance Platform").
- Removed raw proposal code prefixes from prominent card titles ("PROP-01" -> "Mortgage Qualification Exception").
- Verified dual-grounding plain-English terminology across all 4 workflow cards.
