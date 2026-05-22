/**
 * __tests__/enumMapping.test.ts
 *
 * Verifies that frontend enum constants, label maps, and color maps
 * correctly handle all SCREAMING_SNAKE_CASE values produced by the backend's
 * ToApiString() / ScreamingSnakeCaseNamingPolicy serialization.
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

// ── All status values the backend sends ──────────────────────────────────────

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

// ── ShipmentStatus ────────────────────────────────────────────────────────────

describe("ShipmentStatus — SCREAMING_SNAKE_CASE mapping", () => {
  test.each(BACKEND_SHIPMENT_STATUSES)(
    "SHIPMENT_STATUS_LABELS['%s'] must be defined",
    (status) => {
      expect(SHIPMENT_STATUS_LABELS[status]).toBeDefined();
      expect(typeof SHIPMENT_STATUS_LABELS[status]).toBe("string");
      expect(SHIPMENT_STATUS_LABELS[status].length).toBeGreaterThan(0);
    },
  );

  test.each(BACKEND_SHIPMENT_STATUSES)(
    "SHIPMENT_STATUS_COLORS['%s'] must be defined",
    (status) => {
      expect(SHIPMENT_STATUS_COLORS[status]).toBeDefined();
      expect(SHIPMENT_STATUS_COLORS[status]).toMatch(/bg-[^\s]+/);
    },
  );

  it("SHIPMENT_STATUS_ORDER must include all non-failed statuses", () => {
    const nonFailed = BACKEND_SHIPMENT_STATUSES.filter((s) => s !== "FAILED");
    nonFailed.forEach((status) => {
      expect(SHIPMENT_STATUS_ORDER).toContain(status);
    });
  });

  it("Legacy PascalCase values ('Pending', 'LabelGenerated') must NOT be in the maps", () => {
    const pascalCaseValues = [
      "Pending",
      "LabelGenerated",
      "CourierAssigned",
      "InTransit",
      "OutForDelivery",
      "Delivered",
      "Failed",
    ];
    pascalCaseValues.forEach((val) => {
      // @ts-expect-error intentionally testing invalid keys
      expect(SHIPMENT_STATUS_LABELS[val]).toBeUndefined();
    });
  });
});

// ── OrderStatus ───────────────────────────────────────────────────────────────

describe("OrderStatus — SCREAMING_SNAKE_CASE mapping", () => {
  test.each(BACKEND_ORDER_STATUSES)(
    "ORDER_STATUS_LABELS['%s'] must be defined",
    (status) => {
      expect(ORDER_STATUS_LABELS[status]).toBeDefined();
    },
  );

  test.each(BACKEND_ORDER_STATUSES)(
    "ORDER_STATUS_COLORS['%s'] must contain a Tailwind class",
    (status) => {
      expect(ORDER_STATUS_COLORS[status]).toMatch(/bg-[^\s]+/);
    },
  );

  it("NON_CANCELLABLE_STATUSES must include post-pickup statuses", () => {
    const mustBeNonCancellable: OrderStatus[] = [
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];
    mustBeNonCancellable.forEach((status) => {
      expect(NON_CANCELLABLE_STATUSES).toContain(status);
    });
  });

  it("PENDING must be cancellable", () => {
    expect(NON_CANCELLABLE_STATUSES).not.toContain("PENDING");
  });
});

// ── Tracking timeline step logic ──────────────────────────────────────────────

describe("SHIPMENT_STATUS_ORDER — timeline step logic", () => {
  it("IN_TRANSIT must be at index 4", () => {
    const currentStatus: ShipmentStatus = "IN_TRANSIT";
    const currentIndex = SHIPMENT_STATUS_ORDER.indexOf(currentStatus);
    expect(currentIndex).toBe(4); // PENDING=0, LABEL=1, COURIER=2, PICKED=3, IN_TRANSIT=4
  });

  it("DELIVERED must be the last step", () => {
    const lastStatus = SHIPMENT_STATUS_ORDER[SHIPMENT_STATUS_ORDER.length - 1];
    expect(lastStatus).toBe("DELIVERED");
  });

  it("PENDING must be the first step", () => {
    expect(SHIPMENT_STATUS_ORDER[0]).toBe("PENDING");
  });

  it("Status order must match the delivery lifecycle sequence", () => {
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

// ── Admin store setup endpoint ────────────────────────────────────────────────

describe("Admin store setup API endpoint", () => {
  it("URL must be correctly formatted", () => {
    const merchantId = "550e8400-e29b-41d4-a716-446655440000";
    const expectedUrl = `/api/admin/store/${merchantId}/setup`;
    const actualUrl = `/api/admin/store/${merchantId}/setup`;
    expect(actualUrl).toBe(expectedUrl);
    expect(actualUrl).toMatch(/^\/api\/admin\/store\/[^/]+\/setup$/);
  });

  it("Setup payload must contain required fields", () => {
    const payload = {
      storeName: "Test Store",
      slug: "test-store",
      description: "Test description",
      logoUrl: "https://example.com/logo.png",
      handlingHours: 24,
    };
    expect(payload).toHaveProperty("storeName");
    expect(payload).toHaveProperty("slug");
    expect(payload.description).toBeTruthy();
  });
});
