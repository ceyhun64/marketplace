"use client";

import Link from "next/link";
import { Map, ChevronRight } from "lucide-react";

const SITEMAP = [
  {
    section: "Shopping",
    links: [
      { label: "Home", href: "/" },
      { label: "All Products", href: "/products" },
      { label: "Categories", href: "/categories" },
      { label: "Deals & Discounts", href: "/deals" },
      { label: "Best Sellers", href: "/bestsellers" },
      { label: "New Arrivals", href: "/new" },
      { label: "All Stores", href: "/stores" },
      { label: "Search", href: "/search" },
      { label: "Compare Products", href: "/compare" },
    ],
  },
  {
    section: "My Account",
    links: [
      { label: "Login", href: "/auth/login" },
      { label: "Register", href: "/auth/register" },
      { label: "Profile & Settings", href: "/profile" },
      { label: "My Orders", href: "/orders" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Notifications", href: "/notifications" },
      { label: "Cart", href: "/cart" },
      { label: "Checkout", href: "/checkout" },
      { label: "Track Order", href: "/track" },
    ],
  },
  {
    section: "Selling",
    links: [
      { label: "Become a Seller", href: "/auth/apply-merchant" },
      { label: "Seller Guide", href: "/seller-guide" },
      { label: "Subscription Plans", href: "/subscriptions/plans" },
      { label: "Plugin Marketplace", href: "/plugins" },
      { label: "Merchant Dashboard", href: "/merchant" },
    ],
  },
  {
    section: "Support",
    links: [
      { label: "Help & FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "Track a Shipment", href: "/track" },
    ],
  },
  {
    section: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog & Resources", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export default function SitemapPageComponent() {
  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div className="max-w-[1300px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-3">
            <Map className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Navigation
            </span>
          </div>
          <h1
            className="text-[36px] lg:text-[52px] text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Site <span style={{ color: "var(--red)" }}>Map</span>
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            A complete overview of all pages on Marketplace.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {SITEMAP.map(({ section, links }) => (
            <div key={section}>
              <h2
                className="text-[11px] font-bold uppercase tracking-[2px] mb-4 flex items-center gap-2"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <div
                  className="w-1 h-3 rounded-full"
                  style={{ background: "var(--red)" }}
                />
                {section}
              </h2>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center gap-1.5 text-sm transition-colors"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--red)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--charcoal-soft)")
                      }
                    >
                      <ChevronRight
                        className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--red)" }}
                      />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
