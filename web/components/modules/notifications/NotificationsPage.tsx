"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Package,
  Tag,
  Store,
  ShoppingCart,
  Truck,
  Star,
  Settings,
  CheckCheck,
  Trash2,
} from "lucide-react";

type NotifType = "order" | "deal" | "store" | "shipping" | "review" | "system";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const TYPE_META: Record<
  NotifType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  order: { icon: ShoppingCart, bg: "rgba(200,16,46,0.08)", color: "var(--red)" },
  deal: { icon: Tag, bg: "rgba(234,179,8,0.08)", color: "#ca8a04" },
  store: { icon: Store, bg: "rgba(59,130,246,0.08)", color: "#2563eb" },
  shipping: { icon: Truck, bg: "rgba(34,197,94,0.08)", color: "#16a34a" },
  review: { icon: Star, bg: "rgba(168,85,247,0.08)", color: "#7c3aed" },
  system: { icon: Bell, bg: "rgba(51,51,51,0.06)", color: "var(--charcoal-soft)" },
};

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 1,
    type: "shipping",
    title: "Your order is out for delivery",
    message: "Order #MKT-2048 is with the courier and expected today by 18:00.",
    time: "Just now",
    read: false,
    link: "/orders/2048/tracking",
  },
  {
    id: 2,
    type: "deal",
    title: "Flash sale: Up to 40% off Electronics",
    message: "Deals end in 6 hours. Shop from your wishlist now.",
    time: "2 hours ago",
    read: false,
    link: "/deals",
  },
  {
    id: 3,
    type: "order",
    title: "Order confirmed",
    message: "Order #MKT-2047 has been confirmed by the merchant. Processing will begin shortly.",
    time: "Yesterday",
    read: false,
    link: "/orders/2047",
  },
  {
    id: 4,
    type: "store",
    title: "New products from TechHub Store",
    message: "A store you follow has added 8 new products in the Electronics category.",
    time: "2 days ago",
    read: true,
    link: "/store/techhub",
  },
  {
    id: 5,
    type: "review",
    title: "Rate your recent purchase",
    message: "You received your order #MKT-2041 last week. Share your experience!",
    time: "3 days ago",
    read: true,
    link: "/orders/2041",
  },
  {
    id: 6,
    type: "system",
    title: "Security notice",
    message: "A new login was detected from Istanbul, TR. If this wasn't you, please secure your account.",
    time: "5 days ago",
    read: true,
    link: "/profile",
  },
  {
    id: 7,
    type: "deal",
    title: "Price drop on your wishlist",
    message: "A product you saved has dropped in price by 15%.",
    time: "1 week ago",
    read: true,
    link: "/wishlist",
  },
  {
    id: 8,
    type: "shipping",
    title: "Order #MKT-2038 delivered",
    message: "Your package was delivered and signed for. Enjoy your order!",
    time: "1 week ago",
    read: true,
    link: "/orders/2038",
  },
];

const FILTERS = ["All", "Unread", "Orders", "Deals", "Shipping"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);
  const [filter, setFilter] = useState("All");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "Unread") return !n.read;
    if (filter === "Orders") return n.type === "order";
    if (filter === "Deals") return n.type === "deal";
    if (filter === "Shipping") return n.type === "shipping";
    return true;
  });

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: number) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const deleteNotif = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div className="max-w-[1300px] mx-auto flex items-end justify-between gap-4 flex-wrap">
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

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-8">
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
          {filtered.length === 0 && (
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
                <div className="flex-shrink-0 mt-1 relative">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: meta.bg }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
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
                      className="text-[11px] flex-shrink-0"
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
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
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
