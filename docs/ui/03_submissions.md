# Canon UI Overhaul — Screen: Submissions Studio

## 1. Overview & Requirements
- **Route:** `/submissions`
- **Feature Directory:** `src/features/submissions/`
  - `SubmissionsHeader.tsx`: Channel selector, quick-load sample presets ("Clean Compliant Copy", "High-Risk Draft with Violations", "Adversarial Prompt Injection"), unsaved changes indicator, compliance check trigger.
  - `CopyEditor.tsx`: Zero-dependency synchronized backdrop highlight layer, character and word counter, active offset selection, font styling.
  - `CreativeStudioPreview.tsx`: Multi-channel visual preview (Web Landing Page, Email Blast, Digital Ad).
  - `CopilotRewriteModal.tsx`: Real-time AI revision copilot.
- **Entrypoint:** `src/app/submissions/page.tsx` (215 LOC, down from 1115 LOC).
- **Design Tokens:** Follows semantic tokens in light and dark mode.

---

## 2. State Spectrum Implementation
1. **Empty State:**
   - Empty editor with clear placeholder ("Type or paste draft marketing copy here...").
2. **Unsaved Changes State:**
   - Warns user before closing/reloading window via native `beforeunload` listener if edits are unsaved.
3. **Loading State:**
   - While check is in-flight: Button disabled with spinning indicator ("Running Checks..."), findings pane pulses skeleton loader.
4. **Content State:**
   - Synchronized character spans highlight violations with distinct severity border cues (red for Critical, amber for Warning).

---

## 3. Defects & Jargon Remediation
- Presets simplified from technical test codes (`SUB-01`, `SUB-02`, `SUB-03`) to human-readable names.
- Zero layout shift during typing; backdrop layer strictly mirrors font-family, font-size, and line-height.
- Undo history enabled when applying suggestions.
