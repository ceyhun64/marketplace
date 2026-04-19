"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  Package,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Teknik plandaki kategori ve arama gereksinimlerine göre güncellendi
const HERO_TAGS = ["Elektronik", "Moda", "Mutfak", "Hızlı Teslimat", "Kurye"];

export default function HeroSection() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Teknik plandaki /api/products/search rotasına uygun yönlendirme
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#F5F2EB] py-20">
      {/* Arka Plan Dekorasyonu - Teknik Mimarideki 'Elite' Estetiği Yansıtır */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#C84B2F]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#1A4A6B]/5 blur-[120px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.015] grayscale"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Sol İçerik: Metin ve Arama */}
          <div className="z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md border border-black/5 rounded-full mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C84B2F]" />
              <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#0D0D0D]/60 font-bold">
                Unified Marketplace & Fulfillment Engine
              </span>
            </div>

            <h1 className="text-[#0D0D0D] mb-8 leading-[1.1] font-serif text-[clamp(44px,6vw,68px)] font-bold tracking-tight">
              Pazaryeri gücü <br />
              <span className="text-[#C84B2F] italic">
                kurye hızıyla birleşti.
              </span>
            </h1>

            <p className="text-[#7A7060] text-lg leading-relaxed mb-10 max-w-[560px] mx-auto lg:mx-0">
              {/* Teknik plandaki Master Catalogue ve Multi-tenant yapısına atıf */}
              Bağımsız mağazalar ve global ürün kataloğunu birleştiren, entegre
              kurye motoruyla uçtan uca yönetilen yeni nesil ticaret ekosistemi.
            </p>

            {/* Modern Search Bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-xl mx-auto lg:mx-0 mb-8"
            >
              <div className="group relative flex items-center p-2 bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-black/5 transition-all focus-within:shadow-[0_20px_40px_rgba(200,75,47,0.08)] focus-within:border-[#C84B2F]/20">
                <div className="flex items-center pl-4 pr-2 text-[#0D0D0D]/30">
                  <Search className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ürün, mağaza veya kurye takip numarası..."
                  className="flex-1 border-0 text-md text-[#0D0D0D] bg-transparent placeholder:text-[#0D0D0D]/30 focus-visible:ring-0 h-12"
                />
                <Button
                  type="submit"
                  className="rounded-full bg-[#0D0D0D] text-white hover:bg-[#C84B2F] transition-all px-8 h-12 font-bold shadow-lg shadow-black/10 active:scale-95"
                >
                  Ara
                </Button>
              </div>
            </form>

            {/* Popüler Etiketler */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2.5">
              {HERO_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?category=${tag.toLowerCase()}`}
                  className="px-5 py-2 bg-white/40 hover:bg-white border border-black/[0.03] text-[13px] font-semibold text-[#0D0D0D]/70 hover:text-[#C84B2F] hover:shadow-sm transition-all rounded-full backdrop-blur-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ İçerik: Teknik plandaki 'Buy Box' ve 'Tracking' özelliklerini görselleştiren kartlar */}
          <div className="relative hidden lg:flex items-center justify-center h-[600px]">
            {/* Arka Plan Kartı (Sistem Mimarisini Temsil Eder) */}
            <div className="absolute w-[380px] h-[480px] bg-white/40 backdrop-blur-md rounded-[40px] border border-white shadow-2xl rotate-[-6deg] translate-x-[-20px]" />

            {/* Ana Buy Box Kartı - Teknik Plan 3.1'e Göre */}
            <div className="relative w-[360px] bg-white rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden z-20 transition-transform hover:scale-[1.02] duration-500">
              <div className="h-[220px] bg-gradient-to-tr from-[#F5F2EB] to-white flex items-center justify-center p-8">
                <div className="relative">
                  <Package className="w-32 h-32 text-[#0D0D0D] opacity-10" />
                  <div className="absolute inset-0 flex items-center justify-center text-7xl animate-bounce-slow">
                    📦
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B2F] font-bold">
                      Master Catalogue / Buy Box
                    </span>
                    <h3 className="text-xl font-bold text-[#0D0D0D] mt-1">
                      En İyi Teklif
                    </h3>
                  </div>
                  <div className="bg-[#F5F2EB] p-2 rounded-2xl">
                    <Zap
                      className="w-5 h-5 text-[#C84B2F]"
                      fill="currentColor"
                    />
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm border-b border-black/5 pb-2">
                    <span className="text-[#0D0D0D]/40">Satıcı:</span>
                    <span className="font-bold text-[#0D0D0D]">
                      Elite Store A.Ş.
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0D0D0D]/40">Skor:</span>
                    <span className="text-green-600 font-bold">4.9 / 5.0</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif">₺ 1.850</div>
                  <Button className="rounded-full bg-[#0D0D0D] font-bold text-xs hover:bg-[#C84B2F] transition-all">
                    Sepete Ekle
                  </Button>
                </div>
              </div>
            </div>

            {/* Canlı Takip Kartı - SignalR & TrackingHub Temsili (Teknik Plan 8.4) */}
            <div className="absolute top-10 right-[-20px] z-30 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-white/50 animate-float">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C84B2F]/10 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-[#C84B2F]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Canlı Takip (SignalR)
                  </div>
                  <div className="text-sm font-bold text-[#0D0D0D]">
                    Kurye Yolda
                  </div>
                  <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-[#C84B2F] h-full w-2/3 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bağımsız Mağaza Kartı - /store/[slug] Mimarisi Temsili */}
            <div className="absolute bottom-12 left-[-60px] z-30 bg-[#0D0D0D] text-white p-6 rounded-3xl shadow-2xl rotate-3">
              <div className="flex items-center gap-4">
                <Store className="w-8 h-8 text-[#C84B2F]" />
                <div className="h-10 w-[1px] bg-white/10" />
                <div>
                  <div className="text-[10px] font-mono leading-tight uppercase tracking-wider text-[#C84B2F]">
                    Multi-Tenant
                  </div>
                  <div className="text-sm font-bold">Kendi Mağazanı Aç</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

 

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.05);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
