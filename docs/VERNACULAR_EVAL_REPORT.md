# Vernacular Matcher Evaluation Report (Task 4D / 4E)

**Date:** 2026-11-02  
**Architecture:**
- **Layer 1:** AST Deterministic Concept Groups + Overlay Expansion + Surrogate Commodity Extensions
- **Layer 2:** Sliding-Window Char 3–5 N-Gram TF-IDF Inverted Index with Script-Bias Guard
- **Layer 2b:** 3072-dim Multilingual Semantic Embeddings (`gemini-embedding-001` [real])
- **Layer 3:** Online Semantic AI Layer (`gemini-3.1-flash-lite`, `thinkingBudget: 0`, `maxOutputTokens: 2048`, classification schema, untrusted block guard)

---

## 1. Summary Performance Across Configurations

### 1.1 Tune Split (Leave-One-Out, N=42: 30 violations, 12 safe)

| Configuration | Recall | Precision | F1 | Safe FP | Uncertain | Silent Misses |
|---|---|---|---|---|---|---|
| **(1) Layer 1 alone** | 40.0% | 100.0% | 57.1% | 0 / 12 | 0 | 18 |
| **(2) Layer 1 + Layer 2 (offline)** | 40.0% | 100.0% | 57.1% | 0 / 12 | 13 | 9 |
| **(3) Layer 1 + Layer 2b (embeddings: real)** | 43.3% | 100.0% | 60.5% | 0 / 12 | 28 | 0 |

### 1.2 Test Split (Leave-One-Out, N=42: 30 violations, 12 safe)

| Configuration | Recall | Precision | F1 | Safe FP | Uncertain | Silent Misses |
|---|---|---|---|---|---|---|
| **(1) Layer 1 alone** | 23.3% | 100.0% | 37.8% | 0 / 12 | 1 | 22 |
| **(2) Layer 1 + Layer 2 (offline)** | 23.3% | 100.0% | 37.8% | 0 / 12 | 14 | 13 |
| **(3) Layer 1 + Layer 2b (embeddings: real)** | 26.7% | 100.0% | 42.1% | 0 / 12 | 33 | 0 |
| **(4) Full Pipeline (4B Offline + Real Zero-Shot AI)** | **30.0%** | **100.0%** | **46.2%** | **0 / 12** | **0** | **21** |
| **(5) Full Pipeline (4C Margin Offline + Real Zero-Shot AI)** | **40.0%** | **100.0%** | **57.1%** | **0 / 12** | **0** | **18** |

### 1.3 Stress Tests (N=30: 20 violations, 10 safe look-alikes)

| Configuration | Recall | Precision | F1 | Safe FP | Uncertain | Silent Misses |
|---|---|---|---|---|---|---|
| **(1) Layer 1 alone** | 5.0% | 100.0% | 9.5% | 0 / 10 | 0 | 19 |
| **(2) Layer 1 + Layer 2 (offline)** | 5.0% | 100.0% | 9.5% | 0 / 10 | 13 | 11 |
| **(3) Layer 1 + Layer 2b (embeddings: real)** | 25.0% | 100.0% | 40.0% | 0 / 10 | 23 | 0 |
| **(4) Mode 1: Real AI Zero-Shot v2** | 85.0% | 94.4% | 89.5% | 1 / 10 | 0 | 3 |
| **(5) Mode 2: Real AI Few-Shot v2** | *NOT USED* | *NOT USED* | *NOT USED* | 4 / 10 | 0 | 20 |
| **(6) Combined Pipeline (Offline + Zero-Shot AI)** | **90.0%** | **94.7%** | **92.3%** | **1 / 10** | **0** | **2** |

*(Combined Pipeline category-must-match definition yields identical metrics: 90.0% recall, 94.7% precision, 1/10 safe FP).*

---

## 2. Test Split: Full Pipeline Comparison (4B vs 4C Offline Rule + Real Zero-Shot AI)

### 2.1 Side-by-Side Pipeline Performance (N=42: 30 violations, 12 safe)

