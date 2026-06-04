import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import Link from "next/link";
import { ChevronRight, Home, Layers, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { CategoryControls } from "@/components/modules/category/CategoryControls";
import { CategoryProductGrid } from "@/components/modules/category/CategoryProductGrid";
import type { Product } from "@/types/entities";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    subcategory?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function CategoryProducts({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Record<string, string | undefined>;
}) {
  const qs = new URLSearchParams();
  if (searchParams.page)       qs.set("page", searchParams.page);
  if (searchParams.sort)       qs.set("sort", searchParams.sort);
  if (searchParams.subcategory) qs.set("subcategory", searchParams.subcategory);
  if (searchParams.minPrice)   qs.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice)   qs.set("maxPrice", searchParams.maxPrice);

  const [categoryData, productsData] = await Promise.all([
    fetchISR<{ category: any; SubCategories: any[]; products: any[] }>(
      `/api/categories/${slug}`,
    ),
    fetchISR<{ data: any[] }>(
      `/api/products?category=${slug}&${qs.toString()}`,
    ),
  ]);

  if (!categoryData?.category) notFound();

  const category = {
    ...categoryData.category,
    subCategories: categoryData.SubCategories ?? [],
    parent: categoryData.category.parent ?? null,
  };

  const rawProducts =
    (categoryData.products?.length ?? 0) > 0
      ? categoryData.products
      : (productsData?.data ?? []);

  const products: Product[] = rawProducts.map((p: any): Product => ({
    id: p.id ?? p.Id,
    merchantId: p.merchantId ?? "",
    merchantStoreName: p.merchantStoreName ?? p.merchant?.storeName ?? "",
    merchantSlug: p.merchantSlug ?? p.merchant?.slug ?? "",
    name: p.name ?? p.Name,
    description: p.description ?? "",
    categoryId: p.categoryId ?? "",
    categoryName: p.categoryName ?? p.category?.name ?? "",
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

  const subcategories: { id: string; name: string; slug: string; productCount?: number }[] =
    category.subCategories ?? [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 50%, rgba(200,16,46,0.12) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 mb-6 text-[12px]"
            style={{ color: "var(--charcoal-soft)" }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home className="w-3 h-3" />
              Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link
              href="/categories"
              className="hover:text-white transition-colors"
            >
              Categories
            </Link>
            {category.parent && (
              <>
                <ChevronRight className="w-3 h-3 opacity-40" />
                <Link
                  href={`/category/${category.parent.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {category.parent.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">{category.name}</span>
          </nav>

          {/* Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(200,16,46,0.18)" }}
            >
              {category.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.iconUrl}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <Tag className="w-4 h-4" style={{ color: "var(--red-light)" }} />
              )}
            </div>
            <div>
              <h1
                className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold text-white leading-tight"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {category.name}
              </h1>
              {category.description && (
                <p
                  className="mt-1 text-sm max-w-lg line-clamp-2"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {/* Product count */}
          <div
            className="flex items-center gap-1.5 mb-6"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-sm">
              <span className="font-semibold text-white">
                {products.length.toLocaleString()}
              </span>{" "}
              products
            </span>
          </div>

          {/* Subcategory tabs */}
          {subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mb-1">
              <Link
                href={`/category/${slug}`}
                className="shrink-0 px-3.5 h-8 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center"
                style={
                  !searchParams.subcategory
                    ? { background: "#c8102e", color: "#fff" }
                    : {
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.65)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }
                }
              >
                All
              </Link>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${slug}?subcategory=${sub.slug}`}
                  className="shrink-0 px-3.5 h-8 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5"
                  style={
                    searchParams.subcategory === sub.slug
                      ? { background: "#c8102e", color: "#fff" }
                      : {
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.65)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }
                  }
                >
                  {sub.name}
                  {sub.productCount !== undefined && (
                    <span
                      className="text-[10px] opacity-70"
                    >
                      {sub.productCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div
        className="max-w-7xl mx-auto px-4 md:px-8 py-8"
        style={{ background: "var(--off-white)" }}
      >
        <CategoryControls
          productCount={products.length}
          currentSort={searchParams.sort}
        />

        <div className="pt-6">
          <CategoryProductGrid products={products} />
        </div>
      </div>
    </>
  );
}

// ── Skeleton fallback ─────────────────────────────────────────────────────────
function CategorySkeleton() {
  return (
    <>
      <div className="py-12 px-4" style={{ background: "var(--charcoal)" }}>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-4 w-48 mb-6 opacity-20" />
          <Skeleton className="h-10 w-64 mb-3 opacity-20" />
          <Skeleton className="h-4 w-32 mb-6 opacity-20" />
          <div className="flex gap-2">
            {[64, 80, 72, 56].map((w, i) => (
              <Skeleton key={i} className={`h-8 w-${w} rounded-lg opacity-20`} />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  );
}

// ── Page exports ──────────────────────────────────────────────────────────────
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bazr.com";

  const data     = await fetchISR<{ category: { name: string; slug: string } }>(
    `/api/categories/${resolvedParams.slug}`,
  );
  const category = data?.category;

  const breadcrumbs = [
    { name: "Home",       url: siteUrl },
    { name: "Categories", url: `${siteUrl}/categories` },
    ...(category
      ? [{ name: category.name, url: `${siteUrl}/category/${category.slug}` }]
      : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryProducts
          slug={resolvedParams.slug}
          searchParams={resolvedSearch}
        />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchISR<{ category: any }>(`/api/categories/${slug}`);
  const category = data?.category;
  return {
    title: category ? `${category.name} — Marketplace` : "Category",
    description: `Explore ${category?.name ?? "Category"} products on BAZR`,
  };
}
