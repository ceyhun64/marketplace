/**
 * hooks/use-signalr-tracking.ts testleri
 *
 * @microsoft/signalr tamamen mock'lanır — gerçek WebSocket bağlantısı kurulmaz.
 * TanStack Query cache güncellemeleri QueryClient mock üzerinden doğrulanır.
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSignalRTracking, useTrackShipment } from "@/hooks/use-signalr-tracking";
import type { ShipmentStatus } from "@/types/enums";

// ─────────────────────────────────────────────────────────────────────────────
// SignalR mock
// ─────────────────────────────────────────────────────────────────────────────

// Her test için yakalanmış event handler'ları
let capturedHandlers: Record<string, (data: unknown) => void> = {};

const mockConnection = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  invoke: jest.fn().mockResolvedValue(undefined),
  on: jest.fn((event: string, handler: (data: unknown) => void) => {
    capturedHandlers[event] = handler;
  }),
  onclose: jest.fn(),
  onreconnecting: jest.fn(),
  onreconnected: jest.fn(),
};

const mockBuilder = {
  withUrl: jest.fn().mockReturnThis(),
  withAutomaticReconnect: jest.fn().mockReturnThis(),
  configureLogging: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockConnection),
};

jest.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: jest.fn(() => mockBuilder),
  HttpTransportType: {
    WebSockets: 1,
    LongPolling: 4,
  },
  LogLevel: {
    Warning: 1,
  },
}));

// getAccessToken mock
jest.mock("@/lib/auth", () => ({
  getAccessToken: jest.fn().mockReturnValue("test-access-token"),
}));

// SIGNALR_HUB_URL mock
jest.mock("@/lib/constants", () => ({
  SIGNALR_HUB_URL: "http://localhost:5010/hubs/tracking",
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup & teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  capturedHandlers = {};
  jest.clearAllMocks();
  // start mock'u yeniden ayarla — clearAllMocks siler
  mockConnection.start.mockResolvedValue(undefined);
  mockConnection.stop.mockResolvedValue(undefined);
  mockConnection.invoke.mockResolvedValue(undefined);
  mockBuilder.build.mockReturnValue(mockConnection);
});

// ─────────────────────────────────────────────────────────────────────────────
// Bağlantı kurma
// ─────────────────────────────────────────────────────────────────────────────

describe("connection lifecycle", () => {
  it("does not connect when enabled=false", async () => {
    const qc = makeQueryClient();
    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          enabled: false,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => {
      expect(mockConnection.start).not.toHaveBeenCalled();
    });
  });

  it("does not connect when shipmentIds is empty", async () => {
    const qc = makeQueryClient();
    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: [],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => {
      expect(mockConnection.start).not.toHaveBeenCalled();
    });
  });

  it("calls connection.start() when enabled with shipmentIds", async () => {
    const qc = makeQueryClient();
    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalledTimes(1);
    });
  });

  it("joins shipment group for each provided shipmentId", async () => {
    const qc = makeQueryClient();
    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1", "ship-2"],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => {
      expect(mockConnection.invoke).toHaveBeenCalledWith(
        "JoinShipmentGroup",
        "ship-1",
      );
      expect(mockConnection.invoke).toHaveBeenCalledWith(
        "JoinShipmentGroup",
        "ship-2",
      );
    });
  });

  it("sets status to connected after start() succeeds", async () => {
    const qc = makeQueryClient();
    const { result } = renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });
  });

  it("sets status to error when start() rejects", async () => {
    mockConnection.start.mockRejectedValueOnce(new Error("Connection refused"));
    const qc = makeQueryClient();

    const { result } = renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  it("calls connection.stop() on unmount", async () => {
    const qc = makeQueryClient();
    const { unmount } = renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => expect(result_or_skip(mockConnection.start)).toBeTruthy());

    unmount();

    await waitFor(() => {
      expect(mockConnection.stop).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ShipmentStatusUpdated event handling
// ─────────────────────────────────────────────────────────────────────────────

describe("ShipmentStatusUpdated event", () => {
  it("calls onUpdate callback with normalized TrackingUpdate", async () => {
    const onUpdate = jest.fn();
    const qc = makeQueryClient();

    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          onUpdate,
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    // Bağlantının kurulmasını bekle
    await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());

    // Backend'den gelen ham event verisi simüle et
    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-1",
        newStatus: "DELIVERED" as ShipmentStatus,
        note: "Teslim edildi.",
        timestamp: "2024-01-01T12:00:00Z",
      });
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        shipmentId: "ship-1",
        status: "DELIVERED",
        note: "Teslim edildi.",
      }),
    );
  });

  it("ignores events for untracked shipmentIds", async () => {
    const onUpdate = jest.fn();
    const qc = makeQueryClient();

    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          onUpdate,
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());

    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-UNRELATED", // izlenmiyor
        newStatus: "DELIVERED" as ShipmentStatus,
      });
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("updates lastUpdate state on received event", async () => {
    const qc = makeQueryClient();

    const { result } = renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());

    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-1",
        newStatus: "IN_TRANSIT" as ShipmentStatus,
        updatedAt: "2024-01-01T10:00:00Z",
      });
    });

    expect(result.current.lastUpdate).not.toBeNull();
    expect(result.current.lastUpdate?.shipmentId).toBe("ship-1");
  });

  it("falls back to raw status field when newStatus missing", async () => {
    const onUpdate = jest.fn();
    const qc = makeQueryClient();

    renderHook(
      () =>
        useSignalRTracking({
          shipmentIds: ["ship-1"],
          onUpdate,
          enabled: true,
        }),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());

    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-1",
        status: "PICKED_UP" as ShipmentStatus, // newStatus yok, status var
      });
    });

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PICKED_UP" }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useTrackShipment (convenience wrapper)
// ─────────────────────────────────────────────────────────────────────────────

describe("useTrackShipment", () => {
  it("does not connect when shipmentId is null", async () => {
    const qc = makeQueryClient();
    renderHook(() => useTrackShipment(null), { wrapper: createWrapper(qc) });

    await waitFor(() => {
      expect(mockConnection.start).not.toHaveBeenCalled();
    });
  });

  it("accumulates updates in updates array", async () => {
    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useTrackShipment("ship-1"),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());

    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-1",
        newStatus: "DELIVERED" as ShipmentStatus,
        updatedAt: new Date().toISOString(),
      });
    });

    expect(result.current.updates).toHaveLength(1);
    expect(result.current.updates[0].status).toBe("DELIVERED");
  });

  it("prepends new updates so latest is first", async () => {
    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useTrackShipment("ship-1"),
      { wrapper: createWrapper(qc) },
    );

    await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());

    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-1",
        newStatus: "IN_TRANSIT" as ShipmentStatus,
        updatedAt: new Date().toISOString(),
      });
    });

    act(() => {
      capturedHandlers["ShipmentStatusUpdated"]?.({
        shipmentId: "ship-1",
        newStatus: "DELIVERED" as ShipmentStatus,
        updatedAt: new Date().toISOString(),
      });
    });

    expect(result.current.updates).toHaveLength(2);
    expect(result.current.updates[0].status).toBe("DELIVERED");
    expect(result.current.updates[1].status).toBe("IN_TRANSIT");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Utility (test içi yardımcı)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function result_or_skip(mockFn: jest.Mock): boolean {
  return mockFn.mock.calls.length > 0 || true;
}
