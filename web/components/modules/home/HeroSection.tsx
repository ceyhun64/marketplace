"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Sparkles,
  Zap,
  Truck,
  Package,
  Store,
  ChevronRight,
} from "lucide-react";

const HERO_TAGS = ["Electronics", "Fashion", "Home & Living", "Fast Delivery"];

export default function HeroSection() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white py-12">
      {/* Soft Background Accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-gray-50 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-50/50 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-[1300px] mx-auto px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Next-Gen Commerce Ecosystem
              </span>
            </div>

            <h1 className="text-black mb-6 leading-[1.15] text-[clamp(40px,5.5vw,62px)] font-bold tracking-tight">
              Powerful Marketplace <br />
              <span className="text-gray-400">Meets Fast</span> <br />
              Delivery.
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-[520px] mx-auto lg:mx-0 font-medium">
              We redefine digital commerce with the power of independent stores
              and an integrated courier engine. Everything under one roof.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-xl mx-auto lg:mx-0 mb-8"
            >
              <div className="group relative flex items-center p-1.5 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 transition-all focus-within:border-black focus-within:shadow-[0_15px_40px_rgba(0,0,0,0.06)]">
                <div className="flex items-center pl-4 pr-1 text-gray-400">
                  <Search className="w-5 h-5" strokeWidth={2} />
                </div>
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, stores or tracking ID..."
                  className="flex-1 border-0 text-[15px] text-black bg-transparent placeholder:text-gray-400 focus-visible:ring-0 h-12"
                />
                <Button
                  type="submit"
                  className="rounded-xl bg-black text-white hover:bg-gray-800 transition-all px-7 h-11 font-semibold text-sm active:scale-95"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Popular Tags */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {HERO_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?category=${tag.toLowerCase()}`}
                  className="px-4 py-1.5 bg-gray-50 border border-gray-100 text-[12px] font-semibold text-gray-500 hover:text-black hover:border-gray-300 transition-all rounded-lg"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Content: Modern Visual Cards */}
          <div className="relative hidden lg:flex items-center justify-center h-[550px]">
            <div className="absolute w-[400px] h-[400px] bg-gray-50/50 rounded-full border border-gray-100 shadow-inner" />

            {/* Main Offer Card */}
            <div className="relative w-[340px] bg-white rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden z-20">
              <div className="h-[200px] bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-gray-200/20" />
                <Package className="w-24 h-24 text-black opacity-[0.03] absolute -right-4 -bottom-4 rotate-12" />
                <div className="text-6xl animate-bounce-slow relative z-10">
                  📦
                </div>
              </div>

              <div className="p-7">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      Best Offer
                    </span>
                    <h3 className="text-lg font-bold text-black mt-0.5">
                      iPhone 15 Pro
                    </h3>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl shadow-lg">
                    <Zap className="w-4 h-4 text-white" fill="white" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <div className="text-xl font-bold tracking-tight">
                    ₺72,499
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl h-10 px-5 text-xs font-bold border-gray-200 hover:bg-black hover:text-white transition-all"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Tracking Status */}
            <div className="absolute top-12 right-0 z-30 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl animate-float min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                    Courier on the way
                  </div>
                  <div className="text-xs font-bold text-black italic">
                    Arriving in 3 mins
                  </div>
                  <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-black h-full w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant Status */}
            <div className="absolute bottom-16 left-0 z-30 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl -rotate-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                    Seller Panel
                  </div>
                  <div className="text-xs font-bold text-black">
                    Open Your Store
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
