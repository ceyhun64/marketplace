"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = {
  marketplace: {
    title: "Keşfet",
    links: [
      { label: "Tüm Kategoriler", href: "/categories" },
      { label: "Öne Çıkan Mağazalar", href: "/stores" },
      { label: "Fırsatlar & Kampanyalar", href: "/deals" },
      { label: "Yeni Ürünler", href: "/new" },
      { label: "En Çok Satanlar", href: "/bestsellers" },
    ],
  },
  sellers: {
    title: "Satıcılar İçin",
    links: [
      { label: "Satıcı Ol", href: "/auth/register?role=merchant" },
      { label: "Merchant Dashboard", href: "/merchant" },
      { label: "Abonelik Planları", href: "/subscriptions/plans" },
      { label: "Plugin Marketplace", href: "/plugins" },
      { label: "Satıcı Rehberi", href: "/seller-guide" },
    ],
  },
  support: {
    title: "Destek",
    links: [
      { label: "Sık Sorulan Sorular", href: "/faq" },
      { label: "Sipariş Takibi", href: "/track" },
      { label: "İade & Değişim", href: "/returns" },
      { label: "İletişim", href: "/contact" },
      { label: "Gizlilik Politikası", href: "/privacy" },
    ],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full flex flex-col items-center px-4 md:px-6 pb-8 mt-32">
      {/* Main Footer Card */}
      <div className="w-full max-w-[1200px] bg-[#0D0D0D] rounded-[40px] shadow-2xl overflow-hidden text-[#F5F2EB] p-8 md:p-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 bg-[#F5F2EB] rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 shrink-0">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="1"
                    y="1"
                    width="6"
                    height="6"
                    fill="#C84B2F"
                    rx="1.5"
                  />
                  <rect
                    x="9"
                    y="1"
                    width="6"
                    height="6"
                    fill="#0D0D0D"
                    rx="1.5"
                  />
                  <rect
                    x="1"
                    y="9"
                    width="6"
                    height="6"
                    fill="#0D0D0D"
                    rx="1.5"
                  />
                  <rect
                    x="9"
                    y="9"
                    width="6"
                    height="6"
                    fill="#1A4A6B"
                    rx="1.5"
                  />
                </svg>
              </div>
              <span className="text-[#F5F2EB] text-2xl font-bold font-serif tracking-tight">
                Pazar<span className="text-[#C84B2F]">yeri</span>
              </span>
            </Link>

            <p className="text-[#7A7060] text-[14px] leading-relaxed mb-8 max-w-[260px]">
              Dijital ticaretin yeni nesil buluşma noktası. Güvenle al, keyifle
              sat.
            </p>

            {/* Social Icons - Modern & Minimal */}
            <div className="flex gap-2">
              {[
                { label: "Instagram", href: "#", icon: <InstagramIcon /> },
                { label: "Twitter", href: "#", icon: <TwitterIcon /> },
                { label: "LinkedIn", href: "#", icon: <LinkedInIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#7A7060] hover:bg-[#C84B2F] hover:text-white transition-all duration-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title} className="lg:ml-auto">
              <h3 className="font-mono text-[11px] uppercase tracking-[3px] text-[#C84B2F] font-bold mb-8">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#7A7060] text-[14px] font-medium hover:text-[#F5F2EB] hover:translate-x-1 transition-all inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section - Floating Style */}
        <div className="mt-20 p-8 md:p-10 bg-white/[0.03] border border-white/10 rounded-[32px] backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-md">
              <h4 className="text-[#F5F2EB] text-2xl mb-2 font-serif font-bold">
                Elite Club'a katılın
              </h4>
              <p className="text-[#7A7060] text-[14px]">
                En yeni mağazalar ve size özel fırsatlar haftalık olarak
                e-postanızda.
              </p>
            </div>
            <div className="flex items-center w-full lg:w-auto bg-black/20 p-1.5 rounded-full border border-white/10 focus-within:border-[#C84B2F] transition-all">
              <Input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex-1 lg:w-[300px] bg-transparent border-0 text-[#F5F2EB] placeholder:text-[#4A4030] focus-visible:ring-0 h-10 px-4"
              />
              <Button
                type="button"
                className="rounded-full bg-[#C84B2F] hover:bg-[#a83a20] text-white font-bold text-[11px] uppercase tracking-wider px-8 h-10 transition-transform active:scale-95 shadow-lg shadow-[#C84B2F]/20"
              >
                Abone Ol
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-16 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "2.4K+", label: "Aktif Satıcı" },
            { value: "48K+", label: "Benzersiz Ürün" },
            { value: "180K", label: "Mutlu Müşteri" },
            { value: "4.8/5", label: "Memnuniyet" },
          ].map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div className="text-[#F5F2EB] text-xl font-bold font-serif mb-1">
                {stat.value}
              </div>
              <div className="text-[#4A4030] text-[10px] font-mono uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="w-full max-w-[1100px] mt-8 px-4 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
        <p className="font-mono text-[10px] tracking-[2px] text-[#0D0D0D] uppercase font-bold">
          © {currentYear} Pazaryeri Studio
        </p>
        <div className="flex items-center gap-6">
          {["Gizlilik", "Şartlar", "Çerezler"].map((item) => (
            <Link
              key={item}
              href="#"
              className="font-mono text-[10px] tracking-wider text-[#0D0D0D] hover:text-[#C84B2F] transition-colors uppercase font-bold"
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 grayscale opacity-50 hover:grayscale-0 transition-all cursor-default">
          <span className="font-mono text-[9px] text-[#0D0D0D] font-bold border border-black/10 px-2 py-1 rounded">
            VISA
          </span>
          <span className="font-mono text-[9px] text-[#0D0D0D] font-bold border border-black/10 px-2 py-1 rounded">
            STRIPE
          </span>
          <span className="font-mono text-[9px] text-[#0D0D0D] font-bold border border-black/10 px-2 py-1 rounded">
            IYZICO
          </span>
        </div>
      </div>
    </footer>
  );
}

// Icon Components aynı kalıyor...
function InstagramIcon() {
  return (
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
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
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
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
