/**
 * lib/shipping.ts testleri
 *
 * Haversine mesafe hesaplama, ETA hesaplama, kargo maliyeti ve
 * yardımcı fonksiyonlar kapsamlı olarak test edilir.
 */

import {
  haversineDistance,
  calculateEta,
  getEtaLabel,
  getShippingCost,
  getShippingOptions,
  getTrackingUrl,
  type EtaParams,
} from "@/lib/shipping";

// ─────────────────────────────────────────────────────────────────────────────
// haversineDistance
// ─────────────────────────────────────────────────────────────────────────────

describe("haversineDistance", () => {
  it("returns 0 for identical coordinates", () => {
    const dist = haversineDistance(41.0082, 28.9784, 41.0082, 28.9784);
    expect(dist).toBe(0);
  });

  it("calculates realistic distance between Istanbul and Ankara", () => {
    // İstanbul: 41.0082, 28.9784 / Ankara: 39.9334, 32.8597
    const dist = haversineDistance(41.0082, 28.9784, 39.9334, 32.8597);
    // Gerçek kuş uçuşu ~349 km
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(400);
  });

  it("is symmetric — A→B equals B→A", () => {
    const d1 = haversineDistance(40.0, 29.0, 39.0, 32.0);
    const d2 = haversineDistance(39.0, 32.0, 40.0, 29.0);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it("returns positive value for distinct coordinates", () => {
    const dist = haversineDistance(0, 0, 1, 1);
    expect(dist).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateEta
// ─────────────────────────────────────────────────────────────────────────────

const baseParams: EtaParams = {
  merchantLat: 41.0082,
  merchantLon: 28.9784,
  customerLat: 40.9833,
  customerLon: 29.0227,
  shippingRate: "REGULAR",
  handlingHours: 24,
};

describe("calculateEta", () => {
  it("returns a result with all required fields", () => {
    const result = calculateEta(baseParams);

    expect(result).toHaveProperty("distanceKm");
    expect(result).toHaveProperty("handlingHours");
    expect(result).toHaveProperty("transitHours");
    expect(result).toHaveProperty("totalHours");
    expect(result).toHaveProperty("estimatedPickupStart");
    expect(result).toHaveProperty("estimatedPickupEnd");
    expect(result).toHaveProperty("estimatedDeliveryStart");
    expect(result).toHaveProperty("estimatedDeliveryEnd");
  });

  it("distanceKm is positive", () => {
    const result = calculateEta(baseParams);
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  it("totalHours = handlingHours + transitHours (approximately)", () => {
    const result = calculateEta(baseParams);
    // transitHours zaten Math.ceil uygulanmış, totalHours da ceil
    expect(result.totalHours).toBeGreaterThanOrEqual(
      result.handlingHours + result.transitHours - 1,
    );
  });

  it("EXPRESS is faster than REGULAR for same route", () => {
    const expressResult = calculateEta({
      ...baseParams,
      shippingRate: "EXPRESS",
    });
    const regularResult = calculateEta({
      ...baseParams,
      shippingRate: "REGULAR",
    });
    expect(expressResult.transitHours).toBeLessThanOrEqual(
      regularResult.transitHours,
    );
  });

  it("pickup window is 2 hours wide", () => {
    const result = calculateEta(baseParams);
    const diffMs =
      result.estimatedPickupEnd.getTime() -
      result.estimatedPickupStart.getTime();
    expect(diffMs).toBe(2 * 3_600_000);
  });

  it("delivery window is 2 hours wide", () => {
    const result = calculateEta(baseParams);
    const diffMs =
      result.estimatedDeliveryEnd.getTime() -
      result.estimatedDeliveryStart.getTime();
    expect(diffMs).toBe(2 * 3_600_000);
  });

  it("delivery starts after pickup ends", () => {
    const result = calculateEta(baseParams);
    expect(result.estimatedDeliveryStart.getTime()).toBeGreaterThan(
      result.estimatedPickupEnd.getTime(),
    );
  });

  it("defaults handlingHours to 24 when not specified", () => {
    const params = { ...baseParams };
    delete (params as Partial<EtaParams>).handlingHours;

    const result = calculateEta(params);
    expect(result.handlingHours).toBe(24);
  });

  it("rounds distanceKm to 1 decimal", () => {
    const result = calculateEta(baseParams);
    const decimals = (result.distanceKm.toString().split(".")[1] ?? "").length;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEtaLabel
// ─────────────────────────────────────────────────────────────────────────────

describe("getEtaLabel", () => {
  it("returns same-day/next-day label for EXPRESS <= 24h", () => {
    const label = getEtaLabel("EXPRESS", 20);
    expect(label).toContain("Same day");
  });

  it("returns 1-2 day label for EXPRESS > 24h", () => {
    const label = getEtaLabel("EXPRESS", 30);
    expect(label).toContain("1");
    expect(label).toContain("2");
  });

  it("returns 2-3 day label for REGULAR <= 3 days", () => {
    const label = getEtaLabel("REGULAR", 60); // 2.5 days
    expect(label).toContain("2");
    expect(label).toContain("3");
  });

  it("returns 3-5 day label for REGULAR > 3 days", () => {
    const label = getEtaLabel("REGULAR", 100); // ~4.2 days
    expect(label).toContain("3");
    expect(label).toContain("5");
  });

  it("returns a non-empty string for all inputs", () => {
    const rates = ["EXPRESS", "REGULAR"] as const;
    const hours = [6, 24, 48, 72, 120];

    for (const rate of rates) {
      for (const h of hours) {
        expect(getEtaLabel(rate, h).length).toBeGreaterThan(0);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getShippingCost
// ─────────────────────────────────────────────────────────────────────────────

describe("getShippingCost", () => {
  it("returns a positive cost for EXPRESS", () => {
    expect(getShippingCost("EXPRESS")).toBeGreaterThan(0);
  });

  it("returns a positive cost for REGULAR", () => {
    expect(getShippingCost("REGULAR")).toBeGreaterThan(0);
  });

  it("EXPRESS costs more than REGULAR", () => {
    expect(getShippingCost("EXPRESS")).toBeGreaterThan(
      getShippingCost("REGULAR"),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getShippingOptions
// ─────────────────────────────────────────────────────────────────────────────

describe("getShippingOptions", () => {
  it("returns exactly 2 options", () => {
    const options = getShippingOptions();
    expect(options).toHaveLength(2);
  });

  it("returns EXPRESS and REGULAR options", () => {
    const options = getShippingOptions();
    const rates = options.map((o) => o.rate);
    expect(rates).toContain("EXPRESS");
    expect(rates).toContain("REGULAR");
  });

  it("includes etaLabel when etaParams are provided", () => {
    const etaParams = {
      merchantLat: 41.0082,
      merchantLon: 28.9784,
      customerLat: 40.9833,
      customerLon: 29.0227,
      handlingHours: 24,
    };
    const options = getShippingOptions(etaParams);
    options.forEach((o) => {
      expect(o.etaLabel).toBeDefined();
      expect(o.etaLabel!.length).toBeGreaterThan(0);
    });
  });

  it("does not include etaLabel when no params given", () => {
    const options = getShippingOptions();
    options.forEach((o) => {
      expect(o.etaLabel).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTrackingUrl
// ─────────────────────────────────────────────────────────────────────────────

describe("getTrackingUrl", () => {
  it("builds URL with provided base", () => {
    const url = getTrackingUrl("TRK-12345", "https://mystore.com");
    expect(url).toBe("https://mystore.com/track/TRK-12345");
  });

  it("uses window.location.origin when no base provided", () => {
    // jsdom'da window.location.origin = "http://localhost"
    const url = getTrackingUrl("TRK-99999");
    expect(url).toContain("/track/TRK-99999");
  });
});
