"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  TagFilter,
  type TagFilterState,
} from "@/components/modules/store/TagFilter";

export function StoreCategoryFilter({
  slug,
  cat,
  value,
  availableTags,
}: {
  slug: string;
  cat: string;
  value: TagFilterState;
  availableTags: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = useCallback(
    (next: TagFilterState) => {
      const params = new URLSearchParams();
      if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
      if (next.minPrice) params.set("minPrice", String(next.minPrice));
      if (next.maxPrice) params.set("maxPrice", String(next.maxPrice));
      next.tags.forEach((t) => params.append("tags[]", t));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router],
  );

  return (
    <TagFilter
      availableTags={availableTags}
      value={value}
      onChange={handleChange}
    />
  );
}
