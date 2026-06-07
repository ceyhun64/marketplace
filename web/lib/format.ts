// ─────────────────────────────────────────────────────────────────────────────
// lib/format.ts — Currency, date, and number formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

// ── Currency ──────────────────────────────────────────────────────────────────

/**
 * Formats a number as US Dollars.
 * @example formatCurrency(1234.5) → "$1,234.50"
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Short price format — omits decimals when the amount is a whole number.
 * @example formatPrice(1234) → "$1,234"
 */
export function formatPrice(amount: number): string {
  if (amount % 1 === 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatCurrency(amount);
}

// ── Date & Time ───────────────────────────────────────────────────────────────

/**
 * Converts an ISO date string to a readable long-form date.
 * @example formatDate("2026-04-22T10:30:00Z") → "22 April 2026"
 */
export function formatDate(dateStr: string | Date, locale = "en-GB"): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Date + time format.
 * @example formatDateTime("2026-04-22T10:30:00Z") → "22 April 2026, 13:30"
 */
export function formatDateTime(
  dateStr: string | Date,
  locale = "en-GB",
): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Short date format.
 * @example formatShortDate("2026-04-22") → "22/04/2026"
 */
export function formatShortDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Compact day + short month — for tight UI like ETA badges and timelines.
 * @example formatMonthDay("2026-06-22") → "22 Jun"
 */
export function formatMonthDay(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/**
 * Compact day + short month + time — for tight UI like event timelines.
 * @example formatShortDateTime("2026-06-22T14:30:00Z") → "22 Jun, 14:30"
 */
export function formatShortDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Relative time (how many minutes/hours/days ago).
 * @example formatRelativeTime("2026-04-21T10:00:00Z") → "1 day ago"
 */
export function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffSec < 60) return rtf.format(-diffSec, "second");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  if (diffDay < 30) return rtf.format(-diffDay, "day");

  return formatDate(date);
}

/**
 * Formats an ETA date range as a human-readable string.
 * @example formatEtaWindow("2026-04-23T09:00:00Z", "2026-04-23T18:00:00Z")
 *   → "23 April, 09:00 – 18:00"
 */
export function formatEtaWindow(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
  }).format(startDate);

  const startTime = startDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = endDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateStr}, ${startTime} – ${endTime}`;
}

// ── Numbers ───────────────────────────────────────────────────────────────────

/**
 * Abbreviates large numbers.
 * @example formatCompactNumber(1500) → "1.5K"
 */
export function formatCompactNumber(n: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Percentage format.
 * @example formatPercent(0.1567) → "15.67%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ── Text ──────────────────────────────────────────────────────────────────────

/**
 * Truncates a long string to the specified character limit.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalises the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts a slug to a readable title.
 * @example slugToTitle("mens-clothing") → "Mens Clothing"
 */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Converts text to a URL-safe slug.
 */
export function toSlug(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g",
    ı: "i", İ: "i", ö: "o", Ö: "o",
    ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return text
    .split("")
    .map((c) => trMap[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── File size ─────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Phone ─────────────────────────────────────────────────────────────────────

/**
 * Formats a phone number with space-separated groups.
 * @example formatPhone("05321234567") → "0532 123 45 67"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

// ── Tracking number ───────────────────────────────────────────────────────────

/**
 * Displays a tracking number in grouped segments.
 * @example formatTrackingNumber("MKT20260422ABCD") → "MKT-2026-0422-ABCD"
 */
export function formatTrackingNumber(trackingNo: string): string {
  if (trackingNo.includes("-")) return trackingNo;
  return trackingNo.match(/.{1,4}/g)?.join("-") ?? trackingNo;
}
