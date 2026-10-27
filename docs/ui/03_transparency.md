# Canon UI Overhaul — Screen: AI Transparency & Disclosures

## 1. Overview & Requirements
- **Route:** `/transparency`
- **Feature Directory:** `src/features/transparency/`
  - `TransparencyComponents.tsx`:
    - `EUAIActDisclosures`: Professional regulatory declarations replacing internal scope codes (`FR-14`, `VER-04`, `M1`).
    - `TelemetryMetricsGrid`: Active downstream multi-provider failover (Groq, Gemini, OpenAI), 24h call volumes, token throughput, median latency.
    - `RecentInferenceCallsTable`: Auditable ledger of model calls with token counts, latency, and sanitized activity summaries.
- **Entrypoint:** `src/app/transparency/page.tsx` (115 LOC, down from 217 LOC).

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - Graceful fallback when call history is empty or loading.
2. **Loading State:**
   - Skeleton cards matching the dual-disclosure banner and metrics grid.
3. **Content State:**
   - Live telemetry feed loaded directly from `/api/v1/transparency/disclosure`.

---

## 3. Defects & Jargon Remediation
- **Purged Leaked Jargon:** Completely removed internal references to "FR-14 Text Redaction", "NOT BUILT IN M1", "VER-04", and "Milestone 1".
- Replaced with formal EU AI Act Article 50 transparency declarations and Zero-Training data retention commitments.
- Exposed the `recent_calls` table previously hidden from the user interface.
