"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Search, Plus, AlertTriangle, Lock, Zap } from "lucide-react";
import Link from "next/link";

import ProductCatalogueTable from "@/components/modules/merchant/ProductCatalogueTable";
import ProductFormModal from "@/components/modules/merchant/ProductFormModal";

import {
  useMerchantProducts,
  useDeleteProduct,
  useTogglePublish,
  type ProductFilters,
} from "@/queries/useProducts";

import { useMySubscription } from "@/queries/useSubscription";

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
      className={`text-left bg-[var(--bg-surface)] rounded-xl border p-5 transition-all ${
        active
          ? "border-[var(--charcoal)] shadow-sm ring-1 ring-[var(--border-mid)]"
          : "border-[var(--border-light)] hover:border-[var(--border-mid)] hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
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

  // Abonelik planı — Basic planda marketplace yayını kısıtlı
  const { data: subscription } = useMySubscription();
  const currentPlan = subscription?.plan ?? "BASIC";
  const canPublishToMarket = currentPlan === "PRO" || currentPlan === "ENTERPRISE";

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
    // Use server-side stats (covers ALL products, not just current page)
    const serverStats = data?.stats;
    if (serverStats) {
      return {
        total: serverStats.total ?? totalCount,
        onMarket: serverStats.onMarket ?? 0,
        onStore: serverStats.onStore ?? 0,
        pendingApproval: serverStats.pendingApproval ?? 0,
        outOfStock: serverStats.outOfStock ?? 0,
      };
    }
    // Fallback: compute from current page items (less accurate)
    const items = allProducts;
    return {
      total: totalCount,
      onMarket: items.filter((p) => p.publishToMarket).length,
      onStore: items.filter((p) => p.publishToStore).length,
      pendingApproval: items.filter((p) => !p.isApproved).length,
      outOfStock: items.filter((p) => p.stock === 0).length,
    };
  }, [data, allProducts, totalCount]);

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
    // Plan kısıtlaması: Basic planda marketplace yayını yapılamaz
    if (field === "publishToMarket" && value && !canPublishToMarket) {
      toast.error("Marketplace'e yayın yapmak için Pro veya Enterprise planı gereklidir.", {
        action: {
          label: "Planı Yükselt",
          onClick: () => window.location.href = "/merchant/subscription",
        },
      });
      return;
    }
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
      {/* Basic Plan Marketplace Uyarısı */}
      {!canPublishToMarket && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(139,94,26,0.08)", border: "1.5px solid rgba(139,94,26,0.25)" }}
        >
          <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "#8b5e1a" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#8b5e1a" }}>
              Marketplace Yayını — Pro Plan Gerekli
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(139,94,26,0.75)" }}>
              Basic planda ürünler yalnızca e-mağazanızda görünür. Marketplace'e yayınlamak için planınızı yükseltin.
            </p>
          </div>
          <Link
            href="/merchant/subscription"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white whitespace-nowrap"
            style={{ background: "#8b5e1a" }}
          >
            <Zap className="w-3 h-3" />
            Planı Yükselt
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Product Catalogue
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isFetching && !isLoading
              ? "Updating..."
              : `${totalCount} product${totalCount !== 1 ? "s" : ""} in your catalogue`}
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
          style={{ background: "var(--red)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--red-dark)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--red)")
          }
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
          color="text-[var(--text-primary)]"
          bg="bg-[var(--off-white-2)]"
          active={publishFilter === "all"}
          onClick={() => {
            setPublishFilter("all");
            setPage(1);
          }}
        />
        <StatCard
          label="On Marketplace"
          value={stats.onMarket}
          color="text-[var(--info)]"
          bg="bg-[var(--info-bg)]"
          active={publishFilter === "market"}
          onClick={() => {
            setPublishFilter("market");
            setPage(1);
          }}
        />
        <StatCard
          label="In E-Store"
          value={stats.onStore}
          color="text-[var(--charcoal-mid)]"
          bg="bg-[var(--off-white-2)]"
          active={publishFilter === "store"}
          onClick={() => {
            setPublishFilter("store");
            setPage(1);
          }}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval}
          color="text-[var(--warning)]"
          bg="bg-[var(--warning-bg)]"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-surface)] border border-[var(--border-mid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="bg-[var(--bg-surface)] border border-[var(--border-mid)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--border-mid)] rounded-xl p-1">
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
                  ? "text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              style={
                publishFilter === f.key ? { background: "var(--red)" } : {}
              }
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
          <p className="text-xs text-[var(--text-tertiary)]">
            Page {page} of {totalPages} — {totalCount} products
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm border border-[var(--border-mid)] rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-sunken)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        ? "text-white font-semibold"
                        : "border border-[var(--border-mid)] bg-[var(--bg-surface)] hover:bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
                    }`}
                    style={p === page ? { background: "var(--red)" } : {}}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm border border-[var(--border-mid)] rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-sunken)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          <div className="bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-xl p-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No products match your filters
            </p>
            <button
              onClick={() => {
                setPublishFilter("all");
                setSearch("");
                setDebouncedSearch("");
              }}
              className="mt-3 text-xs text-[var(--info)] hover:underline font-medium"
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
          canPublishToMarket={canPublishToMarket}
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
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              Delete Product
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This product will be removed from your catalogue. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-[var(--border-mid)] text-[var(--text-secondary)] rounded-xl py-2.5 text-sm font-medium hover:bg-[var(--bg-sunken)] transition-colors"
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
