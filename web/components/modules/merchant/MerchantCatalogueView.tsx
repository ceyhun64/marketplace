"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Search, Plus, AlertTriangle } from "lucide-react";

import ProductCatalogueTable from "@/components/modules/merchant/ProductCatalogueTable";
import ProductFormModal from "@/components/modules/merchant/ProductFormModal";

import {
  useMerchantProducts,
  useDeleteProduct,
  useTogglePublish,
  type ProductFilters,
} from "@/queries/useProducts";

import type { Product } from "@/types/entities";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc", label: "Oldest First" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "stock_asc", label: "Stock ↑" },
  { value: "name_asc", label: "A → Z" },
];

function StatCard({
  label,
  value,
  color,
  bg,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-xl border p-5 transition-all ${
        active
          ? "border-gray-900 shadow-sm ring-1 ring-gray-900/10"
          : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {label}
        </p>
        <div className={`p-1.5 rounded-lg ${bg}`}>
          <span className={`text-xs font-bold ${color}`}>#</span>
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </button>
  );
}

export default function MerchantCatalogueView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [publishFilter, setPublishFilter] = useState<
    "all" | "market" | "store" | "none"
  >("all");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout((handleSearchChange as any)._timer);
    (handleSearchChange as any)._timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const filters: ProductFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      sort,
    }),
    [page, debouncedSearch, sort],
  );

  const { data, isLoading, isFetching } = useMerchantProducts(filters);
  const deleteProduct = useDeleteProduct();
  const togglePublish = useTogglePublish();

  const allProducts: Product[] = data?.items ?? [];

  const filteredProducts = useMemo(() => {
    if (publishFilter === "all") return allProducts;
    if (publishFilter === "market")
      return allProducts.filter((p) => p.publishToMarket);
    if (publishFilter === "store")
      return allProducts.filter((p) => p.publishToStore);
    if (publishFilter === "none")
      return allProducts.filter((p) => !p.publishToMarket && !p.publishToStore);
    return allProducts;
  }, [allProducts, publishFilter]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const stats = useMemo(() => {
    const items = allProducts;
    return {
      total: totalCount,
      onMarket: items.filter((p) => p.publishToMarket).length,
      onStore: items.filter((p) => p.publishToStore).length,
      pendingApproval: items.filter((p) => !p.isApproved).length,
      outOfStock: items.filter((p) => p.stock === 0).length,
    };
  }, [allProducts, totalCount]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct.mutateAsync(deleteConfirm);
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleTogglePublish = async (
    id: string,
    field: "publishToMarket" | "publishToStore",
    value: boolean,
  ) => {
    try {
      await togglePublish.mutateAsync({ id, [field]: value });
      const channelName =
        field === "publishToMarket" ? "Marketplace" : "E-Store";
      toast.success(
        value ? `Published to ${channelName}.` : `Removed from ${channelName}.`,
      );
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleModalSuccess = () => {
    toast.success(editProduct ? "Product updated." : "Product added.");
  };

  const handleAddNew = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Product Catalogue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isFetching && !isLoading
              ? "Updating..."
              : `${totalCount} product${totalCount !== 1 ? "s" : ""} in your catalogue`}
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Products"
          value={stats.total}
          color="text-gray-900"
          bg="bg-gray-100"
          active={publishFilter === "all"}
          onClick={() => {
            setPublishFilter("all");
            setPage(1);
          }}
        />
        <StatCard
          label="On Marketplace"
          value={stats.onMarket}
          color="text-blue-600"
          bg="bg-blue-50"
          active={publishFilter === "market"}
          onClick={() => {
            setPublishFilter("market");
            setPage(1);
          }}
        />
        <StatCard
          label="In E-Store"
          value={stats.onStore}
          color="text-violet-600"
          bg="bg-violet-50"
          active={publishFilter === "store"}
          onClick={() => {
            setPublishFilter("store");
            setPage(1);
          }}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval}
          color="text-amber-600"
          bg="bg-amber-50"
          active={false}
          onClick={() => {}}
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStock}
          color="text-rose-500"
          bg="bg-rose-50"
          active={false}
          onClick={() => {}}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "market", label: "Market" },
              { key: "store", label: "Store" },
              { key: "none", label: "Unlisted" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setPublishFilter(f.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                publishFilter === f.key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <ProductCatalogueTable
        products={filteredProducts}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteConfirm(id)}
        onTogglePublish={handleTogglePublish}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Page {page} of {totalPages} — {totalCount} products
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                      p === page
                        ? "bg-gray-900 text-white font-semibold"
                        : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Empty state (filtered) */}
      {!isLoading &&
        filteredProducts.length === 0 &&
        allProducts.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">
              No products match your filters
            </p>
            <button
              onClick={() => {
                setPublishFilter("all");
                setSearch("");
                setDebouncedSearch("");
              }}
              className="mt-3 text-xs text-blue-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

      {/* Product Form Modal */}
      {modalOpen && (
        <ProductFormModal
          product={editProduct}
          onClose={() => {
            setModalOpen(false);
            setEditProduct(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setDeleteConfirm(null)
          }
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Delete Product
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This product will be removed from your catalogue. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteProduct.isPending}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteProduct.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
