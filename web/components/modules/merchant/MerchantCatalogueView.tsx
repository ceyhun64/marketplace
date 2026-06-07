"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import ProductCatalogueTable from "@/components/modules/merchant/ProductCatalogueTable";
import ProductFormModal from "@/components/modules/merchant/ProductFormModal";

import {
  useMerchantProducts,
  useDeleteProduct,
  useTogglePublish,
  type ProductFilters,
} from "@/queries/useProducts";

import type { Product } from "@/types/entities";

// -- Constants -----------------------------------------------------------------

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc", label: "Oldest First" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "stock_asc", label: "Stock ↑" },
  { value: "name_asc", label: "A → Z" },
];

const PUBLISH_FILTERS = [
  { key: "all", label: "All" },
  { key: "market", label: "Market" },
  { key: "store", label: "Store" },
  { key: "none", label: "Unlisted" },
] as const;

type PublishFilter = (typeof PUBLISH_FILTERS)[number]["key"];

// -- Stat Card -----------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
  bg,
  active,
  loading,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-(--bg-surface) rounded-xl border p-5 transition-all w-full ${
        active
          ? "border-(--charcoal) shadow-sm ring-1 ring-(--border-mid)"
          : "border-(--border-light) hover:border-(--border-mid) hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
          {label}
        </p>
        <div className={`p-1.5 rounded-lg ${bg}`}>
          <span className={`text-xs font-bold ${color}`}>#</span>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      )}
    </button>
  );
}

// -- Main Component -------------------------------------------------------------

export default function MerchantCatalogueView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pendingApproval" | "outOfStock">("all");

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
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
      ...(statusFilter === "pendingApproval" ? { isApproved: false } : {}),
      ...(statusFilter === "outOfStock" ? { outOfStock: true } : {}),
      ...(publishFilter === "market" ? { publishedToMarket: true } : {}),
      ...(publishFilter === "store" ? { publishedToStore: true } : {}),
      ...(publishFilter === "none" ? { unlisted: true } : {}),
    }),
    [page, debouncedSearch, sort, statusFilter, publishFilter],
  );

  const { data, isLoading, isFetching } = useMerchantProducts(filters);
  const deleteProduct = useDeleteProduct();
  const togglePublish = useTogglePublish();

  const allProducts: Product[] = data?.items ?? [];

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const isFiltered =
    publishFilter !== "all" || statusFilter !== "all" || !!debouncedSearch;

  const stats = useMemo(() => {
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
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Product Catalogue
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            {isFetching && !isLoading
              ? "Updating..."
              : `${totalCount} product${totalCount !== 1 ? "s" : ""} in your catalogue`}
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Products"
          value={stats.total}
          color="text-(--text-primary)"
          bg="bg-(--off-white-2)"
          active={publishFilter === "all"}
          loading={isLoading}
          onClick={() => { setPublishFilter("all"); setPage(1); }}
        />
        <StatCard
          label="On Marketplace"
          value={stats.onMarket}
          color="text-(--info)"
          bg="bg-(--info-bg)"
          active={publishFilter === "market"}
          loading={isLoading}
          onClick={() => { setPublishFilter("market"); setPage(1); }}
        />
        <StatCard
          label="In E-Store"
          value={stats.onStore}
          color="text-(--text-secondary)"
          bg="bg-(--off-white-2)"
          active={publishFilter === "store"}
          loading={isLoading}
          onClick={() => { setPublishFilter("store"); setPage(1); }}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval}
          color="text-(--warning)"
          bg="bg-(--warning-bg)"
          active={statusFilter === "pendingApproval"}
          loading={isLoading}
          onClick={() => { setStatusFilter(statusFilter === "pendingApproval" ? "all" : "pendingApproval"); setPage(1); }}
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStock}
          color="text-(--danger)"
          bg="bg-(--danger-bg)"
          active={statusFilter === "outOfStock"}
          loading={isLoading}
          onClick={() => { setStatusFilter(statusFilter === "outOfStock" ? "all" : "outOfStock"); setPage(1); }}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary) pointer-events-none" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
          />
        </div>

        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-44 border-(--border-mid) shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 bg-(--bg-surface) border border-(--border-mid) rounded-xl p-1 shrink-0">
          {PUBLISH_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setPublishFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                publishFilter === f.key
                  ? "bg-(--charcoal) text-white"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isFiltered && !isLoading && allProducts.length === 0 ? (
        <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl p-12 text-center">
          <Search className="w-10 h-10 mx-auto mb-3 text-(--text-tertiary) opacity-30" />
          <p className="text-sm font-medium text-(--text-secondary)">
            No products match your filters
          </p>
          <button
            onClick={() => {
              setPublishFilter("all");
              setStatusFilter("all");
              setSearch("");
              setDebouncedSearch("");
              setPage(1);
            }}
            className="mt-3 text-xs text-(--info) hover:underline font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ProductCatalogueTable
          products={allProducts}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteConfirm(id)}
          onTogglePublish={handleTogglePublish}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-(--text-tertiary)">
            Page {page} of {totalPages} — {totalCount} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-(--border-mid)"
            >
              ← Previous
            </Button>
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
                        ? "bg-(--charcoal) text-white font-semibold"
                        : "border border-(--border-mid) bg-(--bg-surface) hover:bg-(--bg-sunken) text-(--text-secondary)"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-(--border-mid)"
            >
              Next →
            </Button>
          </div>
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
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-(--danger-bg) flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-(--danger)" />
              </div>
              <DialogTitle>Delete Product</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-(--text-secondary)">
            This product will be permanently removed from your catalogue. This
            action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-(--border-mid)"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteProduct.isPending}
              className="bg-(--danger) hover:opacity-90 text-white"
            >
              {deleteProduct.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
