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
  ShieldCheck,
  FileText,
  RefreshCw,
  LogIn,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  RotateCcw,
  FlaskConical,
  Sliders,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GuidelineIngesterModal } from "@/components/GuidelineIngesterModal";
import { StatutoryRegulatoryBadge } from "@/components/StatutoryRegulatoryBadge";
import { RegulatoryStatute } from "@/types/api";
import {
  IMMUTABLE_CRITICAL_RULES,
  DEFAULT_CHANNEL_THRESHOLDS,
  resolveEffectiveSeverity,
} from "@/lib/compliance-engine";

interface SourceCitation {
  document_title?: string;
  section?: string;
  page?: number | string;
  exact_quote?: string;
  regulatory_statute?: RegulatoryStatute;
  [key: string]: unknown;
}

interface SourceDocument {
  id: string;
  title: string;
  document_type: string;
  storage_path: string;
  content_hash: string;
  page_count: number;
  extracted_text: string;
  status: string;
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
  source_document?: SourceDocument | null;
  rules: RuleDetail[];
  approved_claims: ApprovedClaim[];
}

// Calendar month advance helper with month-end clamping (e.g. Oct 31 + 6 months -> Apr 30)
function advanceCalendarMonths(baseDate: Date, months: number): Date {
  const d = new Date(baseDate.getTime());
  const origDay = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() !== origDay) {
    d.setUTCDate(0); // Clamps to last day of previous month
  }
  return d;
}

function formatDateIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00Z` : dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function SourceDocumentReader({
  extractedText,
  rules,
  selectedRuleCode,
  onSelectRule,
}: {
  extractedText: string;
  rules: RuleDetail[];
  selectedRuleCode: string | null;
  onSelectRule: (code: string) => void;
}) {
  const lines = useMemo(() => extractedText.split("\n"), [extractedText]);

  return (
    <div className="font-mono text-xs leading-relaxed space-y-2 select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`empty-${idx}`} className="h-1.5" />;
        }

        if (trimmed.startsWith("===")) {
          return (
            <div
              key={`div-${idx}`}
              className="border-b-2 border-black/20 my-1"
            />
          );
        }

        if (trimmed.startsWith("SECTION ") || trimmed.startsWith("ACME FINANCIAL BRAND GOVERNANCE")) {
          return (
            <div
              key={`sec-${idx}`}
              className="py-1 px-3 my-2 bg-[#F8F9FA] border border-[#E5E7EB] font-black uppercase text-black text-[11px] rounded shadow-xs"
            >
              {trimmed}
            </div>
          );
        }

        // Match against rules
        const matchedRule =
          rules.find((r) => {
            const quote = r.source_citation?.exact_quote;
            return quote && (line.includes(quote) || quote.includes(trimmed));
          }) || rules.find((r) => line.includes(`Rule Code: ${r.rule_code}`));

        const isSelected = matchedRule && selectedRuleCode === matchedRule.rule_code;

        if (matchedRule) {
          return (
            <div
              key={`rule-line-${idx}`}
              id={`doc-rule-${matchedRule.rule_code}`}
              onClick={() => onSelectRule(matchedRule.rule_code)}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#FFD700] text-black border-black shadow-sm ring-2 ring-black"
                  : "bg-white hover:bg-[#FDFBF7] text-black border-black/40 hover:border-black shadow-xs"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="neo-badge bg-black text-white text-[10px]">
                  {matchedRule.rule_code}
                </span>
                <span className="text-[10px] font-bold text-[#333333] uppercase">
                  {matchedRule.title}
                </span>
                {isSelected && (
                  <span className="neo-badge bg-[#00C2CB] text-black text-[10px] ml-auto">
                    Active Grounding Quote
                  </span>
                )}
              </div>
              <p className="font-sans font-medium text-xs leading-relaxed text-black">
                {line}
              </p>
            </div>
          );
        }

        return (
          <p key={`p-${idx}`} className="font-mono text-[#444444] text-[11px] leading-relaxed px-1">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function PolicyExplorerContent() {
  const { isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [policy, setPolicy] = useState<ActivePolicy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isIngesterModalOpen, setIsIngesterModalOpen] = useState(false);
  const [ingestedNotice, setIngestedNotice] = useState<string | null>(null);

  // Expiry Simulation State (URL-First via simDate)
  const initialSimDate = searchParams.get("simDate");
  const [simulatedDate, setSimulatedDate] = useState<string | null>(initialSimDate);
  const baselineDate = useMemo(() => new Date(), []);

  const effectiveTimestamp = useMemo(() => {
    if (simulatedDate) {
      const parsed = new Date(simulatedDate.length === 10 ? `${simulatedDate}T23:59:59.999Z` : simulatedDate);
      if (!isNaN(parsed.getTime())) return parsed.getTime();
    }
    return baselineDate.getTime();
  }, [simulatedDate, baselineDate]);

  const isSimulating = Boolean(simulatedDate);

  // View & Filter states initialized from URL parameters (Rule 3 URL-First State)
  const rawTab = searchParams.get("tab");
  const initialTab: "rules" | "claims" | "tuner" =
    rawTab === "claims" || rawTab === "tuner" ? rawTab : "rules";
  const [activeTab, setActiveTab] = useState<"rules" | "claims" | "tuner">(initialTab);
  const [tunerChannel, setTunerChannel] = useState<string>("press_release");
  const [channelOverrides, setChannelOverrides] = useState<Record<string, Record<string, "CRITICAL" | "WARNING" | "INFO">>>({});
  const [tunerNotice, setTunerNotice] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<"split" | "grid">(
    searchParams.get("view") === "grid" ? "grid" : "split"
  );
  const [selectedRuleCode, setSelectedRuleCode] = useState<string | null>(
    searchParams.get("rule") || "TERM-001"
  );
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

  const handleTuneRule = (ruleCode: string, targetSev: "CRITICAL" | "WARNING" | "INFO") => {
    if (IMMUTABLE_CRITICAL_RULES.has(ruleCode) && targetSev !== "CRITICAL") {
      setTunerNotice(`⚠️ Safety Invariant: Statutory Rule ${ruleCode} is protected by federal mandate and cannot be downgraded below CRITICAL.`);
      setTimeout(() => setTunerNotice(null), 4000);
      return;
    }
    setChannelOverrides((prev) => ({
      ...prev,
      [tunerChannel]: {
        ...(prev[tunerChannel] || {}),
        [ruleCode]: targetSev,
      },
    }));
    setTunerNotice(`✓ Updated ${ruleCode} on ${tunerChannel} to ${targetSev}.`);
    setTimeout(() => setTunerNotice(null), 2500);
  };

  const handleResetChannelTuner = () => {
    setChannelOverrides((prev) => {
      const next = { ...prev };
      delete next[tunerChannel];
      return next;
    });
    setTunerNotice(`✓ Reset ${tunerChannel} to baseline factory defaults.`);
    setTimeout(() => setTunerNotice(null), 2500);
  };

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
          className: "bg-[#FF00FF] text-white border border-[#E5E7EB] font-black",
        };
      case "MAJOR":
        return {
          label: "Major Warning",
          className: "bg-[#FFD700] text-black border border-[#E5E7EB] font-black",
        };
      case "MINOR":
        return {
          label: "Minor Stylistic",
          className: "bg-[#00C2CB] text-black border border-[#E5E7EB] font-black",
        };
      default:
        return {
          label: severity,
          className: "bg-white text-black border border-[#E5E7EB] font-bold",
        };
    }
  };

  type ClaimTemporalStatus = "VALID" | "EXPIRED" | "NOT_YET_VALID" | "INACTIVE" | "INVALID_METADATA";

  const evaluateClaimStatus = (claim: ApprovedClaim): {
    status: ClaimTemporalStatus;
    label: string;
    description: string;
    badgeClass: string;
  } => {
    if (!claim.is_active) {
      return {
        status: "INACTIVE",
        label: "DEPRECATED / INACTIVE",
        description: "Claim has been retired from active policy",
        badgeClass: "bg-[#9CA3AF] text-white border border-black",
      };
    }

    if (!claim.valid_until) {
      return {
        status: "INVALID_METADATA",
        label: "INVALID DATE METADATA",
        description: "Missing or unparseable validity date",
        badgeClass: "bg-red-500 text-white border border-black",
      };
    }

    // Boundary rule: date-only strings remain valid through end of calendar day (23:59:59.999 UTC)
    let untilMs: number;
    if (claim.valid_until.length === 10) {
      untilMs = new Date(`${claim.valid_until}T23:59:59.999Z`).getTime();
    } else {
      untilMs = new Date(claim.valid_until).getTime();
    }

    if (isNaN(untilMs)) {
      return {
        status: "INVALID_METADATA",
        label: "INVALID DATE METADATA",
        description: "Malformed validity date",
        badgeClass: "bg-red-500 text-white border border-black",
      };
    }

    if (claim.valid_from) {
      const fromMs = new Date(claim.valid_from.length === 10 ? `${claim.valid_from}T00:00:00.000Z` : claim.valid_from).getTime();
      if (!isNaN(fromMs) && effectiveTimestamp < fromMs) {
        return {
          status: "NOT_YET_VALID",
          label: "PENDING EFFECTIVE DATE",
          description: `Evidence not yet effective until ${formatDisplayDate(claim.valid_from)}`,
          badgeClass: "bg-[#93C5FD] text-black border border-black font-bold",
        };
      }
    }

    if (effectiveTimestamp > untilMs) {
      return {
        status: "EXPIRED",
        label: "REVIEW REQUIRED (Substantiation Expired)",
        description: `Evidence validity period ended on ${formatDisplayDate(claim.valid_until)}; review required`,
        badgeClass: "bg-[#FFD700] text-black border border-black font-black",
      };
    }

    return {
      status: "VALID",
      label: "ACTIVE & VALID",
      description: `Substantiation valid through ${formatDisplayDate(claim.valid_until)}`,
      badgeClass: "bg-[#00C2CB] text-black border border-black font-black",
    };
  };

  const isClaimExpired = (validUntil: string) => {
    let untilMs: number;
    if (validUntil.length === 10) {
      untilMs = new Date(`${validUntil}T23:59:59.999Z`).getTime();
    } else {
      untilMs = new Date(validUntil).getTime();
    }
    return isNaN(untilMs) ? false : effectiveTimestamp > untilMs;
  };

  const handleAdvanceMonths = (months: number) => {
    const currentRef = simulatedDate
      ? new Date(simulatedDate.length === 10 ? `${simulatedDate}T00:00:00.000Z` : simulatedDate)
      : baselineDate;
    const nextDate = advanceCalendarMonths(currentRef, months);
    const isoStr = formatDateIso(nextDate);
    setSimulatedDate(isoStr);
    syncUrlParams({ simDate: isoStr });
  };

  const handleSetCustomDate = (val: string) => {
    if (!val) {
      handleResetSimulation();
      return;
    }
    setSimulatedDate(val);
    syncUrlParams({ simDate: val });
  };

  const handleResetSimulation = () => {
    setSimulatedDate(null);
    syncUrlParams({ simDate: null });
  };

  const simulationMetrics = useMemo(() => {
    if (!policy) return { total: 0, expired: 0, valid: 0 };
    let expired = 0;
    let valid = 0;
    policy.approved_claims.forEach((c) => {
      const res = evaluateClaimStatus(c);
      if (res.status === "EXPIRED") expired++;
      else if (res.status === "VALID") valid++;
    });
    return { total: policy.approved_claims.length, expired, valid };
  }, [policy, effectiveTimestamp]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E7EB] pb-8">
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsIngesterModalOpen(true)}
            className="neo-btn neo-btn-teal text-xs py-2.5 px-4 flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Ingest Custom Guidelines</span>
          </button>

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
              <div className="text-[11px] font-mono font-bold text-[#444444] flex flex-col gap-0.5 border-t border-[#E5E7EB] pt-2">
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
      </div>

      {/* Ingested Notice Banner */}
      {ingestedNotice && (
        <div className="p-4 rounded-xl bg-[#00C2CB] border border-[#E5E7EB] text-black font-bold text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
            <span>{ingestedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setIngestedNotice(null)}
            className="text-black hover:opacity-70 p-1 font-mono text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Auth Gate Banner (Empty/Unauthenticated State) */}
      {error === "AUTHENTICATION_REQUIRED" && (
        <div className="neo-box p-8 flex flex-col items-center justify-center text-center gap-4 max-w-xl mx-auto my-12">
          <div className="w-14 h-14 rounded-xl bg-[#00C2CB] border border-[#E5E7EB] text-black flex items-center justify-center shadow-xs">
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
        <div className="p-6 rounded-xl bg-[#FF00FF] border border-[#E5E7EB] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
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
                className={`neo-btn text-xs py-1.5 px-3.5 flex items-center gap-1.5 ${
                  activeTab === "claims" ? "neo-btn-yellow" : "neo-btn-white"
                }`}
              >
                <span>Claims Ledger ({policy.approved_claims.length})</span>
                {isSimulating && (
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="Simulation Active" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("tuner");
                  syncUrlParams({ tab: "tuner" });
                }}
                className={`neo-btn text-xs py-1.5 px-3.5 flex items-center gap-1.5 ${
                  activeTab === "tuner" ? "neo-btn-pink" : "neo-btn-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Channel Tuner</span>
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

            {/* Layout Mode Toggle (Rules view only) */}
            {activeTab === "rules" && (
              <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-lg border border-[#E5E7EB] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode("split");
                    syncUrlParams({ view: "split" });
                  }}
                  className={`px-2.5 py-1 text-xs font-black rounded border-2 transition flex items-center gap-1.5 cursor-pointer ${
                    layoutMode === "split"
                      ? "bg-[#00C2CB] text-black border-black shadow-xs"
                      : "bg-transparent text-black border-transparent hover:bg-white"
                  }`}
                  title="Side-by-Side Guideline Document Reader"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Side-by-Side</span> Reader
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode("grid");
                    syncUrlParams({ view: "grid" });
                  }}
                  className={`px-2.5 py-1 text-xs font-black rounded border-2 transition flex items-center gap-1.5 cursor-pointer ${
                    layoutMode === "grid"
                      ? "bg-[#FFD700] text-black border-black shadow-xs"
                      : "bg-transparent text-black border-transparent hover:bg-white"
                  }`}
                  title="Full Card Grid"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Card</span> Grid
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Rules List */}
          {activeTab === "rules" && (
            <div className="flex flex-col gap-4">
              {filteredRules.length === 0 ? (
                <div className="neo-box p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-black shadow-xs">
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
              ) : layoutMode === "split" ? (
                /* Side-by-Side Document Reader & Rules Inspector */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Source Document Viewer (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="neo-box p-4 bg-white flex flex-col gap-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="neo-badge bg-[#00C2CB] text-black text-[11px] font-black">
                            OFFICIAL BASELINE SOURCE (RECEIPT B)
                          </span>
                          <span className="text-xs font-mono font-bold text-[#555555]">
                            {policy.source_document?.page_count || 2} Pages • v{policy.version_number}
                          </span>
                        </div>

                        {policy.source_document?.content_hash && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 bg-[#E6FAFA] border border-[#E5E7EB] px-2 py-0.5 rounded text-[10px] font-mono font-bold text-black shadow-xs">
                              <ShieldCheck className="w-3 h-3 text-black" />
                              <span>SHA-256: {policy.source_document.content_hash.slice(0, 14)}...</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (policy.source_document?.content_hash) {
                                  navigator.clipboard.writeText(policy.source_document.content_hash);
                                  setCopiedHash(true);
                                  setTimeout(() => setCopiedHash(false), 2000);
                                }
                              }}
                              className="p-1 rounded border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-black text-[10px] transition"
                              title="Copy full SHA-256 hash"
                            >
                              {copiedHash ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-black" />}
                            </button>
                          </div>
                        )}
                      </div>

                      <h2 className="text-base font-black text-black">
                        {policy.source_document?.title || "Acme Brand Guidelines 2026"}
                      </h2>
                      <p className="text-xs font-medium text-[#444444]">
                        Click any highlighted rule in the document or on the right to verify verbatim Double Receipt grounding (Receipt B).
                      </p>
                    </div>

                    {/* Scrollable Document Text Canvas */}
                    <div className="neo-box p-5 bg-white max-h-[640px] overflow-y-auto">
                      <SourceDocumentReader
                        extractedText={policy.source_document?.extracted_text || ""}
                        rules={filteredRules}
                        selectedRuleCode={selectedRuleCode}
                        onSelectRule={(code) => {
                          setSelectedRuleCode(code);
                          syncUrlParams({ rule: code });
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Interactive Rules Inspector (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-3 max-h-[720px] overflow-y-auto pr-1">
                    <div className="text-xs font-black text-black uppercase tracking-wider flex items-center justify-between">
                      <span>Compiled Rules ({filteredRules.length})</span>
                      <span className="text-[11px] font-mono font-bold text-[#555555]">
                        Selected: {selectedRuleCode || "None"}
                      </span>
                    </div>

                    {filteredRules.map((rule) => {
                      const isSelected = selectedRuleCode === rule.rule_code;
                      const sev = getSeverityBadge(rule.severity);
                      return (
                        <article
                          key={rule.id}
                          onClick={() => {
                            setSelectedRuleCode(rule.rule_code);
                            syncUrlParams({ rule: rule.rule_code });
                            const target = document.getElementById(`doc-rule-${rule.rule_code}`);
                            if (target) {
                              target.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                          className={`neo-box p-4 flex flex-col justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? "bg-[#FFFDF5] border-black shadow-md ring-2 ring-black"
                              : "hover:shadow-sm"
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="neo-badge bg-black text-white text-[11px]">
                                  {rule.rule_code}
                                </span>
                                <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
                                  {rule.category}
                                </span>
                                {rule.source_citation?.regulatory_statute && (
                                  <StatutoryRegulatoryBadge
                                    statute={rule.source_citation.regulatory_statute as RegulatoryStatute}
                                    compact
                                  />
                                )}
                              </div>
                              <span className={`neo-badge text-[10px] ${sev.className}`}>
                                {sev.label}
                              </span>
                            </div>

                            <h3 className="text-sm font-black text-black tracking-tight">
                              {rule.title}
                            </h3>

                            {rule.pattern_or_term && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="font-bold text-[#444444]">Trigger:</span>
                                <span className="font-mono font-black text-[#D6006E] bg-[#FFF0F5] px-1.5 py-0.5 rounded border border-black/30">
                                  {rule.pattern_or_term}
                                </span>
                              </div>
                            )}

                            {rule.suggested_replacement && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="font-bold text-[#444444]">Fix:</span>
                                <span className="font-mono font-bold text-black bg-[#E6FAFA] px-1.5 py-0.5 rounded border border-black/30 truncate">
                                  {rule.suggested_replacement}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-black/20 pt-2 text-[11px]">
                            <span className="font-mono text-[#555555] font-semibold text-[10px]">
                              {rule.source_citation?.section || "SECTION 1"}
                            </span>
                            <Link
                              href={`/submissions?fixture=SUB-02`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-black font-bold hover:text-[#00C2CB] transition"
                            >
                              <span>Test in Live Runner</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Full Card Grid */
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="neo-badge bg-black text-white text-xs">
                                {rule.rule_code}
                              </span>
                              <span className="neo-badge bg-[#00C2CB] text-black text-[11px]">
                                {rule.category}
                              </span>
                              {rule.source_citation?.regulatory_statute && (
                                <StatutoryRegulatoryBadge
                                  statute={rule.source_citation.regulatory_statute as RegulatoryStatute}
                                />
                              )}
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
                          <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E7EB]">
                            {rule.pattern_or_term && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black">
                                  Trigger Pattern / Prohibited Term
                                </span>
                                <div className="bg-[#FFF0F5] border border-[#E5E7EB] text-[#D6006E] font-mono font-black text-xs px-3 py-1.5 rounded-lg truncate shadow-xs">
                                  {rule.pattern_or_term}
                                </div>
                              </div>
                            )}

                            {rule.suggested_replacement && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black">
                                  Approved Alternative Replacement
                                </span>
                                <div className="bg-[#E6FAFA] border border-[#E5E7EB] text-black font-mono font-black text-xs px-3 py-1.5 rounded-lg truncate shadow-xs">
                                  {rule.suggested_replacement}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Double Receipt Source Citation Box */}
                        {rule.source_citation && (
                          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3.5 flex flex-col gap-1.5 text-xs shadow-xs">
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
            <div className="flex flex-col gap-5">
              {/* Simulation Safety Indicator Banner */}
              {isSimulating && (
                <div className="neo-box p-4 bg-[#FFD700] border-2 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-[#FFD700] flex items-center justify-center shrink-0 shadow-xs">
                      <Clock className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="neo-badge bg-black text-white text-[10px] uppercase tracking-wider font-mono">
                          Simulation Mode Active
                        </span>
                        <span className="text-xs font-bold text-black font-mono">
                          Simulated Date: <strong>{formatDisplayDate(simulatedDate!)}</strong>
                        </span>
                        <span className="text-[11px] font-semibold text-black/75">
                          (Baseline: {formatDisplayDate(baselineDate.toISOString())})
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-black mt-1">
                        Displaying temporal validity state. Real claim records and server clocks remain unaffected.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/submissions?simDate=${encodeURIComponent(simulatedDate!)}`}
                      className="neo-btn neo-btn-black text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Test Submission Copy</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleResetSimulation}
                      className="neo-btn neo-btn-white text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Today</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Expiry Simulator Toolbar */}
              <div className="neo-box p-4 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00C2CB] text-black border border-black flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-black">
                        Interactive Expiry Simulator
                      </h4>
                      {isSimulating ? (
                        <span className="neo-badge bg-[#FFD700] text-black text-[10px] font-bold">
                          Simulated State
                        </span>
                      ) : (
                        <span className="neo-badge bg-[#F3F4F6] text-black text-[10px] font-semibold">
                          Live Baseline
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-[#555555]">
                      Advance time to forecast substantiation lapse and inspect claims requiring review.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-black uppercase tracking-wider mr-1">
                    Advance:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdvanceMonths(3)}
                    className="neo-btn neo-btn-white text-xs py-1 px-2.5 font-bold hover:bg-[#00C2CB]"
                    title="Advance simulated date by 3 calendar months"
                  >
                    +3 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceMonths(6)}
                    className="neo-btn neo-btn-yellow text-xs py-1 px-2.5 font-bold shadow-xs"
                    title="Advance simulated date by 6 calendar months"
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceMonths(12)}
                    className="neo-btn neo-btn-white text-xs py-1 px-2.5 font-bold hover:bg-[#00C2CB]"
                    title="Advance simulated date by 1 year"
                  >
                    +1 Year
                  </button>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-[#E5E7EB]">
                    <input
                      type="date"
                      value={simulatedDate || formatDateIso(baselineDate)}
                      onChange={(e) => handleSetCustomDate(e.target.value)}
                      className="neo-input text-xs py-1 px-2 font-mono text-black"
                      title="Select custom simulated date"
                    />
                    {isSimulating && (
                      <button
                        type="button"
                        onClick={handleResetSimulation}
                        className="neo-btn neo-btn-white text-xs py-1 px-2.5 font-bold text-red-600 hover:bg-red-50 flex items-center gap-1"
                        title="Reset simulation to current date"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Claims Cards */}
              {filteredClaims.length === 0 ? (
                <div className="neo-box p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-black shadow-xs">
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
                    const evalResult = evaluateClaimStatus(claim);
                    return (
                      <article
                        key={claim.id}
                        className={`neo-box p-6 flex flex-col justify-between gap-5 transition-all ${
                          evalResult.status === "EXPIRED"
                            ? "border-l-4 border-l-[#FFD700]"
                            : evalResult.status === "VALID"
                            ? "border-l-4 border-l-[#00C2CB]"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          {/* Claim Header */}
                          <div className="flex items-center justify-between">
                            <span className="neo-badge bg-black text-white text-xs">
                              {claim.claim_code}
                            </span>
                            <span className={`neo-badge text-[10px] flex items-center ${evalResult.badgeClass}`}>
                              {evalResult.status === "EXPIRED" && <Clock className="w-3.5 h-3.5 mr-1" />}
                              {evalResult.status === "VALID" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                              {evalResult.status === "NOT_YET_VALID" && <Calendar className="w-3.5 h-3.5 mr-1" />}
                              {evalResult.status === "INACTIVE" && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                              {evalResult.label}
                            </span>
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
                          <div className="flex flex-col gap-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-black" />
                              Substantiation Evidence
                            </span>
                            <p className="text-xs font-medium text-black leading-relaxed">
                              {claim.substantiation}
                            </p>
                            <p className="text-[10px] font-medium text-[#666666] mt-1 border-t border-[#E5E7EB] pt-1">
                              {evalResult.description}
                            </p>
                          </div>
                        </div>

                        {/* Validity Dates */}
                        <div className="flex items-center justify-between text-xs font-mono font-bold border-t border-[#E5E7EB] pt-3 text-black">
                          <span>From: {formatDisplayDate(claim.valid_from)}</span>
                          <span className={evalResult.status === "EXPIRED" ? "bg-[#FFD700] px-1.5 py-0.5 rounded border border-black font-black" : ""}>
                            Until: {formatDisplayDate(claim.valid_until)}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Channel Severity Threshold Tuner (Feature 2.4) */}
          {activeTab === "tuner" && (
            <div className="flex flex-col gap-6">
              {/* Tuner Header & Channel Selector */}
              <div className="neo-box p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="neo-badge bg-[#FF00FF] text-white text-[11px] font-black">
                      Feature 2.4
                    </span>
                    <span className="neo-badge bg-[#00C2CB] text-black text-[11px] font-black">
                      Context-Aware Governance
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-black tracking-tight">
                    Channel Severity Threshold Matrix
                  </h2>
                  <p className="text-xs font-medium text-[#444444] leading-relaxed">
                    Tune rule severity thresholds based on publication medium. Tone &amp; formatting rules can be relaxed for informal channels (e.g., social posts or paid ads) while remaining strict for press releases. Statutory rules (FDIC, SEC, FTC) are immutable and locked to CRITICAL across all channels.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="tuner-channel-select" className="text-[10px] font-mono font-black uppercase tracking-wider text-black">
                      Target Channel
                    </label>
                    <select
                      id="tuner-channel-select"
                      value={tunerChannel}
                      onChange={(e) => setTunerChannel(e.target.value)}
                      className="neo-input text-xs py-2 px-3 font-bold"
                    >
                      <option value="press_release">📰 Press Release (High Strictness)</option>
                      <option value="web_landing_page">🌐 Web Landing Page (Standard)</option>
                      <option value="ad_copy">📣 Paid Ad Copy (Dynamic)</option>
                      <option value="social_post">📱 Social Post (Relaxed Tone)</option>
                      <option value="email_blast">✉️ Email Blast</option>
                      <option value="partner_portal">🤝 Partner Portal</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetChannelTuner}
                    className="neo-btn neo-btn-white text-xs py-2 px-3 mt-auto flex items-center gap-1.5 cursor-pointer hover:bg-red-50 text-red-600"
                    title="Reset channel overrides to default baseline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Status / Safety Notice Banner */}
              {tunerNotice && (
                <div className="p-3.5 rounded-xl bg-[#FFF9E6] border-2 border-black flex items-center justify-between gap-3 text-xs font-bold text-black shadow-xs animate-in fade-in">
                  <span>{tunerNotice}</span>
                  <button
                    type="button"
                    onClick={() => setTunerNotice(null)}
                    className="p-1 rounded hover:bg-black/10 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Channel Rule Severity Tuning Table */}
              <div className="neo-box overflow-hidden bg-white">
                <div className="p-4 bg-[#F8F9FA] border-b-2 border-black flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black font-mono">
                    Active Rule Severity for: {tunerChannel.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#555555]">
                    {policy.rules.length} Rules Configured
                  </span>
                </div>

                <div className="divide-y divide-[#E5E7EB]">
                  {policy.rules.map((rule) => {
                    const isImmutable = IMMUTABLE_CRITICAL_RULES.has(rule.rule_code);
                    const effectiveSev =
                      channelOverrides[tunerChannel]?.[rule.rule_code] ||
                      resolveEffectiveSeverity(rule.rule_code, rule.severity as any, tunerChannel);

                    return (
                      <div
                        key={rule.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FFFDF5] transition"
                      >
                        <div className="flex flex-col gap-1 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="neo-badge bg-black text-white text-[10px] font-mono">
                              {rule.rule_code}
                            </span>
                            <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
                              {rule.category}
                            </span>
                            {isImmutable ? (
                              <span className="neo-badge bg-[#FF0055] text-white text-[10px] flex items-center gap-1 font-black">
                                <Lock className="w-3 h-3" />
                                <span>Statutory Mandate (Locked)</span>
                              </span>
                            ) : (
                              <span className="neo-badge bg-[#E5E7EB] text-black text-[10px] font-mono">
                                Tunable Scope
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-black">{rule.title}</h4>
                          {rule.description && (
                            <p className="text-xs text-[#555555] line-clamp-1">{rule.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isImmutable ? (
                            <div className="flex items-center gap-2">
                              <span className="neo-badge bg-[#FF00FF] text-white text-xs font-black py-1 px-3">
                                CRITICAL (LOCKED)
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <label htmlFor={`sev-select-${rule.rule_code}`} className="text-[11px] font-bold text-[#666666]">
                                Severity:
                              </label>
                              <select
                                id={`sev-select-${rule.rule_code}`}
                                value={effectiveSev}
                                onChange={(e) =>
                                  handleTuneRule(
                                    rule.rule_code,
                                    e.target.value as "CRITICAL" | "WARNING" | "INFO"
                                  )
                                }
                                className={`neo-input text-xs py-1 px-2.5 font-black rounded border-2 border-black ${
                                  effectiveSev === "CRITICAL"
                                    ? "bg-[#FFF0F5] text-[#D6004B]"
                                    : effectiveSev === "WARNING"
                                    ? "bg-[#FFD700] text-black"
                                    : "bg-[#E6FAFA] text-black"
                                }`}
                              >
                                <option value="CRITICAL">CRITICAL</option>
                                <option value="WARNING">WARNING</option>
                                <option value="INFO">INFO</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Governance & Backtest CTA Banner */}
      <div className="p-6 rounded-xl bg-[#FFD700] border border-[#E5E7EB] text-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-black shadow-xs shrink-0">
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

      {/* Guideline Ingester Modal */}
      <GuidelineIngesterModal
        isOpen={isIngesterModalOpen}
        onClose={() => setIsIngesterModalOpen(false)}
        onIngestComplete={(rules) => {
          setIngestedNotice(`✨ Successfully compiled ${rules.length} custom brand rules into active policy AST!`);
          handleManualRefresh();
        }}
      />
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
