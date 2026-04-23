import { Suspense } from "react";
import { fetchISR, fetchSSR } from "@/lib/fetch";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
    fetchSSR<{ data: any[] }>(`/products/search?${urlParams.toString()}`),
    fetchISR<{ data: any[] }>(`/categories`),
  ]);

  const products = results?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {q ? (
            <>
              &ldquo;<span className="text-blue-600">{q}</span>&rdquo; için
              sonuçlar
            </>
          ) : (
            "Tüm Ürünler"
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {products.length} ürün bulundu
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
                  Tümü
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
              Fiyat Aralığı
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
                Sonuç bulunamadı
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Farklı anahtar kelimeler deneyebilir veya filtreleri
                temizleyebilirsiniz.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800"
              >
                Ana Sayfaya Dön
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.categoryName}
                    </p>
                    <p className="text-base font-bold text-gray-900 mt-2">
                      {product.minPrice
                        ? `₺${product.minPrice.toLocaleString("tr-TR")}`
                        : "Fiyat sorunuz"}
                    </p>
                    {product.offerCount > 1 && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        {product.offerCount} satıcı
                      </p>
                    )}
                  </div>
                </Link>
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
