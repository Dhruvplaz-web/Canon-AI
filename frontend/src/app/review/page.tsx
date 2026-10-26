"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  UserCheck,
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  ComplianceCertificateModal,
  ReleaseCertificate,
} from "@/components/ComplianceCertificateModal";

interface ReasonCode {
  id: string;
  code: string;
  title: string;
  description?: string;
}

interface ReviewQueueItem {
  id: string;
  check_run_id: string;
  submission_id: string;
  submission_title: string;
  submission_channel: string;
  submission_status: string;
  creator_id?: string | null;
  creator_name?: string | null;
  rule_code: string;
  category: string;
  severity: "CRITICAL" | "WARNING" | "INFO" | string;
  title: string;
  matched_text: string;
  start_offset: number;
  end_offset: number;
  suggested_fix?: string | null;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  source_document_title: string;
  source_section: string;
  status: "PENDING_REVIEW" | "OVERRIDDEN" | "FIXED" | string;
  created_at: string;
}

interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface ApprovalItem {
  id: string;
  workspace_id: string;
  submission_id: string;
  submission_version_id: string;
  approved_by: string;
  approver_name?: string | null;
  approver_email?: string | null;
  decision: "APPROVED" | "SENT_BACK" | string;
  approval_type: string;
  notes?: string | null;
  signed_off_at: string;
  created_at: string;
}

interface SubmissionItem {
  id: string;
  title: string;
  channel: string;
  current_version_number: number;
  status: "DRAFT" | "CHECKING" | "PENDING_REVIEW" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "SENT_BACK" | string;
  created_at: string;
  latest_approval?: ApprovalItem | null;
}

function ReviewQueueContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode switcher: "queue" (PROP-U08) vs "signoff" (PROP-U09)
  const initialMode = searchParams.get("view") === "signoff" ? "signoff" : "queue";
  const [viewMode, setViewMode] = useState<"queue" | "signoff">(initialMode);

  // Queue Triage State (PROP-U08 Pushdown)
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isQueueLoading, setIsQueueLoading] = useState<boolean>(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Queue Pushdown Filters (Rule 3 Database Pushdown)
  const [filterSeverity, setFilterSeverity] = useState<string>(searchParams.get("severity") || "ALL");
  const [filterChannel, setFilterChannel] = useState<string>(searchParams.get("channel") || "ALL");
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get("status") || "ALL");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const [page, setPage] = useState<number>(parseInt(searchParams.get("page") || "1", 10) || 1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Multi-Select Batch Override State
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchReasonCode, setBatchReasonCode] = useState<string>("SCOPE_MISMATCH");
  const [batchJustification, setBatchJustification] = useState("");
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Single Item Double-Receipt Drawer
  const [activeQueueItem, setActiveQueueItem] = useState<ReviewQueueItem | null>(null);
  const [singleReasonCode, setSingleReasonCode] = useState<string>("SCOPE_MISMATCH");
  const [singleJustification, setSingleJustification] = useState("");
  const [isSubmittingSingleOverride, setIsSubmittingSingleOverride] = useState(false);

  // Submission Sign-off View State (PROP-U09)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string>(searchParams.get("submissionId") || "");
  const [submissionFindings, setSubmissionFindings] = useState<ReviewQueueItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signOffNotes, setSignOffNotes] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isSendBackModalOpen, setIsSendBackModalOpen] = useState(false);
  const [sendBackNotes, setSendBackNotes] = useState("");
  const [isSubmittingSendBack, setIsSubmittingSendBack] = useState(false);
  const [submissionRefreshTrigger, setSubmissionRefreshTrigger] = useState<number>(0);

  // Common Taxonomy Reason Codes
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Compliance Release Certificate State
  const [certificateData, setCertificateData] = useState<ReleaseCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);

  const canApprove = user?.role === "reviewer" || user?.role === "brand_manager";

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Sync state to URL search parameters (Rule 3 URL-First State)
  const syncUrlParams = useCallback(
    (newParams: Record<string, string | number | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === null || v === "ALL" || v === "" || v === 1) {
          current.delete(k);
        } else {
          current.set(k, String(v));
        }
      });
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // PROP-U21: Global keyboard accessibility & scroll locking for modals
  const isAnyModalOpen =
    isBatchModalOpen ||
    isSignOffModalOpen ||
    isSendBackModalOpen ||
    !!activeQueueItem ||
    isCertModalOpen;

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBatchModalOpen(false);
        setIsSignOffModalOpen(false);
        setIsSendBackModalOpen(false);
        setActiveQueueItem(null);
        setIsCertModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnyModalOpen]);

  // 1. Fetch Taxonomy Reason Codes
  useEffect(() => {
    fetch("/api/v1/governance/reason-codes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReasonCode[]) => {
        setReasonCodes(data);
        if (data.length > 0) {
          setBatchReasonCode(data[0].code);
          setSingleReasonCode(data[0].code);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Review Queue with Pushdown Filters (Rule 3 Database Pushdown)
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const params = new URLSearchParams();
        if (filterSeverity && filterSeverity !== "ALL") params.set("severity", filterSeverity);
        if (filterChannel && filterChannel !== "ALL") params.set("channel", filterChannel);
        if (filterStatus && filterStatus !== "ALL") params.set("status", filterStatus);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("page", String(page));
        params.set("page_size", String(pageSize));

        const res = await fetch(`/api/v1/review/queue?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error?.message || "Failed to load review queue.");
        }

        const data: ReviewQueueResponse = await res.json();
        if (active) {
          setQueueItems(data.items || []);
          setTotalItems(data.total || 0);
          setTotalPages(data.total_pages || 1);
          setQueueError(null);
        }
      } catch (err: unknown) {
        if (active && !(err instanceof DOMException && err.name === "AbortError")) {
          const msg = err instanceof Error ? err.message : "Network error loading queue.";
          setQueueError(msg);
        }
      } finally {
        if (active) {
          setIsQueueLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [filterSeverity, filterChannel, filterStatus, searchQuery, page, pageSize, refreshTrigger]);

  // 3. Fetch Submissions for Sign-off View
  useEffect(() => {
    let active = true;

    fetch("/api/v1/submissions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return;
        const list: SubmissionItem[] = Array.isArray(data) ? data : data?.items || [];
        setSubmissions(list);
        if (list.length > 0 && !activeSubmissionId) {
          setActiveSubmissionId(list[0].id);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [activeSubmissionId, submissionRefreshTrigger]);

  // 4. Fetch Active Submission Findings & Approvals
  useEffect(() => {
    if (!activeSubmissionId) return;
    let active = true;

    fetch(`/api/v1/submissions/${activeSubmissionId}/checks`)
      .then((res) => (res.ok ? res.json() : []))
      .then((checkData) => {
        if (!active) return;
        if (Array.isArray(checkData) && checkData.length > 0 && checkData[0].findings) {
          setSubmissionFindings(checkData[0].findings);
        } else {
          setSubmissionFindings([]);
        }
      })
      .catch(() => {});

    fetch(`/api/v1/submissions/${activeSubmissionId}/approvals`)
      .then((res) => (res.ok ? res.json() : []))
      .then((appData) => {
        if (!active) return;
        setApprovals(appData);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [activeSubmissionId, submissionRefreshTrigger]);

  // Active submission entity for signoff tab
  const activeSubmission = useMemo(() => {
    return submissions.find((s) => s.id === activeSubmissionId) || submissions[0] || null;
  }, [submissions, activeSubmissionId]);

  // Check for open critical findings in active submission
  const openCriticalFindings = useMemo(() => {
    return submissionFindings.filter(
      (f) => f.severity.toUpperCase() === "CRITICAL" && f.status.toUpperCase() !== "OVERRIDDEN"
    );
  }, [submissionFindings]);

  const hasOpenCritical = openCriticalFindings.length > 0;

  // Queue Selection Handlers
  const handleSelectAllOnPage = () => {
    if (selectedQueueIds.length === queueItems.length) {
      setSelectedQueueIds([]);
    } else {
      setSelectedQueueIds(queueItems.map((item) => item.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedQueueIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit Batch Override (PROP-U08)
  const handleSubmitBatchOverride = async () => {
    if (selectedQueueIds.length === 0 || batchJustification.trim().length < 5) return;
    setIsSubmittingBatch(true);

    try {
      const res = await fetch("/api/v1/review/batch-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finding_ids: selectedQueueIds,
          reason_code: batchReasonCode,
          justification: batchJustification.trim(),
          decision_type: "OVERRIDE",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Batch override failed.");
      }

      const data = await res.json();
      showToast(
        "success",
        `Batch override applied: ${data.overridden_count} violation(s) overridden under reason "${batchReasonCode}". Immutable audit logs recorded.`
      );
      setSelectedQueueIds([]);
      setIsBatchModalOpen(false);
      setBatchJustification("");
      setRefreshTrigger((c) => c + 1);
      setSubmissionRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute batch override.";
      showToast("error", msg);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Submit Single Override from Drawer
  const handleSubmitSingleOverride = async () => {
    if (!activeQueueItem || singleJustification.trim().length < 5) return;
    setIsSubmittingSingleOverride(true);

    try {
      const res = await fetch(`/api/v1/findings/${activeQueueItem.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_code: singleReasonCode,
          justification: singleJustification.trim(),
          decision_type: "OVERRIDE",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Override failed.");
      }

      showToast(
        "success",
        `Override recorded for ${activeQueueItem.rule_code} under reason ${singleReasonCode}.`
      );
      setActiveQueueItem(null);
      setSingleJustification("");
      setRefreshTrigger((c) => c + 1);
      setSubmissionRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record override.";
      showToast("error", msg);
    } finally {
      setIsSubmittingSingleOverride(false);
    }
  };

  // Sign-off Actions (PROP-U09)
  const handleSubmitApproval = async () => {
    if (!activeSubmission) return;
    setIsSubmittingApproval(true);

    try {
      const res = await fetch(`/api/v1/submissions/${activeSubmission.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: signOffNotes.trim() || "Brand compliance sign-off granted.",
          approval_type: "FINAL_SIGNOFF",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Approval failed.");
      }

      showToast("success", `Formal sign-off granted for "${activeSubmission.title}".`);
      setIsSignOffModalOpen(false);
      setSignOffNotes("");
      setSubmissionRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve.";
      showToast("error", msg);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleSubmitSendBack = async () => {
    if (!activeSubmission || sendBackNotes.trim().length < 5) return;
    setIsSubmittingSendBack(true);

    try {
      const res = await fetch(`/api/v1/submissions/${activeSubmission.id}/send-back`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: sendBackNotes.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Send-back failed.");
      }

      showToast("info", `Draft returned to creator with revision instructions.`);
      setIsSendBackModalOpen(false);
      setSendBackNotes("");
      setSubmissionRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to return draft.";
      showToast("error", msg);
    } finally {
      setIsSubmittingSendBack(false);
    }
  };

  const handleDownloadCertificate = async (subId: string) => {
    setIsDownloadingCert(true);
    try {
      const res = await fetch(`/api/v1/submissions/${subId}/certificate`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.detail?.error?.message ||
            err?.detail?.message ||
            `Failed to fetch certificate (${res.status})`
        );
      }
      const cert: ReleaseCertificate = await res.json();
      setCertificateData(cert);
      setIsCertModalOpen(true);
      showToast("success", "Compliance Release Certificate generated & cryptographically verified!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load certificate";
      showToast("error", msg);
    } finally {
      setIsDownloadingCert(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Toast Banner */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border-2.5 border-black flex items-center justify-between text-xs font-bold shadow-[4px_4px_0px_#000] animate-in fade-in duration-200 ${
            toastMsg.type === "success"
              ? "bg-[#00C2CB] text-black"
              : toastMsg.type === "error"
              ? "bg-[#FF00FF] text-white"
              : "bg-[#FFD700] text-black"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toastMsg.type === "error" && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {toastMsg.type === "info" && <RotateCcw className="w-5 h-5 shrink-0" />}
            <span className="text-sm">{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 rounded hover:bg-black/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2.5 border-black pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge bg-[#00C2CB] text-black">SCR-05 & SCR-06</span>
            <span className="text-black font-black text-xs">•</span>
            <span className="text-xs font-mono font-bold text-black uppercase tracking-wider">
              Review Queue & Governance Triage
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">
            Brand Governance Review & Triage
          </h1>
          <p className="text-sm font-medium text-[#333333] mt-1.5 max-w-2xl">
            Perform pushdown SQL queue triage (PROP-U08) and formal compliance sign-offs with Double Receipts (PROP-U09).
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-white border-2.5 border-black p-1.5 rounded-xl shadow-[3px_3px_0px_#000]">
          <button
            type="button"
            onClick={() => {
              setViewMode("queue");
              syncUrlParams({ view: "queue" });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              viewMode === "queue"
                ? "bg-[#00C2CB] border-2 border-black text-black shadow-[2px_2px_0px_#000]"
                : "text-black hover:bg-[#F4F0EA]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Triage Queue</span>
            {totalItems > 0 && (
              <span className="neo-badge bg-black text-white text-[10px]">
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("signoff");
              syncUrlParams({ view: "signoff" });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              viewMode === "signoff"
                ? "bg-[#FFD700] border-2 border-black text-black shadow-[2px_2px_0px_#000]"
                : "text-black hover:bg-[#F4F0EA]"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Submission Sign-Off</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TRIAGE TABLE QUEUE WITH PUSHDOWN FILTERING & BATCH OVERRIDES (PROP-U08) */}
      {/* ========================================================================= */}
      {viewMode === "queue" && (
        <section className="flex flex-col gap-5">
          {/* Pushdown Filter Toolbar */}
          <div className="neo-box p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-black absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                    syncUrlParams({ search: e.target.value, page: 1 });
                  }}
                  placeholder="Search draft title, flagged words, rule code..."
                  className="w-full neo-input pl-9 pr-3 py-1.5 text-xs text-black placeholder-[#666666]"
                />
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-black font-black uppercase tracking-wider text-[11px]">Severity:</span>
                <select
                  value={filterSeverity}
                  onChange={(e) => {
                    setFilterSeverity(e.target.value);
                    setPage(1);
                    syncUrlParams({ severity: e.target.value, page: 1 });
                  }}
                  className="bg-white border-2 border-black rounded-lg px-2.5 py-1.5 text-xs text-black font-bold shadow-[2px_2px_0px_#000] focus:shadow-[4px_4px_0px_#000] cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                </select>
              </div>

              {/* Channel Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-black font-black uppercase tracking-wider text-[11px]">Channel:</span>
                <select
                  value={filterChannel}
                  onChange={(e) => {
                    setFilterChannel(e.target.value);
                    setPage(1);
                    syncUrlParams({ channel: e.target.value, page: 1 });
                  }}
                  className="bg-white border-2 border-black rounded-lg px-2.5 py-1.5 text-xs text-black font-bold shadow-[2px_2px_0px_#000] focus:shadow-[4px_4px_0px_#000] cursor-pointer"
                >
                  <option value="ALL">All Channels</option>
                  <option value="web_landing_page">Web Landing Page</option>
                  <option value="email_blast">Email Blast</option>
                  <option value="ad_copy">Paid Ad Copy</option>
                  <option value="press_release">Press Release</option>
                  <option value="partner_portal">Partner Portal</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-black font-black uppercase tracking-wider text-[11px]">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                    syncUrlParams({ status: e.target.value, page: 1 });
                  }}
                  className="bg-white border-2 border-black rounded-lg px-2.5 py-1.5 text-xs text-black font-bold shadow-[2px_2px_0px_#000] focus:shadow-[4px_4px_0px_#000] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="OVERRIDDEN">Overridden</option>
                  <option value="FIXED">Fixed</option>
                </select>
              </div>
            </div>

            {/* Refresh / Status indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRefreshTrigger((c) => c + 1)}
                disabled={isQueueLoading}
                className="neo-btn neo-btn-white p-2"
                title="Refresh queue"
              >
                <RefreshCw className={`w-4 h-4 text-black ${isQueueLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Floating Batch Override Bar */}
          {selectedQueueIds.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#00C2CB] border-2.5 border-black flex items-center justify-between gap-4 text-xs font-bold shadow-[4px_4px_0px_#000] animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-black">
                <span className="font-black">
                  {selectedQueueIds.length} violation(s) selected
                </span>
                <span>•</span>
                <span className="font-semibold">
                  Ready for batch compliance exception override
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQueueIds([])}
                  className="neo-btn neo-btn-white text-xs py-1.5 px-3"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(true)}
                  className="neo-btn neo-btn-black text-xs py-1.5 px-3"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Batch Override ({selectedQueueIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {queueError && (
            <div className="p-4 rounded-xl bg-[#FF00FF] border-2.5 border-black text-white text-xs flex items-center justify-between gap-3 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
                <span>{queueError}</span>
              </div>
              <button
                type="button"
                onClick={() => setRefreshTrigger((c) => c + 1)}
                className="neo-btn neo-btn-white text-xs py-1 px-3"
              >
                Retry
              </button>
            </div>
          )}

          {/* Triage Table */}
          <div className="neo-box overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2.5 border-black bg-black text-white font-mono font-black text-[11px] tracking-wider">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          queueItems.length > 0 && selectedQueueIds.length === queueItems.length
                        }
                        onChange={handleSelectAllOnPage}
                        className="w-4 h-4 rounded border-2 border-white bg-black accent-[#00C2CB] cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="py-3.5 px-4 w-28">SEVERITY</th>
                    <th className="py-3.5 px-4 w-32">RULE CODE</th>
                    <th className="py-3.5 px-4">VIOLATION / FLAGGED TEXT</th>
                    <th className="py-3.5 px-4">SUBMISSION DRAFT</th>
                    <th className="py-3.5 px-4 w-28">STATUS</th>
                    <th className="py-3.5 px-4 w-28 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {/* Loading Skeleton */}
                  {isQueueLoading && (
                    <>
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="py-4 px-4 text-center">
                            <div className="w-4 h-4 skeleton mx-auto" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-16 h-4 skeleton" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-20 h-4 skeleton" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-48 h-4 skeleton mb-1" />
                            <div className="w-32 h-3 skeleton" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-36 h-4 skeleton" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-20 h-4 skeleton" />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="w-16 h-6 skeleton ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Empty State */}
                  {!isQueueLoading && queueItems.length === 0 && (
                    <tr className="bg-white">
                      <td colSpan={7} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#F4F0EA] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000]">
                            <CheckCircle2 className="w-6 h-6 text-black" />
                          </div>
                          <span className="text-base font-black text-black">
                            No Violations Found
                          </span>
                          <p className="text-xs font-medium text-[#444444] max-w-sm">
                            The review queue is clear for the selected filters. Verify active drafts or run compliance checks to surface findings.
                          </p>
                          <a
                            href="/submissions"
                            className="neo-btn neo-btn-teal text-xs py-2 px-4 mt-1"
                          >
                            <span>Open Drafts & Runner</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Populated Rows */}
                  {!isQueueLoading &&
                    queueItems.map((item) => {
                      const isSelected = selectedQueueIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`transition cursor-pointer ${
                            isSelected ? "bg-[#FFF8E7]" : "bg-white hover:bg-[#FDFBF7]"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="w-4 h-4 rounded border-2 border-black bg-white accent-[#00C2CB] cursor-pointer"
                            />
                          </td>

                          {/* Severity */}
                          <td className="py-3 px-4">
                            <span
                              className={`neo-badge text-[10px] ${
                                item.severity === "CRITICAL"
                                  ? "bg-[#FF00FF] text-white"
                                  : item.severity === "WARNING"
                                  ? "bg-[#FFD700] text-black"
                                  : "bg-[#00C2CB] text-black"
                              }`}
                            >
                              {item.severity}
                            </span>
                          </td>

                          {/* Rule Code */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-black">
                                {item.rule_code}
                              </span>
                              <span className="text-[10px] text-[#444444] uppercase font-mono font-bold">
                                {item.category}
                              </span>
                            </div>
                          </td>

                          {/* Flagged Text & Title */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5 max-w-md">
                              <span className="font-bold text-black truncate">
                                {item.title}
                              </span>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#D6006E] font-black">
                                <span>&ldquo;{item.matched_text}&rdquo;</span>
                                <span className="text-[10px] text-[#555555] font-bold">
                                  [{item.start_offset}:{item.end_offset}]
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Submission */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-black truncate max-w-[180px]">
                                {item.submission_title}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-[#555555] font-mono font-bold">
                                  {item.submission_channel}
                                </span>
                                {item.creator_name && (
                                  <>
                                    <span className="text-black text-[10px] font-bold">•</span>
                                    <span className="text-[10px] text-black font-semibold">
                                      {item.creator_name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`neo-badge text-[10px] ${
                                item.status === "OVERRIDDEN"
                                  ? "bg-black text-white"
                                  : item.status === "FIXED"
                                  ? "bg-[#00C2CB] text-black"
                                  : "bg-white text-black"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQueueItem(item);
                                setSingleJustification("");
                              }}
                              className="neo-btn neo-btn-white text-xs py-1 px-3"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t-2.5 border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-black font-bold">
              <div className="flex items-center gap-2 font-mono">
                <span>Showing</span>
                <span className="text-black font-black">
                  {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}
                </span>
                <span>to</span>
                <span className="text-black font-black">
                  {Math.min(page * pageSize, totalItems)}
                </span>
                <span>of</span>
                <span className="text-black font-black">{totalItems}</span>
                <span>violations</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#444444] font-black uppercase">Page size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white border-2 border-black rounded px-2 py-1 text-xs text-black font-bold shadow-[2px_2px_0px_#000] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, page - 1);
                      setPage(newPage);
                      syncUrlParams({ page: newPage });
                    }}
                    className="neo-btn neo-btn-white p-1.5"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4 text-black" />
                  </button>
                  <span className="px-2 font-mono font-black text-xs text-black">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const newPage = Math.min(totalPages, page + 1);
                      setPage(newPage);
                      syncUrlParams({ page: newPage });
                    }}
                    className="neo-btn neo-btn-white p-1.5"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SUBMISSION SIGN-OFF & SEND-BACK LOOP (PROP-U09) */}
      {/* ========================================================================= */}
      {viewMode === "signoff" && (
        <section className="flex flex-col gap-6">
          {/* Submission Selector Tabs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-black uppercase tracking-wider">Select Submission Draft:</span>
            <div className="flex flex-wrap gap-3">
              {submissions.map((sub) => {
                const isActive = sub.id === activeSubmission?.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setActiveSubmissionId(sub.id);
                      syncUrlParams({ submissionId: sub.id });
                    }}
                    className={`text-left p-3.5 rounded-xl border-2.5 border-black transition text-xs flex flex-col gap-1.5 min-w-[210px] cursor-pointer ${
                      isActive
                        ? "bg-[#00C2CB] shadow-[4px_4px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-white hover:bg-[#FDFBF7] shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black truncate max-w-[150px] text-black">
                        {sub.title}
                      </span>
                      <span
                        className={`neo-badge text-[10px] ${
                          sub.status === "APPROVED" || sub.status === "APPROVED_WITH_OVERRIDE"
                            ? "bg-[#00C2CB] text-black"
                            : sub.status === "SENT_BACK"
                            ? "bg-[#FFD700] text-black"
                            : "bg-white text-black"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[10px] text-[#444444]">
                      v{sub.current_version_number} • {sub.channel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeSubmission && (
            <div className="flex flex-col gap-6">
              {/* Critical Blocker Notice */}
              {hasOpenCritical && (
                <div className="p-4 rounded-xl bg-[#FF00FF] border-2.5 border-black text-white text-xs flex items-center justify-between gap-4 shadow-[4px_4px_0px_#000]">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-white shrink-0" />
                    <div>
                      <strong className="font-black text-sm block uppercase tracking-tight">
                        Sign-off Blocked: {openCriticalFindings.length} Unresolved Critical Violation(s)
                      </strong>
                      <span className="font-medium text-white/95">
                        Under Section 3 Invariants, final sign-off is prohibited while critical violations remain open. Override each finding with a reason code or send back for revision.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSendBackModalOpen(true)}
                    className="neo-btn neo-btn-black text-xs py-1.5 px-3.5 shrink-0"
                  >
                    Send Back Now
                  </button>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="neo-box p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-black">{activeSubmission.title}</h2>
                    <span className="neo-badge bg-[#FFD700] text-black text-xs">
                      v{activeSubmission.current_version_number}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#555555]">
                    Scope: {activeSubmission.channel} • Created:{" "}
                    {new Date(activeSubmission.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isDownloadingCert}
                    onClick={() => handleDownloadCertificate(activeSubmission.id)}
                    className="neo-btn neo-btn-white text-xs py-2 px-4 border-2.5 border-black shadow-[3px_3px_0px_#000] hover:bg-[#FFD700]"
                    title="View & Download Cryptographic Compliance Release Certificate"
                  >
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>{isDownloadingCert ? "Verifying..." : "Compliance Certificate"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSendBackModalOpen(true)}
                    className="neo-btn neo-btn-yellow text-xs py-2 px-4"
                  >
                    <RotateCcw className="w-4 h-4 text-black" />
                    <span>Send Back for Revision</span>
                  </button>

                  <button
                    type="button"
                    disabled={hasOpenCritical || isSubmittingApproval || !canApprove}
                    onClick={() => setIsSignOffModalOpen(true)}
                    className="neo-btn neo-btn-teal text-xs py-2 px-4"
                  >
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Grant Final Sign-Off</span>
                  </button>
                </div>
              </div>

              {/* Active Findings for this submission */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black text-black uppercase tracking-wider">
                  Verification Findings for this Draft ({submissionFindings.length})
                </h3>
                {submissionFindings.map((f) => (
                  <div
                    key={f.id}
                    className="neo-box p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`neo-badge text-[10px] ${
                            f.severity === "CRITICAL"
                              ? "bg-[#FF00FF] text-white"
                              : "bg-[#FFD700] text-black"
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="font-mono text-xs font-black text-black">
                          {f.rule_code}
                        </span>
                      </div>
                      <span
                        className={`neo-badge text-[10px] ${
                          f.status === "OVERRIDDEN"
                            ? "bg-black text-white"
                            : "bg-white text-black"
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-black">{f.title}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-[#FFF0F5] border-2 border-black flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-black text-black block">
                          RECEIPT A (DRAFT)
                        </span>
                        <span className="text-[#D6006E] font-mono font-black">&ldquo;{f.receipt_a_draft_span}&rdquo;</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#E6FAFA] border-2 border-black flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-black text-black block">
                          RECEIPT B (POLICY)
                        </span>
                        <span className="text-black font-mono font-semibold line-clamp-2">
                          &ldquo;{f.receipt_b_rule_quote}&rdquo;
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Approval History Audit Trail */}
              {approvals.length > 0 && (
                <div className="neo-box p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-black" />
                    <span>Compliance Sign-Off History</span>
                  </div>
                  <div className="divide-y-2 divide-black">
                    {approvals.map((app) => (
                      <div key={app.id} className="py-2.5 flex items-center justify-between text-xs font-bold text-black">
                        <div className="flex flex-col">
                          <span className="font-black text-black">
                            {app.decision} by {app.approver_name || "Reviewer"}
                          </span>
                          <span className="text-[11px] text-[#555555] font-normal">{app.notes}</span>
                        </div>
                        <span className="font-mono text-[11px] text-black font-semibold">
                          {new Date(app.signed_off_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: DOUBLE-RECEIPT DETAIL & SINGLE OVERRIDE MODAL */}
      {/* ========================================================================= */}
      {activeQueueItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="active-finding-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="neo-box-prominent max-w-xl w-full p-6 flex flex-col gap-5 text-black animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b-2.5 border-black pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`neo-badge text-[10px] ${
                      activeQueueItem.severity === "CRITICAL"
                        ? "bg-[#FF00FF] text-white"
                        : "bg-[#FFD700] text-black"
                    }`}
                  >
                    {activeQueueItem.severity}
                  </span>
                  <span className="font-mono text-sm font-black text-black">
                    {activeQueueItem.rule_code}
                  </span>
                </div>
                <h3 id="active-finding-title" className="text-base font-black text-black mt-1">
                  {activeQueueItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveQueueItem(null)}
                aria-label="Close modal"
                className="p-1 rounded-md border-2 border-transparent hover:border-black hover:bg-[#F4F0EA] text-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Double Receipts */}
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-[#FFF0F5] border-2 border-black flex flex-col gap-1 shadow-[2px_2px_0px_#000]">
                <span className="text-[10px] font-mono font-black text-black">
                  RECEIPT A: DRAFT SPAN [{activeQueueItem.start_offset}:{activeQueueItem.end_offset}]
                </span>
                <p className="text-xs font-mono text-[#D6006E] font-black">
                  &ldquo;{activeQueueItem.receipt_a_draft_span}&rdquo;
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#E6FAFA] border-2 border-black flex flex-col gap-1 shadow-[2px_2px_0px_#000]">
                <span className="text-[10px] font-mono font-black text-black">
                  RECEIPT B: CITATION ({activeQueueItem.source_document_title})
                </span>
                <p className="text-xs font-mono text-black font-semibold leading-relaxed">
                  &ldquo;{activeQueueItem.receipt_b_rule_quote}&rdquo;
                </p>
              </div>

              {activeQueueItem.suggested_fix && (
                <div className="text-xs text-black flex items-center gap-1.5 font-bold">
                  <span className="text-black">Suggested remediation:</span>
                  <span className="font-mono text-black bg-[#FFD700] px-2 py-0.5 rounded border-2 border-black">
                    &ldquo;{activeQueueItem.suggested_fix}&rdquo;
                  </span>
                </div>
              )}
            </div>

            {/* Override Controls */}
            {activeQueueItem.status !== "OVERRIDDEN" ? (
              <div className="flex flex-col gap-3 pt-3 border-t-2 border-black">
                <div className="flex flex-col gap-1">
                  <label htmlFor="reason-code" className="text-xs font-black uppercase text-black">
                    Taxonomy Reason Code
                  </label>
                  <select
                    id="reason-code"
                    value={singleReasonCode}
                    onChange={(e) => setSingleReasonCode(e.target.value)}
                    className="neo-input cursor-pointer"
                  >
                    {reasonCodes.map((rc) => (
                      <option key={rc.id || rc.code} value={rc.code}>
                        {rc.code} — {rc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="justification" className="text-xs font-black uppercase text-black">
                      Compliance Justification (min 5 characters)
                    </label>
                    <span className="text-[10px] text-black font-mono font-bold">⌘/Ctrl + Enter</span>
                  </div>
                  <textarea
                    id="justification"
                    rows={3}
                    value={singleJustification}
                    onChange={(e) => setSingleJustification(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSubmittingSingleOverride && singleJustification.trim().length >= 5) {
                        e.preventDefault();
                        handleSubmitSingleOverride();
                      }
                    }}
                    placeholder="State justification recorded in immutable audit ledger..."
                    className="neo-input"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveQueueItem(null)}
                    className="neo-btn neo-btn-white text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingSingleOverride || singleJustification.trim().length < 5}
                    onClick={handleSubmitSingleOverride}
                    className="neo-btn neo-btn-teal text-xs py-2 px-4"
                  >
                    {isSubmittingSingleOverride ? "Recording..." : "Record Override"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#00C2CB] border-2 border-black text-black text-xs text-center font-mono font-black shadow-[2px_2px_0px_#000]">
                Violation already overridden and logged in audit ledger.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH OVERRIDE (PROP-U08) */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-override-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="neo-box-prominent max-w-lg w-full p-6 flex flex-col gap-5 text-black animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b-2.5 border-black pb-3">
              <div>
                <h3 id="batch-override-title" className="text-lg font-black text-black">
                  Batch Override {selectedQueueIds.length} Violation(s)
                </h3>
                <p className="text-xs font-semibold text-[#444444] mt-0.5">
                  Record atomic overrides across all selected findings with mandatory taxonomy reason code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                aria-label="Close modal"
                className="p-1 rounded-md border-2 border-transparent hover:border-black hover:bg-[#F4F0EA] text-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="batch-reason" className="text-xs font-black uppercase text-black">
                  Taxonomy Reason Code
                </label>
                <select
                  id="batch-reason"
                  value={batchReasonCode}
                  onChange={(e) => setBatchReasonCode(e.target.value)}
                  className="neo-input cursor-pointer"
                >
                  {reasonCodes.map((rc) => (
                    <option key={rc.id || rc.code} value={rc.code}>
                      {rc.code} — {rc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="batch-justification" className="text-xs font-black uppercase text-black">
                    Compliance Justification (min 5 characters)
                  </label>
                  <span className="text-[10px] text-black font-mono font-bold">⌘/Ctrl + Enter</span>
                </div>
                <textarea
                  id="batch-justification"
                  rows={3}
                  value={batchJustification}
                  onChange={(e) => setBatchJustification(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSubmittingBatch && batchJustification.trim().length >= 5) {
                      e.preventDefault();
                      handleSubmitBatchOverride();
                    }
                  }}
                  placeholder="Audit explanation applied to all selected violations..."
                  className="neo-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="neo-btn neo-btn-white text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingBatch || batchJustification.trim().length < 5}
                onClick={handleSubmitBatchOverride}
                className="neo-btn neo-btn-teal text-xs py-2 px-4"
              >
                {isSubmittingBatch ? "Applying..." : "Confirm Batch Override"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SIGN-OFF CONFIRMATION (PROP-U09) */}
      {/* ========================================================================= */}
      {isSignOffModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signoff-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="neo-box-prominent max-w-md w-full p-6 flex flex-col gap-5 text-black animate-in zoom-in-95 duration-150">
            <div>
              <h3 id="signoff-modal-title" className="text-lg font-black text-black">Grant Formal Brand Sign-Off</h3>
              <p className="text-xs font-semibold text-[#444444] mt-1">
                Certifies that this draft is compliant or that all exceptions have been overridden.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="signoff-notes" className="text-xs font-black uppercase text-black">
                  Optional Sign-Off Notes
                </label>
                <span className="text-[10px] text-black font-mono font-bold">⌘/Ctrl + Enter</span>
              </div>
              <textarea
                id="signoff-notes"
                rows={3}
                value={signOffNotes}
                onChange={(e) => setSignOffNotes(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSubmittingApproval) {
                    e.preventDefault();
                    handleSubmitApproval();
                  }
                }}
                placeholder="e.g. Legal exception verified for Q1 campaign..."
                className="neo-input"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setIsSignOffModalOpen(false)}
                className="neo-btn neo-btn-white text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingApproval}
                onClick={handleSubmitApproval}
                className="neo-btn neo-btn-teal text-xs py-2 px-4"
              >
                {isSubmittingApproval ? "Signing off..." : "Confirm Sign-Off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND BACK FOR REVISION (PROP-U09) */}
      {/* ========================================================================= */}
      {isSendBackModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sendback-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="neo-box-prominent max-w-md w-full p-6 flex flex-col gap-5 text-black animate-in zoom-in-95 duration-150">
            <div>
              <h3 id="sendback-modal-title" className="text-lg font-black text-black">Send Back for Revision</h3>
              <p className="text-xs font-semibold text-[#444444] mt-1">
                Returns the draft to the creator with required revision instructions.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="sendback-notes" className="text-xs font-black uppercase text-black">
                  Revision Instructions (min 5 characters)
                </label>
                <span className="text-[10px] text-black font-mono font-bold">⌘/Ctrl + Enter</span>
              </div>
              <textarea
                id="sendback-notes"
                rows={3}
                value={sendBackNotes}
                onChange={(e) => setSendBackNotes(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSubmittingSendBack && sendBackNotes.trim().length >= 5) {
                    e.preventDefault();
                    handleSubmitSendBack();
                  }
                }}
                placeholder="State specific guidelines or changes required..."
                className="neo-input"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setIsSendBackModalOpen(false)}
                className="neo-btn neo-btn-white text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingSendBack || sendBackNotes.trim().length < 5}
                onClick={handleSubmitSendBack}
                className="neo-btn neo-btn-yellow text-xs py-2 px-4"
              >
                {isSubmittingSendBack ? "Sending back..." : "Confirm Send-Back"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRYPTOGRAPHIC COMPLIANCE RELEASE CERTIFICATE */}
      {/* ========================================================================= */}
      <ComplianceCertificateModal
        certificate={certificateData}
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />
    </div>
  );
}

export default function ReviewQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 text-black font-mono font-bold text-xs">
          Loading Review Governance Workspace...
        </div>
      }
    >
      <ReviewQueueContent />
    </Suspense>
  );
}
