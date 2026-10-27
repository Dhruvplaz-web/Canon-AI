# Canon UI Overhaul — Phase 2: App Shell and Navigation

## 1. Executive Summary

Phase 2 replaces the legacy ad-hoc header and layout with a robust, accessible, and tokenized application shell. The new shell enforces strict role-based navigation, prevents open redirect vulnerabilities, supports instant responsive navigation via mobile drawers, provides keyboard shortcuts (`?`), and integrates live system telemetry through the newly minted `StatusFooter`.

All 6 automated Playwright E2E tests passed with 0 errors, and visual responsive proof was captured across four standard breakpoints (375px, 768px, 1280px, 1920px) in both light and dark modes.

---

## 2. Implemented Components & Architecture

### 2.1 Canonical Role-to-Navigation Map (`src/lib/navigation.ts`)
- Defined a single source of truth for all platform navigation items (`ALL_NAV_ITEMS`).
- Strict role authorization rules:
  - **`creator`**: Author Copy (`/submissions`), Brand Policy (`/policy`), AI Transparency (`/transparency`), Demo Tour (`/demo`), About (`/about`).
  - **`reviewer`**: All creator routes + Review Queue (`/review`).
  - **`brand_manager`**: All reviewer routes + Rule Health & Backtest (`/governance`), AI Evaluation (`/evaluation`).
  - **`anonymous`**: Public informational views (`/`, `/policy`, `/transparency`, `/demo`, `/about`), with protected routes gated at the middleware layer.
- Implemented `validateReturnUrl(url)` sanitizing relative URL redirects and eliminating open-redirect vulnerabilities (`NEW-02`).

### 2.2 Global App Shell (`src/app/layout.tsx` & `src/app/Navbar.tsx`)
- **Skip to Content Link**: Added top-level `<a href="#main-content">` adhering to WCAG 2.4.1 (Bypass Blocks), with explicit focus styles (`:focus:not-sr-only`).
- **Accessible Brand Link**: Verified WCAG 2.5.3 (Label in Name) by ensuring the visible text `CANON` matches the accessible link name without icon conflicts.
- **Role-Aware Navigation**: Dynamically renders authorized routes; suppresses sensitive management routes from non-authorized roles.
- **Mobile Responsive Drawer**: Headless Radix `Sheet` containing full role-filtered navigation for screen widths under 768px.
- **Theme Toggle**: Fast, SSR-safe theme toggle integrated with `next-themes` and React 19 `useSyncExternalStore`.
- **Keyboard Shortcuts Dialog (`src/components/KeyboardShortcutsDialog.tsx`)**: Global listener on `?` (disabled inside input/textarea elements), displaying accessible navigation commands.
- **Session Expired Dialog (`src/components/SessionExpiredDialog.tsx`)**: Reusable session expiration modal with draft rescue backup.

### 2.3 Status-Enabled Footer (`src/components/StatusFooter.tsx`)
- Periodic probe against `/api/v1/health/live` displaying real-time operational status and ping latency.
- Direct quick-launch trigger for Keyboard Shortcuts (`?`).
- Plain-English verified evidence invariants:
  - Exact draft citation character spans
  - Statutory policy rule excerpts
  - Human final decision with reason codes
  - Append-only audit verification ledger
  - Strict workspace multi-tenant isolation
- Persistent trademark notice ("Working Title Notice: Canon is a working title; formal trademark clearance search pending").

### 2.4 Route Protection & Middleware (`src/middleware.ts`)
- Edge middleware protecting `/submissions`, `/review`, `/governance`, and `/evaluation`.
- Transparent redirect to `/login?returnUrl=...` when unauthenticated.
- Cookie-backed session verification via `canon_session_token`.
- Preserved 180 req/min API rate limiter and comprehensive security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).

---

## 3. Verification & Automated Test Evidence

### 3.1 Playwright E2E Suite (`frontend/e2e/shell-navigation.spec.ts`)
```
Running 6 tests using 1 worker

  ok 1 [chromium] › e2e/shell-navigation.spec.ts › Skip to main content link works and gains visible focus (9.7s)
  ok 2 [chromium] › e2e/shell-navigation.spec.ts › Unauthenticated access to protected route redirects to login with returnUrl (3.3s)
  ok 3 [chromium] › e2e/shell-navigation.spec.ts › Open redirect attack via returnUrl is sanitized (4.4s)
  ok 4 [chromium] › e2e/shell-navigation.spec.ts › Keyboard shortcuts dialog opens via shortcut and button, closes on Escape (4.1s)
  ok 5 [chromium] › e2e/shell-navigation.spec.ts › Status footer renders operational health probe (3.8s)
  ok 6 [chromium] › e2e/shell-navigation.spec.ts › Creator role sees Author Copy and does not see Rule Health in Nav (4.4s)

  6 passed (43.2s)
```

### 3.2 Responsive Screenshots Captured
Captured in `docs/ui/screenshots/phase2/`:
- `mobile-light.png` / `mobile-dark.png` (375x812)
- `tablet-light.png` / `tablet-dark.png` (768x1024)
- `desktop-light.png` / `desktop-dark.png` (1280x800)
- `wide-light.png` / `wide-dark.png` (1920x1080)

---

## 4. Defects Resolved in Phase 2

| Defect ID | Description | Resolution |
| :--- | :--- | :--- |
| **NEW-02** | Open redirect vulnerability via unvalidated `returnUrl` | Implemented `validateReturnUrl()` in `src/lib/navigation.ts`, rejecting protocol-relative URLs (`//evil.com`) and invalid schemas. |
| **NEW-04** | Unauthenticated visitors able to access review queue | Added middleware route guard redirecting unauthenticated `/review` requests to `/login?returnUrl=/review`. |
| **F30** | Hardcoded passwords in login quick-fill and client code | Removed credentials from codebase; replaced with safe persona autofill without leaking secrets. |
| **Jargon** | Leaked "(Hackathon Evaluator)" in auth endpoints | Updated `/api/v1/auth/me` and `/api/v1/auth/login` to return clean enterprise persona titles. |

---

## 5. Next Steps
Proceeding directly to **Phase 3: Screens, One at a Time** (`login`, `home`, `policy`, `submissions`, `findings`, `review queue`, `review detail & approver view`, `governance`, `transparency`, `audit`, `demo`).
