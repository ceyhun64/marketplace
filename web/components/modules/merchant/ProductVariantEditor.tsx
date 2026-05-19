"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VariantRow {
  id?: string;          // undefined = new (not yet saved)
  sku: string;
  attributes: Record<string, string>;
  priceOverride: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

interface Props {
  productId?: string;
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  /** Attribute axis names defined for this product (e.g. ["Size", "Color"]) */
  axes: string[];
  onAxesChange: (axes: string[]) => void;
  basePrice: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AxisBadge({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-(--info-bg) text-(--info) border border-(--info-border)">
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-(--danger) transition-colors"
        aria-label={`Remove axis ${name}`}
      >
        ×
      </button>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProductVariantEditor({
  variants,
  onChange,
  axes,
  onAxesChange,
  basePrice,
}: Props) {
  const [newAxis, setNewAxis] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const addAxis = () => {
    const trimmed = newAxis.trim();
    if (!trimmed || axes.includes(trimmed)) return;
    onAxesChange([...axes, trimmed]);
    setNewAxis("");
  };

  const removeAxis = (axis: string) => {
    onAxesChange(axes.filter((a) => a !== axis));
    // Also remove that attribute key from all variants
    onChange(
      variants.map((v) => {
        const attrs = { ...v.attributes };
        delete attrs[axis];
        return { ...v, attributes: attrs };
      })
    );
  };

  const addVariant = () => {
    const blankAttrs = Object.fromEntries(axes.map((a) => [a, ""]));
    onChange([
      ...variants,
      {
        sku: "",
        attributes: blankAttrs,
        priceOverride: "",
        stock: "0",
        imageUrl: "",
        isActive: true,
      },
    ]);
    setExpanded((prev) => ({ ...prev, [variants.length]: true }));
  };

  const removeVariant = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx: number, patch: Partial<VariantRow>) => {
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const updateAttr = (idx: number, axis: string, value: string) => {
    const updated = { ...variants[idx].attributes, [axis]: value };
    updateVariant(idx, { attributes: updated });
  };

  const toggleRow = (idx: number) =>
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // Auto-generate SKU from attribute values
  const suggestSku = (attrs: Record<string, string>) =>
    Object.values(attrs)
      .filter(Boolean)
      .join("-")
      .toUpperCase()
      .replace(/\s+/g, "");

  return (
    <div className="space-y-5">
      {/* Attribute Axes */}
      <div>
        <Label className="text-sm font-semibold text-(--text-primary) mb-2 block">
          Variant Axes
          <span className="ml-2 text-xs font-normal text-(--text-tertiary)">
            (e.g. Size, Color, Material)
          </span>
        </Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {axes.map((axis) => (
            <AxisBadge key={axis} name={axis} onRemove={() => removeAxis(axis)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add axis (e.g. Size)"
            value={newAxis}
            onChange={(e) => setNewAxis(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAxis())}
            className="h-9 text-sm border-(--border-mid) max-w-48"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAxis}
            className="h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <Separator />

      {/* Variant Rows */}
      {variants.length === 0 ? (
        <p className="text-sm text-(--text-tertiary) italic">
          No variants yet. Add attribute axes above, then create variant combinations below.
        </p>
      ) : (
        <div className="space-y-2">
          {variants.map((variant, idx) => {
            const isOpen = !!expanded[idx];
            const label =
              Object.values(variant.attributes).filter(Boolean).join(" / ") ||
              `Variant ${idx + 1}`;

            return (
              <div
                key={idx}
                className="rounded-xl border border-(--border-light) bg-(--bg-surface) overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleRow(idx)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-(--text-primary) truncate">
                      {label}
                    </span>
                    {variant.sku && (
                      <span className="text-xs font-mono text-(--text-tertiary) shrink-0">
                        {variant.sku}
                      </span>
                    )}
                    <span
                      className={`ml-auto shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        variant.isActive
                          ? "bg-(--success-bg) text-(--success)"
                          : "bg-(--off-white-2) text-(--text-tertiary)"
                      }`}
                    >
                      {variant.isActive ? "Active" : "Inactive"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="shrink-0 p-1.5 rounded-lg text-(--text-tertiary) hover:text-(--danger) hover:bg-(--danger-bg) transition-colors"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded form */}
                {isOpen && (
                  <div className="border-t border-(--border-light) px-4 pb-4 pt-3 space-y-4">
                    {/* Attribute values */}
                    {axes.length > 0 && (
                      <div className={`grid gap-3 ${axes.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
                        {axes.map((axis) => (
                          <div key={axis}>
                            <Label className="text-xs text-(--text-secondary) mb-1 block">
                              {axis}
                            </Label>
                            <Input
                              placeholder={`e.g. ${axis === "Size" ? "L" : axis === "Color" ? "Red" : "..."}`}
                              value={variant.attributes[axis] ?? ""}
                              onChange={(e) => {
                                updateAttr(idx, axis, e.target.value);
                                // Auto-suggest SKU if still empty
                                if (!variant.sku) {
                                  const updated = { ...variant.attributes, [axis]: e.target.value };
                                  updateVariant(idx, { sku: suggestSku(updated) });
                                }
                              }}
                              className="h-9 text-sm border-(--border-mid)"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SKU / Price / Stock / Image */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-(--text-secondary) mb-1 block">
                          SKU <span className="text-(--danger)">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. SHIRT-L-RED"
                          value={variant.sku}
                          onChange={(e) =>
                            updateVariant(idx, { sku: e.target.value.toUpperCase() })
                          }
                          className="h-9 text-sm font-mono border-(--border-mid)"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-(--text-secondary) mb-1 block">
                          Price Override
                          <span className="ml-1 text-(--text-tertiary)">
                            (base: ₺{basePrice.toFixed(2)})
                          </span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Leave blank to use base price"
                          value={variant.priceOverride}
                          onChange={(e) =>
                            updateVariant(idx, { priceOverride: e.target.value })
                          }
                          className="h-9 text-sm border-(--border-mid)"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-(--text-secondary) mb-1 block">
                          Stock <span className="text-(--danger)">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariant(idx, { stock: e.target.value })
                          }
                          className="h-9 text-sm border-(--border-mid)"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-(--text-secondary) mb-1 block">
                          Variant Image URL
                        </Label>
                        <Input
                          placeholder="https://..."
                          value={variant.imageUrl}
                          onChange={(e) =>
                            updateVariant(idx, { imageUrl: e.target.value })
                          }
                          className="h-9 text-sm border-(--border-mid)"
                        />
                      </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`variant-active-${idx}`}
                        checked={variant.isActive}
                        onChange={(e) =>
                          updateVariant(idx, { isActive: e.target.checked })
                        }
                        className="w-4 h-4 accent-(--charcoal)"
                      />
                      <Label
                        htmlFor={`variant-active-${idx}`}
                        className="text-sm text-(--text-secondary) cursor-pointer"
                      >
                        Active (visible to customers)
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addVariant}
        disabled={axes.length === 0}
        className="w-full h-10 border-dashed border-(--border-mid) text-(--text-secondary) hover:text-(--text-primary)"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant Combination
        {axes.length === 0 && (
          <span className="ml-2 text-xs text-(--text-tertiary)">(add axes first)</span>
        )}
      </Button>
    </div>
  );
}
