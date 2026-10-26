"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  FileText,
  RefreshCw,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SourceCitation {
  document_title?: string;
  section?: string;
  page?: number | string;
  exact_quote?: string;
  [key: string]: unknown;
}

interface RuleDetail {
  id: string;
  rule_code: string;
  category: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | string;
  title: string;
  description: string | null;
  pattern_or_term: string | null;
  suggested_replacement: string | null;
  source_citation: SourceCitation;
  is_active: boolean;
}

interface ApprovedClaim {
  id: string;
  claim_code: string;
  claim_text: string;
  substantiation: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface ActivePolicy {
  id: string;
  version_number: string;
  status: string;
  compiled_rules_count: number;
  change_summary: string | null;
  approved_by: string | null;
  approved_at: string | null;
  effective_date: string;
  rules: RuleDetail[];
  approved_claims: ApprovedClaim[];
}

function PolicyExplorerContent() {
  const { isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [policy, setPolicy] = useState<ActivePolicy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [currentTimestamp] = useState<number>(() => Date.now());

  // View & Filter states initialized from URL parameters (Rule 3 URL-First State)
  const initialTab = searchParams.get("tab") === "claims" ? "claims" : "rules";
  const [activeTab, setActiveTab] = useState<"rules" | "claims">(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>(searchParams.get("severity") || "ALL");

  // Synchronize state with URL parameters
  const syncUrlParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (!v || v === "ALL" || (k === "tab" && v === "rules")) {
          current.delete(k);
        } else {
          current.set(k, v);
        }
      });
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    fetch("/api/v1/governance/policy/active", {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (res) => {
        if (!active) return;
        if (res.status === 401) {
          setError("AUTHENTICATION_REQUIRED");
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const msg =
            errData?.detail?.error?.message ||
            `Failed to load active policy (HTTP ${res.status})`;
          setError(msg);
          setIsLoading(false);
          return;
        }

        const data: ActivePolicy = await res.json();
        setPolicy(data);
        setError(null);
        setIsLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Network error: Unable to contact Canon policy engine.");
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authLoading, refreshTrigger]);

  const handleManualRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Derived categories from available rules
  const availableCategories = useMemo(() => {
    if (!policy) return [];
    const set = new Set<string>();
    policy.rules.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [policy]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (!policy) return [];
    return policy.rules.filter((rule) => {
      // Category filter
      if (selectedCategory !== "ALL" && rule.category !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== "ALL" && rule.severity !== selectedSeverity) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = rule.rule_code.toLowerCase().includes(q);
        const matchTitle = rule.title.toLowerCase().includes(q);
        const matchDesc = rule.description?.toLowerCase().includes(q) || false;
        const matchTerm = rule.pattern_or_term?.toLowerCase().includes(q) || false;
        const matchDoc =
          rule.source_citation.document_title?.toLowerCase().includes(q) || false;
        const matchQuote =
          rule.source_citation.exact_quote?.toLowerCase().includes(q) || false;

        return (
          matchCode ||
          matchTitle ||
          matchDesc ||
          matchTerm ||
          matchDoc ||
          matchQuote
        );
      }
      return true;
    });
  }, [policy, selectedCategory, selectedSeverity, searchQuery]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    if (!policy) return [];
    return policy.approved_claims.filter((claim) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = claim.claim_code.toLowerCase().includes(q);
        const matchText = claim.claim_text.toLowerCase().includes(q);
        const matchEvidence = claim.substantiation.toLowerCase().includes(q);
        return matchCode || matchText || matchEvidence;
      }
      return true;
    });
  }, [policy, searchQuery]);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return {
          label: "Critical (Blocker)",
          className: "bg-[#FF00FF] text-white border-2 border-black font-black",
        };
      case "MAJOR":
        return {
          label: "Major Warning",
          className: "bg-[#FFD700] text-black border-2 border-black font-black",
        };
      case "MINOR":
        return {
          label: "Minor Stylistic",
          className: "bg-[#00C2CB] text-black border-2 border-black font-black",
        };
      default:
        return {
          label: severity,
          className: "bg-white text-black border-2 border-black font-bold",
        };
    }
  };

  const isClaimExpired = (validUntil: string) => {
    return new Date(validUntil).getTime() < currentTimestamp;
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2.5 border-black pb-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="neo-badge bg-[#00C2CB] text-black">
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              Active Brand Governance Policy
            </span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">
              Brand Guidelines & Executable Rules Explorer
            </h1>
            <p className="text-sm font-medium text-[#333333] mt-1.5 leading-relaxed">
              Living catalog of active compliance rules compiled directly from official brand guidelines.
              Includes Double Receipt A &amp; B citations and the active verified claims ledger.
            </p>
          </div>
        </div>

        {policy && (
          <div className="neo-box p-5 flex flex-col gap-2 min-w-[270px]">
            <div className="flex items-center justify-between text-xs text-black font-black uppercase tracking-wider">
              <span>Active Policy</span>
              <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                {policy.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-black">
                v{policy.version_number}
              </span>
              <span className="text-xs font-bold text-[#555555]">
                ({policy.compiled_rules_count} rules &bull; {policy.approved_claims.length} claims)
              </span>
            </div>
            <div className="text-[11px] font-mono font-bold text-[#444444] flex flex-col gap-0.5 border-t-2 border-black pt-2">
              <span>Effective: {new Date(policy.effective_date).toLocaleDateString()}</span>
              {policy.change_summary && (
                <span className="truncate max-w-[240px]" title={policy.change_summary}>
                  Summary: {policy.change_summary}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Gate Banner (Empty/Unauthenticated State) */}
      {error === "AUTHENTICATION_REQUIRED" && (
        <div className="neo-box p-8 flex flex-col items-center justify-center text-center gap-4 max-w-xl mx-auto my-12">
          <div className="w-14 h-14 rounded-xl bg-[#00C2CB] border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <LogIn className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-black">Workspace Session Required</h2>
            <p className="text-xs font-medium text-[#444444] max-w-md">
              Brand policies are strictly isolated by workspace. Sign in to view and inspect the active guidelines for your brand.
            </p>
          </div>
          <Link
            href="/login"
            className="neo-btn neo-btn-teal text-xs py-2.5 px-6 mt-2"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* General Error State */}
      {error && error !== "AUTHENTICATION_REQUIRED" && (
        <div className="p-6 rounded-xl bg-[#FF00FF] border-2.5 border-black text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
            <div className="flex flex-col">
              <span className="text-base font-black uppercase">Unable to load active policy</span>
              <span className="text-xs font-medium text-white/90">{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="neo-btn neo-btn-white text-xs py-2 px-4"
          >
            <RefreshCw className="w-4 h-4 text-black" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="skeleton h-10 w-48" />
            <div className="skeleton h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="neo-box p-6 flex flex-col gap-4 bg-white">
                <div className="flex justify-between items-center">
                  <div className="skeleton h-5 w-24" />
                  <div className="skeleton h-5 w-16" />
                </div>
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content View */}
      {!isLoading && !error && policy && (
        <div className="flex flex-col gap-6">
          {/* Controls Bar: Tabs, Search & Filters */}
          <div className="neo-box p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* View Tabs */}
            <div className="flex items-center gap-2 border-b-2 lg:border-b-0 border-black pb-3 lg:pb-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("rules");
                  syncUrlParams({ tab: "rules" });
                }}
                className={`neo-btn text-xs py-1.5 px-3.5 ${
                  activeTab === "rules" ? "neo-btn-teal" : "neo-btn-white"
                }`}
              >
                Executable Rules ({policy.rules.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("claims");
                  syncUrlParams({ tab: "claims" });
                }}
                className={`neo-btn text-xs py-1.5 px-3.5 ${
                  activeTab === "claims" ? "neo-btn-yellow" : "neo-btn-white"
                }`}
              >
                Claims Ledger ({policy.approved_claims.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  syncUrlParams({ q: e.target.value || null });
                }}
                placeholder={
                  activeTab === "rules"
                    ? "Search rules by code, term, citation..."
                    : "Search claims by text, claim code, evidence..."
                }
                className="w-full neo-input pl-9 pr-4 py-1.5 text-xs text-black placeholder-[#666666]"
              />
            </div>

            {/* Category & Severity Dropdowns (Rules view only) */}
            {activeTab === "rules" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-black font-bold">
                  <Filter className="w-4 h-4 text-black" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      syncUrlParams({ category: e.target.value });
                    }}
                    aria-label="Filter rules by category"
                    className="bg-white border-2 border-black rounded px-2.5 py-1.5 text-xs text-black font-bold shadow-[2px_2px_0px_#000] cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedSeverity}
                  onChange={(e) => {
                    setSelectedSeverity(e.target.value);
                    syncUrlParams({ severity: e.target.value });
                  }}
                  aria-label="Filter rules by severity"
                  className="bg-white border-2 border-black rounded px-2.5 py-1.5 text-xs text-black font-bold shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="MAJOR">Major Only</option>
                  <option value="MINOR">Minor Only</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 1: Rules List */}
          {activeTab === "rules" && (
            <div className="flex flex-col gap-4">
              {filteredRules.length === 0 ? (
                <div className="neo-box p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F0EA] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-black">No matching rules found</h3>
                  <p className="text-xs font-medium text-[#444444] max-w-sm">
                    No active brand guidelines match your search query or filter criteria. Try resetting the filters.
                  </p>
                  {(searchQuery || selectedCategory !== "ALL" || selectedSeverity !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("ALL");
                        setSelectedSeverity("ALL");
                        syncUrlParams({ q: null, category: null, severity: null });
                      }}
                      className="neo-btn neo-btn-white text-xs py-1.5 px-3.5 mt-2"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRules.map((rule) => {
                    const sev = getSeverityBadge(rule.severity);
                    return (
                      <article
                        key={rule.id}
                        className="neo-box p-6 flex flex-col justify-between gap-5"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Card Header: Code, Category, Severity */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="neo-badge bg-black text-white text-xs">
                                {rule.rule_code}
                              </span>
                              <span className="neo-badge bg-[#00C2CB] text-black text-[11px]">
                                {rule.category}
                              </span>
                            </div>
                            <span
                              className={`neo-badge text-[10px] ${sev.className}`}
                            >
                              {sev.label}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div className="flex flex-col gap-1.5">
                            <h2 className="text-base font-black text-black tracking-tight">
                              {rule.title}
                            </h2>
                            {rule.description && (
                              <p className="text-xs font-medium text-[#444444] leading-relaxed">
                                {rule.description}
                              </p>
                            )}
                          </div>

                          {/* Pattern & Replacement Boxes */}
                          <div className="flex flex-col gap-2 pt-2 border-t-2 border-black">
                            {rule.pattern_or_term && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black">
                                  Trigger Pattern / Prohibited Term
                                </span>
                                <div className="bg-[#FFF0F5] border-2 border-black text-[#D6006E] font-mono font-black text-xs px-3 py-1.5 rounded-lg truncate shadow-[2px_2px_0px_#000]">
                                  {rule.pattern_or_term}
                                </div>
                              </div>
                            )}

                            {rule.suggested_replacement && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black">
                                  Approved Alternative Replacement
                                </span>
                                <div className="bg-[#E6FAFA] border-2 border-black text-black font-mono font-black text-xs px-3 py-1.5 rounded-lg truncate shadow-[2px_2px_0px_#000]">
                                  {rule.suggested_replacement}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Double Receipt Source Citation Box */}
                        {rule.source_citation && (
                          <div className="bg-[#F4F0EA] border-2 border-black rounded-lg p-3.5 flex flex-col gap-1.5 text-xs shadow-[2px_2px_0px_#000]">
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-black">
                              <FileText className="w-4 h-4 text-black" />
                              <span>
                                {rule.source_citation.document_title || "Official Brand Guideline"}
                              </span>
                              {rule.source_citation.section && (
                                <span className="text-[#555555]">&bull; {rule.source_citation.section}</span>
                              )}
                              {rule.source_citation.page && (
                                <span className="text-[#555555]">p. {rule.source_citation.page}</span>
                              )}
                            </div>
                            {rule.source_citation.exact_quote && (
                              <blockquote className="text-[11px] text-black font-medium italic border-l-3 border-black pl-2.5 py-0.5 leading-relaxed bg-white/70 rounded-r">
                                &ldquo;{rule.source_citation.exact_quote}&rdquo;
                              </blockquote>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Claims Ledger */}
          {activeTab === "claims" && (
            <div className="flex flex-col gap-4">
              {filteredClaims.length === 0 ? (
                <div className="neo-box p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F0EA] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-black">No matching approved claims found</h3>
                  <p className="text-xs font-medium text-[#444444] max-w-sm">
                    No approved claims in the temporal claims ledger match your search.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredClaims.map((claim) => {
                    const expired = isClaimExpired(claim.valid_until);
                    return (
                      <article
                        key={claim.id}
                        className="neo-box p-6 flex flex-col justify-between gap-5"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Claim Header */}
                          <div className="flex items-center justify-between">
                            <span className="neo-badge bg-black text-white text-xs">
                              {claim.claim_code}
                            </span>
                            {expired ? (
                              <span className="neo-badge bg-[#FFD700] text-black text-[10px]">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                EXPIRED (Flagged by Engine)
                              </span>
                            ) : (
                              <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                ACTIVE &amp; VALID
                              </span>
                            )}
                          </div>

                          {/* Claim Text */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black">
                              Approved Claim Statement
                            </span>
                            <p className="text-sm font-black text-black leading-relaxed">
                              &ldquo;{claim.claim_text}&rdquo;
                            </p>
                          </div>

                          {/* Substantiation Evidence */}
                          <div className="flex flex-col gap-1 bg-[#F4F0EA] border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_#000]">
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-black" />
                              Substantiation Evidence
                            </span>
                            <p className="text-xs font-medium text-black leading-relaxed">
                              {claim.substantiation}
                            </p>
                          </div>
                        </div>

                        {/* Validity Dates */}
                        <div className="flex items-center justify-between text-xs font-mono font-bold border-t-2 border-black pt-3 text-black">
                          <span>From: {new Date(claim.valid_from).toLocaleDateString()}</span>
                          <span className={expired ? "bg-[#FFD700] px-1.5 py-0.5 rounded border border-black font-black" : ""}>
                            Until: {new Date(claim.valid_until).toLocaleDateString()}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Governance & Backtest CTA Banner */}
      <div className="p-6 rounded-xl bg-[#FFD700] border-2.5 border-black text-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[4px_4px_0px_#000]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000] shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-black uppercase tracking-tight">Rule Flapping or High Override Drag?</h3>
            <p className="text-xs font-semibold text-[#222222]">
              Brand Managers can review override telemetry, backtest candidate amendments, and approve Policy v1.1.
            </p>
          </div>
        </div>
        <Link
          href="/governance"
          className="neo-btn neo-btn-black text-xs py-2.5 px-5 shrink-0"
        >
          <span>View Rule Health &amp; Backtest</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PolicyExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 text-black font-mono font-bold text-xs">
          Loading Brand Policy Explorer...
        </div>
      }
    >
      <PolicyExplorerContent />
    </Suspense>
  );
}
