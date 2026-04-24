import { Suspense } from "react";
import ProductsListPage from "@/components/modules/products/ProductsListPage";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "All Products — Marketplace",
  description:
    "Browse thousands of products from verified sellers. Filter by category, price and more.",
};

function ProductsPageFallback() {
  return (
    <main className="min-h-screen bg-[#F5F2EB]">
      <div className="bg-[#0D0D0D] py-10 px-4">
        <div className="max-w-[1200px] mx-auto">
          <Skeleton className="h-12 w-64 bg-white/10 rounded mb-4" />
          <Skeleton className="h-12 w-96 bg-white/10 rounded-full" />
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-black/5">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ProductsRoute() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsListPage />
    </Suspense>
  );
}
