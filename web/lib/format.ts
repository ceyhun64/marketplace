// ─────────────────────────────────────────────────────────────────────────────
// lib/format.ts — Para birimi, tarih ve sayı formatlama yardımcıları
// ─────────────────────────────────────────────────────────────────────────────

// ── Para Birimi ───────────────────────────────────────────────────────────────

/**
 * Sayıyı Türk Lirası formatında döndürür.
 * @example formatCurrency(1234.5) → "₺1.234,50"
 */
export function formatCurrency(
  amount: number,
  currency = "TRY",
  locale = "tr-TR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Kısa para formatı — ondalık yoksa göstermez.
 * @example formatPrice(1234) → "₺1.234"
 */
export function formatPrice(amount: number): string {
  if (amount % 1 === 0) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatCurrency(amount);
}

// ── Tarih & Saat ──────────────────────────────────────────────────────────────

/**
 * ISO tarih stringini okunabilir Türkçe tarihe çevirir.
 * @example formatDate("2026-04-22T10:30:00Z") → "22 Nisan 2026"
 */
export function formatDate(dateStr: string | Date, locale = "tr-TR"): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Tarih + hours formatı.
 * @example formatDateTime("2026-04-22T10:30:00Z") → "22 Nisan 2026, 13:30"
 */
export function formatDateTime(
  dateStr: string | Date,
  locale = "tr-TR",
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
 * Kısa tarih formatı.
 * @example formatShortDate("2026-04-22") → "22.04.2026"
 */
export function formatShortDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Göreceli zaman (kaç dakika/hours/gün önce).
 * @example formatRelativeTime("2026-04-21T10:00:00Z") → "1 gün önce"
 */
export function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });

  if (diffSec < 60) return rtf.format(-diffSec, "second");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  if (diffDay < 30) return rtf.format(-diffDay, "day");

  return formatDate(date);
}

/**
 * ETA tarih aralığını formatlı string'e çevirir.
 * @example formatEtaWindow("2026-04-23T09:00:00Z", "2026-04-23T18:00:00Z")
 *   → "23 Nisan, 09:00 – 18:00"
 */
export function formatEtaWindow(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const dateStr = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(startDate);

  const startTime = startDate.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = endDate.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateStr}, ${startTime} – ${endTime}`;
}

// ── Sayı ──────────────────────────────────────────────────────────────────────

/**
 * Büyük sayıları kısaltır.
 * @example formatCompactNumber(1500) → "1,5B"
 */
export function formatCompactNumber(n: number, locale = "tr-TR"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Yüzde formatı.
 * @example formatPercent(0.1567) → "%15,67"
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ── Metin ─────────────────────────────────────────────────────────────────────

/**
 * Uzun metni belirtilen karakter sayısında keser.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * İlk harfi büyütür.
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Slug'ı okunabilir başlığa çevirir.
 * @example slugToTitle("erkek-giyim") → "Erkek Giyim"
 */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Metni slug'a çevirir (Türkçe karakter desteğiyle).
 */
export function toSlug(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  return text
    .split("")
    .map((c) => trMap[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Dosya boyutu ──────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Phone ───────────────────────────────────────────────────────────────────

/**
 * Türk telefon numarasını formatlar.
 * @example formatPhone("05321234567") → "0532 123 45 67"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

// ── Kargo takip numarası ──────────────────────────────────────────────────────

/**
 * Takip numarasını gruplar halinde gösterir.
 * @example formatTrackingNumber("MKT20260422ABCD") → "MKT-2026-0422-ABCD"
 */
export function formatTrackingNumber(trackingNo: string): string {
  // Zaten formatlanmışsa olduğu gibi döndür
  if (trackingNo.includes("-")) return trackingNo;
  // 4'lü gruplar halinde böl
  return trackingNo.match(/.{1,4}/g)?.join("-") ?? trackingNo;
}
