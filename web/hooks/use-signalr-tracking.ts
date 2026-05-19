"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL } from "@/lib/constants";
import { getAccessToken } from "@/lib/auth";
import { orderKeys } from "@/queries/useOrders";
import { courierKeys, shipmentKeys } from "@/queries/useCouriers";
import type { ShipmentStatus } from "@/types/enums";
import type { Shipment } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrackingUpdate {
  shipmentId: string;
  trackingNumber?: string;
  /** Resolved status — always populated after normalization */
  status: ShipmentStatus;
  note?: string;
  location?: string;
  updatedAt: string;
  previousStatus?: ShipmentStatus;
  newStatus?: ShipmentStatus;
  timestamp?: string;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface NormalizedTracking {
  orderId: string;
  orderStatus: string;
  status?: string;
  events: Array<{
    id?: string;
    status: string;
    note?: string;
    location?: string;
    createdAt: string;
  }>;
}

interface UseSignalRTrackingOptions {
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
  const queryClient  = useQueryClient();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [status, setStatus]      = useState<ConnectionStatus>("disconnected");
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
          // Exponential backoff: 0 s → 2 s → 10 s → 30 s (then fixed)
          const delays = [0, 2_000, 10_000, 30_000];
          return delays[ctx.previousRetryCount] ?? 30_000;
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── ShipmentStatusUpdated ──────────────────────────────────────────────

    connection.on("ShipmentStatusUpdated", (raw: Record<string, unknown>) => {
      const shipmentId = String(raw.shipmentId ?? "");
      if (!shipmentIds.includes(shipmentId)) return;

      // Normalize the backend payload into the TrackingUpdate shape
      const update: TrackingUpdate = {
        shipmentId,
        trackingNumber: raw.trackingNumber as string | undefined,
        status:  (raw.newStatus ?? raw.status) as ShipmentStatus,
        note:    raw.note as string | undefined,
        location: raw.location as string | undefined,
        updatedAt: (raw.timestamp ?? raw.updatedAt ?? new Date().toISOString()) as string,
        previousStatus: raw.previousStatus as ShipmentStatus | undefined,
        newStatus:      raw.newStatus      as ShipmentStatus | undefined,
        timestamp:      raw.timestamp      as string | undefined,
      };

      // ── Push update directly into TanStack Query caches ────────────────
      //
      // By writing to the cache here we avoid a full refetch round-trip.
      // All components subscribed to these query keys re-render immediately
      // with the new status — zero network requests required.

      // 1. Order tracking detail page
      //    Prepend the new event and update the top-level status fields.
      queryClient.setQueriesData<NormalizedTracking>(
        { queryKey: ["orders", "tracking"] },
        (old) => {
          if (!old) return old;
          const newEvent = {
            status:    update.status,
            note:      update.note,
            location:  update.location,
            createdAt: update.updatedAt,
          };
          return {
            ...old,
            orderStatus: update.status,
            status:      update.status,
            events:      [newEvent, ...(old.events ?? [])],
          };
        },
      );

      // 2. Admin / fulfillment shipment detail
      queryClient.setQueryData<Shipment>(
        shipmentKeys.detail(shipmentId),
        (old) => (old ? { ...old, status: update.status } : old),
      );

      // 3. Courier's own shipments list — courier portal live update
      queryClient.setQueryData<Shipment[]>(
        courierKeys.myShipments(),
        (old) =>
          old?.map((s) =>
            s.id === shipmentId ? { ...s, status: update.status } : s,
          ),
      );

      // 4. Admin shipments list
      queryClient.setQueriesData<Shipment[]>(
        { queryKey: shipmentKeys.list() },
        (old) =>
          old?.map((s) =>
            s.id === shipmentId ? { ...s, status: update.status } : s,
          ),
      );

      // 5. Partial invalidation so a background sync still happens, but only
      //    for the specific tracking query — not the entire orders cache.
      //    This runs after the optimistic write so there's no flash of stale data.
      queryClient.invalidateQueries({ queryKey: ["orders", "tracking"] });

      setLastUpdate(update);
      onUpdate?.(update);
    });

    // ── Connection lifecycle ────────────────────────────────────────────────

    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => setStatus("connected"));
    connection.onclose(() => setStatus("disconnected"));

    try {
      setStatus("connecting");
      await connection.start();
      setStatus("connected");

      // Join the shipment-scoped SignalR groups
      for (const id of shipmentIds) {
        await connection.invoke("JoinShipmentGroup", id).catch(() => {
          // Group not found — silently skip
        });
      }

      connectionRef.current = connection;
    } catch (err) {
      console.error("[SignalR] Connection error:", err);
      setStatus("error");
    }
  }, [enabled, shipmentIds, onUpdate, queryClient]);

  const disconnect = useCallback(async () => {
    if (!connectionRef.current) return;
    try {
      for (const id of shipmentIds) {
        await connectionRef.current
          .invoke("LeaveShipmentGroup", id)
          .catch(() => {});
      }
      await connectionRef.current.stop();
    } catch {
      // Silently ignore disconnect errors
    }
    connectionRef.current = null;
    setStatus("disconnected");
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

// ── Single-shipment convenience wrapper ───────────────────────────────────────

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
