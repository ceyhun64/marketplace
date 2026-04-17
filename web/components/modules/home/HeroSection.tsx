"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HERO_TAGS = [
  "Elektronik",
  "Moda",
  "Ev & Yaşam",
  "Spor",
  "Kitap",
  "Kozmetik",
];

export default function HeroSection() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#F5F2EB] border-b border-[#0D0D0D]/10">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full border-[60px] border-[#C84B2F]/6" />
        <div className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full border-[40px] border-[#1A4A6B]/8" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.035]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="#0D0D0D" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative max-w-[1200px] mx-auto px-5 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-6 h-[2px] bg-[#C84B2F]" />
              <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#C84B2F]">
                Türkiye'nin Yeni Pazaryeri
              </span>
            </div>

            <h1 className="text-[#0D0D0D] mb-6 leading-[1.05] font-serif text-[clamp(40px,5vw,64px)]">
              Her şey{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#C84B2F]">tek yerden</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C84B2F]/12 -z-0 rounded-sm" />
              </span>
              ,<br />
              binlerce satıcıdan.
            </h1>

            <p className="text-[#7A7060] text-[15px] leading-relaxed mb-8 max-w-[460px]">
              Güvenilir satıcılardan en iyi fiyatı bul. Marketplace ve bağımsız
              e-mağazaların gücünü bir arada keşfet.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex items-stretch border-2 border-[#0D0D0D] rounded-sm overflow-hidden bg-white shadow-[4px_4px_0_0_#0D0D0D]">
                <div className="flex items-center px-4 text-[#7A7060]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ürün, kategori veya mağaza ara…"
                  className="flex-1 border-0 text-[14px] text-[#0D0D0D] placeholder:text-[#7A7060] focus-visible:ring-0 h-auto py-4 pr-3"
                />
                <Button
                  type="submit"
                  className="rounded-none bg-[#0D0D0D] text-[#F5F2EB] font-mono text-[11px] uppercase tracking-[2px] hover:bg-[#C84B2F] transition-colors px-6 h-auto"
                >
                  Ara
                </Button>
              </div>
            </form>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#7A7060] self-center mr-1">
                Popüler:
              </span>
              {HERO_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/categories/${tag.toLowerCase()}`}
                  className="px-3 py-1.5 bg-transparent border border-[#0D0D0D]/20 text-[12px] text-[#0D0D0D] hover:border-[#C84B2F] hover:text-[#C84B2F] transition-colors rounded-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: visual cards stack */}
          <div className="hidden lg:block relative h-[440px]">
            <div className="absolute right-8 top-8 w-[280px] h-[340px] bg-[#1A4A6B]/10 border border-[#1A4A6B]/20 rounded-sm rotate-3" />

            <div className="absolute right-4 top-4 w-[280px] bg-white border border-[#0D0D0D]/12 rounded-sm shadow-[8px_8px_0_0_#0D0D0D10] overflow-hidden">
              <div className="h-[180px] bg-gradient-to-br from-[#F5F2EB] to-[#E8E4D8] flex items-center justify-center relative">
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-[9px] uppercase tracking-[2px] bg-[#C84B2F] text-white px-2 py-1">
                    Öne Çıkan
                  </span>
                </div>
                <div className="text-6xl select-none">📦</div>
              </div>
              <div className="p-4">
                <div className="font-mono text-[9px] uppercase tracking-[2px] text-[#7A7060] mb-1">
                  Elektronik · TechStore
                </div>
                <div className="font-semibold text-[#0D0D0D] text-[14px] mb-2">
                  Kablosuz Kulaklık Pro
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#C84B2F] text-lg font-bold font-serif">
                    ₺ 899
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#7A7060]">
                    <span className="text-yellow-500">★</span> 4.8 (234)
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-0 bottom-16 bg-[#0D0D0D] text-[#F5F2EB] px-4 py-3 rounded-sm shadow-lg">
              <div className="font-mono text-[9px] uppercase tracking-[2px] text-[#C84B2F] mb-1">
                Bu hafta
              </div>
              <div className="text-2xl font-bold leading-none font-serif">
                12.4K
              </div>
              <div className="text-[11px] text-[#7A7060] mt-0.5">
                sipariş tamamlandı
              </div>
            </div>

            <div className="absolute right-0 bottom-8 bg-[#2D7A4F] text-white px-3 py-2 rounded-sm text-[11px] font-mono uppercase tracking-wider">
              ✓ Buy Box Korumalı
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stat bar */}
      <div className="relative border-t border-[#0D0D0D]/8 bg-[#0D0D0D]/[0.02]">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#0D0D0D]/8">
            {[
              { value: "₺0", label: "Min. kargo ücreti" },
              { value: "24s", label: "Ort. teslimat" },
              { value: "2.400+", label: "Aktif mağaza" },
              { value: "%100", label: "Güvenli ödeme" },
            ].map((item) => (
              <div
                key={item.label}
                className="py-5 px-6 first:pl-0 text-center"
              >
                <div className="text-[#0D0D0D] text-xl font-bold mb-0.5 font-serif">
                  {item.value}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A7060]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
