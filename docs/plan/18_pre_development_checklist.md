# Canon: Pre-Development Readiness Checklist (18_pre_development_checklist.md)

**Document ID:** `DOC-18`  
**Status:** Complete / Authoritative  
**Date:** 2026-10-25  
**Version:** 1.0  
**Parent Trace:** [DHRUV-V3, Sec 12, 13] `file:///E:/Software/codex/Docuements/Dhruv_Patil_Canon_Engineering_Plan_v3.pdf`, [TB-BRIEF, Sec 4, 13] `file:///E:/Software/codex/Docuements/Canon_Role_Brief_Tanishka_Bellale_FINAL.pdf`, [TG-BRIEF, Sec 1, 3] `file:///E:/Software/codex/Docuements/Canon%20Role%20Brief%20for%20Tanishka%20Gawale.pdf`, [SOURCES.md](file:///E:/Software/codex/docs/plan/SOURCES.md)  

---

## 1. Readiness Gate Overview

Before writing the first line of application code, executing migrations, or spinning up cloud resources for Milestone 1, all checklist items below must be physically verified and checked off by the respective team owner.

```
+----------------------------------------------------------------------------------------------------+
|                                  PRE-DEVELOPMENT READINESS GATE                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ ] 1. TEAM ACCESS & REPOSITORIES (GitHub, Vercel, Render, Supabase access for all 4 members)     |
|  [ ] 2. SECRETS & API KEYS (Configured in host dashboards; zero secrets in code/repo)               |
|  [ ] 3. CLOUD DEPLOYMENT READINESS (Hours 00–04 deployment window locked; VER-08 to VER-14)        |
|  [ ] 4. PRODUCTION URLS & PROXY ROUTING (Single-origin Next.js edge rewrites mapped)               |
|  [ ] 5. TRADEMARK & WORKING TITLE DISCLAIMER (Prominent disclaimer banner staged)                  |
|  [ ] 6. SEED DATA & GUIDELINE FIXTURES (Fictional rules.json with source text ready)               |
|  [ ] 7. PRE-RECORDED FALLBACK VIDEO (4-min MP4 video walkthrough saved on presenter laptop)        |
|                                                                                                    |
|  GATE STATUS: PENDING HUMAN VERIFICATION -> CHECK OFF BEFORE COMMENCING BUILD AT T-00:00           |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Granular Verification Checklist

### 2.1 Team Access, Repositories & Collaboration
- [ ] **GitHub Monorepo Created:** Repository created under team organization (`runtime-rebels/canon` or team leader account).
- [ ] **Write Access Confirmed for All Four Teammates:**
  - Dhruv Patil (`AI-Assisted Developer` - Backend, Pipeline, Infra)
  - Tanishka Bellale (`Frontend Developer` - Next.js, shadcn/ui)
  - Prathmesh Shinde (`Domain Expert` - Research, Fixtures, Reference Data)
  - Tanishka Gawale (`Project Manager & Pitch Lead` - Board, QA, Submissions)
- [ ] **Shared Drive Folder Active:** Google Drive folder `1Ci9DM56kiHJLv-XyHUdq-1vtNpli45Kj` accessible to all four members for binary asset sharing.
- [ ] **Pre-commit Hooks Installed:** Local git hooks configured to block commits containing `.env` or files matching `*key*` or `*secret*`.

### 2.2 Cloud Infrastructure & API Key Provisioning
- [ ] **Vercel Account Provisioned:** Free Hobby tier account active; connected to GitHub repo for continuous deployment.
- [ ] **Render Account Provisioned (Single Host):** Free web service instance configured for Docker deployment.
- [ ] **Supabase Organization Provisioned:** Free project created; PostgreSQL 16 active; connection strings (Direct and Pooler) recorded securely.
- [ ] **LLM Provider API Keys Provisioned:** API key acquired for hosted model provider (Mistral AI / Groq / OpenAI-compatible); quota and rate limits confirmed.
- [ ] **Secrets Dashboard Injected:** Secrets injected into cloud host dashboards (never committed to repository):
  - `DATABASE_URL` (Supabase connection string with SSL mode required)
  - `JWT_SECRET_KEY` (Cryptographically random 256-bit string)
  - `LLM_API_KEY` (Provider API token)
  - `LLM_PROVIDER` (e.g., `mistral` or `groq`)
  - `BACKEND_API_URL` (Injected into Vercel for edge rewrite proxy)

### 2.3 Verified Free-Tier Operational Terms (Review Condition 5: Marked Unverified, Zero Numbers Stated as Fact)
- [ ] **Supabase Inactivity Pausing [VER-08]:** Vendor-claimed inactivity pausing threshold; direct ping procedure staged before demo. (Status: UNVERIFIED).
- [ ] **Render VM Spin-Down Latency [VER-09]:** Vendor-claimed container idle sleep threshold and cold-start wake latency; warm-up procedure added to demo runbook. (Status: UNVERIFIED).
- [ ] **Vercel Body Size Limits [VER-10]:** Vendor-claimed request payload body ceiling through edge rewrites; boundary payload test staged prior to uploads. (Status: UNVERIFIED).
- [ ] **LLM Data Retention Agreement [VER-11]:** Hosted model provider terms of service regarding data retention and training policies; TOS audit staged prior to API key deployment. (Status: UNVERIFIED).
- [ ] **Peak Memory Consumption [VER-12]:** Container memory usage under FastAPI, spaCy, and RapidFuzz without embeddings; profiling scheduled for H12. (Status: UNVERIFIED).
- [ ] **Supabase Connection Limit [VER-13]:** Database connection pool behavior under concurrent worker requests; load test scheduled for H12. (Status: UNVERIFIED).
- [ ] **External Trademark API [VER-14]:** External trademark search latency and quota limits (deferred to M2). (Status: UNVERIFIED).

### 2.4 Production URLs & Domain Configuration
- [ ] **Frontend Web App URL:** `https://canon-web.vercel.app` (or custom team subdomain).
- [ ] **Backend API URL:** `https://canon-api.onrender.com` (or Railway URL).
- [ ] **Single-Origin Proxy Verified:** Confirmed that `next.config.ts` correctly rewrites `/api/v1/:path*` to the backend URL without breaking cookie headers.

### 2.5 Legal, Compliance & Trademark Advisory
- [ ] **Trademark Search Status:** Preliminary search indicates "Canon" is widely registered across Class 9 (optical and camera equipment); no immediate conflict in pre-publication brand software during hackathon.
- [ ] **Mandatory Working Title Designation:** Confirmed that all documentation, UI headers, and pitch decks carry the explicit disclaimer:  
  *“Canon is a working title; formal trademark clearance search pending.”*
- [ ] **No Legal Advice Warranty:** Confirmed that product footer renders:  
  *“Canon provides automated brand and editorial review assistance. It does not provide certified legal advice or guarantee statutory compliance.”*

### 2.6 Seed Data & Domain Fixture Ownership
- [ ] **Owner Appointed:** Prathmesh Shinde (Domain Expert).
- [ ] **Official Guideline PDF Assembled:** `Acme_Brand_Guidelines_2026.pdf` (24 pages, real-world FinTech formatting, 12 explicit rules).
- [ ] **Claims Ledger CSV Assembled:** `claims.csv` containing 10 approved factual claims with effective date windows (`valid_from`, `valid_until`).
- [ ] **Test Submissions Formatted:** 3 test drafts formatted and verified (Clean Pass, 4 Violations, Prompt Injection Attack).
- [ ] **Seeded Historical Overrides Formatted:** `seeded_overrides.json` formatted to seed rule `TERM-007` with 38% override rate and `SCOPE_MISMATCH` diagnostic state.

### 2.7 Offline Contingency & Fallback Assets
- [ ] **Local Docker Profile Verified:** `infra/docker-compose.local-demo.yml` starts frontend, backend, and PostgreSQL locally in $< 30$ seconds.
- [ ] **Pre-Recorded Walkthrough Video:** 3-minute high-definition video walkthrough recorded with audio voiceover showing the complete end-to-end demo flow. Video saved on local desktop and shared drive as ultimate fallback.
- [ ] **Presenter Mobile Hotspot Configured:** Dedicated cellular mobile hotspot tested and ready on presenter laptop to bypass venue Wi-Fi failures.
