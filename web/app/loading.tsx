// app/loading.tsx — Sayfa geçişlerinde gösterilen global yüklenme iskeleti

import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar iskelet */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Skeleton className="h-8 w-32 rounded-md" />
          {/* Arama çubuğu */}
          <Skeleton className="h-9 flex-1 max-w-xl rounded-full hidden md:block" />
          {/* Sağ ikonlar */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* İçerik alanı */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero banner iskelet */}
        <Skeleton className="w-full h-52 md:h-72 rounded-2xl" />

        {/* Kategori çipsleri */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>

        {/* Ürün grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl w-full" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-5 w-1/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
