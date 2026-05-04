import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <div className="mx-auto px-6 pb-20 pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Galeri Skeleton */}
          <div className="lg:col-span-6 h-fit">
            {/* Ana Görsel */}
            <div className="relative aspect-square bg-white border border-slate-200 rounded overflow-hidden mb-4">
              <Skeleton className="w-full h-full bg-slate-200" />
            </div>

            {/* Thumbnail'lar */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="aspect-square bg-slate-200 rounded border border-slate-200"
                />
              ))}
            </div>
          </div>

          {/* Ürün Bilgileri Skeleton */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <div className="space-y-8">
              {/* ProductInfo Skeleton */}
              <div className="space-y-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20 bg-slate-200" />
                  <Skeleton className="h-3 w-3 bg-slate-200 rounded-full" />
                  <Skeleton className="h-3 w-24 bg-slate-200" />
                </div>

                {/* Başlık */}
                <Skeleton className="h-8 w-3/4 bg-slate-200" />

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32 bg-slate-200" />
                </div>

                {/* Fiyat */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <Skeleton className="h-10 w-32 bg-slate-200" />
                    <Skeleton className="h-6 w-24 bg-slate-200" />
                  </div>
                  <Skeleton className="h-4 w-40 bg-slate-200" />
                </div>

                {/* Stok Durumu */}
                <Skeleton className="h-6 w-48 bg-slate-200" />
              </div>

              <div className="space-y-6">
                {/* Beden Seçimi Skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24 bg-slate-200" />
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 bg-slate-200 rounded" />
                    ))}
                  </div>
                </div>

                {/* Aksiyon Butonları Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Quantity */}
                    <Skeleton className="h-14 w-32 bg-slate-200 rounded" />
                    {/* Add to Cart */}
                    <Skeleton className="h-14 flex-1 bg-slate-200 rounded" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-12 bg-slate-200 rounded" />
                    <Skeleton className="h-12 bg-slate-200 rounded" />
                    <Skeleton className="h-12 bg-slate-200 rounded" />
                  </div>
                </div>

                {/* Fiyat Özeti Skeleton */}
                <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32 bg-slate-200" />
                    <Skeleton className="h-4 w-20 bg-slate-200" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 bg-slate-200" />
                    <Skeleton className="h-4 w-20 bg-slate-200" />
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between">
                    <Skeleton className="h-5 w-32 bg-slate-200" />
                    <Skeleton className="h-5 w-24 bg-slate-200" />
                  </div>
                </div>
              </div>

              {/* Özellikler Skeleton */}
              <div className="flex">
                <div className="space-y-4 pt-4 border-t border-slate-100 w-full">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-slate-200 rounded-full" />
                    <Skeleton className="h-3 w-32 bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50/50 border border-slate-100 flex items-center gap-3"
                      >
                        <Skeleton className="w-10 h-10 bg-slate-200 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-16 bg-slate-200" />
                          <Skeleton className="h-2 w-24 bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full bg-slate-200" />
                    <Skeleton className="h-3 w-full bg-slate-200" />
                    <Skeleton className="h-3 w-3/4 bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistikler Skeleton */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 p-4 rounded text-center"
            >
              <Skeleton className="h-5 w-5 mx-auto mb-2 bg-slate-200 rounded-full" />
              <Skeleton className="h-6 w-12 mx-auto mb-1 bg-slate-200" />
              <Skeleton className="h-2 w-16 mx-auto bg-slate-200" />
            </div>
          ))}
        </div>

        {/* İlgili Ürünler Skeleton */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-5 w-5 bg-slate-200 rounded-full" />
            <Skeleton className="h-6 w-32 bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square bg-slate-200 rounded" />
                <Skeleton className="h-4 w-3/4 bg-slate-200" />
                <Skeleton className="h-5 w-20 bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Marka Ürünleri Skeleton */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-5 w-5 bg-slate-200 rounded-full" />
            <Skeleton className="h-6 w-48 bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square bg-slate-200 rounded" />
                <Skeleton className="h-4 w-full bg-slate-200" />
                <Skeleton className="h-5 w-16 bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Sekmeler Skeleton */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="flex gap-6 mb-6">
            <Skeleton className="h-10 w-24 bg-slate-200" />
            <Skeleton className="h-10 w-24 bg-slate-200" />
            <Skeleton className="h-10 w-24 bg-slate-200" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-slate-200" />
            <Skeleton className="h-4 w-full bg-slate-200" />
            <Skeleton className="h-4 w-5/6 bg-slate-200" />
            <Skeleton className="h-4 w-4/6 bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
