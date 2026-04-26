"use client";

import Link from "next/link";
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
    featured: false,
  },
];

export default function FeaturedStores() {
  return (
    <section
      className="py-20 lg:py-24"
      style={{ borderTop: "1px solid rgba(51,51,51,0.06)" }}
    >
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "#c8102e" }}
              />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#6b6b6b]">
                Elite Partners
              </span>
            </div>
            <h2
              className="text-[2.2rem] lg:text-[2.75rem] font-normal leading-[1.1] tracking-[-0.01em] text-[#333333]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Trusted sellers,{" "}
              <em style={{ color: "#c8102e" }}>verified quality.</em>
            </h2>
          </div>
          <Link
            href="/stores"
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[#333333] hover:text-[#c8102e] transition-colors group"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            All Stores
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_STORES.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="group relative bg-white rounded-2xl p-7 block transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 3px rgba(51,51,51,0.06)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = "0 4px 16px rgba(51,51,51,0.08)";
                el.style.borderColor = "rgba(200,16,46,0.2)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = "0 1px 3px rgba(51,51,51,0.06)";
                el.style.borderColor = "rgba(51,51,51,0.08)";
              }}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ background: "#c8102e" }}
              />

              <div className="flex justify-between items-start mb-7">
                <div
                  className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl"
                  style={{ background: "rgba(200,16,46,0.06)" }}
                >
                  {store.emoji}
                </div>
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "#f5f5f3" }}
                >
                  <Star className="w-3 h-3 fill-[#c8102e] text-[#c8102e]" />
                  <span className="font-mono text-[11px] font-medium text-[#333333]">
                    {store.rating}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <h3
                    className="text-[1rem] font-bold text-[#333333] group-hover:text-[#c8102e] transition-colors"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {store.name}
                  </h3>
                  {store.featured && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "#c8102e" }}
                    />
                  )}
                </div>

                <p
                  className="text-[#6b6b6b] text-[0.8125rem] leading-relaxed line-clamp-2"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {store.description}
                </p>

                <div className="flex items-center gap-3 pt-3">
                  <div
                    className="text-center px-3 py-1.5 rounded-lg"
                    style={{ background: "#f5f5f3" }}
                  >
                    <div className="font-mono text-[10px] text-[#6b6b6b] uppercase tracking-[0.08em]">
                      Products
                    </div>
                    <div className="font-bold text-[0.8125rem] text-[#333333]">
                      {store.productCount}+
                    </div>
                  </div>
                  <div
                    className="text-center px-3 py-1.5 rounded-lg"
                    style={{ background: "#f5f5f3" }}
                  >
                    <div className="font-mono text-[10px] text-[#6b6b6b] uppercase tracking-[0.08em]">
                      Reviews
                    </div>
                    <div className="font-bold text-[0.8125rem] text-[#333333]">
                      {store.reviewCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 pt-5 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(51,51,51,0.06)" }}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#333333]">
                  Visit Store
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{ background: "rgba(51,51,51,0.06)" }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#333333]" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Seller CTA */}
        <div
          className="mt-10 rounded-2xl p-8 lg:p-12 relative overflow-hidden"
          style={{ background: "#333333" }}
        >
          {/* Decorative circle */}
          <div
            className="absolute top-[-80px] right-[-80px] w-[280px] h-[280px] rounded-full pointer-events-none"
            style={{ border: "50px solid rgba(200,16,46,0.1)" }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3 block"
                style={{ color: "rgba(200,16,46,0.8)" }}
              >
                Merchant Program
              </span>
              <h3
                className="text-white text-2xl lg:text-3xl font-normal max-w-md leading-[1.2] tracking-[-0.01em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Open your own e-store and reach{" "}
                <em style={{ color: "#c8102e" }}>millions of customers.</em>
              </h3>
            </div>
            <Link
              href="/auth/register?role=merchant"
              className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: "#ffffff",
                color: "#333333",
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: "0.02em",
                boxShadow: "0 8px 32px rgba(200,16,46,0.2)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#c8102e";
                el.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#ffffff";
                el.style.color = "#333333";
              }}
            >
              Start Selling Now
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
