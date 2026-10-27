"use client";

import React from "react";
import { Search, X, SlidersHorizontal, LayoutGrid, Columns2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PolicyFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedSeverity: string;
  onSeverityChange: (sev: string) => void;
  categories: string[];
  layoutMode: "split" | "grid";
  onLayoutModeChange: (mode: "split" | "grid") => void;
  activeTab: "rules" | "claims";
  onTabChange: (tab: "rules" | "claims") => void;
  rulesCount: number;
  claimsCount: number;
}

export function PolicyFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSeverity,
  onSeverityChange,
  categories,
  layoutMode,
  onLayoutModeChange,
  activeTab,
  onTabChange,
  rulesCount,
  claimsCount,
}: PolicyFiltersProps) {
  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCategory !== "ALL" ||
    selectedSeverity !== "ALL";

  const handleResetFilters = () => {
    onSearchChange("");
    onCategoryChange("ALL");
    onSeverityChange("ALL");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Tab Bar: Compiled Rules vs Approved Claims */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 gap-4 flex-wrap">
        <div className="flex items-center gap-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rules"}
            onClick={() => onTabChange("rules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === "rules"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            <span>Compiled Rules</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "rules"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              {rulesCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "claims"}
            onClick={() => onTabChange("claims")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === "claims"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            <span>Approved Claims Ledger</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "claims"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              {claimsCount}
            </span>
          </button>
        </div>

        {/* Layout View Switcher (Only on Rules tab) */}
        {activeTab === "rules" && (
          <div className="flex items-center gap-1 bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={() => onLayoutModeChange("split")}
              className={`p-1.5 rounded text-xs transition flex items-center gap-1 ${
                layoutMode === "split"
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs font-medium"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
              title="Split View: Rule List + Source Document Reader"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Split View</span>
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange("grid")}
              className={`p-1.5 rounded text-xs transition flex items-center gap-1 ${
                layoutMode === "grid"
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs font-medium"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
              title="Full Width Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Grid View</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Controls Row */}
      {activeTab === "rules" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              <Search className="w-4 h-4" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by code, term, rule title, or exact quote..."
              className="pl-9 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Severity Dropdown */}
            <select
              value={selectedSeverity}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              aria-label="Filter by severity"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="MAJOR">Major / Warning</option>
              <option value="MINOR">Minor / Notice</option>
            </select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] h-9 px-2"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
