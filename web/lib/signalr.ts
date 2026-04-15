// web/lib/signalr.ts
"use client";

import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "./auth";

const HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_HUB ?? "http://localhost:5010/hubs/tracking";

let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(
        process.env.NODE_ENV === "development"
          ? signalR.LogLevel.Information
          : signalR.LogLevel.Error,
      )
      .build();
  }
  return connection;
}

export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
}

export async function stopConnection(): Promise<void> {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
  }
}

// ── Helper: belirli bir shipment'ı takip et ────────────────────────────────
export async function joinShipmentTracking(shipmentId: string): Promise<void> {
  const conn = getConnection();
  await conn.invoke("JoinShipmentGroup", shipmentId);
}

export async function leaveShipmentTracking(shipmentId: string): Promise<void> {
  const conn = getConnection();
  await conn.invoke("LeaveShipmentGroup", shipmentId);
}
