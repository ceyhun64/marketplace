"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { label: "Marketplace", href: "/products" },
  { label: "Sellers", href: "/stores" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(10, 10, 11, 0.88)"
            : "transparent",
          backdropFilter: scrolled ? "blur(14px) saturate(160%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px) saturate(160%)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#C8102E" }}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="font-bold text-sm tracking-tight hidden sm:block"
              style={{ color: "#E8E8EC", letterSpacing: "-0.02em" }}
            >
              Marketplace
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.href} label={l.label} href={l.href} />
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: "#7A7A86" }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:opacity-90 active:scale-95"
              style={{
                background: "#C8102E",
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors duration-200"
            style={{ color: menuOpen ? "#F0F0F2" : "#6A6A74" }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{
          background: "rgba(10,10,11,0.96)",
          backdropFilter: "blur(12px)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
        }}
        aria-hidden={!menuOpen}
      >
        <nav
          className="flex flex-col pt-24 px-6 gap-2"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-3.5 text-xl font-semibold border-b transition-colors duration-200 hover:opacity-70"
              style={{
                color: "#C0C0C8",
                borderColor: "rgba(255,255,255,0.06)",
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
              }}
            >
              {l.label}
            </Link>
          ))}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="py-3.5 rounded-xl text-center text-sm font-semibold transition-opacity duration-200 hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#8A8A94",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMenuOpen(false)}
              className="py-3.5 rounded-xl text-center text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{ background: "#C8102E", color: "#ffffff" }}
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

// ── Nav Item ──────────────────────────────────────────────────────────────────

function NavItem({ label, href }: NavLink) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
      style={{
        color: hov ? "#D8D8E0" : "#5E5E6A",
        background: hov ? "rgba(255,255,255,0.055)" : "transparent",
        letterSpacing: "-0.01em",
      }}
    >
      {label}
    </Link>
  );
}
