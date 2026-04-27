/**
 * lib/utils.ts testleri
 *
 * cn() fonksiyonunun clsx + tailwind-merge davranışını doğrular.
 */

import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("handles boolean conditions (clsx syntax)", () => {
    const active = true;
    const disabled = false;
    const result = cn("base", active && "active", disabled && "disabled");
    expect(result).toBe("base active");
  });

  it("deduplicates conflicting Tailwind classes — last wins", () => {
    // tailwind-merge: bg-red-500 ve bg-blue-500 çakışır → son olan kalır
    const result = cn("bg-red-500", "bg-blue-500");
    expect(result).toBe("bg-blue-500");
    expect(result).not.toContain("bg-red-500");
  });

  it("keeps non-conflicting Tailwind classes", () => {
    const result = cn("p-4", "m-4", "text-sm");
    expect(result).toContain("p-4");
    expect(result).toContain("m-4");
    expect(result).toContain("text-sm");
  });

  it("handles object syntax (clsx)", () => {
    const result = cn({ "text-red-500": true, "text-blue-500": false });
    expect(result).toBe("text-red-500");
  });

  it("returns empty string when no valid classes provided", () => {
    expect(cn(undefined, false, null)).toBe("");
  });

  it("handles array syntax", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
    expect(result).toContain("baz");
  });

  it("merges responsive modifiers correctly", () => {
    // Farklı prefix'ler çakışmamalı
    const result = cn("p-2", "md:p-4");
    expect(result).toContain("p-2");
    expect(result).toContain("md:p-4");
  });

  it("deduplicates text size conflicts", () => {
    const result = cn("text-sm", "text-lg");
    expect(result).toBe("text-lg");
  });
});
