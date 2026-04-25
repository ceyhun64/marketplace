import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {AddToCartButton} from "@/components/modules/store/AddToCartButton";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lat?: string; lng?: string }>;
}

async function ProductDetail({
  productId,
  customerLat,
  customerLng,
}: {
  productId: string;
  customerLat?: string;
  customerLng?: string;
}) {
  const etaParams =
    customerLat && customerLng
      ? `?customerLat=${customerLat}&customerLng=${customerLng}`
      : "";

  const [productData, buyBoxData, offersData] = await Promise.all([
    fetchISR<{ data: any }>(`/products/${productId}`),
    fetchISR<{ data: any }>(`/products/${productId}/buybox${etaParams}`),
    fetchISR<{ data: any[] }>(`/products/${productId}/offers${etaParams}`),
  ]);

  if (!productData?.data) notFound();

  const product = productData.data;
  const buyBox = buyBoxData?.data;
  const offers: any[] = offersData?.data || [];
  const otherOffers = offers.filter((o) => o.id !== buyBox?.offerId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-900">
          Ana Sayfa
        </Link>
        <span>/</span>
        {product.categorySlug && (
          <>
            <Link
              href={`/category/${product.categorySlug}`}
              className="hover:text-gray-900"
            >
              {product.categoryName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium line-clamp-1 max-w-xs">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                📦
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.slice(1).map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 2}`}
                  className="h-16 w-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">{product.categoryName}</p>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {product.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/search?tags=${tag}`}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Buy Box */}
          {buyBox ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                  ✓ Buy Box
                </span>
                <span className="text-xs text-green-600">En iyi teklif</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-gray-900">
                    ₺{buyBox.price?.toLocaleString("tr-TR")}
                  </p>
                  {buyBox.stock !== undefined && (
                    <p
                      className={`text-sm mt-1 ${buyBox.stock > 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {buyBox.stock > 0
                        ? `${buyBox.stock} adet stokta`
                        : "Stok yok"}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {buyBox.rating && <p>⭐ {buyBox.rating.toFixed(1)}</p>}
                  {buyBox.eta && (
                    <p className="mt-0.5">
                      🚚 {buyBox.shippingRate === "EXPRESS" ? "⚡ " : ""}
                      {buyBox.eta}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/store/${buyBox.merchantSlug}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  🏪 {buyBox.merchantName}
                </Link>
              </div>

              <AddToCartButton
                offerId={buyBox.offerId}
                productId={product.id}
                productName={product.name}
                price={buyBox.price}
                merchantId={buyBox.merchantId}
                image={product.images?.[0]}
              />
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-gray-500 text-sm">
                There are no active offers for this product right now.
              </p>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Product Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other Sellers */}
      {otherOffers.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Other Sellers ({otherOffers.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Satıcı
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Fiyat
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    ETA
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Puan
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {otherOffers.map((offer: any, i: number) => (
                  <tr
                    key={offer.id}
                    className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/store/${offer.merchantSlug}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {offer.merchantName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ₺{offer.price?.toLocaleString("tr-TR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {offer.eta || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {offer.rating ? `⭐ ${offer.rating.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AddToCartButton
                        offerId={offer.id}
                        productId={product.id}
                        productName={product.name}
                        price={offer.price}
                        merchantId={offer.merchantId}
                        image={product.images?.[0]}
                        variant="small"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { lat, lng } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      }
    >
      <ProductDetail productId={id} customerLat={lat} customerLng={lng} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchISR<{ data: any }>(`/products/${id}`);
  const product = data?.data;
  return {
    title: product ? `${product.name} — Marketplace` : "Product",
    description: product?.description?.slice(0, 160),
    openGraph: {
      images: product?.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}
