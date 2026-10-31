/**
 * Canonical Role-to-Navigation Map (TSK-UI-PRO Item 3)
 * Single source of truth for Navbar, Mobile Drawer, Home Dashboard Cards, and Route Guards.
 */

export type UserRole = "creator" | "reviewer" | "brand_manager" | "anonymous";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  roles: UserRole[]; // Roles allowed to access and view this item
  highlight?: boolean;
  badge?: string;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    href: "/submissions",
    label: "Author Copy",
    description: "Compose marketing copy and execute live pre-flight policy compliance checks.",
    roles: ["creator", "reviewer", "brand_manager"],
  },
  {
    href: "/review",
    label: "Review Queue",
    description: "Triage flagged draft findings, inspect source rule citations, and record overrides.",
    roles: ["reviewer", "brand_manager"],
  },
  {
    href: "/policy",
    label: "Brand Policy",
    description: "Browse compiled guidelines, terminology rules, and active statutory claims.",
    roles: ["creator", "reviewer", "brand_manager", "anonymous"],
  },
  {
    href: "/governance",
    label: "Rule Health & Backtest",
    description: "Examine rule flapping telemetry, simulate empirical backtests, and adopt v1.1.",
    roles: ["brand_manager"],
  },
  {
    href: "/evaluation",
    label: "AI Evaluation",
    description: "Run adversarial model evaluation benchmarks and confusion matrices.",
    roles: ["brand_manager"],
  },
  {
    href: "/transparency",
    label: "AI Transparency",
    description: "Inspect downstream inference call logs, latency, and EU AI Act disclosures.",
    roles: ["creator", "reviewer", "brand_manager", "anonymous"],
  },
  {
    href: "/audit",
    label: "Audit Ledger",
    description: "Inspect immutable SHA-256 release certificates and regulatory audit trails.",
    roles: ["creator", "reviewer", "brand_manager", "anonymous"],
  },
  {
    href: "/demo",
    label: "Demo Tour",
    description: "Guided 4-stage walkthrough of Canon's pre-publication governance pipeline.",
    roles: ["creator", "reviewer", "brand_manager", "anonymous"],
    highlight: true,
  },
  {
    href: "/about",
    label: "About",
    description: "Learn about Canon's architecture, regulatory context, and verification guarantees.",
    roles: ["creator", "reviewer", "brand_manager", "anonymous"],
  },
];

/**
 * Returns the filtered list of navigation items accessible to a given role.
 */
export function getNavItemsForRole(role: string | null | undefined): NavItem[] {
  const effectiveRole: UserRole =
    role === "creator" || role === "reviewer" || role === "brand_manager"
      ? role
      : "anonymous";

  return ALL_NAV_ITEMS.filter((item) => item.roles.includes(effectiveRole));
}

/**
 * Checks if a specific path is permitted for a given user role.
 */
export function isRouteAllowed(path: string, role: string | null | undefined): boolean {
  // Public routes accessible to everyone
  const publicPrefixes = [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/login",
    "/demo",
    "/policy",
    "/transparency",
    "/audit",
    "/dev/components",
    "/api",
  ];

  if (publicPrefixes.some((p) => path === p || path.startsWith(p + "/"))) {
    // If it's policy or transparency or demo, anyone can view
    return true;
  }

  const effectiveRole: UserRole =
    role === "creator" || role === "reviewer" || role === "brand_manager"
      ? role
      : "anonymous";

  // Role-specific protected routes
  if (path.startsWith("/submissions")) {
    return ["creator", "reviewer", "brand_manager"].includes(effectiveRole);
  }
  if (path.startsWith("/review")) {
    return ["reviewer", "brand_manager"].includes(effectiveRole);
  }
  if (path.startsWith("/governance") || path.startsWith("/evaluation")) {
    return effectiveRole === "brand_manager";
  }

  return true;
}

/**
 * Validates that a returnUrl is safe (same-origin relative path, prevents open redirects).
 */
export function validateReturnUrl(url: string | null | undefined): string {
  if (!url) return "/";
  const trimmed = url.trim();
  // Must start with exactly one forward slash, not two (which indicates protocol-relative URL)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  // Prevent protocol injection or backslash tricks
  if (trimmed.includes(":") || trimmed.includes("\\")) {
    return "/";
  }
  return trimmed;
}
