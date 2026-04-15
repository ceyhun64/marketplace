"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Order {
  id: string;
  customerName: string;
  items: { productName: string; quantity: number }[];
  totalAmount: number;
  status: string;
  source: "MARKETPLACE" | "ESTORE";
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  PAYMENT_CONFIRMED: "Ödeme Onaylı",
  LABEL_GENERATED: "Etiket Hazır",
  COURIER_ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Teslim Alındı",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PAYMENT_CONFIRMED: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-600",
};

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    api
      .get<{ items?: Order[] } | Order[]>(
        `/api/orders/merchant/incoming${params}`,
      )
      .then((r) => {
        const d = r.data;
        setOrders(
          Array.isArray(d) ? d : ((d as { items?: Order[] }).items ?? []),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handlePack = async (id: string) => {
    await api.patch(`/api/orders/${id}/pack`);
    load();
  };

  const filters = [
    { value: "all", label: "Tümü" },
    { value: "PENDING", label: "Bekleyen" },
    { value: "PAYMENT_CONFIRMED", label: "Hazırlanacak" },
    { value: "DELIVERED", label: "Teslim Edildi" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
        <p className="text-sm text-gray-500 mt-1">Gelen siparişleri yönetin</p>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">
            Yükleniyor...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">
            Sipariş bulunamadı
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-gray-900">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {o.source === "MARKETPLACE" ? "Marketplace" : "E-Mağaza"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {o.customerName} ·{" "}
                  {o.items
                    ?.map((i) => `${i.productName} (x${i.quantity})`)
                    .join(", ")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(o.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-900">
                  ₺{o.totalAmount?.toLocaleString("tr-TR")}
                </span>
                {o.status === "PAYMENT_CONFIRMED" && (
                  <button
                    onClick={() => handlePack(o.id)}
                    className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                  >
                    Hazırlandı ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
