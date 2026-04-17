"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName?: string;
  productCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Category[]>("/categories");
      setCategories(res.data);
    } catch {
      setError("Kategoriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditTarget(null);
    setForm({ name: "", slug: "", parentId: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId ?? "" });
    setFormError("");
    setShowForm(true);
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug || autoSlug(form.name),
        parentId: form.parentId || null,
      };
      if (editTarget) {
        await api.put(`/categories/${editTarget.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "İşlem başarısız.";
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/categories/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch {
      alert("Silme işlemi başarısız. Kategoriye bağlı ürünler olabilir.");
      setDeleteId(null);
    }
  }

  const roots = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => !!c.parentId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
          <p className="text-sm text-gray-500 mt-1">
            {categories.length} kategori
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Yeni Kategori
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editTarget ? "Kategori Düzenle" : "Yeni Kategori"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug:
                        f.slug === autoSlug(f.name) || !f.slug
                          ? autoSlug(name)
                          : f.slug,
                    }));
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Örn: Elektronik"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug{" "}
                  <span className="text-gray-400 font-normal">(URL adı)</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                  placeholder="elektronik"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Üst Kategori{" "}
                  <span className="text-gray-400 font-normal">(opsiyonel)</span>
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parentId: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">— Ana kategori —</option>
                  {roots
                    .filter((r) => r.id !== editTarget?.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {formLoading
                    ? "Kaydediliyor..."
                    : editTarget
                      ? "Güncelle"
                      : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Kategoriyi Sil</h3>
            <p className="text-sm text-gray-500 mb-6">
              Bu kategoriyi silmek istediğinize emin misiniz? Bağlı alt
              kategoriler ve ürünler etkilenebilir.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Tree */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
          Yükleniyor...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-lg">Henüz kategori yok.</p>
          <p className="text-sm mt-1">
            &quot;Yeni Kategori&quot; ile ilk kategoriyi ekleyin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((root) => {
            const subs = children.filter((c) => c.parentId === root.id);
            return (
              <div
                key={root.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Root row */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{root.name}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        /{root.slug}
                      </p>
                    </div>
                    {subs.length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {subs.length} alt kategori
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(root)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(root.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {/* Sub-category rows */}
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100"
                  >
                    <div className="flex items-center gap-3 pl-5">
                      <span className="text-gray-300">└</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {sub.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          /{sub.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(sub)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
