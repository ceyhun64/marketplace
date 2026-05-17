"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Store,
  Globe,
  Clock,
  ChevronRight,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMerchantStats } from "@/queries/useAnalytics";
import { formatPrice } from "@/lib/format";

export default function MerchantDashboard() {
  const { data: profile } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get("/api/merchants/profile");
      return res.data;
    },
  });

  const { data: offersData } = useQuery({
    queryKey: ["merchant-offers"],
    queryFn: async () => {
      const res = await api.get("/api/merchants/catalogue", {
        params: { page: 1, limit: 20 },
      });
      return res.data;
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ["merchant-orders-incoming"],
    queryFn: async () => {
      const res = await api.get("/api/orders/merchant/incoming", {
        params: { status: "PENDING", limit: 5 },
      });
      return res.data;
    },
  });

  const { data: analyticsStats } = useMerchantStats();

  const offers = offersData?.items || offersData?.data || offersData || [];
  const orders = ordersData?.items || ordersData?.data || ordersData || [];

  const serverStats = offersData?.stats;
  const stats = {
    totalProducts: serverStats?.total ?? offersData?.total ?? offersData?.totalCount ?? offers.length,
    inMarket: serverStats?.onMarket ?? offers.filter((o: any) => o.publishToMarket).length,
    inStore: serverStats?.onStore ?? offers.filter((o: any) => o.publishToStore).length,
    pendingOrders: orders.length,
  };

  const storeName = profile?.storeName || profile?.StoreName || "My Store";
  const slug = profile?.slug || profile?.Slug;
  const plan = profile?.subscriptionPlan || profile?.Subscription?.Plan || profile?.subscription?.plan || "Basic";

  const revenueDisplay = analyticsStats
    ? formatPrice(analyticsStats.totalRevenue)
    : "—";

  const statCards = [
    {
      label: "Total Revenue",
      value: revenueDisplay,
      icon: DollarSign,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success-bg)]",
      href: "/merchant/analytics",
      isText: true,
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-[var(--info)]",
      bg: "bg-[var(--info-bg)]",
      href: "/merchant/catalogue",
      isText: false,
    },
    {
      label: "On Marketplace",
      value: stats.inMarket,
      icon: Globe,
      color: "text-[var(--charcoal-mid)]",
      bg: "bg-[var(--off-white-2)]",
      href: "/merchant/catalogue",
      isText: false,
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning-bg)]",
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
      color: "text-[var(--info)]",
      bg: "bg-[var(--info-bg)]",
    },
    {
      href: "/merchant/orders",
      label: "Orders",
      desc: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success-bg)]",
    },
    {
      href: `/store/${slug}`,
      label: "View My Store",
      desc: "Customer-facing view",
      icon: Store,
      color: "text-[var(--charcoal-mid)]",
      bg: "bg-[var(--off-white-2)]",
      external: true,
    },
    {
      href: "/merchant/analytics",
      label: "Analytics",
      desc: "Sales reports",
      icon: TrendingUp,
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning-bg)]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Welcome, {storeName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Here's your store overview
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5 hover:border-[var(--border-mid)] hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
                  {s.label}
                </p>
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className={`font-bold text-[var(--text-primary)] ${s.isText ? "text-xl" : "text-2xl"}`}>{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
            >
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-[var(--border-mid)] rounded-xl hover:border-[var(--border-strong)] hover:bg-[var(--bg-sunken)] transition-all cursor-pointer gap-2">
                <div className={`p-2 rounded-lg ${link.bg}`}>
                  <link.icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {link.label}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{link.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Recent Orders
            </h2>
            <Link href="/merchant/orders">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                View All <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {orders.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-sunken)] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    #{order.id?.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {new Date(order.createdAt).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                    ₺{order.totalAmount?.toLocaleString("en-US")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-[var(--off-white-2)] text-[var(--text-secondary)] capitalize">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Live Banner */}
      {slug && (
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            background: "var(--red-muted)",
            border: "1px solid var(--red-subtle)",
          }}
        >
          <div className="flex items-center gap-3">
            <Store
              className="w-5 h-5 flex-shrink-0"
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
