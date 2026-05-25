import { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/fetch";
import { StoreHeader } from "@/components/modules/store/StoreHeader";
import { StoreProductGrid } from "@/components/modules/store/StoreProductGrid";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
      description:
        store.description ?? `${store.storeName} store - all products`,
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

export default async function StorePage({
  params: paramsPromise,
}: StorePageProps) {
  const params = await paramsPromise;

  const [store, offersResponse] = await Promise.all([
    serverFetch.store(params.slug) as Promise<StoreProfile | null>,
    serverFetch.storeProducts(params.slug) as Promise<{ items: StoreOffer[] } | StoreOffer[] | null>,
  ]);

  if (!store) return notFound();

  // Backend returns { total, page, limit, items } — extract the items array
  const rawOffers = offersResponse && typeof offersResponse === "object" && !Array.isArray(offersResponse)
    ? (offersResponse as { items: StoreOffer[] }).items
    : offersResponse as StoreOffer[] | null;
  const safeOffers: StoreOffer[] = Array.isArray(rawOffers) ? rawOffers : [];

  return (
    <>
      <div className="min-h-screen" style={{ background: "#fafafa" }}>
        <StoreHeader store={store} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <StoreProductGrid storeSlug={params.slug} offers={safeOffers} />
        </div>
      </div>
    </>
  );
}
