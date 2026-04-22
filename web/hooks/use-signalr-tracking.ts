"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL } from "@/lib/constants";
import { getAccessToken } from "@/lib/auth";
import type { ShipmentStatus } from "@/types/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrackingUpdate {
  shipmentId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  note?: string;
  location?: string;
  updatedAt: string;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface UseSignalRTrackingOptions {
  /** Hangi shipment ID'lerini dinleyeceğiz */
  shipmentIds: string[];
  onUpdate?: (update: TrackingUpdate) => void;
  enabled?: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSignalRTracking({
  shipmentIds,
  onUpdate,
  enabled = true,
}: UseSignalRTrackingOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastUpdate, setLastUpdate] = useState<TrackingUpdate | null>(null);

  const connect = useCallback(async () => {
    if (!enabled || shipmentIds.length === 0) return;

    const token = getAccessToken();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token ?? "",
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, sonra 30s sabit
          const delays = [0, 2000, 10000, 30000];
          return delays[ctx.previousRetryCount] ?? 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── Event Handlers ─────────────────────────────────────────────────────

    connection.on("ShipmentStatusUpdated", (update: TrackingUpdate) => {
      // Sadece dinlediğimiz shipment'ları işle
      if (!shipmentIds.includes(update.shipmentId)) return;
      setLastUpdate(update);
      onUpdate?.(update);
    });

    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => setStatus("connected"));
    connection.onclose(() => setStatus("disconnected"));

    // ── Bağlan ────────────────────────────────────────────────────────────

    try {
      setStatus("connecting");
      await connection.start();
      setStatus("connected");

      // Dinlemek istediğimiz shipment gruplarına katıl
      for (const id of shipmentIds) {
        await connection.invoke("JoinShipmentGroup", id).catch(() => {
          // Grup yoksa sessizce geç
        });
      }

      connectionRef.current = connection;
    } catch (err) {
      console.error("SignalR bağlantı hatası:", err);
      setStatus("error");
    }
  }, [enabled, shipmentIds, onUpdate]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      try {
        // Gruplardan ayrıl
        for (const id of shipmentIds) {
          await connectionRef.current
            .invoke("LeaveShipmentGroup", id)
            .catch(() => {});
        }
        await connectionRef.current.stop();
      } catch {
        // sessizce geç
      }
      connectionRef.current = null;
      setStatus("disconnected");
    }
  }, [shipmentIds]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, shipmentIds.join(",")]);

  return {
    status,
    isConnected: status === "connected",
    lastUpdate,
  };
}

// ── Tek shipment takip eden basit versiyon ────────────────────────────────────

export function useTrackShipment(shipmentId: string | null) {
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);

  const { status, isConnected, lastUpdate } = useSignalRTracking({
    shipmentIds: shipmentId ? [shipmentId] : [],
    onUpdate: (update) => {
      setUpdates((prev) => [update, ...prev]);
    },
    enabled: !!shipmentId,
  });

  return {
    connectionStatus: status,
    isConnected,
    lastUpdate,
    updates,
  };
}
