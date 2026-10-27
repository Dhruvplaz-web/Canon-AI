/**
 * Canon Design System Tokens (TSK-UI-PRO)
 * Strict 8pt spatial grid, semantic color architecture, and WCAG AA contrast standards.
 */

export const tokens = {
  colors: {
    light: {
      canvas: "#f8f9fa",
      surface: "#ffffff",
      surfaceElevated: "#ffffff",
      surfaceMuted: "#f3f4f6",
      surfaceSubtle: "#f9fafb",
      borderSubtle: "#e5e7eb",
      borderDefault: "#d1d5db",
      borderStrong: "#9ca3af",
      borderFocus: "#2563eb",
      textPrimary: "#111827",
      textSecondary: "#374151",
      textMuted: "#4b5563",
      textInverse: "#ffffff",
      brandPrimary: "#2563eb",
      brandHover: "#1d4ed8",
      brandSubtle: "#eff6ff",
      brandMuted: "#dbeafe",
      // Status & Severity
      critical: {
        bg: "#fef2f2",
        border: "#fecaca",
        text: "#b91c1c",
        accent: "#dc2626",
      },
      warning: {
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#92400e",
        accent: "#d97706",
      },
      info: {
        bg: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
        accent: "#2563eb",
      },
      success: {
        bg: "#f0fdf4",
        border: "#bbf7d0",
        text: "#15803d",
        accent: "#16a34a",
      },
    },
    dark: {
      canvas: "#09090b",
      surface: "#18181b",
      surfaceElevated: "#27272a",
      surfaceMuted: "#27272a",
      surfaceSubtle: "#1c1917",
      borderSubtle: "#27272a",
      borderDefault: "#3f3f46",
      borderStrong: "#52525b",
      borderFocus: "#3b82f6",
      textPrimary: "#fafafa",
      textSecondary: "#d4d4d8",
      textMuted: "#a1a1aa",
      textInverse: "#09090b",
      brandPrimary: "#3b82f6",
      brandHover: "#60a5fa",
      brandSubtle: "#1e3a8a",
      brandMuted: "#172554",
      // Status & Severity
      critical: {
        bg: "#450a0a",
        border: "#7f1d1d",
        text: "#fca5a5",
        accent: "#ef4444",
      },
      warning: {
        bg: "#451a03",
        border: "#78350f",
        text: "#fde68a",
        accent: "#f59e0b",
      },
      info: {
        bg: "#172554",
        border: "#1e3a8a",
        text: "#93c5fd",
        accent: "#3b82f6",
      },
      success: {
        bg: "#052e16",
        border: "#14532d",
        text: "#86efac",
        accent: "#22c55e",
      },
    },
  },
  spacing: {
    px1: "4px",
    px2: "8px",
    px3: "12px",
    px4: "16px",
    px6: "24px",
    px8: "32px",
    px12: "48px",
    px16: "64px",
  },
  radius: {
    none: "0px",
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    full: "9999px",
  },
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    focus: "0 0 0 2px var(--color-bg-canvas), 0 0 0 4px var(--color-border-focus)",
  },
  typography: {
    fontSans:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontMono:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  motion: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type ThemeMode = "light" | "dark";
export type SeverityLevel = "CRITICAL" | "WARNING" | "INFO" | "PASSED";
