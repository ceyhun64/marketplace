"use client";

import { useEffect, useState } from "react";
import { useCategories } from "@/queries/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/queries/useProducts";
import MultiImageUploader from "@/components/ui/multiImageUploader";
import type { Product } from "@/types/entities";
import { X, Loader2 } from "lucide-react";
import ProductVariantEditor, { type VariantRow } from "./ProductVariantEditor";
import api from "@/lib/api";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<"details" | "variants">("details");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantAxes, setVariantAxes] = useState<string[]>([]);
  const [savingVariants, setSavingVariants] = useState(false);

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
      let savedProductId = product?.id;
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product.id, ...payload });
      } else {
        const result = (await createMutation.mutateAsync(payload)) as {
          data?: { id?: string };
          id?: string;
        };
        // Backend returns { id, name, price, stock } — interceptor puts it in .data
        savedProductId = result?.data?.id ?? result?.id;
      }

      // Persist new variants if any were added
      if (savedProductId && variants.length > 0) {
        setSavingVariants(true);
        for (const v of variants) {
          if (v.id) continue; // already persisted
          if (!v.sku) continue;
          try {
            await api.post(`/api/products/${savedProductId}/variants`, {
              sku: v.sku,
              attributes: v.attributes,
              priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
              stock: Number(v.stock) || 0,
              imageUrl: v.imageUrl || null,
            });
          } catch {
            toast.error(`Failed to save variant ${v.sku}`);
          }
        }
        setSavingVariants(false);
      }

      onSuccess();
      onClose();
    } catch (e: unknown) {
      // Handle all ASP.NET Core error shapes:
      //  • { message: "..." }            — standard controller errors
      //  • { title, errors: {...} }      — ModelState / RFC 7807 validation
      //  • { title: "..." }              — generic problem detail
      const data = (e as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      const message =
        (data?.message as string | undefined) ??
        (data?.errors
          ? Object.values(data.errors as Record<string, string[]>).flat()[0]
          : undefined) ??
        (data?.title as string | undefined) ??
        "Operation failed. Please try again.";
      setError(message);
    }
  };

  const submitting =
    createMutation.isPending || updateMutation.isPending || savingVariants;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-(--bg-surface) rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-(--border-light)">
          <div>
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-(--text-tertiary) mt-0.5">
              {isEdit
                ? "Update product details"
                : "Add a new product to your catalogue"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-(--text-tertiary) hover:text-(--text-secondary) hover:bg-(--off-white-2) transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-(--border-light) px-6">
          {(["details", "variants"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-6 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-(--charcoal) text-(--text-primary)"
                  : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
              }`}
            >
              {tab === "details" ? "Product Details" : "Variant Matrix"}
              {tab === "variants" && variants.length > 0 && (
                <span className="ml-1.5 text-[11px] bg-(--info-bg) text-(--info) rounded-full px-1.5 py-0.5 font-bold">
                  {variants.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Variants tab */}
          {activeTab === "variants" && (
            <ProductVariantEditor
              productId={product?.id}
              variants={variants}
              onChange={setVariants}
              axes={variantAxes}
              onAxesChange={setVariantAxes}
              basePrice={Number(form.price) || 0}
            />
          )}

          {activeTab === "details" && (
            <>
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
                <Field label="Price ($)" required>
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
              <div className="rounded-xl border border-(--border-light) p-4 space-y-3 bg-(--bg-sunken)/50">
                <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-widest">
                  Publish Channels
                </p>
                <ToggleRow
                  label="Publish to My E-Store"
                  description="Visible on your store page"
                  checked={form.publishToStore}
                  onChange={(v) => set("publishToStore", v)}
                  color="bg-(--charcoal-mid)"
                />
                <ToggleRow
                  label="Publish to Marketplace"
                  description="Visible in the general marketplace listing"
                  checked={form.publishToMarket}
                  onChange={(v) => set("publishToMarket", v)}
                  color="bg-(--info)"
                />
              </div>

              {error && (
                <p className="text-sm text-(--danger) bg-(--danger-bg) rounded-lg px-3 py-2 border border-(--danger-border)">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-(--border-mid) text-(--text-secondary) rounded-xl py-2.5 text-sm font-medium hover:bg-(--bg-sunken) transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-(--charcoal) text-white rounded-xl py-2.5 text-sm font-medium hover:bg-(--charcoal-2) disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// On-brand focus: charcoal ring matching the design system
const inputCls =
  "w-full border border-(--border-mid) rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--charcoal)/15 focus:border-(--charcoal) transition-colors";

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
      <label className="flex items-center gap-1 text-sm font-medium text-(--text-secondary) mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="text-(--text-tertiary) font-normal text-xs">
            ({hint})
          </span>
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
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${disabled ? "opacity-50" : ""}`}
    >
      <div>
        <p className="text-sm font-medium text-(--text-primary)">{label}</p>
        <p className="text-xs text-(--text-tertiary)">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${checked && !disabled ? color : "bg-(--off-white-3)"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-(--bg-surface) shadow transition-transform ${
            checked && !disabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
