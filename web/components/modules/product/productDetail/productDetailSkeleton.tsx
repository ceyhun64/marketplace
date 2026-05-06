import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailSkeleton() {
  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#fafafa", color: "#1e1e1e" }}
    >
      <div className="mx-auto px-6 pb-20 pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Gallery Skeleton */}
          <div className="lg:col-span-6 h-fit">
            {/* Main Image */}
            <div
              className="relative aspect-square overflow-hidden mb-4"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(30,30,30,0.1)",
                borderRadius: "14px",
              }}
            >
              <Skeleton
                className="w-full h-full"
                style={{ background: "#efeeec" }}
              />
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="aspect-square"
                  style={{
                    background: "#efeeec",
                    borderRadius: "8px",
                    border: "1px solid rgba(30,30,30,0.1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <div className="space-y-8">
              {/* ProductInfo Skeleton */}
              <div className="space-y-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                  <Skeleton
                    className="h-3 w-20"
                    style={{ background: "#efeeec" }}
                  />
                  <Skeleton
                    className="h-3 w-3 rounded-full"
                    style={{ background: "#efeeec" }}
                  />
                  <Skeleton
                    className="h-3 w-24"
                    style={{ background: "#efeeec" }}
                  />
                </div>

                {/* Title */}
                <Skeleton
                  className="h-8 w-3/4"
                  style={{ background: "#efeeec" }}
                />

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Skeleton
                    className="h-4 w-32"
                    style={{ background: "#efeeec" }}
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <Skeleton
                      className="h-10 w-32"
                      style={{ background: "#efeeec" }}
                    />
                    <Skeleton
                      className="h-6 w-24"
                      style={{ background: "#efeeec" }}
                    />
                  </div>
                  <Skeleton
                    className="h-4 w-40"
                    style={{ background: "#efeeec" }}
                  />
                </div>

                {/* Stock Status */}
                <Skeleton
                  className="h-6 w-48"
                  style={{ background: "#efeeec" }}
                />
              </div>

              <div className="space-y-6">
                {/* Size Selection Skeleton */}
                <div className="space-y-3">
                  <Skeleton
                    className="h-4 w-24"
                    style={{ background: "#efeeec" }}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-12"
                        style={{ background: "#efeeec", borderRadius: "8px" }}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Quantity */}
                    <Skeleton
                      className="h-12 w-32"
                      style={{ background: "#efeeec", borderRadius: "8px" }}
                    />
                    {/* Add to Cart */}
                    <Skeleton
                      className="h-12 flex-1"
                      style={{ background: "#efeeec", borderRadius: "8px" }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton
                      className="h-11"
                      style={{ background: "#efeeec", borderRadius: "8px" }}
                    />
                    <Skeleton
                      className="h-11"
                      style={{ background: "#efeeec", borderRadius: "8px" }}
                    />
                    <Skeleton
                      className="h-11"
                      style={{ background: "#efeeec", borderRadius: "8px" }}
                    />
                  </div>
                </div>

                {/* Price Summary Skeleton */}
                <div
                  className="p-4 space-y-2"
                  style={{
                    background: "#efeeec",
                    border: "1px solid rgba(30,30,30,0.1)",
                    borderRadius: "14px",
                  }}
                >
                  <div className="flex justify-between">
                    <Skeleton
                      className="h-4 w-32"
                      style={{ background: "#e6e4e1" }}
                    />
                    <Skeleton
                      className="h-4 w-20"
                      style={{ background: "#e6e4e1" }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton
                      className="h-4 w-24"
                      style={{ background: "#e6e4e1" }}
                    />
                    <Skeleton
                      className="h-4 w-20"
                      style={{ background: "#e6e4e1" }}
                    />
                  </div>
                  <div
                    className="pt-2 flex justify-between"
                    style={{ borderTop: "1px solid rgba(30,30,30,0.18)" }}
                  >
                    <Skeleton
                      className="h-5 w-32"
                      style={{ background: "#e6e4e1" }}
                    />
                    <Skeleton
                      className="h-5 w-24"
                      style={{ background: "#e6e4e1" }}
                    />
                  </div>
                </div>
              </div>

              {/* Specifications Skeleton */}
              <div className="flex">
                <div
                  className="space-y-4 pt-4 w-full"
                  style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <Skeleton
                      className="h-4 w-4 rounded-full"
                      style={{ background: "#efeeec" }}
                    />
                    <Skeleton
                      className="h-3 w-32"
                      style={{ background: "#efeeec" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="p-3 flex items-center gap-3"
                        style={{
                          background: "#efeeec",
                          border: "1px solid rgba(30,30,30,0.1)",
                          borderRadius: "8px",
                        }}
                      >
                        <Skeleton
                          className="w-10 h-10"
                          style={{ background: "#e6e4e1", borderRadius: "4px" }}
                        />
                        <div className="flex-1 space-y-2">
                          <Skeleton
                            className="h-3 w-16"
                            style={{ background: "#e6e4e1" }}
                          />
                          <Skeleton
                            className="h-2 w-24"
                            style={{ background: "#e6e4e1" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton
                      className="h-3 w-full"
                      style={{ background: "#efeeec" }}
                    />
                    <Skeleton
                      className="h-3 w-full"
                      style={{ background: "#efeeec" }}
                    />
                    <Skeleton
                      className="h-3 w-3/4"
                      style={{ background: "#efeeec" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 text-center"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(30,30,30,0.1)",
                borderRadius: "14px",
                boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
              }}
            >
              <Skeleton
                className="h-5 w-5 mx-auto mb-2 rounded-full"
                style={{ background: "#efeeec" }}
              />
              <Skeleton
                className="h-6 w-12 mx-auto mb-1"
                style={{ background: "#efeeec" }}
              />
              <Skeleton
                className="h-2 w-16 mx-auto"
                style={{ background: "#efeeec" }}
              />
            </div>
          ))}
        </div>

        {/* Related Products Skeleton */}
        <div
          className="mt-16 pt-8"
          style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Skeleton
              className="h-5 w-5 rounded-full"
              style={{ background: "#efeeec" }}
            />
            <Skeleton className="h-6 w-32" style={{ background: "#efeeec" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton
                  className="aspect-square"
                  style={{ background: "#efeeec", borderRadius: "8px" }}
                />
                <Skeleton
                  className="h-4 w-3/4"
                  style={{ background: "#efeeec" }}
                />
                <Skeleton
                  className="h-5 w-20"
                  style={{ background: "#efeeec" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Brand Products Skeleton */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton
              className="h-5 w-5 rounded-full"
              style={{ background: "#efeeec" }}
            />
            <Skeleton className="h-6 w-48" style={{ background: "#efeeec" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton
                  className="aspect-square"
                  style={{ background: "#efeeec", borderRadius: "8px" }}
                />
                <Skeleton
                  className="h-4 w-full"
                  style={{ background: "#efeeec" }}
                />
                <Skeleton
                  className="h-5 w-16"
                  style={{ background: "#efeeec" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
        >
          <div className="flex gap-6 mb-6">
            <Skeleton className="h-10 w-24" style={{ background: "#efeeec" }} />
            <Skeleton className="h-10 w-24" style={{ background: "#efeeec" }} />
            <Skeleton className="h-10 w-24" style={{ background: "#efeeec" }} />
          </div>
          <div className="space-y-3">
            <Skeleton
              className="h-4 w-full"
              style={{ background: "#efeeec" }}
            />
            <Skeleton
              className="h-4 w-full"
              style={{ background: "#efeeec" }}
            />
            <Skeleton className="h-4 w-5/6" style={{ background: "#efeeec" }} />
            <Skeleton className="h-4 w-4/6" style={{ background: "#efeeec" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
