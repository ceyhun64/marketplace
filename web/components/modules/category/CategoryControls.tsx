"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

const SORT_OPTIONS = [
  { value: "",            label: "Default" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "newest",     label: "Newest First" },
];

interface CategoryControlsProps {
  productCount: number;
  currentSort?: string;
}

export function CategoryControls({ productCount, currentSort }: CategoryControlsProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const handleSort = useCallback(
    (value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set("sort", value);
      else next.delete("sort");
      next.delete("page"); // reset pagination on sort change
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params],
  );

  return (
    <div
      className="flex items-center justify-between gap-3 py-3.5 px-4 md:px-0"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
        <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
          {productCount.toLocaleString()}
        </span>{" "}
        {productCount === 1 ? "product" : "products"}
      </p>

      <div className="relative flex items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--charcoal-mist)" }} />
        <div className="relative">
          <select
            value={currentSort ?? ""}
            onChange={(e) => handleSort(e.target.value)}
            className="h-9 pl-3 pr-8 text-sm rounded-lg appearance-none cursor-pointer outline-none"
            style={{
              background: "white",
              border: "1px solid var(--border-light)",
              color: "var(--charcoal)",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: "var(--charcoal-mist)" }}
          />
        </div>
      </div>
    </div>
  );
}
