"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  isApproved: boolean;
  createdAt: string;
  offerCount?: number;
}

interface Offer {
  id: string;
  productId: string;
  productName: string;
  price: number;
  stock: number;
  publishToMarket?: boolean;
  publishToStore?: boolean;
  createdAt: string;
}

export default function MerchantCataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"offers" | "products">("offers");

  // FIX 3 — Products tab'ına ayrı loading state
  const [offersLoading, setOffersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  const [error, setError] = useState("");

  // ── Offer form ──────────────────────────────────────────────────────────────
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({
    productId: "",
    price: "",
    stock: "",
  });
  const [offerFormError, setOfferFormError] = useState("");
  const [offerFormLoading, setOfferFormLoading] = useState(false);

  // FIX 1 — Edit offer modal (inline fiyat/stok düzenleme)
  const [editingOffer, setEditingOffer] = useState<{
    id: string;
    price: string;
    stock: string;
  } | null>(null);
  const [editFormError, setEditFormError] = useState("");
  const [editFormLoading, setEditFormLoading] = useState(false);

  // ── Product form ────────────────────────────────────────────────────────────
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [productFormError, setProductFormError] = useState("");
  const [productFormLoading, setProductFormLoading] = useState(false);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOffersAndCategories();
  }, []);

  async function fetchOffersAndCategories() {
    setOffersLoading(true);
    setError("");
    try {
      const [offersRes, categoriesRes] = await Promise.all([
        api.get("/merchant/offers"),
        api.get("/categories"),
      ]);
      setOffers(offersRes.data);
      setCategories(categoriesRes.data);
    } catch {
      setError("Data could not be loaded.");
    } finally {
      setOffersLoading(false);
    }
  }

  // FIX 2 — Doğru endpoint: GET /merchant/products (backend'de expose edilmiş olmalı)
  async function fetchProducts() {
    setProductsLoading(true);
    setError("");
    try {
      const res = await api.get("/merchant/products");
      setProducts(res.data);
    } catch {
      setError("Products could not be loaded.");
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "products" && products.length === 0) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Offer form open — ürün listesi hazır olsun ───────────────────────────
  async function openOfferForm() {
    if (products.length === 0) {
      await fetchProducts();
    }
    setShowOfferForm(true);
  }

  // ── Create offer ─────────────────────────────────────────────────────────
  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault();
    setOfferFormError("");
    setOfferFormLoading(true);
    try {
      await api.post("/merchant/offers", {
        productId: offerForm.productId,
        price: parseFloat(offerForm.price),
        stock: parseInt(offerForm.stock),
      });
      setShowOfferForm(false);
      setOfferForm({ productId: "", price: "", stock: "" });
      await fetchOffersAndCategories();
    } catch (err: unknown) {
      setOfferFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Offer could not be created.",
      );
    } finally {
      setOfferFormLoading(false);
    }
  }

  // FIX 1 — Edit offer: PUT /merchant/offers/{id} ile fiyat+stok güncelle
  async function handleEditOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOffer) return;
    setEditFormError("");
    setEditFormLoading(true);
    try {
      await api.put(`/merchant/offers/${editingOffer.id}`, {
        price: parseFloat(editingOffer.price),
        stock: parseInt(editingOffer.stock),
      });
      setOffers((prev) =>
        prev.map((o) =>
          o.id === editingOffer.id
            ? {
                ...o,
                price: parseFloat(editingOffer.price),
                stock: parseInt(editingOffer.stock),
              }
            : o,
        ),
      );
      setEditingOffer(null);
    } catch (err: unknown) {
      setEditFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Update failed.",
      );
    } finally {
      setEditFormLoading(false);
    }
  }

  // ── Publish toggles ──────────────────────────────────────────────────────
  async function handlePublishToggle(
    id: string,
    field: "publishToMarket" | "publishToStore",
    current: boolean,
  ) {
    // Optimistic update
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: !current } : o)),
    );
    try {
      await api.patch(`/merchant/offers/${id}/publish`, { [field]: !current });
    } catch {
      // Rollback on failure
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, [field]: current } : o)),
      );
      alert("Update failed.");
    }
  }

  // ── Delete offer ─────────────────────────────────────────────────────────
  async function handleDeleteOffer(id: string) {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await api.delete(`/merchant/offers/${id}`);
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert("Deletion failed.");
    }
  }

  // FIX 2 — Ürün talebi: doğru endpoint. Admin ürün oluşturur (POST /products),
  // merchant sadece talep gönderir. Backend'e göre endpoint'i ayarla:
  // Eğer merchant kendi adına talep gönderiyorsa => POST /merchant/products
  // Eğer admin endpoint'i kullanılıyorsa => POST /products (Admin policy gerekir)
  // Şu an /merchant/products kullanıyoruz — backend'de bu route varsa çalışır.
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductFormError("");
    setProductFormLoading(true);
    try {
      await api.post("/merchant/products", {
        name: productForm.name,
        description: productForm.description,
        categoryId: productForm.categoryId,
      });
      setShowProductForm(false);
      setProductForm({ name: "", description: "", categoryId: "" });
      await fetchProducts();
    } catch (err: unknown) {
      setProductFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Product request could not be sent.",
      );
    } finally {
      setProductFormLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Catalogue Management</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "offers"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("offers")}
        >
          My Offers
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "products"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("products")}
        >
          My Products
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          OFFERS TAB
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "offers" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Aktif Teklifler
            </h2>
            <button
              onClick={openOfferForm}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + Yeni Teklif
            </button>
          </div>

          {/* ── Create offer modal ─────────────────────────────────────────── */}
          {showOfferForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                  Yeni Teklif Oluştur
                </h3>
                <form onSubmit={handleCreateOffer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün
                    </label>
                    <select
                      required
                      value={offerForm.productId}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          productId: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Ürün seçin...</option>
                      {products
                        .filter((p) => p.isApproved)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    {products.filter((p) => p.isApproved).length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Önce &quot;Ürünlerim&quot; sekmesinden onaylı ürün
                        eklemeniz gerekiyor.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={offerForm.price}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, price: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stok
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={offerForm.stock}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, stock: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  {offerFormError && (
                    <p className="text-sm text-red-600">{offerFormError}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOfferForm(false);
                        setOfferFormError("");
                      }}
                      className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={offerFormLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {offerFormLoading ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FIX 1 — Edit offer modal ──────────────────────────────────────── */}
          {editingOffer && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4">Teklif Düzenle</h3>
                <form onSubmit={handleEditOffer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editingOffer.price}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          price: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stok
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editingOffer.stock}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          stock: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {editFormError && (
                    <p className="text-sm text-red-600">{editFormError}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOffer(null);
                        setEditFormError("");
                      }}
                      className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={editFormLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editFormLoading ? "Kaydediliyor..." : "Güncelle"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Offers table */}
          {offersLoading ? (
            <div className="space-y-2 mt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Henüz teklifiniz yok.</p>
              <p className="text-sm mt-1">
                &quot;Yeni Teklif&quot; butonuyla ilk teklifinizi ekleyin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Ürün</th>
                    <th className="pb-3 font-medium">Fiyat</th>
                    <th className="pb-3 font-medium">Stok</th>
                    <th className="pb-3 font-medium">Marketplace</th>
                    <th className="pb-3 font-medium">E-Mağaza</th>
                    <th className="pb-3 font-medium">Eklenme</th>
                    <th className="pb-3 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{offer.productName}</td>
                      <td className="py-3">
                        {offer.price.toLocaleString("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        })}
                      </td>
                      <td className="py-3">{offer.stock}</td>

                      {/* Marketplace toggle */}
                      <td className="py-3">
                        <button
                          onClick={() =>
                            handlePublishToggle(
                              offer.id,
                              "publishToMarket",
                              offer.publishToMarket ?? false,
                            )
                          }
                          title={
                            offer.publishToMarket
                              ? "Marketplace'den kaldır"
                              : "Marketplace'e yayınla"
                          }
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                            offer.publishToMarket
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              offer.publishToMarket
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>

                      {/* E-store toggle */}
                      <td className="py-3">
                        <button
                          onClick={() =>
                            handlePublishToggle(
                              offer.id,
                              "publishToStore",
                              offer.publishToStore ?? false,
                            )
                          }
                          title={
                            offer.publishToStore
                              ? "E-mağazadan kaldır"
                              : "E-mağazaya yayınla"
                          }
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                            offer.publishToStore
                              ? "bg-purple-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              offer.publishToStore
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-3 text-gray-400">
                        {new Date(offer.createdAt).toLocaleDateString("tr-TR")}
                      </td>

                      <td className="py-3">
                        <div className="flex gap-2">
                          {/* FIX 1 — Düzenle butonu */}
                          <button
                            onClick={() =>
                              setEditingOffer({
                                id: offer.id,
                                price: String(offer.price),
                                stock: String(offer.stock),
                              })
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
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
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PRODUCTS TAB
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Ürünlerim</h2>
            <button
              onClick={() => setShowProductForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + Yeni Ürün Talebi
            </button>
          </div>

          {/* ── Product form modal ─────────────────────────────────────────── */}
          {showProductForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">Yeni Ürün Talebi</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Ürün talebi admin onayına gönderilecektir.
                </p>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün Adı
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ürün adını girin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Ürün açıklaması"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      required
                      value={productForm.categoryId}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          categoryId: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kategori seçin...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {productFormError && (
                    <p className="text-sm text-red-600">{productFormError}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setProductFormError("");
                      }}
                      className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={productFormLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {productFormLoading ? "Gönderiliyor..." : "Talep Gönder"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FIX 3 — Products loading skeleton */}
          {productsLoading ? (
            <div className="space-y-2 mt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Henüz onaylı ürününüz yok.</p>
              <p className="text-sm mt-1">
                &quot;Yeni Ürün Talebi&quot; ile admin onayına gönderin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Ürün Adı</th>
                    <th className="pb-3 font-medium">Kategori</th>
                    <th className="pb-3 font-medium">Teklif Sayısı</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Eklenme</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{product.name}</td>
                      <td className="py-3 text-gray-500">
                        {product.categoryName}
                      </td>
                      <td className="py-3">{product.offerCount ?? 0}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {product.isApproved ? "Onaylandı" : "Beklemede"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(product.createdAt).toLocaleDateString(
                          "tr-TR",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
