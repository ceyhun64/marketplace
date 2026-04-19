import { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/fetch";
import { StoreHeader } from "@/components/modules/store/StoreHeader";
import { StoreProductGrid } from "@/components/modules/store/StoreProductGrid";

interface StorePageProps {
  params: { slug: string };
}

interface StorProfile {
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
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  try {
    const store = await serverFetch.store(params.slug) as StorProfile;
    return {
      title: `${store.storeName} | Mağaza`,
      description: store.description ?? `${store.storeName} mağazasının tüm ürünleri`,
      openGraph: {
        title: store.storeName,
        description: store.description,
        images: store.bannerUrl ? [store.bannerUrl] : [],
      },
    };
  } catch {
    return { title: "Mağaza Bulunamadı" };
  }
}

export default async function StorePage({ params }: StorePageProps) {
  let store: StorProfile;
  let offers: StoreOffer[];

  try {
    [store, offers] = await Promise.all([
      serverFetch.store(params.slug) as Promise<StorProfile>,
      serverFetch.storeProducts(params.slug) as Promise<StoreOffer[]>,
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader store={store} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <StoreProductGrid storeSlug={params.slug} offers={offers} />
      </div>
    </div>
  );
}