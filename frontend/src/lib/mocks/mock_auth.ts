import { User } from "@/types/api";

export const MOCK_USERS: Record<string, User> = {
  brand_manager: {
    id: "usr_01j7manager000000000000001",
    email: "manager@acme.com",
    name: "Alex Vance (Brand Director)",
    role: "brand_manager",
    workspace_id: "wks_01j7acme0000000000000001",
  },
  reviewer: {
    id: "usr_01j7reviewer000000000000002",
    email: "reviewer@acme.com",
    name: "Jordan Lee (Legal & Brand Reviewer)",
    role: "reviewer",
    workspace_id: "wks_01j7acme0000000000000001",
  },
  creator: {
    id: "usr_01j7creator0000000000000003",
    email: "creator@acme.com",
    name: "Taylor Swiftly (Marketing Copywriter)",
    role: "creator",
    workspace_id: "wks_01j7acme0000000000000001",
  },
  approver: {
    id: "usr_01j7approver000000000000004",
    email: "legal@acme.com",
    name: "Morgan Stone (Chief Compliance Officer)",
    role: "approver",
    workspace_id: "wks_01j7acme0000000000000001",
  },
};
