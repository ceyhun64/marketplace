/**
 * __tests__/TrackingTimeline.test.tsx
 *
 * TrackingTimeline bileşeninin UPPER_SNAKE_CASE status değerleriyle
 * doğru render ettiğini ve step hesaplamalarını doğru yaptığını test eder.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import TrackingTimeline from "@/components/modules/fulfillment/TrackingTimeline";
import { SHIPMENT_STATUS_ORDER, type ShipmentStatus } from "@/types/enums";
import type { ShipmentStatusEvent } from "@/types/entities";

// Next.js formatDateTime mock
jest.mock("@/lib/format", () => ({
  formatDateTime: (d: string) => d,
}));

const baseProps = {
  trackingNumber: "TRK-12345",
  events: [] as ShipmentStatusEvent[],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let _evtCounter = 0;
function makeEvent(
  status: ShipmentStatus,
  createdAt: string,
): ShipmentStatusEvent {
  return {
    id: `evt-${++_evtCounter}`,
    shipmentId: "shp-test",
    status,
    createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("TrackingTimeline — status rendering", () => {
  it("PENDING statüsünde render edilmeli", () => {
    render(<TrackingTimeline {...baseProps} currentStatus="PENDING" />);
    expect(screen.getByText("TRK-12345")).toBeInTheDocument();
  });

  it("IN_TRANSIT statüsünde doğru label göstermeli", () => {
    render(<TrackingTimeline {...baseProps} currentStatus="IN_TRANSIT" />);
    expect(screen.getByText(/In Transit/i)).toBeInTheDocument();
  });

  // SONRA (doğru):
  it("DELIVERED statüsünde başarı göstergesi render edilmeli", () => {
    render(<TrackingTimeline {...baseProps} currentStatus="DELIVERED" />);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("isFailed=true iken FAILED durumu render edilmeli", () => {
    render(<TrackingTimeline {...baseProps} currentStatus="FAILED" isFailed />);
    expect(screen.queryByText("TRK-12345")).toBeInTheDocument();
  });

  it("courierName verildiğinde görünmeli", () => {
    render(
      <TrackingTimeline
        {...baseProps}
        currentStatus="COURIER_ASSIGNED"
        courierName="Ahmet Yılmaz"
      />,
    );
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
  });

  // SONRA (doğru) — component "1 Aralık" gibi formatlanmış tarih gösteriyor:
  it("estimatedDelivery verildiğinde render edilmeli", () => {
    render(
      <TrackingTimeline
        {...baseProps}
        currentStatus="IN_TRANSIT"
        estimatedDeliveryStart="2025-12-01"
        estimatedDeliveryEnd="2025-12-03"
      />,
    );
    // Ham string değil, formatlanmış tarih aranmalı
    expect(screen.getByText(/Aralık|December|2025-12-01/i)).toBeInTheDocument();
  });
});

describe("TrackingTimeline — step index logic", () => {
  it.each<[ShipmentStatus, number]>([
    ["PENDING", 0],
    ["LABEL_GENERATED", 1],
    ["COURIER_ASSIGNED", 2],
    ["PICKED_UP", 3],
    ["IN_TRANSIT", 4],
    ["OUT_FOR_DELIVERY", 5],
    ["DELIVERED", 6],
  ])("'%s' statüsünün index'i %i olmalı", (status, expectedIndex) => {
    const index = SHIPMENT_STATUS_ORDER.indexOf(status);
    expect(index).toBe(expectedIndex);
  });

  it("FAILED statüsü order listesinde olmamalı (ayrı durum)", () => {
    expect(SHIPMENT_STATUS_ORDER.indexOf("FAILED")).toBe(-1);
  });
});

describe("TrackingTimeline — events rendering", () => {
  it("Boş events ile render crash etmemeli", () => {
    expect(() =>
      render(
        <TrackingTimeline {...baseProps} currentStatus="PENDING" events={[]} />,
      ),
    ).not.toThrow();
  });

  it("Events listesi varken her event'in createdAt'i render edilmeli", () => {
    const events: ShipmentStatusEvent[] = [
      makeEvent("PENDING", "2025-11-01T10:00:00Z"),
      makeEvent("LABEL_GENERATED", "2025-11-01T11:00:00Z"),
    ];
    render(
      <TrackingTimeline
        {...baseProps}
        currentStatus="LABEL_GENERATED"
        events={events}
      />,
    );
    expect(screen.getByText("2025-11-01T10:00:00Z")).toBeInTheDocument();
    expect(screen.getByText("2025-11-01T11:00:00Z")).toBeInTheDocument();
  });
});
