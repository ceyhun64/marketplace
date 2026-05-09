// app/page.tsx
import HeroSection from "@/components/modules/home/HeroSection";
import CategoryGrid from "@/components/modules/home/CategoryGrid";
import FeaturedProducts from "@/components/modules/home/FeaturedProducts";
import FeaturedStores from "@/components/modules/home/FeaturedStores";
import BecomeSeller from "@/components/modules/home/BecomeSeller";
import HowItWorks from "@/components/modules/home/HowItWorks";
import FlashSale from "@/components/modules/home/FlashSale";
import TrustBadges from "@/components/modules/home/TrustBadges";
import NewsletterSection from "@/components/modules/home/NewsletterSection";
import RecentlyViewed from "@/components/modules/home/RecentlyViewed";

export const metadata = {
  title: "Marketplace — Thousands of Sellers, One Platform",
  description:
    "Find the best prices from trusted sellers. Discover the power of marketplace and independent stores.",
  openGraph: {
    title: "Marketplace — Thousands of Sellers, One Platform",
    description: "Find the best prices from trusted sellers.",
    type: "website",
  },
};

export default async function HomePage() {
  return (
    <main>
      {/* 1. Flash Sale — Zaman kısıtlı indirimler */}
      <FlashSale />

      {/* 2. Hero — Modern arama ve görsel anlatım */}
      <HeroSection />

      {/* 3. Güven Rozetleri — Trust signals */}
      <TrustBadges />

      {/* 4. Kategoriler */}
      <CategoryGrid />

      {/* 5. Öne Çıkan Ürünler */}
      <FeaturedProducts />

      {/* 6. Son Görüntülenenler — Personalization */}
      <RecentlyViewed />

      {/* 7. Öne Çıkan Storelar */}
      <FeaturedStores />

      {/* 8. Satıcı Ol CTA */}
      <BecomeSeller />

      {/* 9. Nasıl Çalışır? */}
      <HowItWorks />

      {/* 10. Newsletter — Email acquisition */}
      <NewsletterSection />
    </main>
  );
}
