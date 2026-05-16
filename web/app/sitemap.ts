// app/sitemap.ts — Next.js App Router sitemap üreteci
// robots.ts tarafından referans veriliyordu; bu dosya eksikti.
import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketplace.example.com";

// Statik rotalar — her zaman indexlenmeli
const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
  { url: `${BASE_URL}/products`, priority: 0.9, changeFrequency: "daily" },
  { url: `${BASE_URL}/categories`, priority: 0.9, changeFrequency: "weekly" },
  { url: `${BASE_URL}/bestsellers`, priority: 0.8, changeFrequency: "daily" },
  { url: `${BASE_URL}/new`, priority: 0.8, changeFrequency: "daily" },
  { url: `${BASE_URL}/deals`, priority: 0.8, changeFrequency: "daily" },
  { url: `${BASE_URL}/flash-sale`, priority: 0.7, changeFrequency: "hourly" },
  { url: `${BASE_URL}/brands`, priority: 0.7, changeFrequency: "weekly" },
  { url: `${BASE_URL}/compare`, priority: 0.6, changeFrequency: "monthly" },
  { url: `${BASE_URL}/plugins`, priority: 0.6, changeFrequency: "weekly" },
  { url: `${BASE_URL}/blog`, priority: 0.7, changeFrequency: "daily" },
  { url: `${BASE_URL}/gift-cards`, priority: 0.6, changeFrequency: "monthly" },
  { url: `${BASE_URL}/loyalty`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE_URL}/referral`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE_URL}/about`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE_URL}/contact`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE_URL}/faq`, priority: 0.6, changeFrequency: "monthly" },
  { url: `${BASE_URL}/help-center`, priority: 0.6, changeFrequency: "monthly" },
  { url: `${BASE_URL}/returns`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "yearly" },
  { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: "yearly" },
  {
    url: `${BASE_URL}/auth/login`,
    priority: 0.4,
    changeFrequency: "monthly",
  },
  {
    url: `${BASE_URL}/auth/register`,
    priority: 0.4,
    changeFrequency: "monthly",
  },
  {
    url: `${BASE_URL}/auth/apply-merchant`,
    priority: 0.5,
    changeFrequency: "monthly",
  },
];

async function fetchDynamicRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "https://api.marketplace.example.com";

    const [productsRes, categoriesRes] = await Promise.allSettled([
      fetch(`${apiBase}/api/products?limit=1000&fields=id,updatedAt`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/api/categories?fields=slug,updatedAt`, {
        next: { revalidate: 86400 },
      }),
    ]);

    const routes: MetadataRoute.Sitemap = [];

    if (productsRes.status === "fulfilled" && productsRes.value.ok) {
      const products: { id: string; updatedAt?: string }[] =
        await productsRes.value.json();
      for (const p of products) {
        routes.push({
          url: `${BASE_URL}/product/${p.id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
          priority: 0.7,
          changeFrequency: "weekly",
        });
      }
    }

    if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
      const categories: { slug: string; updatedAt?: string }[] =
        await categoriesRes.value.json();
      for (const c of categories) {
        routes.push({
          url: `${BASE_URL}/category/${c.slug}`,
          lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
          priority: 0.8,
          changeFrequency: "daily",
        });
      }
    }

    return routes;
  } catch {
    // API erişilemezse statik rotalar yeterli
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicRoutes = await fetchDynamicRoutes();
  return [...staticRoutes, ...dynamicRoutes];
}
