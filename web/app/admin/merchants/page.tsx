"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Merchant {
  id: string;
  storeName: string;
  slug: string;
  userEmail: string;
  isActive: boolean;
  subscriptionPlan: string;
  createdAt: string;
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<Merchant[]>("/api/admin/merchants")
      .then((r) => setMerchants(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSuspend = async (id: string) => {
    await api.patch(`/api/admin/merchants/${id}/suspend`);
    load();
  };

  const filtered = merchants.filter(
    (m) =>
      m.storeName.toLowerCase().includes(search.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant'lar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {merchants.length} kayıtlı satıcı
          </p>
        </div>
        <button
          onClick={() => {
            /* TODO: open create modal */
          }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Merchant Ekle
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mağaza adı veya e-posta ara..."
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {search ? "Sonuç bulunamadı" : "Henüz merchant yok"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {[
                  "Mağaza",
                  "E-posta",
                  "Plan",
                  "Durum",
                  "Kayıt Tarihi",
                  "İşlem",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.storeName}
                    <span className="ml-1 text-xs text-gray-400">
                      /{m.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.userEmail}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {m.subscriptionPlan ?? "Basic"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {m.isActive ? "Aktif" : "Askıya Alındı"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSuspend(m.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {m.isActive ? "Askıya Al" : "Aktifleştir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
