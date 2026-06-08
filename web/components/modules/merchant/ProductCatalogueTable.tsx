"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { Package } from "lucide-react";
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

const HEADERS = ["Product", "Price", "Stock", "Marketplace", "E-Store", "Status", "Actions"];

// -- Toggle switch -------------------------------------------------------------

interface PublishToggleProps {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  activeColor: string;
}

function PublishToggle({ checked, disabled, onChange, activeColor }: PublishToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--red) focus-visible:ring-offset-1 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${checked ? activeColor : "bg-(--off-white-3)"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.75"
        }`}
      />
    </button>
  );
}

// -- Stock badge ---------------------------------------------------------------

function StockBadge({ stock }: { stock: number }) {
  const cls =
    stock === 0
      ? "bg-(--danger-bg) text-(--danger)"
      : stock < 10
        ? "bg-(--warning-bg) text-(--warning)"
        : "bg-(--success-bg) text-(--success)";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {stock} pcs
    </span>
  );
}

// -- Approval badge ------------------------------------------------------------

function ApprovalBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-(--success-bg) text-(--success)">
      Approved
    </span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-(--warning-bg) text-(--warning)">
      Under Review
    </span>
  );
}

// -- Product thumbnail ---------------------------------------------------------

function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="w-10 h-10 rounded-lg border border-(--border-light) bg-(--bg-sunken) flex items-center justify-center overflow-hidden shrink-0">
      {src ? (
        <Image src={src} alt={alt} width={40} height={40} className="object-cover w-full h-full" />
      ) : (
        <Package size={16} className="text-(--text-tertiary)" />
      )}
    </div>
  );
}

// -- Skeleton ------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
      {/* Desktop skeleton */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide whitespace-nowrap">
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
      {/* Mobile skeleton */}
      <div className="sm:hidden divide-y divide-(--border-subtle)">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

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

  if (loading) return <TableSkeleton />;

  if (products.length === 0) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl p-16 text-center">
        <Package size={32} className="mx-auto mb-3 text-(--text-tertiary) opacity-30" />
        <p className="text-sm font-semibold text-(--text-secondary)">No products yet</p>
        <p className="text-xs text-(--text-tertiary) mt-1">
          Click "New Product" to add your first product.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
      {/* -- Desktop table — hidden below sm ----------------------------------- */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-subtle)">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-(--bg-sunken) transition-colors">
                {/* Product */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ProductThumb src={p.images?.[0]} alt={p.name} />
                    <div className="min-w-0">
                      <p title={p.name} className="font-medium text-(--text-primary) truncate max-w-45">{p.name}</p>
                      <p className="text-xs text-(--text-tertiary) truncate">{p.category ?? p.categoryName ?? "—"}</p>
                    </div>
                  </div>
                </td>
                {/* Price */}
                <td className="px-4 py-3 font-semibold text-(--text-primary) whitespace-nowrap">
                  {formatPrice(p.price)}
                </td>
                {/* Stock */}
                <td className="px-4 py-3">
                  <StockBadge stock={p.stock} />
                </td>
                {/* Marketplace */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <PublishToggle
                      checked={p.publishToMarket}
                      disabled={toggling === `${p.id}-publishToMarket`}
                      onChange={(v) => handleToggle(p.id, "publishToMarket", v)}
                      activeColor="bg-(--info)"
                    />
                    <span className={`text-xs font-medium ${p.publishToMarket ? "text-(--info)" : "text-(--text-tertiary)"}`}>
                      {p.publishToMarket ? "On" : "Off"}
                    </span>
                  </div>
                </td>
                {/* E-Store */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <PublishToggle
                      checked={p.publishToStore}
                      disabled={toggling === `${p.id}-publishToStore`}
                      onChange={(v) => handleToggle(p.id, "publishToStore", v)}
                      activeColor="bg-(--success)"
                    />
                    <span className={`text-xs font-medium ${p.publishToStore ? "text-(--success)" : "text-(--text-tertiary)"}`}>
                      {p.publishToStore ? "On" : "Off"}
                    </span>
                  </div>
                </td>
                {/* Status */}
                <td className="px-4 py-3">
                  <ApprovalBadge approved={p.isApproved} />
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEdit(p)}
                      className="text-xs text-(--info) hover:underline font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="text-xs text-(--danger) hover:opacity-80 transition-opacity"
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

      {/* -- Mobile cards — hidden above sm ------------------------------------ */}
      <div className="sm:hidden divide-y divide-(--border-subtle)">
        {products.map((p) => (
          <div key={p.id} className="p-4 space-y-3">
            {/* Row 1: Thumb + name + approval */}
            <div className="flex items-start gap-3">
              <ProductThumb src={p.images?.[0]} alt={p.name} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-(--text-primary) text-sm leading-snug line-clamp-2">{p.name}</p>
                <p className="text-xs text-(--text-tertiary) mt-0.5">{p.category ?? p.categoryName ?? "—"}</p>
              </div>
              <div className="shrink-0">
                <ApprovalBadge approved={p.isApproved} />
              </div>
            </div>

            {/* Row 2: Price + stock */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-(--text-primary) text-sm">
                {formatPrice(p.price)}
              </span>
              <StockBadge stock={p.stock} />
            </div>

            {/* Row 3: Publish toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-(--text-tertiary)">Marketplace</span>
                <PublishToggle
                  checked={p.publishToMarket}
                  disabled={toggling === `${p.id}-publishToMarket`}
                  onChange={(v) => handleToggle(p.id, "publishToMarket", v)}
                  activeColor="bg-(--info)"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-(--text-tertiary)">E-Store</span>
                <PublishToggle
                  checked={p.publishToStore}
                  disabled={toggling === `${p.id}-publishToStore`}
                  onChange={(v) => handleToggle(p.id, "publishToStore", v)}
                  activeColor="bg-(--success)"
                />
              </div>
            </div>

            {/* Row 4: Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(p)}
                className="flex-1 text-xs font-semibold text-(--info) border border-(--info-border) bg-(--info-bg) rounded-lg py-2.5 min-h-10 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="flex-1 text-xs font-semibold text-(--danger) border border-(--danger-border) bg-(--danger-bg) rounded-lg py-2.5 min-h-10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
