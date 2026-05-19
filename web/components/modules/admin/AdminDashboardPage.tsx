"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  AlertCircle,
  Store,
  Activity,
  Percent,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  ordersToday: number;
  ordersThisMonth: number;
  totalMerchants: number;
  activeMerchants: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalProducts: number;
  pendingProducts: number;
  pendingMerchants: number;
  fulfillmentSuccessRate: number;
  activeDeliveries: number;
  totalUsers: number;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
      <Skeleton className="h-7 w-7 rounded-lg mb-3" />
      <Skeleton className="h-7 w-20 mb-1.5" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

// Maps arbitrary color groups to our 4 semantic tokens
const COLOR_MAP: Record<
  string,
  { text: string; bg: string }
> = {
  blue:    { text: "text-(--info)",    bg: "bg-(--info-bg)" },
  cyan:    { text: "text-(--info)",    bg: "bg-(--info-bg)" },
  indigo:  { text: "text-(--info)",    bg: "bg-(--info-bg)" },
  teal:    { text: "text-(--success)", bg: "bg-(--success-bg)" },
  green:   { text: "text-(--success)", bg: "bg-(--success-bg)" },
  emerald: { text: "text-(--success)", bg: "bg-(--success-bg)" },
  amber:   { text: "text-(--warning)", bg: "bg-(--warning-bg)" },
  orange:  { text: "text-(--warning)", bg: "bg-(--warning-bg)" },
  rose:    { text: "text-(--danger)",  bg: "bg-(--danger-bg)" },
  red:     { text: "text-(--danger)",  bg: "bg-(--danger-bg)" },
  violet:  { text: "text-(--info)",    bg: "bg-(--info-bg)" },
  gray:    { text: "text-(--text-tertiary)", bg: "bg-(--off-white-2)" },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/api/admin/dashboard");
      const d = res.data;
      return {
        totalOrders:           d.orders?.totalOrders ?? d.totalOrders ?? 0,
        pendingOrders:         d.orders?.pendingOrders ?? d.pendingOrders ?? 0,
        ordersToday:           d.orders?.ordersToday ?? d.ordersToday ?? 0,
        ordersThisMonth:       d.orders?.ordersThisMonth ?? d.ordersThisMonth ?? 0,
        totalMerchants:        d.merchants?.totalMerchants ?? d.totalMerchants ?? 0,
        activeMerchants:       d.merchants?.activeMerchants ?? d.activeMerchants ?? 0,
        totalRevenue:          d.totalRevenue ?? d.revenue?.revenueThisMonth ?? 0,
        revenueThisMonth:      d.revenue?.revenueThisMonth ?? 0,
        totalProducts:         d.totalProducts ?? 0,
        pendingProducts:       d.pendingProducts ?? 0,
        pendingMerchants:      d.pendingMerchants ?? 0,
        fulfillmentSuccessRate: d.fulfillmentSuccessRate ?? 0,
        activeDeliveries:      d.activeShipments ?? d.activeDeliveries ?? 0,
        totalUsers:            d.totalUsers ?? 0,
      } as DashboardStats;
    },
  });

  const s = data ?? ({} as DashboardStats);

  const cards = [
    { label: "Total Orders",       value: s.totalOrders ?? 0,   icon: ShoppingCart, color: "blue",   href: "/admin/orders" },
    { label: "Pending Orders",     value: s.pendingOrders ?? 0, icon: Clock,        color: "amber",  href: "/admin/orders" },
    { label: "Orders Today",       value: s.ordersToday ?? 0,   icon: TrendingUp,   color: "cyan",   href: "/admin/orders" },
    { label: "Orders This Month",  value: s.ordersThisMonth ?? 0, icon: ShoppingCart, color: "indigo", href: "/admin/orders" },
    {
      label: "Active Merchants",
      value: `${s.activeMerchants ?? 0} / ${s.totalMerchants ?? 0}`,
      icon: Users, color: "violet", href: "/admin/merchants",
    },
    { label: "Total Users",        value: s.totalUsers ?? 0,    icon: Users,        color: "teal",   href: "/admin/users" },
    {
      label: "Total Revenue",
      value: `₺${(s.totalRevenue ?? 0).toLocaleString("en-US")}`,
      icon: DollarSign, color: "emerald", href: "/admin/analytics",
    },
    {
      label: "This Month Revenue",
      value: `₺${(s.revenueThisMonth ?? 0).toLocaleString("en-US")}`,
      icon: TrendingUp, color: "green", href: "/admin/analytics",
    },
    { label: "Total Products",     value: s.totalProducts ?? 0,  icon: Package,     color: "cyan",   href: "/admin/products" },
    { label: "Pending Approval",   value: s.pendingProducts ?? 0, icon: AlertCircle, color: "rose",   href: "/admin/products" },
    { label: "Fulfillment Rate",   value: `${s.fulfillmentSuccessRate ?? 0}%`, icon: CheckCircle, color: "teal", href: "/admin/analytics" },
    { label: "Active Deliveries",  value: s.activeDeliveries ?? 0, icon: Truck,      color: "indigo", href: "/admin/fulfillment" },
  ];

  const quickLinks = [
    { href: "/admin/merchants",  label: "Merchants",   icon: Users },
    { href: "/admin/products",   label: "Products",    icon: Package },
    { href: "/admin/categories", label: "Categories",  icon: TrendingUp },
    { href: "/admin/couriers",   label: "Couriers",    icon: Truck },
    { href: "/admin/commission", label: "Commission",  icon: Percent },
    { href: "/admin/analytics",  label: "Analytics",   icon: TrendingUp },
    { href: "/admin/logs",       label: "Audit Logs",  icon: Activity },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">Dashboard</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          Platform overview &amp; key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((card) => {
              const tokens = COLOR_MAP[card.color] ?? COLOR_MAP.gray;
              return (
                <Link key={card.label} href={card.href}>
                  <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5 hover:border-(--border-mid) hover:shadow-sm transition-all cursor-pointer">
                    <div className={`inline-flex p-2 rounded-lg ${tokens.bg} mb-3`}>
                      <card.icon className={`w-4 h-4 ${tokens.text}`} />
                    </div>
                    <p className="text-2xl font-bold text-(--text-primary) mb-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-(--text-tertiary) font-medium">
                      {card.label}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Quick Actions */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-6">
        <h2 className="text-sm font-semibold text-(--text-primary) mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-(--border-mid) rounded-xl hover:border-(--border-strong) hover:bg-(--bg-sunken) transition-all cursor-pointer gap-2">
                <link.icon className="w-5 h-5 text-(--text-tertiary)" />
                <span className="text-xs text-(--text-secondary) text-center font-medium leading-tight">
                  {link.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending Merchants Alert */}
      {(s.pendingMerchants ?? 0) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 rounded-xl border border-(--warning-border) bg-(--warning-bg)">
          <div className="flex items-start sm:items-center gap-3">
            <Store className="w-5 h-5 text-(--warning) shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-medium text-(--text-primary) text-sm">
                {s.pendingMerchants} merchant application
                {s.pendingMerchants! > 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-xs text-(--text-secondary) mt-0.5">
                New applicants are waiting for approval before they can list
                products.
              </p>
            </div>
          </div>
          <Link href="/admin/merchants?tab=pending" className="self-start sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-(--warning) bg-(--warning-bg) hover:opacity-80 border border-(--warning-border) px-3 py-1.5 rounded-lg transition-opacity cursor-pointer whitespace-nowrap inline-block">
              Review →
            </span>
          </Link>
        </div>
      )}

      {/* Pending Products Alert */}
      {(s.pendingProducts ?? 0) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 rounded-xl border border-(--border-mid) bg-(--bg-sunken)">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-(--text-tertiary) shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-medium text-(--text-primary) text-sm">
                {s.pendingProducts} products awaiting review
              </p>
              <p className="text-xs text-(--text-secondary) mt-0.5">
                Merchant products are waiting for approval before going live.
              </p>
            </div>
          </div>
          <Link href="/admin/products" className="self-start sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-(--text-secondary) hover:text-(--text-primary) px-3 py-1.5 rounded-lg border border-(--border-mid) hover:border-(--border-strong) transition-colors cursor-pointer whitespace-nowrap inline-block">
              Review →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
