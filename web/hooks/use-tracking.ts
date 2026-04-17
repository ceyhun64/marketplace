import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "LABEL_GENERATED"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export interface ShipmentStatusUpdate {
  shipmentId: string;
  status: ShipmentStatus;
  note?: string;
  updatedAt: string;
  courierName?: string;
  estimatedDelivery?: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

interface UseTrackingReturn {
  connectionState: ConnectionState;
  latestUpdate: ShipmentStatusUpdate | null;
  history: ShipmentStatusUpdate[];
  joinShipment: (shipmentId: string) => Promise<void>;
  leaveShipment: (shipmentId: string) => Promise<void>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_HUB ?? "http://localhost:5000/hubs/tracking";

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * SignalR tabanlı gerçek zamanlı kargo takip hook'u.
 *
 * Kullanım:
 * ```tsx
 * const { connectionState, latestUpdate, joinShipment } = useTracking();
 *
 * useEffect(() => {
 *   if (shipmentId) joinShipment(shipmentId);
 * }, [shipmentId]);
 * ```
 */
export function useTracking(accessToken?: string): UseTrackingReturn {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [latestUpdate, setLatestUpdate] = useState<ShipmentStatusUpdate | null>(null);
  const [history, setHistory] = useState<ShipmentStatusUpdate[]>([]);

  // Build connection once
  useEffect(() => {
    const builder = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: accessToken ? () => accessToken : undefined,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // 1s, 2s, 5s, 10s, 30s, ardından null (durur)
          const delays = [1000, 2000, 5000, 10000, 30000];
          return delays[retryContext.previousRetryCount] ?? null;
        },
      })
      .configureLogging(
        process.env.NODE_ENV === "development"
          ? signalR.LogLevel.Information
          : signalR.LogLevel.Error
      )
      .build();

    // Connection state listeners
    builder.onreconnecting(() => setConnectionState("reconnecting"));
    builder.onreconnected(() => setConnectionState("connected"));
    builder.onclose(() => setConnectionState("disconnected"));

    // Server → Client: durum güncellemesi
    builder.on("StatusUpdated", (update: ShipmentStatusUpdate) => {
      setLatestUpdate(update);
      setHistory((prev) => [update, ...prev].slice(0, 50)); // Son 50 eventi tut
    });

    connectionRef.current = builder;

    setConnectionState("connecting");
    builder
      .start()
      .then(() => setConnectionState("connected"))
      .catch((err) => {
        console.error("[SignalR] Bağlantı hatası:", err);
        setConnectionState("disconnected");
      });

    return () => {
      builder.stop();
    };
  }, [accessToken]);

  const joinShipment = useCallback(async (shipmentId: string) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    try {
      await conn.invoke("JoinShipmentGroup", shipmentId);
    } catch (err) {
      console.error("[SignalR] JoinShipmentGroup hatası:", err);
    }
  }, []);

  const leaveShipment = useCallback(async (shipmentId: string) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    try {
      await conn.invoke("LeaveShipmentGroup", shipmentId);
    } catch (err) {
      console.error("[SignalR] LeaveShipmentGroup hatası:", err);
    }
  }, []);

  return { connectionState, latestUpdate, history, joinShipment, leaveShipment };
}

// ── Shipment-specific shortcut ────────────────────────────────────────────────

/**
 * Belirli bir shipment ID'sini otomatik takip eden kolaylaştırılmış hook.
 *
 * ```tsx
 * const { status, history, isConnected } = useShipmentTracking(shipmentId, token);
 * ```
 */
export function useShipmentTracking(shipmentId: string | null, accessToken?: string) {
  const { connectionState, latestUpdate, history, joinShipment, leaveShipment } =
    useTracking(accessToken);

  useEffect(() => {
    if (!shipmentId || connectionState !== "connected") return;
    joinShipment(shipmentId);
    return () => {
      leaveShipment(shipmentId);
    };
  }, [shipmentId, connectionState, joinShipment, leaveShipment]);

  return {
    isConnected: connectionState === "connected",
    connectionState,
    latestStatus: latestUpdate?.status ?? null,
    latestUpdate,
    history: history.filter((h) => h.shipmentId === shipmentId),
  };
}
