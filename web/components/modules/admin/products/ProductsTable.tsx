"use client";

import type { Product } from "./types";

interface Props {
  products: Product[];
  loading: boolean;
  tab: "all" | "pending";
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

function getCategoryName(p: Product) {
  return p.categoryName ?? p.category?.name ?? "-";
}

export default function ProductsTable({
  products,
  loading,
  tab,
  onApprove,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-mid) rounded-xl p-8 text-center text-sm text-(--text-tertiary)">
        Loading...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-mid) rounded-xl p-8 text-center text-sm text-(--text-tertiary)">
        {tab === "pending" ? "No products pending approval" : "No products added yet"}
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface) border border-(--border-mid) rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-(--bg-sunken) text-xs text-(--text-tertiary) uppercase tracking-wide">
          <tr>
            {[
              "Product Name",
              "Category",
              "Offer",
              "Status",
              "Added",
              "Action",
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border-light)">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-(--bg-sunken)">
              <td className="px-4 py-3 font-medium text-(--text-primary)">
                <div className="flex items-center gap-2">
                  {p.imageUrls?.[0] && (
                    <img
                      src={p.imageUrls[0]}
                      alt=""
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  )}
                  {p.name}
                </div>
              </td>
              <td className="px-4 py-3 text-(--text-tertiary)">{getCategoryName(p)}</td>
              <td className="px-4 py-3 text-(--text-secondary)">{p.offerCount ?? 0}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.isApproved
                      ? "bg-(--success-bg) text-(--success)"
                      : "bg-(--warning-bg) text-(--warning)"
                  }`}
                >
                  {p.isApproved ? "Approved" : "Pending"}
                </span>
              </td>
              <td className="px-4 py-3 text-(--text-tertiary)">
                {new Date(p.createdAt).toLocaleDateString("en-US")}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  {!p.isApproved && (
                    <button
                      onClick={() => onApprove(p.id)}
                      className="text-xs text-(--success) hover:underline"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-xs text-red-500 hover:underline"
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
