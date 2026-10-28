"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  CheckSquare,
  Shield,
  Activity,
  Sparkles,
  Eye,
  Home,
  Compass,
  User,
  LogOut,
  CornerDownLeft,
  X,
  Layers,
  FileCode,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: "Navigation" | "Test Fixtures" | "Personas" | "Session";
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  action: () => void | Promise<void>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { login, logout } = useAuth();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Command Definitions
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation Targets
      {
        id: "nav-submissions",
        title: "Submissions Draft & Live Compliance",
        description: "Draft marketing copy and run live compliance checks",
        category: "Navigation",
        keywords: ["author", "draft", "submit", "write", "editor", "scan", "check"],
        icon: FileText,
        badge: "/submissions",
        action: () => router.push("/submissions"),
      },
      {
        id: "nav-review",
        title: "Review Queue & Human Sign-Off",
        description: "Adjudicate policy violations and issue signed releases",
        category: "Navigation",
        keywords: ["review", "queue", "approve", "sign-off", "override", "exception", "human"],
        icon: CheckSquare,
        badge: "/review",
        action: () => router.push("/review"),
      },
      {
        id: "nav-policy",
        title: "Brand Policy Explorer",
        description: "Inspect active brand rules, guidelines, and AST parsing matrix",
        category: "Navigation",
        keywords: ["policy", "guidelines", "rules", "claims", "baseline", "brand"],
        icon: Shield,
        badge: "/policy",
        action: () => router.push("/policy"),
      },
      {
        id: "nav-governance",
        title: "Rule Health & Backtest Intelligence",
        description: "Simulate policy proposals and backtest rule health against corpus",
        category: "Navigation",
        keywords: ["governance", "backtest", "health", "proposals", "v1.1", "simulation"],
        icon: Activity,
        badge: "/governance",
        action: () => router.push("/governance"),
      },
      {
        id: "nav-evaluation",
        title: "AI Evaluation & Adversarial Benchmark",
        description: "Benchmark jailbreak resilience and adversarial prompt suites",
        category: "Navigation",
        keywords: ["evaluation", "benchmark", "adversarial", "jailbreak", "metrics", "test"],
        icon: Sparkles,
        badge: "/evaluation",
        action: () => router.push("/evaluation"),
      },
      {
        id: "nav-transparency",
        title: "AI Service Telemetry & Disclosures",
        description: "View model transparency reports and EU AI Act disclosures",
        category: "Navigation",
        keywords: ["transparency", "telemetry", "disclosure", "eu ai act", "audit", "logs"],
        icon: Eye,
        badge: "/transparency",
        action: () => router.push("/transparency"),
      },
      {
        id: "nav-demo",
        title: "Evaluator Demo Tour",
        description: "Step-by-step evaluator walkthrough of Canon's Double-Receipt Invariant",
        category: "Navigation",
        keywords: ["demo", "tour", "guide", "walkthrough", "pitch", "presentation"],
        icon: Compass,
        badge: "/demo",
        action: () => router.push("/demo"),
      },
      {
        id: "nav-home",
        title: "Platform Home Overview",
        description: "Canon platform homepage and enterprise architecture summary",
        category: "Navigation",
        keywords: ["home", "main", "overview", "canon", "index"],
        icon: Home,
        badge: "/",
        action: () => router.push("/"),
      },

      // Test Fixture Loaders
      {
        id: "fixture-sub-01",
        title: "Load Fixture SUB-01: Clean Compliant Copy",
        description: "Enterprise Treasury Digital Platform — 0 violations, 100% policy pass",
        category: "Test Fixtures",
        keywords: ["sub-01", "clean", "compliant", "pass", "treasury", "fixture"],
        icon: FileCode,
        badge: "SUB-01",
        action: () => router.push("/submissions?fixture=SUB-01"),
      },
      {
        id: "fixture-sub-02",
        title: "Load Fixture SUB-02: 4 Violations with Stale Claim",
        description: "Acme Global Wealth 2026 Pitch — triggers 4 blocking policy findings",
        category: "Test Fixtures",
        keywords: ["sub-02", "violations", "stale claim", "reject", "wealth", "fixture"],
        icon: Layers,
        badge: "SUB-02",
        action: () => router.push("/submissions?fixture=SUB-02"),
      },
      {
        id: "fixture-sub-03",
        title: "Load Fixture SUB-03: Adversarial Prompt Injection",
        description: "Secret Internal Instructions Delimited — security block test",
        category: "Test Fixtures",
        keywords: ["sub-03", "adversarial", "prompt injection", "jailbreak", "security", "fixture"],
        icon: ShieldAlert,
        badge: "SUB-03",
        action: () => router.push("/submissions?fixture=SUB-03"),
      },

      // Persona & Session Switching
      {
        id: "persona-creator",
        title: "Switch to Charlie Creator",
        description: "Sign in as Marketing Copywriter authoring drafts (creator@acme.corp)",
        category: "Personas",
        keywords: ["creator", "charlie", "author", "copywriter", "persona", "role"],
        icon: User,
        badge: "CREATOR",
        action: async () => {
          await login("creator@acme.corp", "Creator2026!");
        },
      },
      {
        id: "persona-reviewer",
        title: "Switch to Rachel Reviewer",
        description: "Sign in as Brand Compliance Reviewer (reviewer@acme.corp)",
        category: "Personas",
        keywords: ["reviewer", "rachel", "compliance officer", "approver", "persona", "role"],
        icon: User,
        badge: "REVIEWER",
        action: async () => {
          await login("reviewer@acme.corp", "Reviewer2026!");
        },
      },
      {
        id: "persona-brand-manager",
        title: "Switch to Alice Brand Manager",
        description: "Sign in as Policy Authority & Governance Approver (brand_manager@acme.corp)",
        category: "Personas",
        keywords: ["brand manager", "alice", "policy authority", "admin", "persona", "role"],
        icon: User,
        badge: "BRAND MANAGER",
        action: async () => {
          await login("brand_manager@acme.corp", "BrandManager2026!");
        },
      },
      {
        id: "session-logout",
        title: "Sign Out of Current Session",
        description: "Clear authenticated session cookies and return to guest mode",
        category: "Session",
        keywords: ["logout", "sign out", "exit", "disconnect"],
        icon: LogOut,
        badge: "SESSION",
        action: async () => {
          await logout();
        },
      },
    ],
    [router, login, logout]
  );

  // Search filter
  const filteredCommands = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return commands;

    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(trimmed);
      const matchDesc = cmd.description.toLowerCase().includes(trimmed);
      const matchCat = cmd.category.toLowerCase().includes(trimmed);
      const matchBadge = cmd.badge ? cmd.badge.toLowerCase().includes(trimmed) : false;
      const matchKeywords = cmd.keywords.some((k) => k.toLowerCase().includes(trimmed));

      return matchTitle || matchDesc || matchCat || matchBadge || matchKeywords;
    });
  }, [commands, query]);

  // Execute selected command
  const executeCommand = useCallback(
    async (cmd: CommandItem) => {
      onClose();
      try {
        await cmd.action();
      } catch (err) {
        console.error("Failed to execute command:", err);
      }
    },
    [onClose]
  );

  // Handle keyboard events inside the command palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (filteredCommands.length === 0 && e.key !== "Escape") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [filteredCommands, selectedIndex, executeCommand, onClose]
  );

  // Manage focus restoration and input autofocus
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
        setQuery("");
      }, 20);
      return () => clearTimeout(timer);
    } else {
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  // Global escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalEscape, true);
    return () => window.removeEventListener("keydown", handleGlobalEscape, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeOptionId =
    filteredCommands[selectedIndex] ? `cmd-item-${filteredCommands[selectedIndex].id}` : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-[60] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[var(--color-text-primary)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[var(--color-border-subtle)] px-4 py-3 bg-[var(--color-surface-muted)]">
          <Search className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 mr-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={activeOptionId}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, route, fixture, or persona..."
            className="w-full bg-transparent text-sm font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none"
            id="command-palette-title"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Listbox */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Compass className="w-8 h-8 text-[var(--color-text-muted)] stroke-[1.5]" />
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                No matching commands found for &apos;{query}&apos;.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Try searching for &quot;submissions&quot;, &quot;SUB-02&quot;, &quot;policy&quot;, or &quot;rachel&quot;.
              </p>
            </div>
          ) : (
            <ul
              ref={listRef}
              id="command-list"
              role="listbox"
              aria-label="Available commands"
              className="flex flex-col gap-1"
            >
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                const IconComponent = cmd.icon;

                return (
                  <li
                    key={cmd.id}
                    id={`cmd-item-${cmd.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected
                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-text-primary)] shadow-xs translate-x-0.5"
                        : "bg-transparent border-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border-subtle)]"
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs truncate text-[var(--color-text-primary)]">
                          {cmd.title}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                          {cmd.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cmd.badge && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] font-semibold">
                          {cmd.badge}
                        </span>
                      )}
                      {isSelected && (
                        <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-[var(--color-primary)] font-bold">
                          <span>Select</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Action Footer Keyboard Hints */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-4 py-2.5 flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded px-1 text-[10px]">↑</kbd>
              <kbd className="font-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded px-1 text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded px-1.5 text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded px-1 text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-[var(--color-text-muted)]">
            <span>Canon Governance Quick Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}

