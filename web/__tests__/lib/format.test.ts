import {
  formatCurrency,
  formatPrice,
  formatDate,
  formatDateTime,
  formatShortDate,
  formatRelativeTime,
  formatEtaWindow,
  formatCompactNumber,
  formatPercent,
  truncate,
  capitalize,
  slugToTitle,
  toSlug,
  formatFileSize,
  formatPhone,
  formatTrackingNumber,
} from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats integer USD amount correctly", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("1,000");
    expect(result).toContain("$");
  });

  it("formats decimal USD amount with 2 decimal places", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1,234");
    expect(result).toContain("50");
  });

  it("formats zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("supports EUR currency", () => {
    const result = formatCurrency(100, "EUR", "en-GB");
    expect(result).toContain("100");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatPrice
// ─────────────────────────────────────────────────────────────────────────────

describe("formatPrice", () => {
  it("omits decimals for whole number amounts", () => {
    const result = formatPrice(1234);
    expect(result).toContain("1,234");
    expect(result).toContain("$");
  });

  it("includes decimals for non-whole amounts", () => {
    const result = formatPrice(99.9);
    expect(result).toContain("99");
    expect(result).toContain("$");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDate
// ─────────────────────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats ISO date string to English long date", () => {
    const result = formatDate("2026-04-22T10:00:00Z");
    expect(result).toContain("2026");
    expect(result).toMatch(/April/);
  });

  it("accepts Date object", () => {
    const result = formatDate(new Date("2026-01-15T00:00:00Z"));
    expect(result).toContain("2026");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatShortDate
// ─────────────────────────────────────────────────────────────────────────────

describe("formatShortDate", () => {
  it("formats to dd/MM/yyyy pattern", () => {
    const result = formatShortDate("2026-04-22T00:00:00Z");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatRelativeTime
// ─────────────────────────────────────────────────────────────────────────────

describe("formatRelativeTime", () => {
  it("returns a relative string for recent timestamps", () => {
    const justNow = new Date(Date.now() - 10_000); // 10 seconds ago
    const result = formatRelativeTime(justNow);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  // SONRA (doğru):
  it("returns days for old timestamps", () => {
    const yesterday = new Date(Date.now() - 25 * 3_600_000);
    const result = formatRelativeTime(yesterday);
    expect(result).toMatch(/day|yesterday/i);
  });

  it("returns formatted date for dates older than 30 days", () => {
    const oldDate = new Date(Date.now() - 40 * 24 * 3_600_000);
    const result = formatRelativeTime(oldDate);
    // Uzak tarihler için formatDate() kullanılıyor — yıl içermiş olmalı
    expect(result).toMatch(/\d{4}/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatEtaWindow
// ─────────────────────────────────────────────────────────────────────────────

describe("formatEtaWindow", () => {
  it("returns a string with time separator", () => {
    const result = formatEtaWindow(
      "2026-04-23T09:00:00Z",
      "2026-04-23T18:00:00Z",
    );
    expect(result).toContain("–");
    expect(typeof result).toBe("string");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatCompactNumber
// ─────────────────────────────────────────────────────────────────────────────

describe("formatCompactNumber", () => {
  it("compacts thousands", () => {
    const result = formatCompactNumber(1500);
    // tr-TR locale → "1,5B"
    expect(result.length).toBeLessThan(6);
  });

  it("compacts millions", () => {
    const result = formatCompactNumber(2_000_000);
    expect(result).toMatch(/\d/); // Sayı içermeli
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatPercent
// ─────────────────────────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it("formats 0.15 as ~15%", () => {
    const result = formatPercent(0.15);
    expect(result).toContain("15");
    expect(result).toContain("%");
  });

  it("uses specified decimal places", () => {
    const result = formatPercent(0.1567, 2);
    expect(result).toContain("15");
    expect(result).toContain("67");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// truncate
// ─────────────────────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("returns original string when within limit", () => {
    expect(truncate("Kısa metin", 20)).toBe("Kısa metin");
  });

  it("truncates long string and adds ellipsis", () => {
    const result = truncate("Bu çok uzun bir metin", 10);
    expect(result).toHaveLength(10);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns exact limit without truncation", () => {
    const text = "Tam uzunluk";
    expect(truncate(text, text.length)).toBe(text);
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// capitalize
// ─────────────────────────────────────────────────────────────────────────────

describe("capitalize", () => {
  it("capitalizes first letter and lowercases rest", () => {
    expect(capitalize("merhaba DÜNYA")).toBe("Merhaba dünya");
  });

  it("returns empty string for empty input", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// slugToTitle
// ─────────────────────────────────────────────────────────────────────────────

describe("slugToTitle", () => {
  it("converts hyphenated slug to title case", () => {
    expect(slugToTitle("erkek-giyim")).toBe("Erkek Giyim");
  });

  it("handles single word slug", () => {
    expect(slugToTitle("elektronik")).toBe("Elektronik");
  });

  it("handles multi-word slug", () => {
    expect(slugToTitle("spor-ayakkabi-erkek")).toBe("Spor Ayakkabi Erkek");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// toSlug
// ─────────────────────────────────────────────────────────────────────────────

describe("toSlug", () => {
  it("converts Turkish characters", () => {
    expect(toSlug("Çanta")).toContain("canta");
    expect(toSlug("Şeker")).toContain("seker");
    expect(toSlug("Ğıldız")).toContain("gildiz");
  });

  it("converts spaces to hyphens", () => {
    expect(toSlug("Test Ürünü")).toBe("test-urunu");
  });

  // SONRA (doğru):
  it("removes special characters", () => {
    expect(toSlug("test@product!")).toBe("test-product");
  });

  it("lowercases all characters", () => {
    expect(toSlug("HELLO WORLD")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(toSlug(" test ")).toBe("test");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatFileSize
// ─────────────────────────────────────────────────────────────────────────────

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toContain("KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toContain("MB");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatPhone
// ─────────────────────────────────────────────────────────────────────────────

describe("formatPhone", () => {
  it("formats standard Turkish mobile number", () => {
    const result = formatPhone("05321234567");
    expect(result).toBe("0532 123 45 67");
  });

  it("returns original for non-standard numbers", () => {
    const result = formatPhone("+1234567890");
    expect(result).toBe("+1234567890"); // bilinmeyen format — olduğu gibi
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatTrackingNumber
// ─────────────────────────────────────────────────────────────────────────────

describe("formatTrackingNumber", () => {
  it("groups tracking number with dashes", () => {
    const result = formatTrackingNumber("MKT20260422ABCD");
    expect(result).toContain("-");
  });

  it("returns already-formatted tracking number unchanged", () => {
    const formatted = "MKT-2026-0422-ABCD";
    expect(formatTrackingNumber(formatted)).toBe(formatted);
  });
});
