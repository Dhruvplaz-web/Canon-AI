/**
 * Unified Formatting Utilities (TSK-UI-PRO Item 22)
 * Consistent date, time, number, and typographic formatting across the Canon platform.
 */

/**
 * Formats a date string or timestamp into a consistent, locale-aware string.
 */
export function formatDate(
  input: string | number | Date | null | undefined,
  includeTime = true
): string {
  if (!input) return "—";
  try {
    const date = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
    if (isNaN(date.getTime())) return "—";

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }
        : {}),
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    return String(input);
  }
}

/**
 * Formats a numeric value with tabular digits and optional unit formatting.
 */
export function formatNumber(
  value: number | null | undefined,
  maximumFractionDigits = 0
): string {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats a percentage value accurately, preventing the 8920% bug (Item C13 / NEW-01).
 * Detects whether the input is already a percentage (e.g., 89.2) or a ratio (0.892).
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  // If the value is between 0 and 1 (inclusive), scale by 100.
  // If the value is already > 1 (e.g. 89.2), use directly.
  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(decimals).replace(/\.0$/, "")}%`;
}

/**
 * Replaces straight quotes and apostrophes with proper typographic marks.
 */
export function toTypographicText(text: string): string {
  if (!text) return "";
  return text
    // Replace straight double quotes with curly quotes
    .replace(/(^|[\s([{<])"/g, "$1\u201C")
    .replace(/"/g, "\u201D")
    // Replace straight single quotes/apostrophes with curly marks
    .replace(/(^|[\s([{<])'/g, "$1\u2018")
    .replace(/'/g, "\u2019");
}
