"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  categoryName: string;
  offerCount: number;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending">("all");

  const load = () => {
    setLoading(true);
    const url =
      tab === "pending"
        ? "/api/admin/products/pending"
        : "/api/products?limit=100";
    api
      .get<{ items?: Product[]; data?: Product[] } | Product[]>(url)
      .then((r) => {
        const d = r.data;
        if (Array.isArray(d)) setProducts(d);
        else setProducts((d as { items?: Product[] }).items ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleApprove = async (id: string) => {
    await api.patch(`/api/admin/products/${id}/approve`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-500 mt-1">Master katalog yönetimi</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          + Ürün Ekle
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "pending"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "all" ? "Tüm Ürünler" : "Onay Bekleyen"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Yükleniyor...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Ürün bulunamadı
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {[
                  "Ürün Adı",
                  "Kategori",
                  "Teklif Sayısı",
                  "Durum",
                  "Eklenme",
                  "İşlem",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.categoryName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.offerCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.isApproved
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {p.isApproved ? "Onaylı" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    {!p.isApproved && (
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Onayla
                      </button>
                    )}
                    <button className="text-xs text-gray-500 hover:underline">
                      Düzenle
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
