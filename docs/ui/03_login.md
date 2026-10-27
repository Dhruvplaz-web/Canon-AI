# Canon UI Overhaul — Screen: Login

## 1. Overview & Requirements
- **Route:** `/login`
- **Component File:** `src/features/login/LoginForm.tsx`
- **Entrypoint:** `src/app/login/page.tsx` (31 LOC)
- **Design Tokens:** Follows Industrial/Modern Enterprise palette with semantic CSS custom properties.
- **Accessibility:**
  - Semantic `<form>` with explicit `htmlFor` and `id` bindings.
  - Visible `:focus-visible` focus rings on all inputs and buttons.
  - Show/hide password button with descriptive `aria-label` ("Show password" / "Hide password").
  - `role="alert"` and `aria-live="assertive"` on error messages.
  - Disabled submit button with loading spinner in-flight.
- **Security & Quality:**
  - Fixed **NEW-02**: `validateReturnUrl` prevents open redirect attacks.
  - Fixed **F30**: No hardcoded credentials in source code.
  - Quick-fill evaluation personas without exposing raw credentials.

---

## 2. State Spectrum Implementation
1. **Empty State:** Clean, pristine input fields with clear placeholders and icons.
2. **Loading State:**
   - In Next.js Suspense: Skeleton cards matching form layout.
   - During submit: Button disabled, inline spinning spinner, text changes to "Verifying credentials...".
3. **Error State:**
   - Accessible banner with red accent (`role="alert"`, `aria-live="assertive"`), descriptive message, and retry capability.
4. **Already Authenticated State:**
   - Displays user details, role badge, and single click "Continue to Application" routing to `returnUrl`.

---

## 3. Automated Test Verification
Verified in Playwright test suite `frontend/e2e/shell-navigation.spec.ts`:
- Unauthenticated access to protected routes redirects to `/login?returnUrl=...`.
- Protocol-relative open redirect `//evil.com` safely redirects to `/`.
- Persona quick-select correctly authenticates and navigates to the destination.
- Show/hide password toggles input type between `password` and `text`.