| Pipeline Metric | 4B Offline + AI (`gemini-3.1-flash-lite`) | 4C Margin-First + AI (`gemini-3.1-flash-lite`) |
|---|---|---|
| **Rule Specification** | $T_{\text{HIGH}}=0.75, M_{\text{HIGH}}=0.02, T_{\text{LOW}}=0.58$ | $M \ge 0.11, T \ge 0.68, T_{\text{LOW}}=0.67$ |
| **Overall Recall** | **30.0%** (9 / 30) | **40.0%** (12 / 30) |
| **Overall Precision** | **100.0%** (9 / 9) | **100.0%** (12 / 12) |
| **Safe False Positives** | **0 / 12** (0.0%) | **0 / 12** (0.0%) |
| **Violations Ending Clean (Misses)** | **21 / 30** (70.0%) | **18 / 30** (60.0%) |
| **Silent Misses (Offline Filter)** | 0 / 30 (0.0%) | 7 / 30 (23.3%) |
| **AI Call Share** | **38 / 42** (90.5%) | **14 / 42** (33.3%) |

### 2.2 Per-Category Recall on Test Split

| Category | 4B + Zero-Shot AI | 4C Margin + Zero-Shot AI |
|---|---|---|
| `SURROGATE_ALCOBEV` | 2 / 5 (40.0%) | 2 / 5 (40.0%) |
| `SURROGATE_TOBACCO` | 2 / 5 (40.0%) | 1 / 5 (20.0%) |
| `SURROGATE_BETTING` | 0 / 5 (0.0%) | 0 / 5 (0.0%) |
| `PREDATORY_FINTECH_PROMISE` | 1 / 5 (20.0%) | 2 / 5 (40.0%) |
| `FALSE_URGENCY_DARK_PATTERN` | 3 / 5 (60.0%) | 3 / 5 (60.0%) |
| `PROHIBITED_MAGIC_REMEDY` | 1 / 5 (20.0%) | 4 / 5 (80.0%) |

### 2.3 Per-Style Recall on Test Split

| Style | 4B + Zero-Shot AI | 4C Margin + Zero-Shot AI |
|---|---|---|
| `indirect_no_brand` | 1 / 6 (16.7%) | 2 / 6 (33.3%) |
| `slangy_short` | 1 / 6 (16.7%) | 4 / 6 (66.7%) |
| `direct_branded` | 2 / 6 (33.3%) | 2 / 6 (33.3%) |
| `non_latin_script` | 3 / 6 (50.0%) | 4 / 6 (66.7%) |
| `polite_disguised` | 2 / 6 (33.3%) | 0 / 6 (0.0%) |

---

## 3. Active Offline Rule & Latency Benchmarks

- **Wired Offline Rule:** 4B Threshold Rule (in `embed-check/route.ts` and `eval_vernacular.mjs`):
  - $T_{\text{HIGH}} = 0.75$, $M_{\text{HIGH}} = 0.02$, $T_{\text{LOW}} = 0.58$
- **AI Call Share:**
  - Tune split: 28 / 42 (**66.7%**)
  - Test split (4B): 38 / 42 (**90.5%**)
  - Test split (4C): 14 / 42 (**33.3%**)
  - Stress suite: 23 / 30 (**76.7%**)
- **Latency Breakdown (Average):**
  - Offline layers (L1 + L2 cold index / search): **~1.2 ms**
  - `embed-check` (windowing + batch embedding + cosine scoring): **~220 ms**
  - `ai-check` (`gemini-3.1-flash-lite`, thinking budget 0, maxOutputTokens 2048): **~550 ms**
  - Combined end-to-end latency: **~770 ms** (well within 4.0s SLA)

---

## 4. Data File Integrity & Exact Substring Guard Verification

- **Data File Invariants:**
  - `data/vernacular_exemplars.json` text SHA-256: `8608f8a0797d6959967757a3de524b37babd3c2f64525907ea788afe5cf98555` (Match: `true`)
  - `data/vernacular_stress_tests.json` text SHA-256: `aac30050e0d3843b9b955bb7f9d0bf7dc7ca4dd76f464c1a0aa33ddd556a85d2` (Match: `true`)
  - `data/vernacular_concept_groups.json` SHA-256: `a7e7e3e5c3bcb141a63082deef1584f8a6cb56cf8e07cbad72009339243b6997` (Match: `true`)
- **Guard Substring Verification:**
  - 100% of returned spans in `docs/vernacular_real_ai_run_v2.json` and `docs/vernacular_real_ai_run_test.json` are exact character-for-character substrings of the original stored draft copy (`storedText.includes(span) === true`).
  - Zero spans dropped by exact substring guard.
  - Server validation runs strictly on the original un-normalized draft text.
