// app/page.tsx
import HeroSection from "@/components/modules/home/HeroSection";
import CategoryGrid from "@/components/modules/home/CategoryGrid";
import FeaturedProducts from "@/components/modules/home/FeaturedProducts";
import FeaturedStores from "@/components/modules/home/FeaturedStores";
import HowItWorksSection from "@/components/modules/home/HowItWorks";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
    <main >

      {/* 1. Hero — Modern arama ve görsel anlatım */}
      <HeroSection />

      <div className="space-y-8 pb-20">
        {/* 2. Kategoriler */}
        <CategoryGrid />

        {/* 3. Öne Çıkan Ürünler */}
        <FeaturedProducts />

        {/* 4. Öne Çıkan Storelar */}
        <FeaturedStores />

        {/* 5. Nasıl Çalışır? - Artık ayrı bir bileşen */}
        <HowItWorksSection />
      </div>

    </main>
  );
}
