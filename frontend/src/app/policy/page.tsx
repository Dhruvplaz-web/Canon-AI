"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PolicyHeader } from "@/features/policy/PolicyHeader";
import { PolicyFilters } from "@/features/policy/PolicyFilters";
import { PolicyRulesTable } from "@/features/policy/PolicyRulesTable";
import { RuleDetailSheet, type RuleDetail } from "@/features/policy/RuleDetailSheet";
import { ApprovedClaimsTab, type ApprovedClaim } from "@/features/policy/ApprovedClaimsTab";
import { SourceDocumentReader } from "@/features/policy/SourceDocumentReader";
import { GuidelineIngesterModal } from "@/components/GuidelineIngesterModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface ActivePolicy {
  id: string;
  version_number: string;
  status: string;
  compiled_rules_count: number;
  change_summary: string | null;
  approved_by: string | null;
  approved_at: string | null;
  effective_date: string;
  source_document?: {
    id: string;
    title: string;
    extracted_text: string;
    content_hash: string;
  } | null;
  rules: RuleDetail[];
  approved_claims: ApprovedClaim[];
}

function PolicyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [policy, setPolicy] = useState<ActivePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // URL-first state
  const activeTab = searchParams.get("tab") === "claims" ? "claims" : "rules";
  const layoutMode = (searchParams.get("view") === "grid" ? "grid" : "split") as "split" | "grid";
  const searchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "ALL";
  const selectedSeverity = searchParams.get("severity") || "ALL";
  const selectedRuleCode = searchParams.get("rule") || null;

  const [drawerRule, setDrawerRule] = useState<RuleDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isIngesterOpen, setIsIngesterOpen] = useState(false);

  // Sync params to URL
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || val === "ALL" || (key === "tab" && val === "rules")) {
          sp.delete(key);
        } else {
          sp.set(key, val);
        }
      });
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchPolicy = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch("/api/v1/governance/policy/active", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load policy data (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data: ActivePolicy) => {
        setPolicy(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to contact policy engine.");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy, refreshTrigger]);

  // Handle URL rule parameter synchronization
  useEffect(() => {
    if (policy && selectedRuleCode) {
      const match = policy.rules.find((r) => r.rule_code === selectedRuleCode);
      if (match) {
        setDrawerRule(match);
      }
    }
  }, [policy, selectedRuleCode]);

  // Available categories
  const categories = useMemo(() => {
    if (!policy) return [];
    return Array.from(new Set(policy.rules.map((r) => r.category))).sort();
  }, [policy]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (!policy) return [];
    return policy.rules.filter((rule) => {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesCode = rule.rule_code.toLowerCase().includes(query);
        const matchesTitle = rule.title.toLowerCase().includes(query);
        const matchesTerm = rule.pattern_or_term?.toLowerCase().includes(query);
        const matchesQuote = rule.source_citation?.exact_quote?.toLowerCase().includes(query);
        if (!matchesCode && !matchesTitle && !matchesTerm && !matchesQuote) return false;
      }
      if (selectedCategory !== "ALL" && rule.category !== selectedCategory) return false;
      if (selectedSeverity !== "ALL" && rule.severity !== selectedSeverity) return false;
      return true;
    });
  }, [policy, searchQuery, selectedCategory, selectedSeverity]);

  const handleSelectRule = (rule: RuleDetail) => {
    setDrawerRule(rule);
    setIsDrawerOpen(true);
    updateUrl({ rule: rule.rule_code });
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    updateUrl({ rule: null });
  };

  return (
    <div className="space-y-6">
      <PolicyHeader
        versionNumber={policy?.version_number}
        rulesCount={policy?.rules?.length || 0}
        contentHash={policy?.source_document?.content_hash}
        onRefresh={() => setRefreshTrigger((t) => t + 1)}
        onOpenIngester={() => setIsIngesterOpen(true)}
        isRefreshing={isLoading}
      />

      {isLoading && !policy ? (
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      ) : error && !policy ? (
        <ErrorState
          title="Failed to Load Active Policy"
          description={error}
          retryAction={() => setRefreshTrigger((t) => t + 1)}
        />
      ) : (
        <>

      <PolicyFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => updateUrl({ q })}
        selectedCategory={selectedCategory}
        onCategoryChange={(category) => updateUrl({ category })}
        selectedSeverity={selectedSeverity}
        onSeverityChange={(severity) => updateUrl({ severity })}
        categories={categories}
        layoutMode={layoutMode}
        onLayoutModeChange={(view) => updateUrl({ view })}
        activeTab={activeTab}
        onTabChange={(tab) => updateUrl({ tab })}
        rulesCount={policy?.rules?.length || 0}
        claimsCount={policy?.approved_claims?.length || 0}
      />

      {activeTab === "rules" ? (
        layoutMode === "split" && policy?.source_document?.extracted_text ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <PolicyRulesTable
              rules={filteredRules}
              selectedRuleCode={drawerRule?.rule_code || null}
              onSelectRule={handleSelectRule}
              onResetFilters={() => updateUrl({ q: null, category: null, severity: null })}
              isFiltered={Boolean(searchQuery || selectedCategory !== "ALL" || selectedSeverity !== "ALL")}
            />
            <SourceDocumentReader
              extractedText={policy.source_document.extracted_text}
              rules={policy.rules}
              selectedRuleCode={drawerRule?.rule_code || null}
              onSelectRule={handleSelectRule}
            />
          </div>
        ) : (
          <PolicyRulesTable
            rules={filteredRules}
            selectedRuleCode={drawerRule?.rule_code || null}
            onSelectRule={handleSelectRule}
            onResetFilters={() => updateUrl({ q: null, category: null, severity: null })}
            isFiltered={Boolean(searchQuery || selectedCategory !== "ALL" || selectedSeverity !== "ALL")}
          />
        )
      ) : (
        <ApprovedClaimsTab claims={policy?.approved_claims || []} />
      )}

      <RuleDetailSheet
        rule={drawerRule}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />

      <GuidelineIngesterModal
        isOpen={isIngesterOpen}
        onClose={() => setIsIngesterOpen(false)}
        onSuccess={() => setRefreshTrigger((t) => t + 1)}
      />
        </>
      )}
    </div>
  );
}

export default function PolicyPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        }
      >
        <PolicyContent />
      </Suspense>
    </div>
  );
}
