# STEP 0: VERNACULAR & HINGLISH SEMANTIC CLASSIFIER AUDIT
**Repository:** Canon — Pre-Publication Brand Governance Platform  
**Audit Target:** Architecture, Dual-Pass Pipeline, Existing Vernacular Radar, Fixtures, API Contracts, and Deployment Constraints  
**Audit Mode:** Read-Only Static Codebase Inspection  

---

## 1. Executive Summary

Canon operates a dual-architecture: a FastAPI + SQLAlchemy backend (105 tests, PostgreSQL/SQLite) and a self-contained Next.js 16 frontend (`Turbopack`) with 30 in-memory route handlers. In production on Vercel, the frontend runs standalone on Next.js route handlers unless `BACKEND_API_URL` is explicitly set to an external host. The existing Round 3 "Vernacular Radar" is implemented entirely in client/edge TypeScript (`features/submissions/vernacular/`) and is completely absent from the Python backend. No embedding, vector, or ML dependencies exist today. Because Vercel has a 250MB serverless bundle ceiling and Render Free Tier has a strict 512MB RAM ceiling, shipping a 100–200MB on-device ONNX model poses severe OOM/timeout risks. The new Tier 1.5 semantic classifier should be built using **precomputed exemplar vectors (<150KB JSON)** evaluated via pure mathematical cosine similarity or a lightweight external embedding API, plugged directly into `frontend/src/features/submissions/vernacular/` and mirrored into `backend/app/services/` for dual-stack parity.

---

## 2. Findings for Numbered Audit Questions

### 1. ARCHITECTURE: WHERE DOES THE LIVE LOGIC RUN?

#### 1.a. FastAPI Backend vs Next.js Route Handlers
Both backends exist in the repository, but the frontend runs independently using Next.js route handlers by default.
- **FastAPI Backend:** Located in `backend/app/` (`main.py`, `api/v1/`, `services/`, `models/`). Runs on port 8000, connects to PostgreSQL or SQLite (`canon.db`), and implements the full 17-table relational schema.
- **Next.js Route Handlers:** Located in `frontend/src/app/api/v1/**` (30 route handlers). Implements a complete in-memory mock and compliance runtime (`submissionsStore`, `reviewQueueStore`, `proposalsStore`).
- **Does the frontend call FastAPI?** By default, **NO**. In `frontend/next.config.ts`, requests to `/api/v1/*` are only proxied if `BACKEND_API_URL` is set to an external (non-local) URL. Otherwise, Next.js route handlers service every request.

#### 1.b. End-to-End Request Trace: "Run Check" on `/submissions`
When a user clicks "Run Check" on `/submissions`:
1. **Button Handler:** `frontend/src/features/submissions/SubmissionsHeader.tsx` (lines 51, 102–109):
   ```tsx
   <Button onClick={onRunCheck} disabled={isChecking} variant="primary">
     <RefreshCw className={isChecking ? "animate-spin" : ""} />
     <span>{isChecking ? "Running Verification..." : "Run Check"}</span>
   </Button>
   ```
2. **State Orchestrator:** `frontend/src/features/submissions/useSubmissionState.ts` (lines 93–125):
   ```ts
   const handleRunCheck = async () => {
     setIsChecking(true);
     const createRes = await fetch("/api/v1/submissions", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ title, content, channel }),
     });
     const draft = await createRes.json();
     const subId = draft.id;
     const checkRes = await fetch(`/api/v1/submissions/${subId}/check`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ content }),
     });
   ```
3. **Draft Creation Handler:** `frontend/src/app/api/v1/submissions/route.ts` (lines 5–26):
   Generates `id = sub_${crypto.randomUUID().slice(0, 8)}` and persists to `submissionsStore[id]`.
4. **Check Route Handler:** `frontend/src/app/api/v1/submissions/[id]/check/route.ts` (lines 5–27):
   ```ts
   export async function POST(req: NextRequest, { params }) {
     const { id } = await params;
     const body = await req.json();
     const checkResult = verifyMarketingCopy(contentToCheck, id);
     return NextResponse.json(checkResult);
   }
   ```
5. **Deterministic Verification Engine:** `frontend/src/lib/compliance-engine.ts` (lines 174–240):
   Runs `ACTIVE_RULES` regex matching and calls `auditVernacularCopy(content)` from `features/submissions/vernacular/vernacularAuditEngine.ts`.
6. **Findings State & Toast:** `frontend/src/features/submissions/useSubmissionState.ts` (lines 120–138):
   Receives `CheckRunResult`, calls `setFindings(checkData.findings)`, updates `selectedFindingId`, and triggers notification toast.
7. **Response Rendering:** `frontend/src/features/submissions/FindingsList.tsx` (lines 45–180):
   Renders finding cards with Receipt A (`receipt_a_draft_span`), Receipt B (`receipt_b_rule_quote`), and the "Apply Fix" action.

