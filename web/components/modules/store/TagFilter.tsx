"use client";

import { useState } from "react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TagFilterState {
  tags: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

interface TagFilterProps {
  /** Mevcut sistemde tanımlı tüm etiketler */
  availableTags: string[];
  value: TagFilterState;
  onChange: (state: TagFilterState) => void;
  maxPrice?: number;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TagFilter({
  availableTags,
  value,
  onChange,
  maxPrice = 10000,
  className,
}: TagFilterProps) {
  const [priceOpen, setPriceOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(true);

  const activeCount =
    value.tags.length +
    (value.minPrice ? 1 : 0) +
    (value.maxPrice ? 1 : 0) +
    (value.sort !== "newest" ? 1 : 0);

  function toggleTag(tag: string) {
    const next = value.tags.includes(tag)
      ? value.tags.filter((t) => t !== tag)
      : [...value.tags, tag];
    onChange({ ...value, tags: next });
  }

  function clearAll() {
    onChange({
      tags: [],
      minPrice: undefined,
      maxPrice: undefined,
      sort: "newest",
    });
  }

  return (
    <aside className={cn("space-y-5", className)}>
      {/* Başlık + temizle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sort
        </p>
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, sort: opt.value })}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                value.sort === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fiyat aralığı */}
      <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-0 hover:bg-transparent"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Price Range
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                priceOpen && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <Slider
            min={0}
            max={maxPrice}
            step={50}
            value={[value.minPrice ?? 0, value.maxPrice ?? maxPrice]}
            onValueChange={([min, max]) =>
              onChange({
                ...value,
                minPrice: min > 0 ? min : undefined,
                maxPrice: max < maxPrice ? max : undefined,
              })
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₺{(value.minPrice ?? 0).toLocaleString("tr-TR")}</span>
            <span>₺{(value.maxPrice ?? maxPrice).toLocaleString("tr-TR")}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Labeller */}
      <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-0 hover:bg-transparent"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Labeller
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                tagsOpen && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          {availableTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No tags in this category.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const active = value.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Aktif filtre özetleri */}
      {value.tags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Selected tags</p>
          <div className="flex flex-wrap gap-1.5">
            {value.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-1 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="ml-0.5 rounded-full hover:text-destructive"
                  aria-label={`Remove ${tag} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default TagFilter;
