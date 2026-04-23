"use client";

import dynamic from "next/dynamic";

// Recharts SSR'da DOM manipülasyonu yapıp hydration uyumsuzluğuna yol açıyor.
// ssr: false ile yalnızca client-side render edilmesini sağlıyoruz.
const RevenueChart = dynamic(() => import("@/components/modules/charts/AdminRevenueChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const OrderChart = dynamic(() => import("@/components/modules/charts/AdminOrderChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const SourceChart = dynamic(() => import("@/components/modules/charts/AdminSourceChart"), {
  ssr: false,
  loading: () => (
    <div className="w-[180px] h-[180px] bg-gray-100 rounded-full animate-pulse mx-auto" />
  ),
});

function ChartSkeleton() {
  return (
    <div className="w-full h-[200px] bg-gray-100 rounded-lg animate-pulse" />
  );
}

const revenueData = [
  { gun: "Pzt", gelir: 18400 },
  { gun: "Sal", gelir: 22100 },
  { gun: "Çar", gelir: 19800 },
  { gun: "Per", gelir: 31200 },
  { gun: "Cum", gelir: 27500 },
  { gun: "Cmt", gelir: 14200 },
  { gun: "Paz", gelir: 11800 },
];

const orderData = [
  { gun: "Pzt", siparis: 84 },
  { gun: "Sal", siparis: 103 },
  { gun: "Çar", siparis: 91 },
  { gun: "Per", siparis: 142 },
  { gun: "Cum", siparis: 128 },
  { gun: "Cmt", siparis: 67 },
  { gun: "Paz", siparis: 54 },
];

export const sourceData = [
  { name: "Marketplace", value: 68, color: "#3b82f6" },
  { name: "E-Mağaza", value: 32, color: "#10b981" },
];

const topMerchants = [
  { ad: "TechStore Türkiye", satis: 312, gelir: "₺1.42M", oran: 92 },
  { ad: "Moda Dünyası", satis: 198, gelir: "₺487K", oran: 74 },
  { ad: "Ev & Yaşam Pro", satis: 143, gelir: "₺321K", oran: 61 },
  { ad: "Spor Merkezi", satis: 97, gelir: "₺198K", oran: 48 },
  { ad: "Kitap Dünyası", satis: 64, gelir: "₺89K", oran: 31 },
];

const stats = [
  { baslik: "Toplam GMV", deger: "₺2.51M", degisim: "+18.4%", artis: true },
  { baslik: "Aktif Merchant", deger: "47", degisim: "+3", artis: true },
  { baslik: "Günlük Sipariş", deger: "669", degisim: "+12.1%", artis: true },
  {
    baslik: "Fulfillment Başarı",
    deger: "%94.3",
    degisim: "-0.8%",
    artis: false,
  },
];

// API bağlantıları:
// GET /api/analytics/admin/overview    → stats
// GET /api/analytics/admin/revenue     → revenueData
// GET /api/analytics/admin/fulfillment → fulfillment metrics

export { revenueData, orderData };

export default function AdminAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Platform Analitikleri
        </h1>
        <p className="text-sm text-gray-500 mt-1">Son 7 günlük özet</p>
      </div>

      {/* KPI Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.baslik}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {s.baslik}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{s.deger}</p>
            <p
              className={`text-xs mt-1 font-medium ${s.artis ? "text-emerald-600" : "text-red-500"}`}
            >
              {s.degisim} bu hafta
            </p>
          </div>
        ))}
      </div>

      {/* Gelir + Sipariş Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Haftalık Gelir (₺)
          </h2>
          <RevenueChart data={revenueData} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Haftalık Sipariş Adedi
          </h2>
          <OrderChart data={orderData} />
        </div>
      </div>

      {/* Kaynak Dağılımı + Top Merchantlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 self-start">
            Sipariş Kaynağı
          </h2>
          <SourceChart data={sourceData} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            En İyi Merchantlar
          </h2>
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <div key={m.ad} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {m.ad}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 ml-2">
                      {m.gelir}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${m.oran}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {m.satis} satış
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
