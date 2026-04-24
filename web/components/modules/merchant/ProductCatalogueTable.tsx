"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/format";
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

const HEADERS = [
  "Product",
  "Price",
  "Stock",
  "Marketplace",
  "E-Store",
  "Status",
  "Actions",
];

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
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
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
      <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm font-semibold text-gray-700">No products yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Click "New Product" to add your first product.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
              {/* Product */}
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
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {p.categoryName ?? "—"}
                    </p>
                  </div>
                </div>
              </td>

              {/* Price */}
              <td className="px-4 py-3 font-semibold text-gray-900">
                {formatPrice(p.price)}
              </td>

              {/* Stock */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.stock === 0
                      ? "bg-red-50 text-red-600"
                      : p.stock < 10
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {p.stock} pcs
                </span>
              </td>

              {/* Marketplace Toggle */}
              <td className="px-4 py-3">
                <Switch
                  checked={p.publishToMarket}
                  disabled={toggling === `${p.id}-publishToMarket`}
                  onCheckedChange={(v) =>
                    handleToggle(p.id, "publishToMarket", v)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </td>

              {/* E-Store Toggle */}
              <td className="px-4 py-3">
                <Switch
                  checked={p.publishToStore}
                  disabled={toggling === `${p.id}-publishToStore`}
                  onCheckedChange={(v) =>
                    handleToggle(p.id, "publishToStore", v)
                  }
                  className="data-[state=checked]:bg-violet-600"
                />
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                {p.isApproved ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                    Approved
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                    Under Review
                  </span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
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
