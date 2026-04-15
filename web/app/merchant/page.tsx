"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface MerchantStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalOffers: number;
  marketplaceOrders: number;
  estoreOrders: number;
}

export default function MerchantDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<MerchantStats>("/api/analytics/merchant/sales")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Toplam Sipariş",
      value: stats?.totalOrders,
      color: "text-blue-700 bg-blue-50",
    },
    {
      label: "Bekleyen",
      value: stats?.pendingOrders,
      color: "text-yellow-700 bg-yellow-50",
    },
    {
      label: "Gelir",
      value: stats?.totalRevenue
        ? `₺${stats.totalRevenue.toLocaleString("tr-TR")}`
        : "-",
      color: "text-green-700 bg-green-50",
    },
    {
      label: "Aktif Teklif",
      value: stats?.totalOffers,
      color: "text-purple-700 bg-purple-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hoş geldin{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Mağazanızın güncel durumu</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {cards.map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <p className="text-xs text-gray-500 mb-2">{label}</p>
              <p
                className={`text-2xl font-bold px-2 py-0.5 rounded inline-block ${color}`}
              >
                {value ?? "-"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Hızlı işlemler */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/merchant/catalogue"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors group"
        >
          <p className="font-semibold text-gray-900 group-hover:text-gray-700">
            Katalog & Teklifler →
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ürün fiyatlarını, stoklarını ve yayın durumlarını yönet
          </p>
        </Link>
        <Link
          href="/merchant/orders"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors group"
        >
          <p className="font-semibold text-gray-900 group-hover:text-gray-700">
            Gelen Siparişler →
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Yeni siparişleri görüntüle ve hazırlığını onayla
          </p>
        </Link>
      </div>
    </div>
  );
}
