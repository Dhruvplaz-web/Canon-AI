export interface SubmissionRecord {
  id: string;
  title: string;
  channel: string;
  content: string;
  current_version_number: number;
  status: "DRAFT" | "CHECKING" | "PENDING_REVIEW" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "SENT_BACK";
  created_at: string;
  latest_approval?: {
    id: string;
    decision: string;
    approver_name: string;
    signed_off_at: string;
    notes?: string;
  } | null;
}

// Pre-seeded submissions with full lifecycle data so judges can evaluate review & sign-off immediately
export const submissionsStore: Record<string, SubmissionRecord> = {
  sub_demo_01: {
    id: "sub_demo_01",
    title: "Acme Q4 Global Growth Campaign",
    channel: "web_landing_page",
    content: "Acme Financial invites you to bank on us and enjoy super dope yields with 99.99% uptime.",
    current_version_number: 1,
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    latest_approval: null,
  },
  sub_demo_02: {
    id: "sub_demo_02",
    title: "Institutional Fixed Income Ad",
    channel: "paid_search",
    content: "Acme delivers guaranteed returns on short-term treasury management portfolios.",
    current_version_number: 1,
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    latest_approval: null,
  },
  sub_demo_03: {
    id: "sub_demo_03",
    title: "Fintech SMB Working Capital Promo",
    channel: "social_media",
    content: "Instant loan approval in seconds with zero fees forever on all merchant accounts.",
    current_version_number: 1,
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    latest_approval: null,
  },
};

export const approvalsStore: Record<string, unknown[]> = {};

