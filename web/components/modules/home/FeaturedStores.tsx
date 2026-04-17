import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryFocus: string;
  productCount: number;
  rating: number;
  reviewCount: number;
  emoji: string;
  accentColor: string;
  featured: boolean;
}

const MOCK_STORES: Store[] = [
  {
    id: "1",
    name: "TechStore TR",
    slug: "techstore-tr",
    description: "Güncel elektronik ürünlerde en iyi fiyat garantisi.",
    categoryFocus: "Elektronik",
    productCount: 1240,
    rating: 4.8,
    reviewCount: 2340,
    emoji: "⚡",
    accentColor: "#1A4A6B",
    featured: true,
  },
  {
    id: "2",
    name: "Doğa Beauty",
    slug: "doga-beauty",
    description: "%100 doğal, cruelty-free cilt ve saç bakım ürünleri.",
    categoryFocus: "Kozmetik",
    productCount: 340,
    rating: 4.9,
    reviewCount: 1890,
    emoji: "🌿",
    accentColor: "#2D7A4F",
    featured: true,
  },
  {
    id: "3",
    name: "Ev Dekor Plus",
    slug: "ev-dekor-plus",
    description: "Modern ve minimalist ev dekorasyon çözümleri.",
    categoryFocus: "Ev & Yaşam",
    productCount: 890,
    rating: 4.7,
    reviewCount: 956,
    emoji: "🏠",
    accentColor: "#8B5E1A",
    featured: true,
  },
  {
    id: "4",
    name: "SportLife",
    slug: "sportlife",
    description: "Profesyonel ve amatör sporcu ekipmanları.",
    categoryFocus: "Spor",
    productCount: 670,
    rating: 4.6,
    reviewCount: 1240,
    emoji: "🏃",
    accentColor: "#C84B2F",
    featured: false,
  },
];

export default function FeaturedStores() {
  return (
    <section className="py-16 lg:py-20 bg-[#F5F2EB] border-t border-[#0D0D0D]/6">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-[2px] bg-[#1A4A6B]" />
              <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
                Öne Çıkan Mağazalar
              </span>
            </div>
            <h2 className="text-[#0D0D0D] text-[28px] lg:text-[36px] leading-tight font-serif">
              Güvenilir satıcılar,
              <br className="hidden sm:block" />
              doğrulanmış kalite.
            </h2>
          </div>
          <Link
            href="/stores"
            className="hidden sm:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-[#7A7060] hover:text-[#1A4A6B] transition-colors pb-1 border-b border-transparent hover:border-[#1A4A6B]"
          >
            Tüm mağazalar
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Stores grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Large featured card */}
          {MOCK_STORES.filter((s) => s.featured)
            .slice(0, 1)
            .map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.slug}`}
                className="group lg:col-span-1 lg:row-span-2 relative bg-[#0D0D0D] rounded-sm overflow-hidden hover:shadow-[6px_6px_0_0_#0D0D0D30] transition-all duration-300 min-h-[280px] flex flex-col"
              >
                <div className="absolute inset-0 opacity-5">
                  <svg
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="heroStoreGrid"
                        x="0"
                        y="0"
                        width="32"
                        height="32"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M32 0L0 0 0 32"
                          fill="none"
                          stroke="#F5F2EB"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#heroStoreGrid)"
                    />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col h-full p-7">
                  <div
                    className="w-10 h-[3px] rounded-full mb-6 transition-all duration-300 group-hover:w-16"
                    style={{ backgroundColor: store.accentColor }}
                  />
                  <div
                    className="w-16 h-16 rounded-sm flex items-center justify-center text-4xl mb-6"
                    style={{ backgroundColor: `${store.accentColor}25` }}
                  >
                    {store.emoji}
                  </div>

                  <div className="flex-1">
                    <div
                      className="font-mono text-[9px] uppercase tracking-[2px] mb-2"
                      style={{ color: store.accentColor }}
                    >
                      {store.categoryFocus} ·{" "}
                      {store.productCount.toLocaleString("tr-TR")} ürün
                    </div>
                    <h3 className="text-[#F5F2EB] text-[22px] leading-tight mb-3 font-serif">
                      {store.name}
                    </h3>
                    <p className="text-[#7A7060] text-[13px] leading-relaxed">
                      {store.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#F5F2EB]/10">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-[#F5F2EB] text-[13px] font-semibold">
                        {store.rating}
                      </span>
                      <span className="text-[#7A7060] text-[11px]">
                        ({store.reviewCount.toLocaleString("tr-TR")}{" "}
                        değerlendirme)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#F5F2EB] font-mono text-[11px] uppercase tracking-wider">
                      Ziyaret Et
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="transform group-hover:translate-x-1 transition-transform"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

          {/* Smaller cards */}
          {MOCK_STORES.slice(1).map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="group bg-white border border-[#0D0D0D]/10 rounded-sm overflow-hidden hover:border-[#0D0D0D]/25 hover:shadow-[4px_4px_0_0_#0D0D0D08] transition-all duration-200"
            >
              <div
                className="h-[3px]"
                style={{ backgroundColor: store.accentColor }}
              />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: `${store.accentColor}15` }}
                  >
                    {store.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-[#0D0D0D] text-[14px] group-hover:text-[#C84B2F] transition-colors truncate">
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-yellow-500 text-[11px]">★</span>
                        <span className="text-[12px] font-semibold text-[#0D0D0D]">
                          {store.rating}
                        </span>
                      </div>
                    </div>
                    <div
                      className="font-mono text-[9px] uppercase tracking-wider mb-2"
                      style={{ color: store.accentColor }}
                    >
                      {store.categoryFocus} ·{" "}
                      {store.productCount.toLocaleString("tr-TR")} ürün
                    </div>
                    <p className="text-[#7A7060] text-[12px] leading-relaxed line-clamp-2">
                      {store.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#0D0D0D]/6">
                  <span className="text-[#7A7060] text-[11px]">
                    {store.reviewCount.toLocaleString("tr-TR")} değerlendirme
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    style={{ color: store.accentColor }}
                  >
                    Mağazaya Git
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="transform group-hover:translate-x-1 transition-transform"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-8 bg-[#1A4A6B] rounded-sm p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[3px] text-[#F5F2EB]/50 mb-2">
              Satıcılar için
            </div>
            <h3 className="text-[#F5F2EB] text-[22px] leading-tight font-serif">
              Kendi e-mağazanı kur, <br className="hidden sm:block" />
              milyonlara ulaş.
            </h3>
          </div>
          <Button
            asChild
            className="shrink-0 bg-[#F5F2EB] text-[#0D0D0D] font-mono text-[11px] uppercase tracking-[2px] hover:bg-[#C84B2F] hover:text-[#F5F2EB] transition-colors rounded-sm px-7 py-3.5 h-auto"
          >
            <Link href="/auth/register?role=merchant">
              Satıcı Ol
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
