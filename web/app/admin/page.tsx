"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalMerchants: number;
  totalCouriers: number;
  pendingOrders: number;
  deliveredToday: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/api/admin/dashboard")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Toplam Sipariş",
      value: stats?.totalOrders,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Toplam Gelir",
      value: stats?.totalRevenue
        ? `₺${stats.totalRevenue.toLocaleString("tr-TR")}`
        : "-",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Bekleyen Sipariş",
      value: stats?.pendingOrders,
      color: "bg-yellow-50 text-yellow-700",
    },
    {
      label: "Bugün Teslim",
      value: stats?.deliveredToday,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "Toplam Merchant",
      value: stats?.totalMerchants,
      color: "bg-orange-50 text-orange-700",
    },
    {
      label: "Aktif Kurye",
      value: stats?.totalCouriers,
      color: "bg-gray-100 text-gray-700",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform geneli özet</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {cards.map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <p className="text-sm text-gray-500 mb-2">{label}</p>
              <p
                className={`text-3xl font-bold px-2 py-0.5 rounded inline-block ${color}`}
              >
                {value ?? "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
