"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

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
  { value: "createdAt_desc", label: "En Yeni" },
  { value: "createdAt_asc", label: "En Eski" },
  { value: "price_asc", label: "Fiyat ↑" },
  { value: "price_desc", label: "Fiyat ↓" },
  { value: "stock_asc", label: "Stok ↑" },
  { value: "name_asc", label: "A → Z" },
];

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white border rounded-xl px-4 py-3 transition-all ${
        active
          ? "border-[#0D0D0D] shadow-sm"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <p
        className="text-2xl font-serif font-bold leading-none"
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[#7A7060] font-mono mt-1 uppercase tracking-wide">
        {label}
      </p>
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
      toast.success("Ürün silindi.");
    } catch {
      toast.error("Ürün silinemedi.");
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
        field === "publishToMarket" ? "Pazaryeri" : "E-Mağaza";
      toast.success(
        value
          ? `${channelName}'de yayınlandı.`
          : `${channelName}'den kaldırıldı.`,
      );
    } catch {
      toast.error("Durum güncellenemedi.");
    }
  };

  const handleModalSuccess = () => {
    toast.success(editProduct ? "Ürün güncellendi." : "Ürün eklendi.");
  };

  const handleAddNew = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB]">
      {/* Page Header */}
      <div className="bg-[#0D0D0D] px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono tracking-[3px] uppercase text-[#C84B2F] mb-2">
              Merchant Dashboard
            </p>
            <h1 className="text-2xl md:text-3xl font-serif text-[#F5F2EB] leading-tight">
              Ürün Kataloğu
            </h1>
            <p className="text-sm text-[#7A7060] mt-1 font-mono">
              {isFetching && !isLoading
                ? "Güncelleniyor..."
                : `${totalCount} ürün`}
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="shrink-0 flex items-center gap-2 bg-[#C84B2F] hover:bg-[#a83d25] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <span className="text-base leading-none">+</span>
            Yeni Ürün
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Toplam Ürün"
            value={stats.total}
            color="#0D0D0D"
            active={publishFilter === "all"}
            onClick={() => { setPublishFilter("all"); setPage(1); }}
          />
          <StatCard
            label="Pazaryerinde"
            value={stats.onMarket}
            color="#C84B2F"
            active={publishFilter === "market"}
            onClick={() => { setPublishFilter("market"); setPage(1); }}
          />
          <StatCard
            label="E-Mağazada"
            value={stats.onStore}
            color="#1A4A6B"
            active={publishFilter === "store"}
            onClick={() => { setPublishFilter("store"); setPage(1); }}
          />
          <StatCard
            label="Onay Bekleyen"
            value={stats.pendingApproval}
            color="#8B5E1A"
            active={false}
            onClick={() => {}}
          />
          <StatCard
            label="Stokta Yok"
            value={stats.outOfStock}
            color="#6B2828"
            active={false}
            onClick={() => {}}
          />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7060] text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4A6B]/20 focus:border-[#1A4A6B] transition-colors"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4A6B]/20 focus:border-[#1A4A6B] transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1">
            {(
              [
                { key: "all", label: "Tümü" },
                { key: "market", label: "Pazar" },
                { key: "store", label: "Mağaza" },
                { key: "none", label: "Yayında Değil" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => { setPublishFilter(f.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  publishFilter === f.key
                    ? "bg-[#0D0D0D] text-[#F5F2EB]"
                    : "text-[#7A7060] hover:text-[#0D0D0D]"
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
            <p className="text-xs text-[#7A7060] font-mono">
              Sayfa {page} / {totalPages} — {totalCount} ürün
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Önceki
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
                          ? "bg-[#0D0D0D] text-[#F5F2EB] font-semibold"
                          : "border border-gray-200 bg-white hover:bg-gray-50 text-[#0D0D0D]"
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
                Sonraki →
              </button>
            </div>
          </div>
        )}

        {/* Empty state (filtered) */}
        {!isLoading &&
          filteredProducts.length === 0 &&
          allProducts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-medium text-gray-700">
                Filtreyle eşleşen ürün bulunamadı
              </p>
              <button
                onClick={() => {
                  setPublishFilter("all");
                  setSearch("");
                  setDebouncedSearch("");
                }}
                className="mt-3 text-xs text-[#1A4A6B] hover:underline font-medium"
              >
                Filtreleri temizle
              </button>
            </div>
          )}
      </div>

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
            <div className="text-2xl mb-3">⚠️</div>
            <h3 className="text-base font-semibold text-[#0D0D0D] mb-1">
              Ürünü sil
            </h3>
            <p className="text-sm text-[#7A7060] mb-6">
              Bu ürün katalogdan kaldırılacak. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteProduct.isPending}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteProduct.isPending ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
