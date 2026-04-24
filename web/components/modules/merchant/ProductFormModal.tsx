"use client";

import { useEffect, useState } from "react";
import { useCategories } from "@/queries/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/queries/useProducts";
import MultiImageUploader from "@/components/ui/multiImageUploader";
import type { Product } from "@/types/entities";
import { X } from "lucide-react";

interface Props {
  product?: Product | null;
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
    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.categoryId) return setError("Please select a category.");
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      return setError("Enter a valid price.");
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      return setError("Enter a valid stock quantity.");

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
      setError(e?.response?.data?.message ?? "Operation failed.");
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit
                ? "Update product details"
                : "Add a new product to your catalogue"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Images */}
          <MultiImageUploader
            label="Product Images"
            folder="marketplace/products"
            maxFiles={6}
            onUpdate={(urls) => set("images", urls)}
          />

          {/* Name */}
          <Field label="Product Name" required>
            <input
              type="text"
              placeholder="E.g. Bluetooth Headphones"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              rows={3}
              placeholder="Short product description..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Category */}
          <Field label="Category" required>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputCls}
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₺)" required>
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
            <Field label="Stock Quantity" required>
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

          {/* Tags */}
          <Field label="Tags" hint="comma separated">
            <input
              type="text"
              placeholder="electronics, audio, wireless"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Publish Channels */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-3 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Publish Channels
            </p>
            <ToggleRow
              label="Publish to My E-Store"
              description="Visible on your store page"
              checked={form.publishToStore}
              onChange={(v) => set("publishToStore", v)}
              color="bg-violet-600"
            />
            <ToggleRow
              label="Publish to Marketplace"
              description="Visible in general listing (approval may be required)"
              checked={form.publishToMarket}
              onChange={(v) => set("publishToMarket", v)}
              color="bg-blue-600"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? "Saving..."
              : isEdit
                ? "Update Product"
                : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

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
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="text-gray-400 font-normal text-xs">({hint})</span>
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
  color,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? color : "bg-gray-200"
        }`}
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
