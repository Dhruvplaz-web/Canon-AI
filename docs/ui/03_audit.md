# Canon UI Overhaul — Screen: Audit & Verification Ledger

## 1. Overview & Requirements
- **Route:** `/audit`
- **File:** `src/app/audit/page.tsx`
- **Core Directive:** In accordance with the user's primary requirement ("everything to work in real time, no assumption or fake data shown by app") and specification **F41**:
  - Canon explicitly discloses that the global bulk audit log export endpoint (`/api/v1/audit/export`) is a backend gap currently under development.
  - No simulated or mock 10,000-row client-side tables are displayed.
  - Real cryptographic release certificates and append-only database guarantees are surfaced with direct inspection capability via the live certificate endpoint (`/api/v1/submissions/[id]/certificate`).

---

## 2. Implemented Capabilities
1. **Interactive Certificate Inspection:**
   - Launches `ComplianceCertificateModal` with real HMAC-SHA256 signatures, content hashes, and approver identity verification.
2. **Architectural Guarantees:**
   - Highlights PostgreSQL append-only tables with revoked `UPDATE` and `DELETE` permissions.
   - Highlights Row-Level Security (RLS) multi-tenant isolation.
3. **Direct Navigation to Operational Workflows:**
   - Quick routing to `/submissions` for pre-flight checking and `/review?view=signoff` for approver signoff records.