#### 1.c. Rewrite / Proxy Config & Environment Variables
In `frontend/next.config.ts` (lines 12–25):
```ts
async rewrites() {
  const backendUrl = process.env.BACKEND_API_URL;
  // Only proxy to an external backend if an explicit non-local URL is provided
  if (backendUrl && !backendUrl.includes("127.0.0.1") && !backendUrl.includes("localhost")) {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  }
  return [];
}
```
Relevant Environment Variables:
- `BACKEND_API_URL`: Directs Next.js rewrites to external FastAPI backend (e.g. `https://canon-api.onrender.com`). If unset or set to localhost, rewrites evaluate to `[]`.
- `NEXT_PUBLIC_BASE_URL`: Defined in `frontend/src/app/sitemap.ts` (default: `"https://canon-governance.vercel.app"`).
- `NEXT_PUBLIC_DEMO_MODE`: Set to `"true"` in `docker-compose.yml`.

#### 1.d. Production on Vercel Execution Verdict
**Production on Vercel runs: Next route handlers (with optional rewrite proxy to FastAPI on Render if BACKEND_API_URL is configured).**  
*Supporting Evidence:*
1. `frontend/src/lib/compliance-engine.ts` (lines 1–4) explicitly declares:
   ```ts
   /**
    * Self-Contained Deterministic Brand Governance & Compliance Engine.
    * Runs seamlessly on Next.js Edge/Serverless and Node.js with zero dependencies.
    */
   ```
2. `docker-compose.yml` (lines 1–18) launches only `canon-frontend`, setting `NEXT_PUBLIC_DEMO_MODE=true` without any backend container service.
3. `render.yaml` (lines 1–21) defines `canon-api` as an independent Render web service on `plan: free`.
4. The entire Round 3 Vernacular and Visual engines exist exclusively inside `frontend/src/features/submissions/` and are only executed by Next.js route handlers.

---

### 2. DUAL-PASS PIPELINE

#### 2.a. Tier-1 Deterministic Scanner & Tier-2 LLM / Semantic Step
**FastAPI Backend Pipeline:**
- **Tier-1 Deterministic Scanner:** `backend/app/services/terms_engine.py` (lines 38–41):
  - Function: `scan_terms_and_typos(raw_text: str, rules: list[Any]) -> list[TermFinding]`
  - Employs Unicode NFKC normalization (`normalize_text`), word-boundary regexes, and RapidFuzz token matching (`fuzz.ratio` threshold 75..99) to catch typos like "Acmee" or "Akme".
- **Tier-2 Semantic / LLM Step:** `backend/app/services/semantic_engine.py` (lines 40–44):
  - Function: `scan_semantic_violations(raw_text: str, rules: list[Any], llm_adapter: LLMProvider | None = None) -> list[SemanticFinding]`
  - Filters rules by category `TONE` and `ACCESSIBILITY`, builds a structured prompt for `LLMProvider.generate()`, parses conforming JSON, and maps verbatim character spans back into `raw_text`.

**Next.js Frontend Pipeline:**
- `frontend/src/lib/compliance-engine.ts` (lines 174–256):
  - Function: `verifyMarketingCopy(content: string, submissionId: string) -> CheckRunResult`
  - Evaluates `ACTIVE_RULES` (TERM-001 through INJECT-001) and delegates to `auditVernacularCopy()`.

#### 2.b. Double-Receipt Verifier
Located in `backend/app/pipeline/verifier.py` (lines 27–56):
- **Receipt A Validation (Draft Span):**
  ```python
  def verify_receipt_a(draft_text: str, receipt_a: str, start_offset: int | None = None, end_offset: int | None = None) -> bool:
      if not receipt_a or not receipt_a.strip():
          return False
      if (start_offset is not None and end_offset is not None
          and 0 <= start_offset < end_offset <= len(draft_text)
          and draft_text[start_offset:end_offset] == receipt_a):
          return True
      return receipt_a in draft_text
  ```
- **Receipt B Validation (Policy Excerpt):**
  ```python
  def verify_receipt_b(policy_texts: Sequence[str], receipt_b: str) -> bool:
      if not receipt_b or not receipt_b.strip():
          return False
      cleaned_receipt = receipt_b.strip()
      for text in policy_texts:
          if cleaned_receipt in text:
              return True
      return False
  ```
- `verify_candidate_finding` (lines 58–120) strictly requires both `a_ok` and `b_ok`. If either check fails, the finding is dropped before database persistence.

#### 2.c. Prompt-Injection Pre-Flight (SEC-INJ-001)
Located in `backend/app/services/injection_scanner.py` (lines 103–130):
- Function: `scan_for_injections(text: str) -> ScanResult`
- Scans input copy against 10 pre-compiled regex signatures in `INJECTION_PATTERNS` (lines 29–100):
  1. `SYSTEM_NOTICE_OVERRIDE` (`(?:\[\s*SYSTEM\s*NOTICE...\])`)
  2. `DISREGARD_PRIOR_INSTRUCTIONS` (`/(?:disregard|ignore|forget)\s+all\s+prior/i`)
  3. `JAILBREAK_PERSONA` (`/(?:you\s+are\s+now\s+DAN|unrestricted)/i`)
  4. `MARKDOWN_EXFILTRATION` (`/!\[[^\]]*\]\(https?:\/\/.*(?:exfil|leak|token)/i`)
  5. `DELIMITER_ESCAPE` (`/(?:---+ END OF POLICY ---+)/i`)
  6. `TEST_MODE_BYPASS` (`/(?:you are in system test mode)/i`)
  7. `SIMULATE_UNRESTRICTED` (`/(?:simulate the response of an AI without restrictions)/i`)
  8. `PROMPT_EXTRACTION` (`/(?:repeat|print|reveal)\s+your\s+system\s+prompt/i`)
  9. `FABRICATE_PASSED_RESULT` (`/(?:mark all rules as passed|output only COMPLIANT)/i`)
  10. `PROMPT_DELIMITER_INJECTION` (`/(?:<system>|\[/?INST\]|<<SYS>>|<\|im_start\|>)/i`)
