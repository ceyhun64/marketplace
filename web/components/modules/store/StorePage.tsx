import { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/fetch";
import { StoreHeader } from "@/components/modules/store/StoreHeader";
import { StoreProductGrid } from "@/components/modules/store/StoreProductGrid";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

interface StoreProfile {
  id: string;
  storeName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  rating?: number;
  productCount?: number;
  location?: string;
  handlingHours?: number;
  memberSince?: string;
}

interface StoreOffer {
  id: string;
  productId: string;
  productName: string;
  productImages: string[];
  price: number;
  stock: number;
  rating: number;
  categoryName?: string;
  merchantId?: string;
  merchantStoreName?: string;
  merchantSlug?: string;
}

export async function generateMetadata({
  params: paramsPromise,
}: StorePageProps): Promise<Metadata> {
  const params = await paramsPromise;
  try {
    const store = (await serverFetch.store(params.slug)) as StoreProfile | null;
    if (!store) return { title: "Store Not Found" };
    return {
      title: `${store.storeName} | Store`,
      description: store.description ?? `${store.storeName} store — browse all products`,
      openGraph: {
        title: store.storeName,
        description: store.description,
        images: store.bannerUrl ? [store.bannerUrl] : [],
      },
    };
  } catch {
    return { title: "Store Not Found" };
  }
}

export default async function StorePage({ params: paramsPromise }: StorePageProps) {
  const params = await paramsPromise;

  const [store, offersResponse] = await Promise.all([
    serverFetch.store(params.slug) as Promise<StoreProfile | null>,
    serverFetch.storeProducts(params.slug) as Promise<
      { items: StoreOffer[] } | StoreOffer[] | null
    >,
  ]);

  if (!store) return notFound();

  const rawOffers =
    offersResponse && typeof offersResponse === "object" && !Array.isArray(offersResponse)
      ? (offersResponse as { items: StoreOffer[] }).items
      : (offersResponse as StoreOffer[] | null);
  const safeOffers: StoreOffer[] = Array.isArray(rawOffers) ? rawOffers : [];

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f7" }}>
      <StoreHeader store={store} />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Section heading */}
        <div className="flex items-baseline justify-between mb-6">
          <h2
            className="text-base font-bold"
            style={{ color: "#1e1e1e", letterSpacing: "-0.01em" }}
          >
            Products
          </h2>
          {safeOffers.length > 0 && (
            <span className="text-xs" style={{ color: "#9a9a9a" }}>
              {safeOffers.length.toLocaleString()} items
            </span>
          )}
        </div>

        <StoreProductGrid storeSlug={params.slug} offers={safeOffers} />
      </div>
    </div>
  );
}
