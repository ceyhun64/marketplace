// app/sitemap.ts — Dinamik XML sitemap üreteci
// Marketplace, kategori ve mağaza sayfalarını indeksler.
import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketplace.example.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5010";

// ── Veri çekiciler ────────────────────────────────────────────────────────────

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 3600 }, // 1 saat
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface ProductItem {
  id: string;
  updatedAt?: string;
}

interface CategoryItem {
  id: string;
  slug?: string;
  name: string;
}

interface StoreItem {
  slug: string;
  updatedAt?: string;
}

// ── Sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ── Statik sayfalar ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stores`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/bestsellers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/new`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/deals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/flash-sale`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/seller-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // ── Dinamik ürün sayfaları ────────────────────────────────────────────────
  const productsData = await fetchJson<{
    items?: ProductItem[];
    data?: ProductItem[];
  }>("/api/products?limit=500&page=1");

  const products = productsData?.items ?? productsData?.data ?? [];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.id}`,
    lastModified: p.updatedAt ?? now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // ── Kategori sayfaları ────────────────────────────────────────────────────
  const categoriesData = await fetchJson<
    CategoryItem[] | { items?: CategoryItem[] }
  >("/api/categories");

  const categories: CategoryItem[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData?.items ?? []);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/category/${c.slug ?? c.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ── Mağaza sayfaları ──────────────────────────────────────────────────────
  const storesData = await fetchJson<{
    items?: StoreItem[];
    data?: StoreItem[];
  }>("/api/store/list?limit=200&page=1");

  const stores = storesData?.items ?? storesData?.data ?? [];

  const storeRoutes: MetadataRoute.Sitemap = stores.map((s) => ({
    url: `${BASE_URL}/store/${s.slug}`,
    lastModified: s.updatedAt ?? now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...storeRoutes];
}
