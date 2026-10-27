"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function subscribe() {
  return () => {};
}

function useIsMounted() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div
        className="w-8 h-8 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-default)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] cursor-pointer"
      title={`Switch to ${isDark ? "light" : "dark"} mode (current: ${theme || "system"})`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 stroke-[2]" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 stroke-[2]" aria-hidden="true" />
      )}
    </button>
  );
}
