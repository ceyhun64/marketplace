"use client";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { StoreCategoryFilter } from "./StoreCategoryFilter";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  TagFilter,
  type TagFilterState,
} from "@/components/modules/store/TagFilter";
import type { Product, MerchantProfile, Category } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string; cat: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

// ── Data Fetchers (SSR / ISR) ─────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5010";

async function getStore(slug: string): Promise<MerchantProfile | null> {
  try {
    const res = await fetch(`${API_URL}/api/store/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCategory(
  slug: string,
  cat: string,
): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/api/store/${slug}/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const categories: Category[] = await res.json();
    return categories.find((c) => c.slug === cat || c.id === cat) ?? null;
  } catch {
    return null;
  }
}

async function getProducts(
  slug: string,
  cat: string,
  searchParams: Record<string, string | string[]>,
): Promise<{ items: Product[]; totalCount: number }> {
  const params = new URLSearchParams();
  params.set("category", cat);
  if (searchParams.search) params.set("search", String(searchParams.search));
  if (searchParams.sort) params.set("sort", String(searchParams.sort));
  if (searchParams.minPrice)
    params.set("minPrice", String(searchParams.minPrice));
  if (searchParams.maxPrice)
    params.set("maxPrice", String(searchParams.maxPrice));
  if (searchParams["tags[]"]) {
    const tags = Array.isArray(searchParams["tags[]"])
      ? searchParams["tags[]"]
      : [searchParams["tags[]"]];
    tags.forEach((t) => params.append("tags[]", t));
  }
  params.set("page", String(searchParams.page ?? 1));
  params.set("limit", "24");

  try {
    const res = await fetch(`${API_URL}/api/store/${slug}/products?${params}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return { items: [], totalCount: 0 };
    return res.json();
  } catch {
    return { items: [], totalCount: 0 };
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, cat } = await params;
  const [store, category] = await Promise.all([
    getStore(slug),
    getCategory(slug, cat),
  ]);
  if (!store || !category) return {};
  return {
    title: `${category.name} — ${store.storeName}`,
    description: `${store.storeName} products in ${category.name} category products.`,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StoreCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug, cat } = await params;
  const sp = await searchParams;

  const [store, category, productsData] = await Promise.all([
    getStore(slug),
    getCategory(slug, cat),
    getProducts(slug, cat, sp),
  ]);

  if (!store) notFound();
  if (!category) notFound();

  const { items: products, totalCount } = productsData;

  // Mevcut filtre durumu URL'den okunur — client-side interaktif değil,
  // navigasyon ile URL güncellenerek sayfayı yeniden render eder.
  const currentFilter: TagFilterState = {
    tags: sp["tags[]"]
      ? Array.isArray(sp["tags[]"])
        ? sp["tags[]"]
        : [sp["tags[]"]]
      : [],
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    sort: (sp.sort as TagFilterState["sort"]) ?? "newest",
  };

  // Sayfadaki ürünlerden mevcut etiketleri topla
  const availableTags = Array.from(new Set(products.flatMap((p) => p.tags)));

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={`/store/${slug}`}
          className="hover:text-foreground transition-colors"
        >
          {store.storeName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <div className="flex items-baseline justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filtre paneli — client component, URL navigasyonu ile çalışır */}
        <StoreCategoryFilter
          slug={slug}
          cat={cat}
          value={currentFilter}
          availableTags={availableTags}
        />

        {/* Ürün grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-muted-foreground">
            <p className="text-base">No products found in this category.</p>
            <Link
              href={`/store/${slug}`}
              className="text-sm text-primary hover:underline"
            >
              Back to all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                context="store"
                storeSlug={slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
