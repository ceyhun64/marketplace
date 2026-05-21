"use client";

import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Bell,
  ShoppingCart,
  Truck,
  Star,
  Tag,
  Store,
  Settings,
  CheckCheck,
  Trash2,
} from "lucide-react";
import {
  useNotifications,
  type NotifType,
} from "@/queries/useNotifications";

const TYPE_META: Record<
  NotifType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  order:    { icon: ShoppingCart, bg: "bg-(--red-muted)",     color: "text-(--red)" },
  deal:     { icon: Tag,          bg: "bg-(--warning-bg)",    color: "text-(--warning)" },
  store:    { icon: Store,        bg: "bg-(--info-bg)",       color: "text-(--info)" },
  shipping: { icon: Truck,        bg: "bg-(--success-bg)",    color: "text-(--success)" },
  review:   { icon: Star,         bg: "bg-(--off-white-2)",   color: "text-(--text-secondary)" },
  system:   { icon: Bell,         bg: "bg-(--off-white-2)",   color: "text-(--text-tertiary)" },
};

const FILTERS = ["All", "Unread", "Orders", "Shipping", "Deals", "Reviews"];

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotif } =
    useNotifications();
  const [filter, setFilter] = useState("All");

  const filtered = notifications.filter((n) => {
    if (filter === "Unread") return !n.read;
    if (filter === "Orders") return n.type === "order";
    if (filter === "Deals") return n.type === "deal";
    if (filter === "Shipping") return n.type === "shipping";
    if (filter === "Reviews") return n.type === "review";
    return true;
  });

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div className="max-w-325 mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4" style={{ color: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Notifications
              </span>
            </div>
            <h1
              className="text-[36px] lg:text-[48px] text-white leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your{" "}
              <span style={{ color: "var(--red)" }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold align-middle"
                  style={{ background: "var(--red)", fontFamily: "var(--font-body)" }}
                >
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-body)",
              }}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-325 mx-auto px-4 lg:px-8 py-8">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: filter === f ? "var(--charcoal)" : "white",
                color: filter === f ? "white" : "var(--charcoal-soft)",
                border: `1px solid ${filter === f ? "var(--charcoal)" : "rgba(51,51,51,0.12)"}`,
                fontFamily: "var(--font-body)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {/* Loading skeletons using the Skeleton primitive */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-(--border-light)"
                >
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20">
              <Bell
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "rgba(51,51,51,0.12)" }}
              />
              <p
                style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
              >
                No notifications here.
              </p>
            </div>
          )}

          {filtered.map((notif) => {
            const meta = TYPE_META[notif.type];
            const Icon = meta.icon;
            return (
              <div
                key={notif.id}
                className="group flex items-start gap-4 p-4 rounded-2xl bg-white transition-shadow cursor-pointer"
                style={{
                  border: `1px solid ${notif.read ? "rgba(51,51,51,0.07)" : "rgba(200,16,46,0.12)"}`,
                  boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                  opacity: notif.read ? 0.85 : 1,
                }}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.link) window.location.href = notif.link;
                }}
              >
                {/* Unread dot */}
                <div className="shrink-0 mt-1 relative">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}
                  >
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  {!notif.read && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: "var(--red)" }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-semibold text-[0.875rem] leading-snug"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {notif.title}
                    </h3>
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                    >
                      {notif.time}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
                  >
                    {notif.message}
                  </p>
                </div>

                {/* Delete */}
                <button
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                  style={{ color: "var(--charcoal-mist)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif(notif.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
