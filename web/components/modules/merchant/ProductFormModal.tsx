"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCategories } from "@/queries/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/queries/useProducts";
import MultiImageUploader from "@/components/ui/multiImageUploader";
import type { Product } from "@/types/entities";

interface Props {
  product?: Product | null; // null = add mode, Product = edit mode
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  tags: string;
  price: string;
  stock: string;
  publishToMarket: boolean;
  publishToStore: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  categoryId: "",
  images: [],
  tags: "",
  price: "",
  stock: "",
  publishToMarket: false,
  publishToStore: true,
};

export default function ProductFormModal({
  product,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!product;
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        images: product.images ?? [],
        tags: product.tags?.join(", ") ?? "",
        price: String(product.price),
        stock: String(product.stock),
        publishToMarket: product.publishToMarket,
        publishToStore: product.publishToStore,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [product]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Ürün adı zorunlu.");
    if (!form.categoryId) return setError("Kategori seçin.");
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      return setError("Geçerli bir fiyat girin.");
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      return setError("Geçerli bir stok miktarı girin.");

    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      images: form.images,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      price: Number(form.price),
      stock: Number(form.stock),
      publishToMarket: form.publishToMarket,
      publishToStore: form.publishToStore,
    };

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "İşlem başarısız.");
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#0D0D0D]">
              {isEdit ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </h2>
            <p className="text-xs text-[#7A7060] mt-0.5 font-mono">
              {isEdit
                ? "Ürün bilgilerini güncelleyin"
                : "Kataloğunuza yeni ürün ekleyin"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Görseller */}
          <MultiImageUploader
            label="Ürün Görselleri"
            folder="marketplace/products"
            maxFiles={6}
            onUpdate={(urls) => set("images", urls)}
          />

          {/* Ad */}
          <Field label="Ürün Adı" required>
            <input
              type="text"
              placeholder="Örn: Bluetooth Kulaklık"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Açıklama */}
          <Field label="Açıklama">
            <textarea
              rows={3}
              placeholder="Ürün hakkında kısa açıklama..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Kategori */}
          <Field label="Kategori" required>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputCls}
            >
              <option value="">Kategori seçin...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Fiyat & Stok */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fiyat (₺)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Stok Adedi" required>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Etiketler */}
          <Field label="Etiketler" hint="virgülle ayırın">
            <input
              type="text"
              placeholder="elektronik, ses, kablosuz"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Yayın Kanalları */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-3 bg-gray-50/50">
            <p className="text-xs font-mono uppercase tracking-widest text-[#7A7060]">
              Yayın Kanalları
            </p>
            <ToggleRow
              label="E-Mağazamda Yayınla"
              description="Mağaza sayfanızda görünür"
              checked={form.publishToStore}
              onChange={(v) => set("publishToStore", v)}
              accentColor="#1A4A6B"
            />
            <ToggleRow
              label="Pazaryerinde Yayınla"
              description="Genel listede görünür (onay gerekebilir)"
              checked={form.publishToMarket}
              onChange={(v) => set("publishToMarket", v)}
              accentColor="#C84B2F"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-[#0D0D0D] text-[#F5F2EB] rounded-xl py-2.5 text-sm font-medium hover:bg-[#C84B2F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? "Kaydediliyor..."
              : isEdit
                ? "Güncelle"
                : "Ürünü Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4A6B]/30 focus:border-[#1A4A6B] transition-colors";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium text-[#0D0D0D] mb-1.5">
        {label}
        {required && <span className="text-[#C84B2F]">*</span>}
        {hint && (
          <span className="text-[#7A7060] font-normal text-xs">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  accentColor,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accentColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[#0D0D0D]">{label}</p>
        <p className="text-xs text-[#7A7060]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? "bg-opacity-100" : "bg-gray-200"
        }`}
        style={{ backgroundColor: checked ? accentColor : undefined }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
