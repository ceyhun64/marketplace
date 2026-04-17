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
  isActive: boolean;
  publishToMarket?: boolean;
  publishToStore?: boolean;
  createdAt: string;
}

export default function MerchantCataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"offers" | "products">("offers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Offer form
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({
    productId: "",
    price: "",
    stock: "",
  });
  const [offerFormError, setOfferFormError] = useState("");
  const [offerFormLoading, setOfferFormLoading] = useState(false);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [productFormError, setProductFormError] = useState("");
  const [productFormLoading, setProductFormLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [offersRes, categoriesRes] = await Promise.all([
        api.get("/merchant/offers"),
        api.get("/categories"),
      ]);
      setOffers(offersRes.data);
      setCategories(categoriesRes.data);
    } catch {
      setError("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await api.get("/merchant/products");
      setProducts(res.data);
    } catch {
      setError("Ürünler yüklenemedi.");
    }
  }

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Yeni teklif oluştur — önce ürünleri yüklediğimizden emin ol
  async function openOfferForm() {
    if (products.length === 0) {
      await fetchProducts();
    }
    setShowOfferForm(true);
  }

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
      await fetchAll();
    } catch (err: unknown) {
      setOfferFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Teklif oluşturulamadı.",
      );
    } finally {
      setOfferFormLoading(false);
    }
  }

  async function handleToggleOffer(id: string, isActive: boolean) {
    try {
      await api.patch(`/merchant/offers/${id}`, { isActive: !isActive });
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, isActive: !isActive } : o)),
      );
    } catch {
      alert("Güncelleme başarısız.");
    }
  }

  // Marketplace / E-store toggle
  async function handlePublishToggle(
    id: string,
    field: "publishToMarket" | "publishToStore",
    current: boolean,
  ) {
    try {
      await api.patch(`/merchant/offers/${id}`, { [field]: !current });
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, [field]: !current } : o)),
      );
    } catch {
      alert("Güncelleme başarısız.");
    }
  }

  async function handleDeleteOffer(id: string) {
    if (!confirm("Bu teklifi silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/merchant/offers/${id}`);
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert("Silme başarısız.");
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductFormError("");
    setProductFormLoading(true);
    try {
      await api.post("/products", {
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
          ?.message ?? "Ürün oluşturulamadı.",
      );
    } finally {
      setProductFormLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Katalog Yönetimi</h1>

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
          Tekliflerim
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "products"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Ürünlerim
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ─── OFFERS TAB ─────────────────────────────────────────────────────── */}
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

          {/* Offer form modal */}
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

          {loading ? (
            <p className="text-gray-400 text-sm">Yükleniyor...</p>
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
                    <th className="pb-3 font-medium">Durum</th>
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
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {offer.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
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
                          <button
                            onClick={() =>
                              handleToggleOffer(offer.id, offer.isActive)
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {offer.isActive ? "Pasife Al" : "Aktife Al"}
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

      {/* ─── PRODUCTS TAB ────────────────────────────────────────────────────── */}
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

          {/* Product form modal */}
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

          {products.length === 0 ? (
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
