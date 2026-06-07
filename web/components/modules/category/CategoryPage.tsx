import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import Link from "next/link";
import { ChevronRight, Home, Layers, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { CategoryFilteredGrid } from "@/components/modules/category/CategoryFilteredGrid";

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

// -- Data fetching -------------------------------------------------------------
async function CategoryProducts({
  slug,
}: {
  slug: string;
}) {
  const categoryData = await fetchISR<{ category: any; subCategories: any[] }>(
    `/api/categories/${slug}`,
  );

  if (!categoryData?.category) notFound();

  const category = {
    ...categoryData.category,
    subCategories: categoryData.subCategories ?? [],
    parent: categoryData.category.parent ?? null,
  };

  const subcategories: { id: string; name: string; slug: string; productCount?: number }[] =
    category.subCategories ?? [];

  return (
    <>
      {/* -- Hero ----------------------------------------------------------- */}
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
          {category.productCount != null && (
            <div
              className="flex items-center gap-1.5 mb-2"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-sm">
                <span className="font-semibold text-white">
                  {category.productCount.toLocaleString()}
                </span>{" "}
                products
              </span>
            </div>
          )}
        </div>
      </div>

      {/* -- Content -------------------------------------------------------- */}
      <div
        className="max-w-7xl mx-auto px-4 md:px-8 py-8"
        style={{ background: "var(--off-white)" }}
      >
        <CategoryFilteredGrid slug={slug} subcategories={subcategories} />
      </div>
    </>
  );
}

// -- Skeleton fallback ---------------------------------------------------------
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

// -- Page exports --------------------------------------------------------------
export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
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
        <CategoryProducts slug={resolvedParams.slug} />
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
