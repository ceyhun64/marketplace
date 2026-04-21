"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Store,
  Globe,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function MerchantDashboardPage() {
  const { data: profile } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get("/api/merchant/profile");
      return res.data;
    },
  });

  const { data: offersData } = useQuery({
    queryKey: ["merchant-offers"],
    queryFn: async () => {
      const res = await api.get("/api/merchant/offers");
      return res.data;
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ["merchant-orders-incoming"],
    queryFn: async () => {
      const res = await api.get("/api/orders/incoming", {
        params: { status: "placed", limit: 5 },
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

  const storeName = profile?.storeName || "Mağazam";
  const slug = profile?.slug;
  const plan = profile?.subscriptionPlan || "Basic";

  const quickLinks = [
    {
      href: "/merchant/catalogue",
      label: "Ürün Ekle",
      desc: "Yeni ürün ve fiyat",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      href: "/merchant/orders",
      label: "Siparişler",
      desc: `${stats.pendingOrders} bekleyen`,
      icon: ShoppingCart,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      href: `/store/${slug}`,
      label: "Mağazamı Gör",
      desc: "Müşteri görünümü",
      icon: Store,
      color: "text-purple-600",
      bg: "bg-purple-50",
      external: true,
    },
    {
      href: "/merchant/analytics",
      label: "Analizler",
      desc: "Satış raporları",
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Merhaba, {storeName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            İşte bugünkü özet bilgileriniz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              plan === "Enterprise"
                ? "border-purple-300 text-purple-700"
                : plan === "Pro"
                  ? "border-blue-300 text-blue-700"
                  : "border-gray-300 text-gray-600"
            }
          >
            {plan} Plan
          </Badge>
          {plan === "Basic" && (
            <Link href="/merchant/subscription">
              <Button size="sm" variant="outline" className="text-xs h-7">
                Yükselt →
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Ürün",
            value: stats.totalProducts,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Marketplace'de",
            value: stats.inMarket,
            icon: Globe,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "E-Mağazada",
            value: stats.inStore,
            icon: Store,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Bekleyen Sipariş",
            value: stats.pendingOrders,
            icon: Clock,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target={link.external ? "_blank" : undefined}
          >
            <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${link.bg}`}>
                  <link.icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{link.label}</p>
                  <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {orders.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Son Siparişler</CardTitle>
            <Link href="/merchant/orders">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Tümünü Gör <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {orders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      #{order.id?.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">
                      ₺{order.totalAmount?.toLocaleString("tr-TR")}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {slug && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">E-Mağazanız Yayında</p>
                <p className="text-sm text-blue-600">
                  marketplace.com/store/{slug}
                </p>
              </div>
            </div>
            <Link href={`/store/${slug}`} target="_blank">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Mağazayı Ziyaret Et
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
