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
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
        {tab === "pending" ? "No products pending approval" : "No products added yet"}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
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
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
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
              <td className="px-4 py-3 text-gray-500">{getCategoryName(p)}</td>
              <td className="px-4 py-3 text-gray-600">{p.offerCount ?? 0}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.isApproved
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {p.isApproved ? "Approved" : "Pending"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(p.createdAt).toLocaleDateString("en-US")}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  {!p.isApproved && (
                    <button
                      onClick={() => onApprove(p.id)}
                      className="text-xs text-green-600 hover:underline"
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
