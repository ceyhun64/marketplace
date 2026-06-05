"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "default",     label: "Default" },
  { value: "price_asc",   label: "Price: Low → High" },
  { value: "price_desc",  label: "Price: High → Low" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "newest",      label: "Newest First" },
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
      if (value && value !== "default") next.set("sort", value);
      else next.delete("sort");
      next.delete("page");
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

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--charcoal-mist)" }} />
        <Select value={currentSort || "default"} onValueChange={handleSort}>
          <SelectTrigger className="h-9 w-auto text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
