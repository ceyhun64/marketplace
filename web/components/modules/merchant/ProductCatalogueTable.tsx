"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

function PublishToggle({
  checked,
  disabled,
  onChange,
  activeColor,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--red) focus-visible:ring-offset-1 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${checked ? activeColor : "bg-(--off-white-3)]"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.75"
        }`}
      />
    </button>
  );
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
      <div className="bg-(--bg-surface)] border border-(--border-light)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken)] border-b border-(--border-light)]">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-(--text-tertiary)] uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-subtle)">
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
      <div className="bg-(--bg-surface)] border border-(--border-light)] rounded-xl p-16 text-center">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm font-semibold text-(--text-secondary)]">No products yet</p>
        <p className="text-xs text-(--text-tertiary)] mt-1">
          Click "New Product" to add your first product.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface)] border border-(--border-light)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-(--bg-sunken)] border-b border-(--border-light)]">
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-(--text-tertiary)] uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border-subtle)">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-(--bg-sunken)] transition-colors">
              {/* Product */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-(--border-light)] bg-(--bg-sunken)] flex items-center justify-center overflow-hidden shrink-0">
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
                    <p className="font-medium text-(--text-primary) truncate max-w-45">
                      {p.name}
                    </p>
                    <p className="text-xs text-(--text-tertiary)] truncate">
                      {p.categoryName ?? "—"}
                    </p>
                  </div>
                </div>
              </td>

              {/* Price */}
              <td className="px-4 py-3 font-semibold text-(--text-primary)]">
                {formatPrice(p.price)}
              </td>

              {/* Stock */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.stock === 0
                      ? "bg-(--danger-bg)] text-(--danger)]"
                      : p.stock < 10
                        ? "bg-(--warning-bg)] text-(--warning)]"
                        : "bg-(--success-bg)] text-(--success)]"
                  }`}
                >
                  {p.stock} pcs
                </span>
              </td>

              {/* Marketplace Toggle */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <PublishToggle
                    checked={p.publishToMarket}
                    disabled={toggling === `${p.id}-publishToMarket`}
                    onChange={(v) => handleToggle(p.id, "publishToMarket", v)}
                    activeColor="bg-(--info)]"
                  />
                  <span className={`text-xs font-medium ${p.publishToMarket ? "text-(--info)]" : "text-(--text-tertiary)]"}`}>
                    {p.publishToMarket ? "On" : "Off"}
                  </span>
                </div>
              </td>

              {/* E-Store Toggle */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <PublishToggle
                    checked={p.publishToStore}
                    disabled={toggling === `${p.id}-publishToStore`}
                    onChange={(v) => handleToggle(p.id, "publishToStore", v)}
                    activeColor="bg-(--success)]"
                  />
                  <span className={`text-xs font-medium ${p.publishToStore ? "text-(--success)]" : "text-(--text-tertiary)]"}`}>
                    {p.publishToStore ? "On" : "Off"}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                {p.isApproved ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-(--success-bg)] text-(--success)]">
                    Approved
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-(--warning-bg)] text-(--warning)]">
                    Under Review
                  </span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-xs text-(--info)] hover:underline font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-xs text-(--danger)] hover:text-(--red-dark)] transition-colors"
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
