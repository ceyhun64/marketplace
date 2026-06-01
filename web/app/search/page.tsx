import { Suspense } from "react";
import SearchPage from "@/components/modules/search/SearchPage";
import { Skeleton } from "@/components/ui/skeleton";

export function generateMetadata() {
  return { title: "Search — Marketplace" };
}

function SearchFallback() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <div style={{ background: "var(--charcoal)", padding: "32px 24px 24px" }}>
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-12 w-full max-w-2xl bg-white/10 rounded-xl" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-black/5">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchRoute() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPage />
    </Suspense>
  );
}
