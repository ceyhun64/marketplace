"use client";

import MerchantSalesChart from "@/components/modules/charts/MerchantSalesChart";

const salesData = [
  { gun: "Mon", marketplace: 3200, estore: 1100 },
  { gun: "Tue", marketplace: 4100, estore: 1800 },
  { gun: "Wed", marketplace: 2900, estore: 900 },
  { gun: "Thu", marketplace: 5800, estore: 2100 },
  { gun: "Fri", marketplace: 4700, estore: 1600 },
  { gun: "Sat", marketplace: 2100, estore: 700 },
  { gun: "Sun", marketplace: 1600, estore: 500 },
];

const topProducts = [
  { name: "Samsung Galaxy S24", sales: 42, revenue: "₺188.9K", trend: "+12%" },
  { name: "Apple iPhone 16 Pro", sales: 28, revenue: "₺153.9K", trend: "+8%" },
  { name: "MacBook Air M3", sales: 15, revenue: "₺101.9K", trend: "+3%" },
  { name: "Lenovo ThinkPad X1", sales: 11, revenue: "₺74.7K", trend: "-2%" },
  { name: "Nike Air Max 2024", sales: 8, revenue: "₺35.9K", trend: "+19%" },
];

const comparison = [
  { label: "Total Revenue", marketplace: "₺312K", estore: "₺148K" },
  { label: "Order Count", marketplace: "104", estore: "49" },
  { label: "Avg. Order Value", marketplace: "₺3,000", estore: "₺3,020" },
  { label: "Conversion Rate", marketplace: "2.1%", estore: "4.8%" },
];

const kpis = [
  { label: "Weekly Revenue", value: "₺24.4K", change: "+14.2%", up: true },
  { label: "Total Orders", value: "153", change: "+9", up: true },
  { label: "Active Offers", value: "6", change: "0", up: true },
  { label: "Avg. Rating", value: "4.7", change: "+0.1", up: true },
];

export default function MerchantAnalyticsDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Last 7 days performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              {k.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{k.value}</p>
            <p
              className={`text-xs mt-1 font-medium ${k.up ? "text-emerald-600" : "text-rose-500"}`}
            >
              {k.change} this week
            </p>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Marketplace vs E-Store Revenue (₺)
          </h2>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Marketplace
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              E-Store
            </span>
          </div>
        </div>
        <MerchantSalesChart data={salesData} />
      </div>

      {/* Channel Comparison + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Channel Comparison
          </h2>
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Metric</span>
              <span className="text-center">Marketplace</span>
              <span className="text-right">E-Store</span>
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

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Top Products
          </h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.sales} sold · {p.revenue}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${p.trend.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}
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
