"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { gun: "Pzt", marketplace: 3200, estore: 1100 },
  { gun: "Sal", marketplace: 4100, estore: 1800 },
  { gun: "Çar", marketplace: 2900, estore: 900 },
  { gun: "Per", marketplace: 5800, estore: 2100 },
  { gun: "Cum", marketplace: 4700, estore: 1600 },
  { gun: "Cmt", marketplace: 2100, estore: 700 },
  { gun: "Paz", marketplace: 1600, estore: 500 },
];

const topProducts = [
  { ad: "Samsung Galaxy S24", satis: 42, gelir: "₺188.9K", trend: "+12%" },
  { ad: "Apple iPhone 16 Pro", satis: 28, gelir: "₺153.9K", trend: "+8%" },
  { ad: "MacBook Air M3", satis: 15, gelir: "₺101.9K", trend: "+3%" },
  { ad: "Lenovo ThinkPad X1", satis: 11, gelir: "₺74.7K", trend: "-2%" },
  { ad: "Nike Air Max 2024", satis: 8, gelir: "₺35.9K", trend: "+19%" },
];

const comparison = [
  { label: "Toplam Gelir", marketplace: "₺312K", estore: "₺148K" },
  { label: "Sipariş Sayısı", marketplace: "104", estore: "49" },
  { label: "Ort. Sipariş Değeri", marketplace: "₺3.000", estore: "₺3.020" },
  { label: "Dönüşüm Oranı", marketplace: "%2.1", estore: "%4.8" },
];

const kpis = [
  { baslik: "Bu Hafta Gelir", deger: "₺24.4K", degisim: "+14.2%", artis: true },
  { baslik: "Toplam Sipariş", deger: "153", degisim: "+9", artis: true },
  { baslik: "Aktif Teklif", deger: "6", degisim: "0", artis: true },
  { baslik: "Ort. Puan", deger: "4.7", degisim: "+0.1", artis: true },
];

// API bağlantıları:
// GET /api/analytics/merchant/sales       → salesData
// GET /api/analytics/merchant/comparison  → comparison
// GET /api/analytics/merchant/top-products → topProducts

export default function MerchantAnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Mağaza Analitikleri
        </h1>
        <p className="text-sm text-gray-500 mt-1">Son 7 günlük performans</p>
      </div>

      {/* KPI Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.baslik}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {k.baslik}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{k.deger}</p>
            <p
              className={`text-xs mt-1 font-medium ${k.artis ? "text-emerald-600" : "text-red-500"}`}
            >
              {k.degisim} bu hafta
            </p>
          </div>
        ))}
      </div>

      {/* Satış Grafiği */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Marketplace vs E-Mağaza Geliri (₺)
          </h2>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Marketplace
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              E-Mağaza
            </span>
          </div>
        </div>
        {mounted && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="storeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v, n) => [
                  `₺${Number(v).toLocaleString("tr-TR")}`,
                  n === "marketplace" ? "Marketplace" : "E-Mağaza",
                ]}
              />
              <Area
                type="monotone"
                dataKey="marketplace"
                stroke="#3b82f6"
                fill="url(#mktGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="estore"
                stroke="#10b981"
                fill="url(#storeGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Karşılaştırma + Top Ürünler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Kanal Karşılaştırması
          </h2>
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Metrik</span>
              <span className="text-center">Marketplace</span>
              <span className="text-right">E-Mağaza</span>
            </div>
            {comparison.map((c) => (
              <div key={c.label} className="grid grid-cols-3 py-3 text-sm">
                <span className="text-gray-600">{c.label}</span>
                <span className="text-center font-semibold text-blue-600">
                  {c.marketplace}
                </span>
                <span className="text-right font-semibold text-emerald-600">
                  {c.estore}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            En Çok Satan Ürünler
          </h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.ad} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {p.ad}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.satis} adet · {p.gelir}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${p.trend.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}
                >
                  {p.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
