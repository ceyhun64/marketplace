import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, Star } from "lucide-react";

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
    description: "Best price guarantee on the latest electronics.",
    categoryFocus: "Electronics",
    productCount: 1240,
    rating: 4.8,
    reviewCount: 2340,
    emoji: "⚡",
    accentColor: "#1A4A6B",
    featured: true,
  },
  {
    id: "2",
    name: "Nature Beauty",
    slug: "nature-beauty",
    description: "100% natural, cruelty-free skin and hair care products.",
    categoryFocus: "Cosmetics",
    productCount: 340,
    rating: 4.9,
    reviewCount: 1890,
    emoji: "🌿",
    accentColor: "#2D7A4F",
    featured: true,
  },
  {
    id: "3",
    name: "Home Decor Plus",
    slug: "home-decor-plus",
    description: "Modern and minimalist home decoration solutions.",
    categoryFocus: "Home & Living",
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
    description: "Equipment for professional and amateur athletes.",
    categoryFocus: "Sports",
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
    <section className="py-20 lg:py-24 border-t border-gray-50">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[3px] text-blue-600 font-bold">
                Elite Partners
              </span>
            </div>
            <h2 className="text-black text-3xl lg:text-4xl font-bold tracking-tight">
              Trusted sellers, verified quality.
            </h2>
          </div>
          <Link
            href="/stores"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-black hover:opacity-70 transition-opacity"
          >
            All Stores
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_STORES.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="group relative bg-white border border-gray-100 rounded-[32px] p-8 transition-all duration-300 hover:border-black hover:shadow-xl hover:shadow-gray-50"
            >
              <div className="flex justify-between items-start mb-8">
                <div
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center text-3xl shadow-inner"
                  style={{ backgroundColor: `${store.accentColor}08` }}
                >
                  {store.emoji}
                </div>
                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-black">
                    {store.rating}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-black group-hover:text-blue-600 transition-colors">
                    {store.name}
                  </h3>
                  {store.featured && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </div>

                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 font-medium">
                  {store.description}
                </p>

                <div className="flex items-center gap-4 pt-4">
                  <div className="text-center bg-gray-50 px-4 py-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                      Products
                    </div>
                    <div className="text-sm font-black text-black">
                      {store.productCount}+
                    </div>
                  </div>
                  <div className="text-center bg-gray-50 px-4 py-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                      Reviews
                    </div>
                    <div className="text-sm font-black text-black">
                      {store.reviewCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between text-black font-bold text-xs uppercase tracking-widest pt-6 border-t border-gray-50 group-hover:border-gray-100 transition-colors">
                Visit Store
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Seller CTA - Modernized */}
        <div className="mt-12 bg-black rounded-[32px] p-8 lg:p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className="text-blue-400 text-[11px] font-bold uppercase tracking-[4px] mb-4 block">
                Merchant Program
              </span>
              <h3 className="text-white text-2xl lg:text-3xl font-bold tracking-tight max-w-md">
                Open your own e-store and reach millions of customers.
              </h3>
            </div>
            <Button
              asChild
              className="bg-white text-black hover:bg-blue-500 hover:text-white transition-all rounded-2xl px-10 py-7 h-auto font-bold text-sm shadow-xl"
            >
              <Link href="/auth/register?role=merchant">Start Selling Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
