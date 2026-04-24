"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalMerchants: number;
  activeMerchants: number;
  totalRevenue: number;
  totalProducts: number;
  pendingProducts: number;
  fulfillmentSuccessRate: number;
  recentOrders?: any[];
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/api/admin/dashboard");
      return res.data as DashboardStats;
    },
  });

  const stats = data || ({} as DashboardStats);

  const cards = [
    {
      label: "Total Orders",
      value: stats.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/orders",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/orders",
    },
    {
      label: "Active Merchants",
      value: `${stats.activeMerchants ?? 0} / ${stats.totalMerchants ?? 0}`,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/admin/merchants",
    },
    {
      label: "Total Revenue",
      value: `₺${(stats.totalRevenue ?? 0).toLocaleString("en-US")}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/analytics",
    },
    {
      label: "Total Products",
      value: stats.totalProducts ?? 0,
      icon: Package,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      href: "/admin/products",
    },
    {
      label: "Pending Approval",
      value: stats.pendingProducts ?? 0,
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-50",
      href: "/admin/products",
    },
    {
      label: "Fulfillment Rate",
      value: `${stats.fulfillmentSuccessRate ?? 0}%`,
      icon: CheckCircle,
      color: "text-teal-600",
      bg: "bg-teal-50",
      href: "/admin/analytics",
    },
    {
      label: "Active Deliveries",
      value: 0,
      icon: Truck,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/admin/orders",
    },
  ];

  const quickLinks = [
    { href: "/admin/merchants", label: "Add Merchant", icon: Users },
    {
      href: "/admin/products/pending",
      label: "Review Products",
      icon: Package,
    },
    { href: "/admin/categories", label: "Categories", icon: TrendingUp },
    { href: "/admin/couriers", label: "Couriers", icon: Truck },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform overview & key metrics
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-7 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
                <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {card.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer gap-2">
                <link.icon className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-600 text-center font-medium">
                  {link.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alert */}
      {(stats.pendingProducts ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 text-sm">
                {stats.pendingProducts} products awaiting review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Merchant products are waiting for your approval before going
                live.
              </p>
            </div>
          </div>
          <Link href="/admin/products/pending">
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              Review →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
