"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Store,
  Globe,
  Clock,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useMerchantStats } from "@/queries/useAnalytics";
import { formatPrice, formatCurrency, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/enums";
import type { Order, Product } from "@/types/entities";

function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}

// -- Dashboard -----------------------------------------------------------------

export default function MerchantDashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get("/api/merchants/profile");
      return res.data;
    },
  });

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ["merchant-offers"],
    queryFn: async () => {
      const res = await api.get("/api/merchants/catalogue", {
        params: { page: 1, limit: 20 },
      });
      return res.data;
    },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["merchant-orders-incoming"],
    queryFn: async () => {
      const res = await api.get("/api/orders/merchant/incoming", {
        params: { status: "PENDING", limit: 5 },
      });
      return res.data;
    },
  });

  const { data: analyticsStats, isLoading: analyticsLoading } =
    useMerchantStats();

  const statsLoading = offersLoading || ordersLoading || analyticsLoading;

  const offers: Product[] =
    offersData?.items ?? offersData?.data ?? offersData ?? [];
  const orders: Order[] =
    ordersData?.items ?? ordersData?.data ?? ordersData ?? [];

  const serverStats = offersData?.stats;
  const stats = {
    totalProducts:
      serverStats?.total ??
      offersData?.total ??
      offersData?.totalCount ??
      offers.length,
    inMarket:
      serverStats?.onMarket ??
      offers.filter((o) => o.publishToMarket).length,
    pendingOrders: ordersData?.stats?.pending ?? orders.length,
  };

  const storeName = profile?.storeName ?? profile?.StoreName ?? "My Store";
  const slug = profile?.slug ?? profile?.Slug;
  const plan =
    profile?.subscriptionPlan ??
    profile?.Subscription?.Plan ??
    profile?.subscription?.plan ??
    "Basic";

  const revenueDisplay = analyticsStats
    ? formatPrice(analyticsStats.totalRevenue)
    : "—";

  const statCards = [
    {
      label: "Total Revenue",
      value: revenueDisplay,
      icon: DollarSign,
      color: "text-(--success)",
      bg: "bg-(--success-bg)",
      href: "/merchant/analytics",
      isText: true,
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-(--info)",
      bg: "bg-(--info-bg)",
      href: "/merchant/catalogue",
      isText: false,
    },
    {
      label: "On Marketplace",
      value: stats.inMarket,
      icon: Globe,
      color: "text-(--charcoal-mid)",
      bg: "bg-(--off-white-2)",
      href: "/merchant/catalogue",
      isText: false,
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-(--warning)",
      bg: "bg-(--warning-bg)",
      href: "/merchant/orders",
      isText: false,
    },
  ];

  const planBadgeStyle =
    plan === "Enterprise"
      ? {
          border: "1px solid rgba(200,16,46,0.4)",
          color: "var(--red)",
          background: "var(--red-muted)",
        }
      : plan === "Pro"
        ? {
            border: "1px solid rgba(59,130,246,0.4)",
            color: "#3b82f6",
            background: "#eff6ff",
          }
        : {
            border: "1px solid rgba(0,0,0,0.12)",
            color: "var(--charcoal-soft)",
            background: "var(--off-white-2)",
          };

  const quickLinks = [
    {
      href: "/merchant/catalogue",
      label: "Add Product",
      desc: "New product & pricing",
      icon: Package,
      color: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      href: "/merchant/orders",
      label: "Orders",
      desc: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    ...(slug
      ? [
          {
            href: `/store/${slug}`,
            label: "View My Store",
            desc: "Customer-facing view",
            icon: Store,
            color: "text-(--charcoal-mid)",
            bg: "bg-(--off-white-2)",
            external: true,
          },
        ]
      : []),
    {
      href: "/merchant/analytics",
      label: "Analytics",
      desc: "Sales reports",
      icon: TrendingUp,
      color: "text-(--warning)",
      bg: "bg-(--warning-bg)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {profileLoading ? (
            <Skeleton className="h-7 w-48 mb-2" />
          ) : (
            <h1 className="text-2xl font-semibold text-(--text-primary)">
              Welcome, {storeName}
            </h1>
          )}
          <p className="text-sm text-(--text-secondary) mt-1">
            Here&apos;s your store overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!profileLoading && (
            <>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={planBadgeStyle}
              >
                {plan} Plan
              </span>
              {plan === "Basic" && (
                <Link href="/merchant/subscription">
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{ background: "var(--red)", color: "#fff" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "var(--red-dark)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "var(--red)")
                    }
                  >
                    Upgrade →
                  </button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : statCards.map((s) => (
              <Link key={s.label} href={s.href}>
                <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5 hover:border-(--border-mid) hover:shadow-sm hover:ring-2 hover:ring-black/5 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                      {s.label}
                    </p>
                    <div className={`p-1.5 rounded-lg ${s.bg}`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                  <p
                    className={`font-bold text-(--text-primary) ${s.isText ? "text-xl" : "text-2xl"}`}
                  >
                    {s.value}
                  </p>
                </div>
              </Link>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-6">
        <h2 className="text-sm font-semibold text-(--text-primary) mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
            >
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-(--border-mid) rounded-xl hover:border-(--border-strong) hover:bg-(--bg-sunken) transition-all cursor-pointer gap-2">
                <div className={`p-2 rounded-lg ${link.bg}`}>
                  <link.icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-(--text-secondary)">
                    {link.label}
                  </p>
                  <p className="text-xs text-(--text-tertiary) mt-0.5">
                    {link.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light)">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border-light)">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Recent Orders
          </h2>
          <Link href="/merchant/orders">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
              View All <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {ordersLoading ? (
          <div className="divide-y divide-(--border-subtle)">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderRowSkeleton key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon"><ShoppingCart className="w-5 h-5" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No pending orders</EmptyTitle>
              <EmptyDescription>New orders will appear here</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y divide-(--border-subtle)">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-(--bg-sunken) transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-(--text-primary)">
                    #{order.id?.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-(--text-tertiary)">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-(--text-primary)">
                    {formatCurrency(order.totalAmount ?? 0)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store Live Banner */}
      {!profileLoading && slug && (
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            background: "var(--red-muted)",
            border: "1px solid var(--red-subtle)",
          }}
        >
          <div className="flex items-center gap-3">
            <Store
              className="w-5 h-5 shrink-0"
              style={{ color: "var(--red)" }}
            />
            <div>
              <p
                className="font-medium text-sm"
                style={{ color: "var(--charcoal)" }}
              >
                Your E-Store is Live
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--charcoal-soft)" }}
              >
                marketplace.com/store/{slug}
              </p>
            </div>
          </div>
          <Link href={`/store/${slug}`} target="_blank">
            <button
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-white"
              style={{ background: "var(--red)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--red-dark)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--red)")
              }
            >
              Visit Store
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
