"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";

const FOOTER_LINKS = {
  marketplace: {
    title: "Discover",
    links: [
      { label: "All Categories", href: "/categories" },
      { label: "Featured Stores", href: "/stores" },
      { label: "Deals & Campaigns", href: "/deals" },
      { label: "New Arrivals", href: "/new" },
      { label: "Best Sellers", href: "/bestsellers" },
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
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Order Tracking", href: "/track" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        padding: "0 1.5rem 4rem",
        marginTop: "6rem",
      }}
    >
      {/* Main Footer Container */}
      <div
        style={{
          width: "100%",
          maxWidth: 1300,
          background: "var(--white)",
          border: "1px solid var(--border-light)",
          borderRadius: 28,
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          padding: "3.5rem",
        }}
      >
        {/* Top: brand + links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            gap: "3rem",
          }}
          className="lg:grid-cols-4 grid-cols-1"
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1.5rem",
                textDecoration: "none",
              }}
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
                  <rect
                    x="8"
                    y="1"
                    width="5"
                    height="5"
                    fill="rgba(255,255,255,0.5)"
                    rx="1"
                  />
                  <rect
                    x="1"
                    y="8"
                    width="5"
                    height="5"
                    fill="rgba(255,255,255,0.5)"
                    rx="1"
                  />
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
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--charcoal-soft)",
                lineHeight: 1.8,
                marginBottom: "1.75rem",
                maxWidth: 240,
              }}
            >
              The modern meeting point of digital commerce. Discover with
              confidence, shop with pleasure.
            </p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "Instagram", icon: <InstagramIcon /> },
                { label: "Twitter", icon: <TwitterIcon /> },
                { label: "LinkedIn", icon: <LinkedInIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  style={{
                    width: 34,
                    height: 34,
                    background: "var(--off-white-2)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                    transition:
                      "background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: "var(--charcoal-soft)",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 1,
                    background: "var(--red)",
                  }}
                />
                {section.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: "0.875rem",
                }}
              >
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.875rem",
                        color: "var(--charcoal-soft)",
                        textDecoration: "none",
                        transition:
                          "color var(--duration-fast) var(--ease-out)",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div
          style={{
            marginTop: "3rem",
            padding: "2rem 2.5rem",
            background: "var(--off-white)",
            border: "1px solid var(--border-light)",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            flexWrap: "wrap" as const,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.375rem",
                fontWeight: 500,
                color: "var(--charcoal)",
                marginBottom: "0.375rem",
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
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--white)",
              border: "1.5px solid var(--border-mid)",
              borderRadius: "0.75rem",
              padding: "5px 5px 5px 14px",
              gap: "0.5rem",
              minWidth: 340,
            }}
          >
            <input
              type="email"
              placeholder="Your email address"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--charcoal)",
              }}
            />
            <button
              type="button"
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
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(200,16,46,0.2)",
                transition: "background var(--duration-fast) var(--ease-out)",
              }}
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-light)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
          }}
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
                  textTransform: "uppercase" as const,
                  color: "var(--charcoal-soft)",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom legal */}
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          marginTop: "2rem",
          padding: "0 0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap" as const,
          gap: "1rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--charcoal-soft)",
            letterSpacing: "0.05em",
          }}
        >
          © {currentYear} BAZR Studio. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacy", "Terms", "Cookies"].map((item) => (
            <Link
              key={item}
              href="#"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--charcoal-soft)",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "color var(--duration-fast) var(--ease-out)",
              }}
            >
              {item}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", opacity: 0.5 }}>
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

function InstagramIcon() {
  return (
    <svg
      width="15"
      height="15"
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg
      width="15"
      height="15"
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
