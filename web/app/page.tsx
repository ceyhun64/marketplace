// app/page.tsx — Public Marketplace Homepage
// Server Component (no "use client" needed at top level)

import HeroSection from "@/components/modules/home/HeroSection";
import CategoryGrid from "@/components/modules/home/CategoryGrid";
import FeaturedProducts from "@/components/modules/home/FeaturedProducts";
import FeaturedStores from "@/components/modules/home/FeaturedStores";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Server-side fetch for categories (ISR — revalidates every 60s)
// async function getCategories() {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
//     next: { revalidate: 60 },
//   });
//   if (!res.ok) return [];
//   return res.json();
// }

export const metadata = {
  title: "Marketplace — Thousands of Sellers, One Platform",
  description:
    "Find the best price from trusted sellers. Discover the power of a marketplace and independent e-stores combined.",
  openGraph: {
    title: "Marketplace — Thousands of Sellers, One Platform",
    description: "Find the best price from trusted sellers.",
    type: "website",
  },
};

export default async function HomePage() {
  // Uncomment when API is ready:
  // const categories = await getCategories();

  return (
    <main>
      <Navbar />
      {/* 1. Hero — bold editorial search + stats */}
      <HeroSection />

      {/* 2. Category grid */}
      <CategoryGrid
      // categories={categories}  // pass real data from API when ready
      />

      {/* 3. Featured products with tabs */}
      <FeaturedProducts />

      {/* 4. Featured stores + seller CTA */}
      <FeaturedStores />

      {/* 5. Trust / how it works section */}
      <HowItWorksSection />
      <Footer />
    </main>
  );
}

// Inline simple section — can be extracted to its own component later
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Find the product",
      description:
        "Search through thousands of products, browse categories, and find the best price.",
      color: "#C84B2F",
    },
    {
      number: "02",
      title: "Pay securely",
      description:
        "256-bit SSL encryption powered by iyzico. Credit card, bank transfer, or cash on delivery.",
      color: "#1A4A6B",
    },
    {
      number: "03",
      title: "Track your order",
      description:
        "Track your order in real time. See your courier's location live.",
      color: "#2D7A4F",
    },
    {
      number: "04",
      title: "Receive delivery",
      description:
        "At your door in an average of 24 hours. Same-day delivery with the Express option.",
      color: "#8B5E1A",
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-[#0D0D0D]">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-6 h-[2px] bg-[#C84B2F]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
              How It Works
            </span>
            <div className="w-6 h-[2px] bg-[#C84B2F]" />
          </div>
          <h2
            className="text-[#F5F2EB] text-[28px] lg:text-[36px] leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Shopping is this simple.
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-[#F5F2EB]/[0.04] border border-[#F5F2EB]/8 rounded-sm p-6 hover:border-[#F5F2EB]/16 transition-colors group"
            >
              {/* Number */}
              <div
                className="font-mono text-[40px] font-bold leading-none mb-4 opacity-20 group-hover:opacity-30 transition-opacity"
                style={{
                  color: step.color,
                  fontFamily: "'DM Serif Display', serif",
                }}
              >
                {step.number}
              </div>

              {/* Color accent */}
              <div
                className="w-8 h-[2px] mb-4 rounded-full transition-all duration-300 group-hover:w-12"
                style={{ backgroundColor: step.color }}
              />

              <h3
                className="text-[#F5F2EB] text-[17px] mb-3 leading-tight"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {step.title}
              </h3>
              <p className="text-[#7A7060] text-[13px] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
