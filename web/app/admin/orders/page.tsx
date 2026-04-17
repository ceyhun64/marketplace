"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  merchantName: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  status: string;
  source: "MARKETPLACE" | "ESTORE";
  shippingRate: "EXPRESS" | "REGULAR";
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  PAYMENT_CONFIRMED: "Ödeme Onaylı",
  LABEL_GENERATED: "Etiket Hazır",
  COURIER_ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Teslim Alındı",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAYMENT_CONFIRMED: "bg-blue-100 text-blue-700",
  LABEL_GENERATED: "bg-indigo-100 text-indigo-700",
  COURIER_ASSIGNED: "bg-purple-100 text-purple-700",
  PICKED_UP: "bg-orange-100 text-orange-700",
  IN_TRANSIT: "bg-sky-100 text-sky-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await api.get<Order[]>(`/orders/admin/all${params}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleStatusUpdate() {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });
      setSelectedOrder(null);
      await load();
    } catch {
      alert("Durum güncellenemedi.");
    } finally {
      setUpdating(false);
    }
  }

  const filters = [
    { value: "all", label: "Tümü" },
    { value: "PENDING", label: "Bekliyor" },
    { value: "PAYMENT_CONFIRMED", label: "Ödeme Onaylı" },
    { value: "IN_TRANSIT", label: "Yolda" },
    { value: "DELIVERED", label: "Teslim Edildi" },
    { value: "FAILED", label: "Başarısız" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">Tüm platform siparişleri</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-1">Durum Güncelle</h3>
            <p className="text-sm text-gray-500 mb-4">
              Sipariş #{selectedOrder.id.slice(0, 8).toUpperCase()}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mevcut Durum
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  STATUS_COLORS[selectedOrder.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
              </span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yeni Durum
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Durum seçin...</option>
                {ALL_STATUSES.filter((s) => s !== selectedOrder.status).map(
                  (s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setNewStatus("");
                }}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updating}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {updating ? "Güncelleniyor..." : "Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
          Yükleniyor...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-lg">Sipariş bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Sipariş No
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Müşteri
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Satıcı
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Kaynak
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Durum
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Tutar
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Tarih
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4 font-mono text-xs font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-gray-400">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {order.merchantName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {order.source === "MARKETPLACE"
                          ? "Marketplace"
                          : "E-Mağaza"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[order.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {order.totalAmount.toLocaleString("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      })}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus("");
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Durum Güncelle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
