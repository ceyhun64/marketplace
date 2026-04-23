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
      label: "Toplam Sipariş",
      value: stats.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/orders",
    },
    {
      label: "Bekleyen Sipariş",
      value: stats.pendingOrders ?? 0,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-50",
      href: "/admin/orders",
    },
    {
      label: "Aktif Merchant",
      value: `${stats.activeMerchants ?? 0} / ${stats.totalMerchants ?? 0}`,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/merchants",
    },
    {
      label: "Toplam Gelir",
      value: `₺${(stats.totalRevenue ?? 0).toLocaleString("tr-TR")}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/analytics",
    },
    {
      label: "Toplam Ürün",
      value: stats.totalProducts ?? 0,
      icon: Package,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      href: "/admin/products",
    },
    {
      label: "Onay Bekleyen",
      value: stats.pendingProducts ?? 0,
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-50",
      href: "/admin/products",
    },
    {
      label: "Fulfillment Başarısı",
      value: `${stats.fulfillmentSuccessRate ?? 0}%`,
      icon: CheckCircle,
      color: "text-teal-600",
      bg: "bg-teal-50",
      href: "/admin/analytics",
    },
    {
      label: "Aktif Teslimat",
      value: 0,
      icon: Truck,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/admin/orders",
    },
  ];

  const quickLinks = [
    { href: "/admin/merchants", label: "Merchant Ekle", icon: Users },
    { href: "/admin/products", label: "Ürünleri Onayla", icon: Package },
    { href: "/admin/categories", label: "Kategoriler", icon: TrendingUp },
    { href: "/admin/couriers", label: "Kuryeler", icon: Truck },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform genel durumu</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer gap-2">
                  <link.icon className="w-6 h-6 text-gray-500" />
                  <span className="text-sm text-gray-600 text-center font-medium">
                    {link.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {(stats.pendingProducts ?? 0) > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-orange-800">
                  {stats.pendingProducts} ürün onay bekliyor
                </p>
                <p className="text-sm text-orange-600">
                  Merchant'ların ürünleri yayına girebilmek için onayınızı
                  bekliyor
                </p>
              </div>
            </div>
            <Link href="/admin/products">
              <Badge className="bg-orange-500 hover:bg-orange-600 cursor-pointer">
                İncele →
              </Badge>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
