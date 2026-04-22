"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatPrice, formatDate } from "@/lib/format";
import type { Product } from "@/types/entities";

interface Props {
  products: Product[];
  loading?: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (
    id: string,
    field: "publishToMarket" | "publishToStore",
    value: boolean,
  ) => void;
}

export default function ProductCatalogueTable({
  products,
  loading,
  onEdit,
  onDelete,
  onTogglePublish,
}: Props) {
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (
    id: string,
    field: "publishToMarket" | "publishToStore",
    value: boolean,
  ) => {
    setToggling(`${id}-${field}`);
    try {
      await onTogglePublish(id, field, value);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {[
                "Ürün",
                "Fiyat",
                "Stok",
                "Pazaryeri",
                "E-Mağaza",
                "Durum",
                "İşlem",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm font-medium text-gray-700">
          Henüz ürün eklenmedi
        </p>
        <p className="text-xs text-gray-400 mt-1">
          İlk ürününüzü eklemek için "Yeni Ürün" butonuna tıklayın.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-[#7A7060] uppercase tracking-wide">
          <tr>
            {[
              "Ürün",
              "Fiyat",
              "Stok",
              "Pazaryeri",
              "E-Mağaza",
              "Durum",
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
            <tr key={p.id} className="hover:bg-[#F5F2EB]/40 transition-colors">
              {/* Ürün */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0D0D0D] truncate max-w-[180px]">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-[#7A7060] font-mono truncate">
                      {p.categoryName ?? "—"}
                    </p>
                  </div>
                </div>
              </td>

              {/* Fiyat */}
              <td className="px-4 py-3 font-semibold text-[#0D0D0D] font-serif">
                {formatPrice(p.price)}
              </td>

              {/* Stok */}
              <td className="px-4 py-3">
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.stock === 0
                      ? "bg-red-50 text-red-600"
                      : p.stock < 10
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-green-50 text-green-700"
                  }`}
                >
                  {p.stock} adet
                </span>
              </td>

              {/* Pazaryeri Toggle */}
              <td className="px-4 py-3">
                <Switch
                  checked={p.publishToMarket}
                  disabled={toggling === `${p.id}-publishToMarket`}
                  onCheckedChange={(v) =>
                    handleToggle(p.id, "publishToMarket", v)
                  }
                  className="data-[state=checked]:bg-[#C84B2F]"
                />
              </td>

              {/* E-Mağaza Toggle */}
              <td className="px-4 py-3">
                <Switch
                  checked={p.publishToStore}
                  disabled={toggling === `${p.id}-publishToStore`}
                  onCheckedChange={(v) =>
                    handleToggle(p.id, "publishToStore", v)
                  }
                  className="data-[state=checked]:bg-[#1A4A6B]"
                />
              </td>

              {/* Durum */}
              <td className="px-4 py-3">
                {p.isApproved ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                    Onaylı
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">
                    İncelemede
                  </span>
                )}
              </td>

              {/* İşlem */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-xs text-[#1A4A6B] hover:underline font-medium"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
