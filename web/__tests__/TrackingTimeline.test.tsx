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

// Next.js formatDateTime mock
jest.mock("@/lib/format", () => ({
  formatDateTime: (d: string) => d,
}));

const baseProps = {
  trackingNumber: "TRK-12345",
  events: [],
};

describe("TrackingTimeline — status rendering", () => {
  it("PENDING statüsünde render edilmeli", () => {
    render(
      <TrackingTimeline {...baseProps} currentStatus="PENDING" />
    );
    // Takip numarası görünmeli
    expect(screen.getByText("TRK-12345")).toBeInTheDocument();
  });

  it("IN_TRANSIT statüsünde doğru label göstermeli", () => {
    render(
      <TrackingTimeline {...baseProps} currentStatus="IN_TRANSIT" />
    );
    expect(screen.getByText(/In Transit/i)).toBeInTheDocument();
  });

  it("DELIVERED statüsünde başarı göstergesi render edilmeli", () => {
    render(
      <TrackingTimeline {...baseProps} currentStatus="DELIVERED" />
    );
    expect(screen.getByText("DELIVERED")).toBeInTheDocument();
  });

  it("isFailed=true iken FAILED durumu render edilmeli", () => {
    render(
      <TrackingTimeline {...baseProps} currentStatus="FAILED" isFailed />
    );
    // Hata göstergesi
    expect(screen.queryByText("TRK-12345")).toBeInTheDocument();
  });

  it("courierName verildiğinde görünmeli", () => {
    render(
      <TrackingTimeline
        {...baseProps}
        currentStatus="COURIER_ASSIGNED"
        courierName="Ahmet Yılmaz"
      />
    );
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
  });

  it("estimatedDelivery verildiğinde render edilmeli", () => {
    render(
      <TrackingTimeline
        {...baseProps}
        currentStatus="IN_TRANSIT"
        estimatedDeliveryStart="2025-12-01"
        estimatedDeliveryEnd="2025-12-03"
      />
    );
    expect(screen.getByText("2025-12-01")).toBeInTheDocument();
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
    const index = SHIPMENT_STATUS_ORDER.indexOf("FAILED");
    expect(index).toBe(-1);
  });
});

describe("TrackingTimeline — events rendering", () => {
  it("Boş events ile render crash etmemeli", () => {
    expect(() =>
      render(<TrackingTimeline {...baseProps} currentStatus="PENDING" events={[]} />)
    ).not.toThrow();
  });

  it("Events listesi varken her event render edilmeli", () => {
    const events = [
      { status: "PENDING" as ShipmentStatus, changedAt: "2025-11-01T10:00:00Z" },
      { status: "LABEL_GENERATED" as ShipmentStatus, changedAt: "2025-11-01T11:00:00Z" },
    ];
    render(
      <TrackingTimeline
        {...baseProps}
        currentStatus="LABEL_GENERATED"
        events={events}
      />
    );
    // Her event'in changedAt'i gösterilmeli
    expect(screen.getByText("2025-11-01T10:00:00Z")).toBeInTheDocument();
    expect(screen.getByText("2025-11-01T11:00:00Z")).toBeInTheDocument();
  });
});
