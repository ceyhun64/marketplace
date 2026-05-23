"use client";

import { useMemo, useState, useCallback } from "react";
import { useMyOrders } from "@/queries/useOrders";
import { useAuth } from "@/hooks/use-auth";
import { ORDER_STATUS_LABELS } from "@/types/enums";
import type { Order } from "@/types/entities";

export type NotifType =
  | "order"
  | "deal"
  | "store"
  | "shipping"
  | "review"
  | "system";

export interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function ordersToNotifications(orders: Order[]): Notification[] {
  const notifs: Notification[] = [];
  let id = 1;

  for (const order of orders) {
    const label = ORDER_STATUS_LABELS[order.status] ?? order.status;
    const shortId = order.id.slice(0, 8).toUpperCase();
    // trackingNumber is not on Order — it comes via the shipment
    const trackingLink = order.shipment?.trackingNumber
      ? `/orders/${order.id}/tracking`
      : `/orders/${order.id}`;

    if (
      ["OUT_FOR_DELIVERY", "IN_TRANSIT", "PICKED_UP"].includes(order.status)
    ) {
      notifs.push({
        id: id++,
        type: "shipping",
        title: `${label}: Order #${shortId}`,
        message: `Your order is currently in "${label}" status.`,
        time: relativeTime(order.createdAt),
        read: order.status === "PICKED_UP",
        link: trackingLink,
      });
    } else if (order.status === "DELIVERED") {
      notifs.push({
        id: id++,
        type: "review",
        title: `Rate your purchase — #${shortId}`,
        message: `Your order was delivered. Share your experience!`,
        time: relativeTime(order.createdAt),
        read: true,
        link: `/orders/${order.id}`,
      });
    } else if (
      [
        "PENDING",
        "PAYMENT_CONFIRMED",
        "LABEL_GENERATED",
        "COURIER_ASSIGNED",
      ].includes(order.status)
    ) {
      notifs.push({
        id: id++,
        type: "order",
        title: `${label} — #${shortId}`,
        message: `Your order of $${order.totalAmount.toLocaleString("tr-TR")} is ${label.toLowerCase()}.`,
        time: relativeTime(order.createdAt),
        read: order.status !== "PENDING",
        link: `/orders/${order.id}`,
      });
    } else if (["CANCELLED", "FAILED"].includes(order.status)) {
      notifs.push({
        id: id++,
        type: "system",
        title: `Order ${label} — #${shortId}`,
        message: `Your order has been ${label.toLowerCase()}. Contact support if needed.`,
        time: relativeTime(order.createdAt),
        read: true,
        link: `/orders/${order.id}`,
      });
    }
  }

  return notifs;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuth();
  // GET /api/orders is CustomerOnly — skip for Merchant, Admin, Courier to avoid 403
  const isCustomer = user?.role === "Customer";
  const { data: orders = [], isLoading } = useMyOrders(undefined, { enabled: isCustomer });

  const derived = useMemo(() => ordersToNotifications(orders), [orders]);

  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  const notifications = useMemo(
    () =>
      derived
        .filter((n) => !deletedIds.has(n.id))
        .map((n) => ({ ...n, read: n.read || readIds.has(n.id) })),
    [derived, readIds, deletedIds],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: number) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(derived.map((n) => n.id)));
  }, [derived]);

  const deleteNotif = useCallback((id: number) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    deleteNotif,
  };
}
