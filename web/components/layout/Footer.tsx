"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
    <footer className="bg-[#0D0D0D] text-[#F5F2EB] mt-24">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <div className="w-8 h-8 bg-[#F5F2EB] rounded-sm flex items-center justify-center transition-transform group-hover:rotate-3 shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" fill="#C84B2F" />
                  <rect x="9" y="1" width="6" height="6" fill="#0D0D0D" />
                  <rect x="1" y="9" width="6" height="6" fill="#0D0D0D" />
                  <rect x="9" y="9" width="6" height="6" fill="#1A4A6B" />
                </svg>
              </div>
              <span className="text-[#F5F2EB] text-xl leading-none font-serif">
                Pazar<span className="text-[#C84B2F]">yeri</span>
              </span>
            </Link>

            <p className="text-[#7A7060] text-[13px] leading-relaxed mb-6 max-w-[260px]">
              Binlerce satıcıyla tek platform. Alışveriş yap, mağaza kur, büyü.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { value: "2.4K+", label: "Satıcı" },
                { value: "48K+", label: "Ürün" },
                { value: "180K", label: "Müşteri" },
                { value: "4.8★", label: "Puan" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-[#F5F2EB]/10 rounded-sm p-3"
                >
                  <div className="text-[#F5F2EB] text-lg font-bold leading-none mb-1 font-serif">
                    {stat.value}
                  </div>
                  <div className="text-[#7A7060] text-[10px] font-mono uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { label: "Instagram", href: "#", icon: <InstagramIcon /> },
                { label: "Twitter", href: "#", icon: <TwitterIcon /> },
                { label: "LinkedIn", href: "#", icon: <LinkedInIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 border border-[#F5F2EB]/15 rounded-sm flex items-center justify-center text-[#7A7060] hover:border-[#C84B2F] hover:text-[#C84B2F] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title}>
              <h3 className="font-mono text-[10px] uppercase tracking-[2px] text-[#C84B2F] mb-5">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#7A7060] text-[13px] hover:text-[#F5F2EB] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter strip */}
        <div className="mt-14 pt-10 border-t border-[#F5F2EB]/8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="text-[#F5F2EB] text-xl mb-1 font-serif">
                Fırsatlardan haberdar ol
              </h4>
              <p className="text-[#7A7060] text-[13px]">
                Kampanya ve yeni ürünleri ilk sen öğren.
              </p>
            </div>
            <div className="flex items-center w-full md:w-auto">
              <Input
                type="email"
                placeholder="E-posta adresin"
                className="flex-1 md:w-[260px] rounded-r-none border-r-0 bg-[#F5F2EB]/8 border-[#F5F2EB]/15 text-[#F5F2EB] placeholder:text-[#7A7060] focus-visible:ring-0 focus-visible:border-[#C84B2F]"
              />
              <Button
                type="button"
                className="rounded-l-none bg-[#C84B2F] hover:bg-[#a83a20] text-[#F5F2EB] font-mono text-[11px] uppercase tracking-wider whitespace-nowrap"
              >
                Abone Ol
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <Separator className="bg-[#F5F2EB]/8" />
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[1.5px] text-[#7A7060] uppercase">
          © {currentYear} Pazaryeri · Tüm hakları saklıdır
        </p>
        <div className="flex items-center gap-4">
          {["Kullanım Şartları", "Çerez Politikası", "KVKK"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="font-mono text-[10px] tracking-wider text-[#7A7060] hover:text-[#F5F2EB] transition-colors uppercase"
            >
              {item}
            </Link>
          ))}
        </div>
        <span className="font-mono text-[10px] text-[#7A7060] uppercase tracking-wider">
          iyzico · Stripe · Visa · Mastercard
        </span>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
