import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToCartButton } from "@/components/modules/store/AddToCartButton";
import { WishlistButton } from "@/components/modules/store/WishlistButton";
import {
  ArrowLeft,
  ChevronRight,
  Star,
  CheckCircle,
  X,
  Award,
  BadgeCheck,
  ShieldCheck,
  Truck,
  Eye,
  Heart,
  ShoppingCart,
  Share2,
  Zap,
} from "lucide-react";

// ─── Logo ────────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{
          width: 28,
          height: 28,
          background: "var(--red, #c8102e)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(200,16,46,0.25)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" fill="white" rx="1" />
          <rect
            x="8"
            y="1"
            width="5"
            height="5"
            fill="rgba(255,255,255,0.5)"
            rx="1"
          />
          <rect
            x="1"
            y="8"
            width="5"
            height="5"
            fill="rgba(255,255,255,0.5)"
            rx="1"
          />
          <rect x="8" y="8" width="5" height="5" fill="white" rx="1" />
        </svg>
      </div>
      <span
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#1a1a1a",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        BAZR
      </span>
    </div>
  );
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-orange-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < Math.round(rating) ? "currentColor" : "none"}
            className={i < Math.round(rating) ? "" : "text-slate-300"}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-slate-900">
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-500">({count} reviews)</span>
      )}
    </div>
  );
}

// ─── Spec Card ───────────────────────────────────────────────────────────────

function SpecCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded flex items-center gap-3">
      <div className="p-2 bg-slate-100 text-slate-600 rounded">{icon}</div>
      <div>
        <div className="text-xs font-bold text-slate-900">{label}</div>
        <div className="text-[10px] text-slate-500">{value}</div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-100 p-4 rounded-lg text-center">
      <div className={`flex items-center justify-center ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

// ─── Main Product Detail ──────────────────────────────────────────────────────

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
    fetchISR<{ data: any }>(`/api/products/${productId}`),
    fetchISR<{ data: any }>(`/api/products/${productId}/buybox${etaParams}`),
    fetchISR<{ data: any[] }>(`/api/products/${productId}/offers${etaParams}`),
  ]);

  if (!productData?.data) notFound();

  const product = productData.data;
  const buyBox = buyBoxData?.data;
  const offers: any[] = offersData?.data || [];
  const otherOffers = offers.filter((o) => o.id !== buyBox?.offerId);

  const inStock = buyBox ? (buyBox.stock ?? 0) > 0 : false;

  // Fallback stats for display
  const mockRating = 4.3;
  const mockReviewCount = 128;
  const mockViews = product.meta?.views ?? 1240;
  const mockFavorites = product.meta?.favorites ?? 87;
  const mockSold = product.meta?.purchaseCount ?? 342;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* ── Logo top bar ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <Link href="/" style={{ textDecoration: "none" }}>
          <LogoMark />
        </Link>
        <div className="h-5 w-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
          Product Detail
        </span>
      </div>

      <div className="mx-auto px-6 pb-20 pt-6 max-w-7xl">
        {/* ── Breadcrumb ── */}
        <nav className="hidden lg:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-8">
          <Link
            href="/"
            className="hover:text-orange-600 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Home
          </Link>
          {product.categorySlug && (
            <>
              <ChevronRight size={10} />
              <Link
                href={`/category/${product.categorySlug}`}
                className="hover:text-orange-600 transition-colors"
              >
                {product.categoryName}
              </Link>
            </>
          )}
          <ChevronRight size={10} />
          <span className="text-slate-300 line-clamp-1 max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* ── Main 2-col Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Image Gallery ── */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-3">
              <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-20 h-20"
                      style={{ color: "rgba(51,51,51,0.12)" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    >
                      <path d="m7.5 4.27 9 5.15" />
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
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
                      className="h-16 w-16 object-cover rounded-lg border border-slate-200 flex-shrink-0 cursor-pointer hover:border-orange-400 transition-colors"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Product Info Panel ── */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <div className="space-y-6">
              {/* Category badge + title */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-bold tracking-widest uppercase text-orange-600 flex items-center gap-2">
                    <span className="bg-orange-50 px-2 py-0.5 rounded text-orange-700">
                      {product.categoryName ?? "Product"}
                    </span>
                    <span className="text-slate-300">ID: PRO-{product.id}</span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {product.name}
                </h1>

                <StarRating rating={mockRating} count={mockReviewCount} />

                {/* Tags */}
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/search?tags=${tag}`}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Stock badge */}
                <div className="flex items-center gap-2">
                  {inStock ? (
                    <>
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-600">
                        In Stock
                      </span>
                      {buyBox?.stock && buyBox.stock < 10 && (
                        <span className="text-xs text-orange-600 ml-2">
                          (Only {buyBox.stock} left!)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <X size={16} className="text-red-600" />
                      <span className="text-sm font-semibold text-red-600">
                        Out of Stock
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* ── Buy Box / Price ── */}
              {buyBox ? (
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
                  {/* Price row */}
                  <div className="flex items-baseline gap-3 border-b border-slate-100 pb-4">
                    <span className="text-3xl font-black tracking-tighter text-slate-900">
                      ${buyBox.price?.toLocaleString("en-US")}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Best Offer
                    </span>
                    {buyBox.rating && (
                      <span className="text-xs text-slate-500 ml-auto">
                        ⭐ {buyBox.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Truck size={14} className="text-slate-400" />
                    {buyBox.shippingRate === "EXPRESS" && (
                      <Zap size={12} className="text-orange-500" />
                    )}
                    <span>
                      {buyBox.eta
                        ? `Estimated delivery: ${buyBox.eta}`
                        : "Shipping calculated at checkout"}
                    </span>
                  </div>

                  {/* Seller link */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/store/${buyBox.merchantSlug}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      🏪 {buyBox.merchantName}
                    </Link>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Unit Price</span>
                      <span className="font-bold text-slate-900">
                        ${buyBox.price?.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax (10%)</span>
                      <span className="font-bold text-slate-900">
                        ${(buyBox.price * 0.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between">
                      <span className="text-base font-bold text-slate-900">
                        Total (incl. tax)
                      </span>
                      <span className="text-base font-black text-orange-600">
                        ${(buyBox.price * 1.1).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="flex flex-col gap-3">
                    <AddToCartButton
                      offerId={buyBox.offerId}
                      productId={product.id}
                      productName={product.name}
                      price={buyBox.price}
                      merchantId={buyBox.merchantId}
                      image={product.images?.[0]}
                    />
                    <div className="flex gap-3">
                      <WishlistButton
                        productId={product.id}
                        productName={product.name}
                        className="flex-1"
                      />
                      <button
                        className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-all shadow-sm"
                        title="Share"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-slate-500 text-sm">
                    No active offers for this product right now.
                  </p>
                </div>
              )}

              {/* ── Specifications ── */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <Award size={14} className="text-orange-600" /> Product
                  Specifications
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SpecCard
                    icon={<Award size={16} />}
                    label="Warranty"
                    value="1 Year"
                  />
                  <SpecCard
                    icon={<BadgeCheck size={16} />}
                    label="Origin"
                    value="Verified Seller"
                  />
                  <SpecCard
                    icon={<ShieldCheck size={16} />}
                    label="Certifications"
                    value="ISO Certified"
                  />
                  <SpecCard
                    icon={<Truck size={16} />}
                    label="Shipping"
                    value={
                      buyBox?.shippingRate === "EXPRESS"
                        ? "Express Available"
                        : "Standard"
                    }
                  />
                </div>
              </div>

              {/* ── Description ── */}
              {product.description && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Product Description
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <StatCard
            icon={<Eye size={20} />}
            color="text-orange-600"
            value={mockViews.toLocaleString()}
            label="Views"
          />
          <StatCard
            icon={<Heart size={20} />}
            color="text-pink-600"
            value={mockFavorites.toLocaleString()}
            label="Favorites"
          />
          <StatCard
            icon={<ShoppingCart size={20} />}
            color="text-emerald-600"
            value={mockSold.toLocaleString()}
            label="Sold"
          />
        </div>

        {/* ── Other Sellers ── */}
        {otherOffers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-600 rounded-full inline-block" />
              Other Sellers ({otherOffers.length})
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                      Seller
                    </th>
                    <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                      Price
                    </th>
                    <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                      ETA
                    </th>
                    <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                      Rating
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {otherOffers.map((offer: any, i: number) => (
                    <tr
                      key={offer.id}
                      className={`border-t border-slate-100 ${
                        i % 2 === 0 ? "" : "bg-slate-50/30"
                      }`}
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
                        <span className="text-sm font-bold text-slate-900">
                          ${offer.price?.toLocaleString("en-US")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
                        {offer.eta || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
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
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { lat, lng } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100">
          <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-4 shadow-sm">
            <Skeleton className="h-7 w-24 rounded" />
          </div>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-24 w-full" />
              </div>
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
  const data = await fetchISR<{ data: any }>(`/api/products/${id}`);
  const product = data?.data;
  return {
    title: product ? `${product.name} — BAZR Marketplace` : "Product",
    description: product?.description?.slice(0, 160),
    openGraph: {
      images: product?.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}
