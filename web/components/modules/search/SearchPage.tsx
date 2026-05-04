import { Suspense } from "react";
import { fetchISR, fetchSSR } from "@/lib/fetch";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    subcategory?: string;
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

async function SearchResults({
  q,
  params,
}: {
  q: string;
  params: Record<string, string | undefined>;
}) {
  const urlParams = new URLSearchParams();
  if (q) urlParams.set("q", q);
  if (params.category) urlParams.set("category", params.category);
  if (params.subcategory) urlParams.set("subcategory", params.subcategory);
  if (params.tags) urlParams.set("tags", params.tags);
  if (params.minPrice) urlParams.set("minPrice", params.minPrice);
  if (params.maxPrice) urlParams.set("maxPrice", params.maxPrice);
  if (params.page) urlParams.set("page", params.page);

  const [results, categoriesData] = await Promise.all([
    fetchSSR<any>(`/api/products/search?${urlParams.toString()}`).catch(
      () => null,
    ),
    fetchISR<any>(`/api/categories`).catch(() => null),
  ]);

  const rawProducts: any[] =
    results?.items ?? results?.data ?? (Array.isArray(results) ? results : []);
  const categories: any[] =
    categoriesData?.items ??
    categoriesData?.data ??
    (Array.isArray(categoriesData) ? categoriesData : []);

  // Normalize to Product type
  const products: Product[] = rawProducts.map((p: any): Product => ({
    id: p.id ?? p.Id,
    merchantId: p.merchantId ?? "",
    merchantStoreName: p.merchantStoreName ?? p.merchant?.storeName ?? "",
    merchantSlug: p.merchantSlug ?? p.merchant?.slug ?? "",
    name: p.name ?? p.Name,
    description: p.description ?? "",
    categoryId: p.categoryId ?? "",
    categoryName: p.categoryName ?? p.Category ?? p.category?.name ?? "",
    images: p.images ?? p.Images ?? [],
    tags: p.tags ?? [],
    price: p.price ?? p.Price ?? p.minPrice ?? 0,
    stock: p.stock ?? 0,
    publishToMarket: p.publishToMarket ?? true,
    publishToStore: p.publishToStore ?? true,
    isApproved: p.isApproved ?? true,
    isDeleted: p.isDeleted ?? false,
    createdAt: p.createdAt ?? "",
    updatedAt: p.updatedAt,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {q ? (
            <>
              Results for &ldquo;<span className="text-blue-600">{q}</span>
              &rdquo;
            </>
          ) : (
            "All Products"
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {products.length} products found
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-56 flex-shrink-0 space-y-4">
          {/* Categories */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Kategoriler
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={`/search?q=${q || ""}`}
                  className={`block text-sm px-2 py-1.5 rounded-lg ${!params.category ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  All
                </Link>
              </li>
              {categories.slice(0, 10).map((cat: any) => (
                <li key={cat.id}>
                  <Link
                    href={`/search?q=${q || ""}&category=${cat.slug}`}
                    className={`block text-sm px-2 py-1.5 rounded-lg ${params.category === cat.slug ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Price Range
            </h3>
            <form action="/search" className="space-y-2">
              {q && <input type="hidden" name="q" value={q} />}
              {params.category && (
                <input type="hidden" name="category" value={params.category} />
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={params.minPrice}
                  placeholder="Min ₺"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={params.maxPrice}
                  placeholder="Max ₺"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white text-sm py-1.5 rounded-lg hover:bg-gray-800"
              >
                Uygula
              </button>
            </form>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-lg font-semibold text-gray-900">
                No results found
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Try different keywords or adjust filters.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  context="marketplace"
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const q = resolved.q || "";

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-72 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <SearchResults q={q} params={resolved} />
    </Suspense>
  );
}

export function generateMetadata() {
  return { title: "Arama — Marketplace" };
}
