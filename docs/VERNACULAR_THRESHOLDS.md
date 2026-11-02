# Vernacular Matcher Layer 2 & Layer 2b: Threshold Tuning Documentation

**Date:** 2026-11-01  
**Dataset Split Used:** `split === "tune"` exclusively (42 entries: 30 violations, 12 safe look-alikes)  
**Strict Constraint Enforced:** The `test` split (42 entries) and the 30 stress tests were strictly **NOT** inspected or used during threshold tuning.

---

## 1. Overview of Detection Architecture

The Vernacular Matcher combines complementary detection layers:
1. **Layer 1:** Deterministic concept groups, brand dictionaries, proximity rules, and safe blockers.
2. **Layer 2 (Offline Lexical):** Character n-gram (lengths 3 to 5) TF-IDF vectors with Soundex-Indic normalization and inverted index.
3. **Layer 2b (Embedding Semantic):** Dense 768-dimensional multilingual semantic vectors (`text-embedding-004` / deterministic dense projection) comparing draft windows against precomputed exemplar embeddings.
4. **Layer 3 (Online AI Verification):** LLM validation for spans escalated as `uncertain`.

---

## 2. Layer 2: Character N-Gram TF-IDF Thresholds

### 2.1 Methodology
- All 42 entries with `split === "tune"` were extracted from `data/vernacular_exemplars.json`.
- Leave-One-Out Cross-Validation (LOO-CV) computed pairwise character n-gram cosine similarities.

### 2.2 Tune Split Distributions
| Comparison Metric | Count | Min | Median | Avg | Max |
|---|---|---|---|---|---|
| **Violations to Same Category Violations** | 30 | 0.000 | 0.113 | 0.116 | 0.267 |
| **Violations to Nearest Violation (any category)** | 30 | 0.000 | 0.160 | 0.164 | 0.283 |
| **Safe Look-alikes to Nearest Violation** | 12 | 0.000 | 0.175 | 0.151 | 0.263 |
| **Safe Look-alikes to Nearest Safe Look-alike** | 12 | 0.000 | 0.079 | 0.094 | 0.216 |

### 2.3 Layer 2 Selected Thresholds
- **`SIMILARITY_HIGH = 0.40`** (Definitive match threshold)
- **`SIMILARITY_LOW = 0.22`** (Escalation / noise floor threshold)
- **Zero FP Buffer:** `HIGH = 0.40` is comfortably above the maximum safe-to-violation score of `0.263` on tune split (52% safety margin).

---

## 3. Layer 2b: Dense Multilingual Semantic Embedding Thresholds

### 3.1 Model & Representation
- **Selected Model:** `gemini-embedding-001` (3072 dimensions), supporting Hindi, Bengali, Tamil, and Romanized Hinglish.
- **Offline / Isolated Fallback:** Deterministic dense projection for hermetic offline test suites.
- **Artifact:** `data/vernacular_embeddings.json` (contains all 84 normalized exemplar vectors).

### 3.2 Evaluation Setup (Tune-Only LOO-CV)
For each exemplar $e_i$ in `split === "tune"`:
- Vector $v_i$ is compared against all other 41 tune vectors $\{v_j \mid j \neq i\}$.
- Recorded metrics:
  - `bestViolScore` = $\max_{j \in \text{Tune Violations}, j \neq i} \cos(v_i, v_j)$
  - `bestSafeScore` = $\max_{j \in \text{Tune Safe}, j \neq i} \cos(v_i, v_j)$
  - `margin` = `bestViolScore` - `bestSafeScore`

### 3.3 Score Distributions on Tune Split (Real Embeddings)
| Metric | Min | Average | Max |
|---|---|---|---|
| **Violation: `bestViolScore`** | 0.601 | 0.690 | 0.780 |
| **Violation: `margin`** | -0.061 | +0.081 | +0.209 |
| **Safe Look-alike: `bestViolScore`** | 0.556 | 0.636 | 0.736 |
| **Safe Look-alike: `margin`** | -0.071 | +0.015 | +0.107 |

### 3.4 Grid Search on Candidate Thresholds (Tune Split Only)
A grid search was run over candidate tuples $(T_{\text{HIGH}}, M_{\text{HIGH}}, T_{\text{LOW}})$ using real vectors:

| $T_{\text{HIGH}}$ | $M_{\text{HIGH}}$ | $T_{\text{LOW}}$ | Viol Flagged (TP) | Safe FP | Silent Misses (FN) | Escalated (Uncertain) | Precision |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0.72 | 0.02 | 0.58 | 6 | 1 | 0 | 35 | 85.7% |
| 0.73 | 0.02 | 0.58 | 6 | 1 | 0 | 35 | 85.7% |
| 0.74 | 0.02 | 0.58 | 6 | 0 | 0 | 35 | 100.0% |
| **0.75** | **0.02** | **0.58** | **6** | **0** | **0** | **35** | **100.0%** |
| 0.76 | 0.02 | 0.58 | 4 | 0 | 0 | 37 | 100.0% |
| 0.78 | 0.02 | 0.58 | 1 | 0 | 0 | 40 | 100.0% |
| 0.80 | 0.02 | 0.58 | 0 | 0 | 0 | 42 | N/A |

### 3.5 Final Selected Layer 2b Thresholds
- **$T_{\text{HIGH}} = 0.75$** (Confidence ceiling for immediate violation)
- **$M_{\text{HIGH}} = 0.02$** (Minimum required margin over safe look-alikes)
- **$T_{\text{LOW}} = 0.58$** (Escalation floor: any score between $T_{\text{LOW}}$ and $T_{\text{HIGH}}$ escalates to Layer 3)

### 3.6 Decision Rule
For each copy window $w$:
1. **Definitive Violation:**
   $$\text{If } \text{bestViolScore} \ge T_{\text{HIGH}} \ (0.75) \ \land \ \text{margin} \ge M_{\text{HIGH}} \ (0.02) \implies \text{flag } \mathbf{violation}$$
2. **Definitive Safe:**
   $$\text{If } \text{bestSafeScore} \ge T_{\text{HIGH}} \ (0.75) \ \land \ \text{margin} \le -M_{\text{HIGH}} \ (-0.02) \implies \text{flag } \mathbf{safe}$$
3. **Escalation to Layer 3 (AI Check):**
   $$\text{If } \text{bestViolScore} \ge T_{\text{LOW}} \ (0.58) \implies \text{mark } \mathbf{uncertain}$$
4. **Noise Floor:**
   $$\text{If } \text{bestViolScore} < T_{\text{LOW}} \implies \text{unflagged (safe)}$$

### 3.7 Safety Verification
- **0 False Positives:** At $T_{\text{HIGH}} = 0.75$, the highest safe-lookalike score on the tune split (0.736) is strictly rejected from triggering a false violation with a safety margin of +0.014.
- **0 Silent Misses:** Every tune violation score is $\ge 0.601$, strictly above $T_{\text{LOW}} = 0.58$. No violation is silently discarded; all candidate spans either match directly or safely escalate to Layer 3.
