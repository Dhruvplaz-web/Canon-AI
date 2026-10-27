import { Submission } from "@/types/api";

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub_01j7demo0000000000000001",
    workspace_id: "wks_01j7acme0000000000000001",
    creator_id: "usr_01j7creator0000000000000003",
    title: "Q1 Digital Treasury & Accounts Campaign",
    channel: "email_blast",
    content:
      "Bank on us for all your financial operations! We offer super dope yields with instant loan approval in seconds. Acme has been rated #1 banking app with 99.99% uptime across all major benchmarks.",
    status: "COMPLETED",
    created_at: "2026-01-15T10:30:00Z",
  },
  {
    id: "sub_01j7demo0000000000000002",
    workspace_id: "wks_01j7acme0000000000000001",
    creator_id: "usr_01j7creator0000000000000003",
    title: "Homepage Hero Banner Refresh",
    channel: "web_landing_page",
    content:
      "Acme is a modern financial technology platform delivering enterprise treasury tools. Partner with Acme Financial Technologies, an FDIC-insured banking partner, to access competitive interest rates.",
    status: "COMPLETED",
    created_at: "2026-01-16T14:15:00Z",
  },
];
