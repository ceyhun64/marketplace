import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    subcategory?: string;
  }>;
}

async function CategoryProducts({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams();
  if (searchParams.page) params.set("page", searchParams.page);
  if (searchParams.tags) params.set("tags", searchParams.tags);
  if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.subcategory)
    params.set("subcategory", searchParams.subcategory);

  const [categoryData, productsData] = await Promise.all([
    fetchISR<{ data: any }>(`/categories/${slug}`),
    fetchISR<{ data: any[] }>(
      `/products?category=${slug}&${params.toString()}`,
    ),
  ]);

  if (!categoryData?.data) notFound();

  const category = categoryData.data;
  const products = productsData?.data || [];
  const subcategories = category.subCategories || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-900">
          Ana Sayfa
        </Link>
        <span>/</span>
        {category.parent && (
          <>
            <Link
              href={`/category/${category.parent.slug}`}
              className="hover:text-gray-900"
            >
              {category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{category.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          {subcategories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Alt Kategoriler
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={`/category/${slug}`}
                    className={`block text-sm px-2 py-1.5 rounded-lg ${!searchParams.subcategory ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    All
                  </Link>
                </li>
                {subcategories.map((sub: any) => (
                  <li key={sub.id}>
                    <Link
                      href={`/category/${slug}?subcategory=${sub.slug}`}
                      className={`block text-sm px-2 py-1.5 rounded-lg ${searchParams.subcategory === sub.slug ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price Filter */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Price Range
            </h3>
            <form className="space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={searchParams.minPrice}
                  placeholder="Min ₺"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <span className="text-gray-400 text-sm">—</span>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={searchParams.maxPrice}
                  placeholder="Max ₺"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white text-sm py-1.5 rounded-lg hover:bg-gray-800"
              >
                Filtrele
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {category.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {products.length} products found
              </p>
            </div>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              defaultValue={searchParams.sort || ""}
            >
              <option value="">Sort</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="newest">En Yeni</option>
            </select>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📦</div>
              <p className="font-medium">No products found in this category</p>
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
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
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

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <CategoryProducts
        slug={resolvedParams.slug}
        searchParams={resolvedSearch}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchISR<{ data: any }>(`/categories/${slug}`);
  const category = data?.data;
  return {
    title: category ? `${category.name} — Marketplace` : "Category",
    description: `Explore ${category?.name || "Category"} products`,
  };
}
