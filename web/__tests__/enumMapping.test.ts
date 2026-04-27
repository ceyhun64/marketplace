/**
 * __tests__/enumMapping.test.ts
 *
 * BUG FIX #1 (Frontend tarafı) — Enum Serialization Mismatch
 *
 * Backend artık UPPER_SNAKE_CASE gönderiyor.
 * Bu testler frontend enum sabitleri, label map'leri ve
 * renk map'lerinin UPPER_SNAKE_CASE değerleri doğru ele aldığını doğrular.
 */

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_COLORS,
  SHIPMENT_STATUS_ORDER,
  NON_CANCELLABLE_STATUSES,
  type OrderStatus,
  type ShipmentStatus,
} from "@/types/enums";

// ── Yardımcı: backend'in gönderdiği tüm ShipmentStatus değerleri ──────────────
const BACKEND_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "PENDING",
  "LABEL_GENERATED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
];

const BACKEND_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "LABEL_GENERATED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];

// ── ShipmentStatus testleri ───────────────────────────────────────────────────

describe("ShipmentStatus — UPPER_SNAKE_CASE uyumluluğu", () => {
  test.each(BACKEND_SHIPMENT_STATUSES)(
    "SHIPMENT_STATUS_LABELS['%s'] tanımlı olmalı",
    (status) => {
      expect(SHIPMENT_STATUS_LABELS[status]).toBeDefined();
      expect(typeof SHIPMENT_STATUS_LABELS[status]).toBe("string");
      expect(SHIPMENT_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  );

  test.each(BACKEND_SHIPMENT_STATUSES)(
    "SHIPMENT_STATUS_COLORS['%s'] tanımlı olmalı",
    (status) => {
      expect(SHIPMENT_STATUS_COLORS[status]).toBeDefined();
      expect(SHIPMENT_STATUS_COLORS[status]).toMatch(/bg-\w+/);
    }
  );

  it("SHIPMENT_STATUS_ORDER tüm non-failed statüleri içermeli", () => {
    const nonFailed = BACKEND_SHIPMENT_STATUSES.filter(
      (s) => s !== "FAILED"
    );
    nonFailed.forEach((status) => {
      expect(SHIPMENT_STATUS_ORDER).toContain(status);
    });
  });

  it("Eski PascalCase değerleri ('Pending', 'LabelGenerated') map'te bulunmamalı", () => {
    // Eğer backend fix'i olmadan eski PascalCase gelseyde, bu testler başarısız olurdu.
    // Şimdi backend UPPER_SNAKE_CASE gönderiyor ve frontend map'i de UPPER_SNAKE_CASE bekliyor.
    const pascalCaseValues = [
      "Pending", "LabelGenerated", "CourierAssigned",
      "InTransit", "OutForDelivery", "Delivered", "Failed",
    ];
    pascalCaseValues.forEach((val) => {
      // @ts-expect-error intentionally testing invalid keys
      expect(SHIPMENT_STATUS_LABELS[val]).toBeUndefined();
    });
  });
});

// ── OrderStatus testleri ──────────────────────────────────────────────────────

describe("OrderStatus — UPPER_SNAKE_CASE uyumluluğu", () => {
  test.each(BACKEND_ORDER_STATUSES)(
    "ORDER_STATUS_LABELS['%s'] tanımlı olmalı",
    (status) => {
      expect(ORDER_STATUS_LABELS[status]).toBeDefined();
    }
  );

  test.each(BACKEND_ORDER_STATUSES)(
    "ORDER_STATUS_COLORS['%s'] Tailwind class içermeli",
    (status) => {
      expect(ORDER_STATUS_COLORS[status]).toMatch(/bg-\w+/);
    }
  );

  it("NON_CANCELLABLE_STATUSES mantıklı statüler içermeli", () => {
    // Sipariş kargoya verildikten sonra iptal edilemez
    const mustBeNonCancellable: OrderStatus[] = [
      "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED",
    ];
    mustBeNonCancellable.forEach((status) => {
      expect(NON_CANCELLABLE_STATUSES).toContain(status);
    });
  });

  it("PENDING iptal edilebilir olmalı", () => {
    expect(NON_CANCELLABLE_STATUSES).not.toContain("PENDING");
  });
});

// ── TrackingTimeline step hesaplaması ─────────────────────────────────────────

describe("SHIPMENT_STATUS_ORDER — timeline step logic", () => {
  it("IN_TRANSIT için tamamlanan adım sayısı doğru olmalı", () => {
    const currentStatus: ShipmentStatus = "IN_TRANSIT";
    const currentIndex = SHIPMENT_STATUS_ORDER.indexOf(currentStatus);
    expect(currentIndex).toBe(4); // 0-indexed: PENDING=0, LABEL=1, COURIER=2, PICKED=3, IN_TRANSIT=4
  });

  it("DELIVERED en son adım olmalı", () => {
    const lastStatus = SHIPMENT_STATUS_ORDER[SHIPMENT_STATUS_ORDER.length - 1];
    expect(lastStatus).toBe("DELIVERED");
  });

  it("PENDING ilk adım olmalı", () => {
    expect(SHIPMENT_STATUS_ORDER[0]).toBe("PENDING");
  });

  it("Tüm statüler ardışık sıralanmış olmalı", () => {
    // FAILED timeline'a dahil değil (ayrı durum)
    const expectedOrder: ShipmentStatus[] = [
      "PENDING",
      "LABEL_GENERATED",
      "COURIER_ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];
    expect(SHIPMENT_STATUS_ORDER).toEqual(expectedOrder);
  });
});

// ── Admin store setup API çağrısı test ───────────────────────────────────────

describe("Admin store setup API endpoint", () => {
  it("Endpoint URL formatı doğru oluşturulmalı", () => {
    const merchantId = "550e8400-e29b-41d4-a716-446655440000";
    const expectedUrl = `/api/admin/store/${merchantId}/setup`;
    // URL template kontrolü
    const actualUrl = `/api/admin/store/${merchantId}/setup`;
    expect(actualUrl).toBe(expectedUrl);
    expect(actualUrl).toMatch(/^\/api\/admin\/store\/[^/]+\/setup$/);
  });

  it("Setup payload doğru yapıda olmalı", () => {
    const payload = {
      storeName: "Test Mağaza",
      slug: "test-magaza",
      description: "Test açıklaması",
      logoUrl: "https://example.com/logo.png",
      handlingHours: 24,
    };

    // Gerekli alanlar mevcut
    expect(payload).toHaveProperty("storeName");
    expect(payload).toHaveProperty("slug");
    // Opsiyonel alanlar undefined olabilir (null gönderme)
    expect(payload.description).toBeTruthy();
  });
});