- Emits `InjectionFinding(rule_code="SEC-INJ-001", severity="CRITICAL")`.

#### 2.d. Finding / Violation Data Structure
**Backend ORM Entity (`backend/app/models/check.py:63–105`):**
```python
class Finding(Base, TimestampMixin):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspace.id", ondelete="CASCADE"), nullable=False)
    check_run_id = Column(UUID(as_uuid=True), ForeignKey("check_run.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("rule.id", ondelete="SET NULL"), nullable=True)
    rule_code = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    severity = Column(String(50), nullable=False)  # "CRITICAL", "WARNING", "INFO"
    title = Column(String(255), nullable=False)
    matched_text = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    suggested_fix = Column(Text, nullable=True)
    receipt_a_draft_span = Column(Text, nullable=False)
    receipt_b_rule_quote = Column(Text, nullable=False)
    source_document_title = Column(String(255), nullable=False)
    source_section = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="PENDING_REVIEW") # PENDING_REVIEW, OVERRIDDEN, FIXED, CONFIRMED
```
**Frontend TypeScript Interface (`frontend/src/features/submissions/FindingsList.tsx:28–43`):**
```typescript
export interface Finding {
  id: string;
  rule_code: string;
  category: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  matched_text: string;
  start_offset: number;
  end_offset: number;
  suggested_fix?: string;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  source_document_title: string;
  source_section: string;
  status: string;
}
```
*Note on `source` field:* **NOT FOUND**. Neither backend ORM nor frontend TypeScript interfaces contain a `source` field.

---

### 3. EXISTING VERNACULAR RADAR (Round 3 Feature)

#### 3.a. Vernacular Radar Codebase Inventory
- **Studio Component:** `frontend/src/components/VernacularAuditStudio.tsx` (714 lines)
- **Tab Controller:** `frontend/src/app/submissions/page.tsx` (lines 20–33, 82–120)
- **Phonetic Normalizer:** `frontend/src/features/submissions/vernacular/indicNormalizer.ts` (195 lines)
- **Audit Engine:** `frontend/src/features/submissions/vernacular/vernacularAuditEngine.ts` (288 lines)
- **Lexicon & Rules:** `frontend/src/features/submissions/vernacular/vernacularLexicon.ts` (251 lines)
- **Data Types:** `frontend/src/features/submissions/vernacular/vernacularTypes.ts` (45 lines)
- **Dedicated Route Handler:** `frontend/src/app/api/v1/submissions/vernacular-check/route.ts` (27 lines)

#### 3.b. The 6 Offense Categories & Detection Mechanisms
Defined in `vernacularLexicon.ts` and evaluated in `vernacularAuditEngine.ts`:

1. **Surrogate Alcobev (`SURROGATE_ALCOBEV` / `ASCI-SURR-ALCO`):**
   - *Method:* Bipartite entity match (`SURROGATE_KNOWLEDGE_BASE:24–75`).
   - *Restricted Brands (21):* `royal challenge`, `mcdowell`, `imperial blue`, `blenders pride`, `royal stag`, `kingfisher`, `tuborg`, `carlsberg`, `haywards`, `bagpiper`, `corona`, `signature`, `johnnie walker`, `chivas`, `bacardi`, `100 pipers`, `teachers`, `magic moments`, `seagram`.
   - *Innocuous Extensions (16):* `club soda`, `soda`, `packaged drinking water`, `mineral water`, `sparkling water`, `music cds`, `crystal glassware`, `playing cards`, `crisps`, `snacks`.
2. **Surrogate Tobacco & Pan Masala (`SURROGATE_TOBACCO` / `COTPA-SURR-TOB`):**
   - *Method:* Bipartite entity match (`SURROGATE_KNOWLEDGE_BASE:76–115`).
   - *Restricted Brands (16):* `vimal`, `kamla pasand`, `rajnigandha`, `dilbagh`, `pan bahar`, `shikhar`, `manikchand`, `rajshree`, `chaini khaini`, `zubaan kesari`, `gutkha`, `pan parag`.
   - *Innocuous Extensions (9):* `silver elaichi`, `elaichi`, `mouth freshener`, `kesar candy`, `silver pearls`, `supari`.
3. **Surrogate Sports Betting (`SURROGATE_BETTING` / `MEITY-BETTING-01`):**
   - *Method:* Bipartite entity match (`SURROGATE_KNOWLEDGE_BASE:116–157`).
   - *Restricted Brands (16):* `1xbet`, `parimatch`, `fairplay`, `lotus365`, `betway`, `dafabet`, `stake`, `wolf777`, `melbet`, `mostbet`, `winbuzz`, `dafanews`.
   - *Innocuous Extensions (10):* `news`, `sports news`, `news portal`, `sports magazine`, `prediction league`, `gaming community`, `live scores app`.
