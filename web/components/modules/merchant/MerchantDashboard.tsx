"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Store,
  Globe,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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
      const res = await api.get("/api/merchants/offers");
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

  const offers = offersData?.items || offersData || [];
  const orders = ordersData?.items || ordersData || [];

  const stats = {
    totalProducts: offers.length,
    inMarket: offers.filter((o: any) => o.publishToMarket).length,
    inStore: offers.filter((o: any) => o.publishToStore).length,
    pendingOrders: orders.length,
  };

  const storeName = profile?.storeName || "My Store";
  const slug = profile?.slug;
  const plan = profile?.subscriptionPlan || "Basic";

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/merchant/catalogue",
    },
    {
      label: "On Marketplace",
      value: stats.inMarket,
      icon: Globe,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/merchant/catalogue",
    },
    {
      label: "In E-Store",
      value: stats.inStore,
      icon: Store,
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/merchant/catalogue",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/merchant/orders",
    },
  ];

  const quickLinks = [
    {
      href: "/merchant/catalogue",
      label: "Add Product",
      desc: "New product & pricing",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      href: "/merchant/orders",
      label: "Orders",
      desc: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      href: `/store/${slug}`,
      label: "View My Store",
      desc: "Customer-facing view",
      icon: Store,
      color: "text-violet-600",
      bg: "bg-violet-50",
      external: true,
    },
    {
      href: "/merchant/analytics",
      label: "Analytics",
      desc: "Sales reports",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {storeName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's your store overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              plan === "Enterprise"
                ? "border-violet-300 text-violet-700 bg-violet-50"
                : plan === "Pro"
                  ? "border-blue-300 text-blue-700 bg-blue-50"
                  : "border-gray-300 text-gray-600 bg-gray-50"
            }`}
          >
            {plan} Plan
          </span>
          {plan === "Basic" && (
            <Link href="/merchant/subscription">
              <Button size="sm" variant="outline" className="text-xs h-7">
                Upgrade →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {s.label}
                </p>
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
            >
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer gap-2">
                <div className={`p-2 rounded-lg ${link.bg}`}>
                  <link.icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700">
                    {link.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Recent Orders
            </h2>
            <Link href="/merchant/orders">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                View All <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.id?.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-gray-900">
                    ₺{order.totalAmount?.toLocaleString("en-US")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600 capitalize">
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800 text-sm">
                Your E-Store is Live
              </p>
              <p className="text-xs text-blue-600">
                marketplace.com/store/{slug}
              </p>
            </div>
          </div>
          <Link href={`/store/${slug}`} target="_blank">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              Visit Store
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
