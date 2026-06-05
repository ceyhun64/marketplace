"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const FOOTER_LINKS = {
  marketplace: {
    title: "Discover",
    links: [
      { label: "All Categories", href: "/categories" },
      { label: "All Products", href: "/products" },
      { label: "Featured Stores", href: "/stores" },
      { label: "Brands", href: "/brands" },
      { label: "Deals & Campaigns", href: "/deals" },
      { label: "Flash Sale", href: "/flash-sale" },
      { label: "New Arrivals", href: "/new" },
      { label: "Best Sellers", href: "/bestsellers" },
      { label: "Compare Products", href: "/compare" },
    ],
  },
  account: {
    title: "My Account",
    links: [
      { label: "My Profile", href: "/profile" },
      { label: "My Orders", href: "/orders" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Shopping Cart", href: "/cart" },
      { label: "Wallet", href: "/wallet" },
      { label: "Loyalty Program", href: "/loyalty" },
      { label: "Referral Program", href: "/referral" },
    ],
  },
  sellers: {
    title: "For Sellers",
    links: [
      { label: "Become a Seller", href: "/auth/register?role=merchant" },
      { label: "Merchant Dashboard", href: "/merchant" },
      { label: "Subscription Plans", href: "/subscriptions/plans" },
      { label: "Plugin Marketplace", href: "/plugins" },
      { label: "Seller Guide", href: "/seller-guide" },
      { label: "Blog & Resources", href: "/blog" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help-center" },
      { label: "FAQ", href: "/faq" },
      { label: "Order Tracking", href: "/track" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Contact Us", href: "/contact" },
      { label: "Gift Cards", href: "/gift-cards" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Notifications", href: "/notifications" },
      { label: "Site Map", href: "/sitemap-page" },
    ],
  },
};

// ── Accordion bölümü — mobilde açılır/kapanır, sm+ her zaman açık ──────────────

function FooterSection({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/*
       * Başlık — mobilde tıklanabilir toggle, sm+ statik
       * border-b sadece mobilde (her bölümü ayıran ince çizgi)
       */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sm:pointer-events-none w-full flex items-center justify-between py-3.5 sm:py-0 sm:mb-5 border-b border-(--border-light) sm:border-none"
        aria-expanded={open}
      >
        <div
          className="flex items-center gap-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--charcoal-soft)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 1,
              background: "var(--red)",
              flexShrink: 0,
            }}
          />
          {title}
        </div>

        {/* Chevron — sadece mobilde görünür, açık/kapalı durumuna göre döner */}
        <ChevronDown
          className="sm:hidden w-4 h-4 shrink-0 transition-transform duration-300"
          style={{
            color: "var(--charcoal-mist)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/*
       * İçerik animasyonu: CSS grid-template-rows geçişi
       *  - grid-rows-[0fr]  → yükseklik 0 (kapalı)
       *  - grid-rows-[1fr]  → doğal yükseklik (açık)
       *  - sm:grid-rows-[1fr] → masaüstünde her zaman açık
       * İç div min-h-0 olmadan grid row trick çalışmaz.
       */}
      <div
        className={`grid sm:grid-rows-[1fr] overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <ul className="flex flex-col gap-3.5 list-none p-0 m-0 pt-3.5 sm:pt-0 pb-4 sm:pb-0">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-(--charcoal) transition-colors"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full flex flex-col items-center px-3 sm:px-5 lg:px-6 pb-12 lg:pb-16 mt-16 md:mt-20 border-b-4 border-(--charcoal)">
      {/* ── Ana footer kartı ─────────────────────────────────────────────── */}
      <div
        className="w-full max-w-325 p-6 sm:p-8 md:p-10 lg:p-14 rounded-[28px] overflow-hidden"
        style={{
          background: "var(--white)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/*
         * Mobil:    1 kolon — brand + accordion bölümleri sıralanır
         * Tablet:   2→3 kolon grid (pointer-events-none ile accordion devre dışı)
         * Masaüstü: 6 kolon, her şey her zaman açık
         */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 sm:gap-8">

          {/* Brand — accordion değil, her zaman tam görünür */}
          <div className="lg:col-span-1 pb-2 sm:pb-0 mb-1 sm:mb-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-6 mt-1"
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: "var(--red)",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(200,16,46,0.25)",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" fill="white" rx="1" />
                  <rect x="8" y="1" width="5" height="5" fill="rgba(255,255,255,0.5)" rx="1" />
                  <rect x="1" y="8" width="5" height="5" fill="rgba(255,255,255,0.5)" rx="1" />
                  <rect x="8" y="8" width="5" height="5" fill="white" rx="1" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  fontWeight: 500,
                  color: "var(--charcoal)",
                  letterSpacing: "-0.02em",
                }}
              >
                BAZR
              </span>
            </Link>

            <p
              className="mb-7 max-w-60"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--charcoal-soft)",
                lineHeight: 1.8,
              }}
            >
              The modern meeting point of digital commerce. Discover with
              confidence, shop with pleasure.
            </p>

            {/* Sosyal ikonlar — 44px touch target */}
            <div className="flex gap-2 mb-6 sm:mb-0">
              {[
                { label: "Instagram", icon: <InstagramIcon /> },
                { label: "Twitter", icon: <TwitterIcon /> },
                { label: "LinkedIn", icon: <LinkedInIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex items-center justify-center w-11 h-11 rounded-full transition-colors hover:bg-(--off-white)"
                  style={{
                    background: "var(--off-white-2)",
                    border: "1px solid var(--border-light)",
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link bölümleri — mobilde accordion, sm+ statik */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <FooterSection
              key={section.title}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>

        {/* ── Newsletter ────────────────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mt-10 p-6 sm:p-8 rounded-3xl"
          style={{
            background: "var(--off-white)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div>
            <div
              className="mb-1.5"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.375rem",
                fontWeight: 500,
                color: "var(--charcoal)",
              }}
            >
              Join Our Newsletter
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--charcoal-soft)",
                lineHeight: 1.6,
              }}
            >
              Get the latest stores and exclusive deals delivered weekly.
            </p>
          </div>

          <div
            className="flex items-center w-full sm:w-auto sm:min-w-85"
            style={{
              background: "var(--white)",
              border: "1.5px solid var(--border-mid)",
              borderRadius: "0.75rem",
              padding: "5px 5px 5px 14px",
              gap: "0.5rem",
            }}
          >
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 min-w-0 border-none outline-none bg-transparent"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--charcoal)",
              }}
            />
            <button
              type="button"
              className="shrink-0 transition-opacity hover:opacity-90"
              style={{
                background: "var(--red)",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.625rem 1.25rem",
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(200,16,46,0.2)",
              }}
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mt-8 pt-8"
          style={{ borderTop: "1px solid var(--border-light)" }}
        >
          {[
            { value: "2.4K+", label: "Active Sellers" },
            { value: "48K+", label: "Product Variety" },
            { value: "180K", label: "Happy Customers" },
            { value: "4.8/5", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 500,
                  color: "var(--charcoal)",
                  marginBottom: "0.25rem",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.625rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--charcoal-soft)",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alt hukuki bar ────────────────────────────────────────────────── */}
      <div className="w-full max-w-275 mt-6 px-1 flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-4">
        <p
          className="text-center sm:text-left"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--charcoal-soft)",
            letterSpacing: "0.05em",
          }}
        >
          © {currentYear} BAZR Studio. All rights reserved.
        </p>

        <div className="flex gap-4 sm:gap-6 flex-wrap justify-center sm:justify-start">
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Site Map", href: "/sitemap-page" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--charcoal-soft)",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "color var(--duration-fast) var(--ease-out)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2 opacity-50">
          {["VISA", "STRIPE", "IYZICO"].map((pay) => (
            <span
              key={pay}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5625rem",
                fontWeight: 700,
                color: "var(--charcoal)",
                border: "1px solid var(--border-mid)",
                padding: "3px 8px",
                borderRadius: 4,
                letterSpacing: "0.08em",
              }}
            >
              {pay}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── SVG icon helpers ─────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