4. **Predatory FinTech Promises (`PREDATORY_FINTECH_PROMISE`):**
   - *Method:* Regex patterns on normalized text (`VERNACULAR_PATTERN_RULES:175–211`).
   - `RBI-VERN-01`: `/(bina|bagair|binaa)\s+(kisi\s+)?(document|kagaz|paper|cibil|salary\s*slip|jhanjhat)/i`, `/sirf\s+(aadhaar|pan)\s*(do|pe)\s*(instant\s*)?(loan|paisa)/i`.
   - `SEBI-VERN-02`: `/(paisa|pesa|rakam)\s+(double|dugna|3x|triple)/i`, `/(100%\s*pakka|shartiya)\s*(munafa|return|kamai)/i`.
5. **False Urgency Dark Patterns (`FALSE_URGENCY_DARK_PATTERN` / `CCPA-DARK-URGENCY`):**
   - *Method:* Regex patterns (`VERNACULAR_PATTERN_RULES:212–231`).
   - Patterns: `/(sirf|bas)\s*(\d+|do|teen|das)\s*(minute|ghante)\s*bache/i`, `/(jaldi\s*karo)\s*varna\s*(offer|mauka)\s*(khatam|gaya)/i`, `/(aakhri\s*mauka|last\s*chance)/i`.
6. **Prohibited Magic Remedies (`PROHIBITED_MAGIC_REMEDY` / `DMRA-MAGIC-01`):**
   - *Method:* Regex patterns (`VERNACULAR_PATTERN_RULES:232–251`).
   - Patterns: `/(shartiya|100%\s*guaranteed)\s*(ilaaj|ilaj|cure)/i`, `/(jad\s*se\s*khatam|chamatkari\s*dawa)/i`, `/(sugar|diabetes|cancer)\s*(theek|cure)/i`.

#### 3.c. Soundex-Indic Phonetic Normalizer
Located in `frontend/src/features/submissions/vernacular/indicNormalizer.ts`:
- **Function Signatures:**
  ```typescript
  export function transliterateDevanagariToLatin(text: string): string;
  export function getPhoneticTransformationTrace(text: string): { original: string; canonical: string; steps: PhoneticTraceStep[] };
  export function normalizeIndicPhonetics(text: string): string;
  export function tokenizeWithOffsets(text: string): { token: string; start: number; end: number }[];
  ```
- **Real Transformation Examples (from code and presets):**
  - `"sooodaaa"` $\rightarrow$ `"soda"` (Repetition Compression: `replace(/(.)\1{2,}/g, "$1")`)
  - `"jaldddiii"` $\rightarrow$ `"jaldi"` (Repetition + Geminate Consonant Reduction)
  - `"रॉयल"` $\rightarrow$ `"royal"` (Devanagari: `र` $\rightarrow$ `r`, `ॉ` $\rightarrow$ `o`, `य` $\rightarrow$ `y`, `ल` $\rightarrow$ `l`)
  - `"विमल"` $\rightarrow$ `"vimal"` (Devanagari: `व` $\rightarrow$ `v`, `ि` $\rightarrow$ `i`, `म` $\rightarrow$ `m`, `ल` $\rightarrow$ `l`)
  - `"shartiya"` $\rightarrow$ `"sartiya"` (Sibilant Harmonization: `replace(/sh/g, "s")`)
  - `"binaa"` $\rightarrow$ `"bina"` (Vowel Harmonization: `replace(/aa/g, "a")`)

#### 3.d. Presets Inventory (10 Presets in `VernacularAuditStudio.tsx:41–112`)
1. `ALCOBEV_SURROGATE`: *"Bhai shaam ko doston ke saath Royal Challenge club soda chilled mangwao aur celebrate karo har shaandar lamha! Jaldi order karo party shuru hone wali hai!"*
2. `TOBACCO_SURROGATE`: *"Anokha swaad, dilon par chha gaya! Vimal silver elaichi khao, shaan se jiyo aur jeeto brand new luxury car! Zubaan kesari har pal!"*
3. `BETTING_SURROGATE`: *"India vs Australia maha muqabala! 1xBet sports news app download karo aur pao live cricket score aur expert predictions! 100% pakka double kamai!"*
4. `DECEPTIVE_FINTECH`: *"Arey boss! Bina kisi document, kagaz ya salary slip ke 5 lakh chutki me lo fatafat! Sirf aadhaar card do aur turant paisa account me double pao bina kisi risk ke!"*
5. `DARK_PATTERN_URGENCY`: *"Maha dhamaka deal! Sirf 10 minute bache hain! Jaldi karo varna ye jackpot offer hamesha ke liye khatam ho jayega! Aakhri mauka hath se na jane do!"*
6. `MAGIC_REMEDY`: *"Sugar aur diabetes ka 100% shartiya ilaj! Sirf 14 din me jad se khatam bina doctor aur bina operation ke! Chamatkari jadi-booti se guaranteed nateeja!"*
7. `DEVANAGARI_UNICODE`: *"रॉयल चैलेंज सोडा के साथ शाम को पार्टी शुरू करो! सिर्फ आधार कार्ड दो और चुटki me लोन पाओ! जल्दी करो सिर्फ १० मिनट बचे हैं!"*
8. `TANGLISH_FINTECH`: *"Nanba! No cibil score, no salary slip vendam! Instant 2 lakh loan unga bank account-la 5 minutes-la vandhudum! Guaranteed double return, 100% no risk!"*
9. `BANGLISH_BETTING`: *"Bhai shobai shono! Aajker match-e double taka labh koro! 1xBet sports news app-e register koro ar 100% sure win khao bina kono loss chhara!"*
10. `COMPLIANT_VERNACULAR`: *"Celebrate this festive season with your family and loved ones. Digital personal loans through our RBI-regulated NBFC partner, subject to credit bureau assessment and transparent APR disclosure."*

