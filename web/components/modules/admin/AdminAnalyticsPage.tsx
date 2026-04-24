"use client";

import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/modules/charts/AdminRevenueChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);
const OrderChart = dynamic(
  () => import("@/components/modules/charts/AdminOrderChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);
const SourceChart = dynamic(
  () => import("@/components/modules/charts/AdminSourceChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-[180px] h-[180px] bg-gray-100 rounded-full animate-pulse mx-auto" />
    ),
  },
);

function ChartSkeleton() {
  return (
    <div className="w-full h-[200px] bg-gray-100 rounded-lg animate-pulse" />
  );
}

const revenueData = [
  { gun: "Mon", gelir: 18400 },
  { gun: "Tue", gelir: 22100 },
  { gun: "Wed", gelir: 19800 },
  { gun: "Thu", gelir: 31200 },
  { gun: "Fri", gelir: 27500 },
  { gun: "Sat", gelir: 14200 },
  { gun: "Sun", gelir: 11800 },
];

const orderData = [
  { gun: "Mon", siparis: 84 },
  { gun: "Tue", siparis: 103 },
  { gun: "Wed", siparis: 91 },
  { gun: "Thu", siparis: 142 },
  { gun: "Fri", siparis: 128 },
  { gun: "Sat", siparis: 67 },
  { gun: "Sun", siparis: 54 },
];

export const sourceData = [
  { name: "Marketplace", value: 68, color: "#3b82f6" },
  { name: "E-Store", value: 32, color: "#10b981" },
];

const topMerchants = [
  { ad: "TechStore Global", satis: 312, gelir: "₺1.42M", oran: 92 },
  { ad: "Fashion World", satis: 198, gelir: "₺487K", oran: 74 },
  { ad: "Home & Living Pro", satis: 143, gelir: "₺321K", oran: 61 },
  { ad: "Sports Center", satis: 97, gelir: "₺198K", oran: 48 },
  { ad: "Book Universe", satis: 64, gelir: "₺89K", oran: 31 },
];

const stats = [
  { baslik: "Total GMV", deger: "₺2.51M", degisim: "+18.4%", artis: true },
  { baslik: "Active Merchants", deger: "47", degisim: "+3", artis: true },
  { baslik: "Daily Orders", deger: "669", degisim: "+12.1%", artis: true },
  {
    baslik: "Fulfillment Rate",
    deger: "94.3%",
    degisim: "-0.8%",
    artis: false,
  },
];

export { revenueData, orderData };

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Last 7 days platform summary
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.baslik}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              {s.baslik}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{s.deger}</p>
            <p
              className={`text-xs mt-1 font-medium ${s.artis ? "text-emerald-600" : "text-rose-500"}`}
            >
              {s.degisim} this week
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Weekly Revenue (₺)
          </h2>
          <RevenueChart data={revenueData} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Weekly Orders
          </h2>
          <OrderChart data={orderData} />
        </div>
      </div>

      {/* Source + Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 self-start">
            Order Source
          </h2>
          <SourceChart data={sourceData} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Top Merchants
          </h2>
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <div key={m.ad} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">
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
                      className="h-full bg-gray-900 rounded-full"
                      style={{ width: `${m.oran}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-14 text-right">
                  {m.satis} sales
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