#### 3.e. Main Pipeline Connection & "Bridge to Copywriter Studio"
- **Pipeline Integration:** In `frontend/src/lib/compliance-engine.ts:221–240`, `auditVernacularCopy()` is called automatically on every `POST /api/v1/submissions/{id}/check`.
- **Bridge Workflow:**
  1. User audits copy in `VernacularAuditStudio.tsx` and clicks "Bridge to Copywriter Studio" (`handleBridgeToCopywriter`, lines 133–138):
     ```ts
     const textToBridge = showRemediation ? report.remediatedText : inputText;
     sessionStorage.setItem("canon_bridged_copy", textToBridge);
     window.location.href = "/submissions?tab=copy&bridged=1";
     ```
  2. On `/submissions`, `useSubmissionState.ts` (lines 27–43) checks `searchParams.get("bridged") === "1"`, retrieves the bridged copy from `sessionStorage`, initializes the copy editor with it, and clears the session key.

#### 3.f. Embedding / Vector / ML Code Search
- **Keywords Searched:** `embedding`, `bge`, `sentence-transformers`, `fastembed`, `onnx`, `cosine`, `pgvector`, `numpy`, `transformers`.
- **Result:** **NOT FOUND** across all project source code. Zero ML or vector code exists in the repository today.

---

### 4. DATA AND FIXTURES

#### 4.a. Existing Rules, Claims Ledger, and Fixtures
Stored under `data/`:
1. `data/demo_policy/rules.json`:
   - Schema: `{ policy: { name, version, status, effective_date, source_document }, rules: RuleItem[], approved_claims: ClaimItem[] }`
   - Contains 12 brand rules (`TERM-001` to `VIS-001`) and 2 claims (`CLAIM-001` [expired] and `CLAIM-002` [active]).
2. `data/demo_policy/guideline_source.txt`:
   - Raw text guidelines for `ACME-GUIDELINES-2026-V1`.
3. `data/demo_policy/seeded_proposal.json`:
   - Proposal `PROP-01` metadata and backtest simulation baseline.
4. `data/demo_submissions/samples.json`:
   - Fixtures for `SUB-01` (Clean, 0 findings), `SUB-02` (4 findings, expired claim), and `SUB-03` (Prompt injection attack).
5. `data/benchmark_dataset.json`:
   - 30 test cases across 3 cohorts: `adversarial_security` (10), `brand_violations` (10), `compliant_copy` (10).

#### 4.b. Vernacular Exemplars & Indian Statute Fixtures
- **Status:** **NOT FOUND**. No `indian_statutes.json` or `vernacular_exemplars.json` file exists in the repo.
- Current Implementation: All Indian statutory knowledge and patterns are hardcoded in TypeScript files (`features/submissions/vernacular/vernacularLexicon.ts` and `components/VernacularAuditStudio.tsx`).

#### 4.c. Where New `data/vernacular_exemplars.json` Fits Best
Based on current repository conventions, the best location is **`data/vernacular_exemplars.json`** at the repository root. This ensures:
- Direct compatibility with `data/benchmark_dataset.json` and `data/demo_submissions/samples.json`.
- Accessible by Python scripts (`backend/scripts/seed_data.py`), pytest fixtures, and Next.js bundlers.

---

### 5. API CONTRACT

| Endpoint / Route Handler | Method | Request Body Shape | Response Body Shape | Consuming Component |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/app/api/v1/submissions/[id]/check/route.ts` | `POST` | `{ content?: string }` | `CheckRunResult` (`{ id, status, total_findings, findings: Finding[] }`) | `features/submissions/useSubmissionState.ts` (`handleRunCheck`) |
| `frontend/src/app/api/v1/submissions/vernacular-check/route.ts` | `POST` | `{ text: string }` | `{ success: true, data: VernacularAuditReport, statutoryFrameworksApplied: string[] }` | `VernacularAuditStudio.tsx`, External API clients |
| `frontend/src/app/api/v1/submissions/visual-check/route.ts` | `POST` | `VisualCreativeAsset` \| `{ asset, imageBase64 }` | `{ success: true, data: VisualAuditReport, tier2Metadata }` | `components/VisualAuditViewer.tsx` |
| `frontend/src/app/api/v1/review/queue/route.ts` | `GET` | *Query params:* `page, page_size, severity, category` | `{ items: Finding[], total: number, page: number, page_size: number }` | `features/review/ReviewQueueList.tsx`, `app/review/page.tsx` |
| `frontend/src/app/api/v1/findings/[id]/override/route.ts` | `POST` | `{ reason_code: string, justification: string }` | `{ finding_id: string, status: "OVERRIDDEN", override: object }` | `features/submissions/FindingsList.tsx`, `ReviewQueueList.tsx` |
| `backend/app/api/v1/submissions.py:308` | `POST` | None (*Query:* `version_number?: int`) | `CheckRunResponse` (`{ id, status, total_findings, findings: FindingResponse[] }`) | Python integration tests (`test_m1_walkthrough.py`) |

---

### 6. TESTS

#### 6.a. Backend Test Suite
- **Pytest Layout:**
  - `backend/tests/unit/`: 18 test files (94 tests)
  - `backend/tests/integration/`: 2 test files (`test_m1_walkthrough.py` [4 tests], `test_postgres_rls.py` [7 tests])
- **Execution Command:** `cd backend && .venv\Scripts\pytest tests`
- **Current Execution Status:** **98 passed, 7 skipped, 0 failed in 19.92s**.  
  *(The 7 skipped tests require a live PostgreSQL container with RLS users configured; all SQLite/in-memory unit and integration tests pass 100%).*

#### 6.b. Frontend Playwright Tests & Fixtures
- **Playwright Test Files:** Located in `frontend/e2e/`:
  - `capture-phase2-screenshots.spec.ts`
  - `capture-screenshots.spec.ts`
  - `design-system.spec.ts`
  - `link-crawl-and-uat.spec.ts`
  - `shell-navigation.spec.ts`
- **Fixtures for SUB-01 to SUB-04:**
  - `SUB-01` (Clean), `SUB-02` (4 Violations), `SUB-03` (Prompt Injection) exist in `data/demo_submissions/samples.json` and `frontend/src/features/submissions/SubmissionsHeader.tsx:8–45`.
  - `SUB-04`: **NOT FOUND**. No fixture or test references `SUB-04`.

#### 6.c. Tests Covering Vernacular Radar Today
- **Status:** **NOT FOUND (0 tests)**.
- Neither `backend/tests/` nor `frontend/e2e/` contains tests for `indicNormalizer.ts`, `vernacularAuditEngine.ts`, or `/api/v1/submissions/vernacular-check`.

---

### 7. DEPENDENCIES AND DEPLOYMENT LIMITS

#### 7.a. Current Dependency Inventory
- **Python Dependencies (`backend/requirements.txt` & `pyproject.toml`):**
  FastAPI (0.162.0), Uvicorn (0.54.0), Pydantic (2.14.1), Pydantic-Settings (2.16.1), SQLAlchemy (2.1.6), Alembic (1.20.1), psycopg2-binary (2.9.13), psycopg (3.3.6), Argon2-cffi (25.1.0), PyJWT (2.15.1), RapidFuzz (3.14.6), HTTPX (0.28.1), Python-dotenv (1.2.4).
- **JavaScript Dependencies (`frontend/package.json`):**
  Next.js (16.4.3), React (19.3.0), React-DOM (19.3.0), `@tanstack/react-query` (5.105.0), `lucide-react` (1.61.0), `pdfjs-dist` (6.4.299), `tesseract.js` (7.0.0), `zod` (4.6.7), `@radix-ui/*`.
- **Render Build Command (`render.yaml:8`):**
  `pip install --upgrade pip && pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy alembic psycopg2-binary argon2-cffi pyjwt rapidfuzz httpx python-dotenv`

#### 7.b. Dockerfiles & Serverless Execution Limits
- `backend/Dockerfile`: Lightweight Python 3.12-slim container.
- `frontend/Dockerfile`: Multi-stage Node 20-alpine Next.js runner.
- `docker-compose.yml`: Deploys only `canon-frontend`.
- **Vercel Limits:**
  - Serverless function uncompressed bundle limit: **250 MB**.
  - Serverless cold-start execution ceiling: 10–15s (Hobby) / 60s (Pro).
  - Edge middleware bundle limit: **1 MB**.
- **Render Free Tier Limits:**
  - RAM limit: **512 MB** hard ceiling (process terminated on OOM).
  - Sleeps after 15 minutes of inactivity (50s cold start).

#### 7.c. Viability of ~100–200MB ONNX Embedding Model
- **Can it be shipped on Vercel Serverless?** **HIGH RISK / NOT RECOMMENDED**. A 150MB ONNX model file + `onnxruntime-node` binary (`~80MB`) brings the uncompressed deployment artifact dangerously close to Vercel's 250MB ceiling and severely degrades cold-start latency (1.5s+ initialization).
- **Can it be shipped on Render Free Tier?** **CANNOT RUN SAFELY**. Render's 512MB RAM ceiling cannot comfortably accommodate the OS, Python runtime, FastAPI worker, and an in-memory ONNX model without frequent OOM kills.
- **Safest Recommended Architecture:**
  1. **Precomputed Exemplar Embeddings (<150KB):** Generate high-quality embeddings offline for curated exemplars, store them in `data/vernacular_exemplars.json`, and run cosine similarity directly in pure JavaScript or Python.
  2. **External Cloud Embedding API:** Use a fast remote embedding endpoint (e.g. Gemini `text-embedding-004` or HuggingFace Serverless) when evaluating ad-hoc user query text.

---

### 8. DOC vs CODE MISMATCHES

| Dimension | Documented Claim in Notes / Readme | Real Value in Actual Code | Root Cause / Code Evidence |
| :--- | :--- | :--- | :--- |
| **Backend Test Count** | "73/73 tests passing" (`README.md:56`, `SUBMISSION_NOTES.md:15`) | **105 tests collected** (98 passing, 7 skipped) | Test count was recorded during Milestone 1 and grew to 105 as Milestone 2/3 tests were added. |
| **Next.js Page Routes** | "12 routes" or "37 routes" | **16 page routes** (`page.tsx`) | `Get-ChildItem -Filter page.tsx`: `/`, `/about`, `/audit`, `/contact`, `/cookies`, `/demo`, `/dev/components`, `/evaluation`, `/governance`, `/login`, `/policy`, `/privacy`, `/review`, `/submissions`, `/terms`, `/transparency`. |
| **Next.js API Routes** | Not documented or reported as proxy | **30 API route handlers** (`route.ts`) | Complete in-memory mock backend implemented across `frontend/src/app/api/v1/**`. |
| **Total Routes** | "40 routes" | **46 routes** (16 pages + 30 API handlers) | Exact file count under `frontend/src/app`. |
| **Production Runtime** | "FastAPI + PostgreSQL with RLS" | **Dual Stack**: Next.js route handlers default in Vercel | Next.js rewrites proxy to FastAPI only if non-local `BACKEND_API_URL` is configured (`next.config.ts:15`). |
| **Vernacular Radar** | Documented as platform governance | **Frontend-only TS logic** | Python backend has 0 references to vernacular, Indic, or Hinglish rules. |
| **Submission Fixtures** | Mentions SUB-01 to SUB-04 | Only **SUB-01, SUB-02, SUB-03** exist | `SUB-04` is absent from `samples.json` and tests. |

---

### 9. INSERTION POINT RECOMMENDATION

#### 9.a. Recommended Architecture & Files to Touch
To preserve dual-stack functionality and maintain compatibility with both Vercel serverless and the local FastAPI engine:

1. **New Fixture File to Create:**
   - `data/vernacular_exemplars.json`: Canonical dictionary of curated exemplars across the 6 offense categories, containing category, statutory citation, rule code, exemplar text, verbatim statutory quote (for Receipt B), and precomputed float embedding vectors.
2. **Frontend Files to Create & Touch:**
   - **Create:** `frontend/src/features/submissions/vernacular/vernacularSemanticClassifier.ts`: Implements cosine similarity calculation between input text spans and precomputed exemplar vectors.
   - **Touch:** `frontend/src/features/submissions/vernacular/vernacularAuditEngine.ts`: Invoke semantic classifier as Stage 3 after Bipartite surrogate check and regex pattern check.
   - **Touch:** `frontend/src/lib/compliance-engine.ts`: Ensure semantic vernacular findings flow into the main `/api/v1/submissions/[id]/check` output.
3. **Backend Parity Files to Create & Touch:**
   - **Create:** `backend/app/services/vernacular_engine.py`: Python equivalent reading `data/vernacular_exemplars.json` and computing cosine similarity.
   - **Touch:** `backend/app/services/pipeline_runner.py`: Add `Stage 2.5: Vernacular Semantic Classifier` between deterministic terms (`scan_terms_and_typos`) and generative LLM (`scan_semantic_violations`).

#### 9.b. Double-Receipt & Schema Invariant Compliance
- **Data Structure Compatibility:**
  The `Finding` interface in `FindingsList.tsx` and `compliance-engine.ts` currently does not have a `source` field.
  Add an optional field: `source?: "deterministic" | "semantic" | "statutory"` (defaults to `"deterministic"`).
- **Double-Receipt Invariant Enforcement:**
  - **Receipt A (Draft Span):** The classifier must identify the exact character slice in the author's copy that triggered the similarity match (`draft_text[start:end]`). Verbatim substring verification in `verify_receipt_a` passes cleanly.
  - **Receipt B (Policy Excerpt):** The classifier must attach the statutory rule quote from `data/vernacular_exemplars.json` (e.g. *"ASCI Code Chapter III: Prohibits indirect advertising of products whose advertising is restricted by law"*).
  - In `pipeline_runner.py`, append the statutory citation texts to `policy_source_texts` so `verify_receipt_b()` verifies them without rejection.

#### 9.c. Architectural Risks & Mitigations
1. **Memory & Latency Risk:** Avoid bundling full ONNX model binaries on Vercel/Render. Use precomputed exemplar vectors (<150KB) and pure cosine similarity for instantaneous (<5ms) zero-memory execution.
2. **Determinism Risk:** Float operations across V8 (browser/Node) and Python (backend) can have slight precision differences. Mitigate by setting a conservative similarity threshold (e.g., $\ge 0.82$) with a dead-band buffer.
3. **Regression / Test Breakage Risk:** Existing test `test_pipeline_clean_submission_sub01` requires `SUB-01` to return 0 findings. All vernacular exemplars must have zero cosine similarity above threshold with compliant banking copy.
4. **Database Migration Risk:** If `source` is persisted to PostgreSQL, a new Alembic migration is required for table `finding`. Until then, store `"source": "semantic"` inside `Finding.category` (e.g. `"VERNACULAR_SEMANTIC"`) or `Finding.source_section` to maintain 100% schema backward compatibility.

---

## 3. Comprehensive File Map

| File Path | Primary Purpose | Relevant to New Vernacular Classifier? |
| :--- | :--- | :---: |
| `data/demo_policy/rules.json` | 12 Brand policy rules and approved claims ledger | Reference (rule schemas & citations) |
| `data/demo_submissions/samples.json` | Test fixtures for SUB-01, SUB-02, SUB-03 | Reference (test inputs) |
| `data/benchmark_dataset.json` | 30 AI safety and brand rule test cases | Reference (benchmark structure) |
| `data/vernacular_exemplars.json` | *Proposed new fixture file* for curated exemplar vectors | **CORE NEW FILE** |
| `backend/app/main.py` | FastAPI application entrypoint and middleware | No |
| `backend/app/api/v1/submissions.py` | Submissions endpoints, check trigger, approvals | Yes (endpoint pipeline wiring) |
| `backend/app/services/pipeline_runner.py` | Backend verification pipeline runner | **YES (Backend insertion point)** |
| `backend/app/services/terms_engine.py` | Tier-1 regex & RapidFuzz typo engine | Reference (pattern techniques) |
| `backend/app/services/semantic_engine.py` | Tier-2 LLM semantic tone scanner | Reference (finding creation pattern) |
| `backend/app/pipeline/verifier.py` | Double-Receipt verifier (Receipt A & B) | **CRITICAL (Verifier invariant constraint)** |
| `backend/app/services/injection_scanner.py` | Stage 1 pre-flight prompt injection scanner | No |
| `backend/app/models/check.py` | SQLAlchemy ORM models (`Finding`, `CheckRun`) | Yes (schema structure) |
| `backend/app/schemas/submission.py` | Pydantic response models (`FindingResponse`) | Yes (API contract) |
| `frontend/next.config.ts` | Next.js rewrites and proxy configuration | **YES (Proxy behavior decision)** |
| `frontend/src/lib/compliance-engine.ts` | Frontend self-contained verification engine | **YES (Frontend pipeline wiring)** |
| `frontend/src/features/submissions/vernacular/vernacularTypes.ts` | TypeScript types for vernacular findings & categories | **YES (Category & finding extensions)** |
| `frontend/src/features/submissions/vernacular/indicNormalizer.ts` | Soundex-Indic phonetic normalizer | **YES (Input normalizer for classifier)** |
| `frontend/src/features/submissions/vernacular/vernacularLexicon.ts` | Surrogate brands, extensions, and regex rules | **YES (Exemplar taxonomy source)** |
| `frontend/src/features/submissions/vernacular/vernacularAuditEngine.ts` | Bipartite surrogate and pattern audit engine | **YES (Frontend insertion point)** |
| `frontend/src/components/VernacularAuditStudio.tsx` | UI component for Vernacular Radar studio & presets | Yes (UI presentation & exemplars) |
| `frontend/src/app/api/v1/submissions/[id]/check/route.ts` | Next.js submission check route handler | Yes (serves check results) |
| `frontend/src/app/api/v1/submissions/vernacular-check/route.ts` | Dedicated vernacular check route handler | Yes (standalone API test harness) |
| `frontend/src/features/submissions/FindingsList.tsx` | Findings list card rendering & fix action | Yes (displays double receipts) |
| `frontend/src/features/submissions/useSubmissionState.ts` | Submissions page state & API coordinator | Yes (bridges copy & handles checks) |

---

## 4. Open Questions and Risks

1. **Embedding Generation Location:**
   Will user query embeddings be generated via a lightweight remote API (e.g. Gemini `text-embedding-004`), or must the semantic comparison operate strictly offline without external network calls? *(If strictly offline, precomputed exemplar embeddings with character n-gram / TF-IDF or lightweight WASM embeddings are required to stay under Vercel/Render limits).*
2. **Double-Receipt Statute Text Alignment:**
   Will the Indian statutes (CCPA, ASCI, MeitY, DMRA, RBI, SEBI) be formalized into `data/demo_policy/rules.json` as active policy rules, or should `app.pipeline.verifier` recognize an official static statutory ledger for Receipt B verification?
3. **Database Schema Evolution:**
   Does the team want to add an explicit `source VARCHAR(50)` column to the PostgreSQL `finding` table via Alembic migration, or keep `source` embedded in `Finding.category` / `Finding.source_section` to maintain zero-migration stability?
4. **Automated Test Coverage Gap:**
   Currently, **0 automated tests** cover the vernacular radar. Prior to adding the semantic classifier, a baseline test suite (`tests/unit/test_vernacular.py` and a Jest/Vitest frontend spec) should be established to prevent regressions.

