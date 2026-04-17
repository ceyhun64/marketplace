"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useCartCount() {
  return 0;
}

const NAV_LINKS = [
  { label: "Kategoriler", href: "/categories" },
  { label: "Mağazalar", href: "/stores" },
  { label: "Fırsatlar", href: "/deals" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const cartCount = useCartCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#F5F2EB]/95 backdrop-blur-md shadow-[0_1px_0_0_#0d0d0d18]"
            : "bg-[#F5F2EB]"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-[#0D0D0D] text-[#F5F2EB] py-2 px-4 text-center">
          <p className="font-mono text-[10px] tracking-[2px] uppercase">
            Ücretsiz kargo — ₺500 üzeri siparişlerde&nbsp;
            <Link
              href="/deals"
              className="underline underline-offset-2 hover:text-[#C84B2F] transition-colors"
            >
              Detaylar →
            </Link>
          </p>
        </div>

        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <div className="flex items-center h-[64px] gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 bg-[#0D0D0D] rounded-sm flex items-center justify-center transition-transform group-hover:rotate-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" fill="#C84B2F" />
                  <rect x="9" y="1" width="6" height="6" fill="#F5F2EB" />
                  <rect x="1" y="9" width="6" height="6" fill="#F5F2EB" />
                  <rect x="9" y="9" width="6" height="6" fill="#1A4A6B" />
                </svg>
              </div>
              <span className="text-[#0D0D0D] text-xl leading-none font-serif">
                Pazar<span className="text-[#C84B2F]">yeri</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 text-[13px] font-medium tracking-wide transition-colors rounded-sm ${
                    pathname === link.href
                      ? "text-[#C84B2F]"
                      : "text-[#0D0D0D] hover:text-[#C84B2F]"
                  }`}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#C84B2F] rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Search */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="flex items-center border border-[#0D0D0D] bg-white rounded-sm overflow-hidden">
                    <Input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ürün, kategori ara..."
                      className="w-[220px] border-0 text-[13px] text-[#0D0D0D] placeholder:text-[#7A7060] focus-visible:ring-0 h-[34px]"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-none h-[34px] bg-[#0D0D0D] hover:bg-[#C84B2F] transition-colors px-3"
                    >
                      <SearchIcon className="w-3.5 h-3.5 text-[#F5F2EB]" />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="ml-2 text-[#7A7060] hover:text-[#0D0D0D] transition-colors text-[11px] font-mono uppercase tracking-wider"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-[#0D0D0D] hover:text-[#C84B2F] transition-colors"
                  aria-label="Arama"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-[#0D0D0D] hover:text-[#C84B2F] transition-colors"
              aria-label="Sepet"
            >
              <CartIcon className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#C84B2F] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center px-0.5">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                asChild
                className="text-[13px] font-medium text-[#0D0D0D] hover:text-[#C84B2F] hover:bg-transparent px-2"
              >
                <Link href="/auth/login">Giriş</Link>
              </Button>
              <Button
                asChild
                className="text-[12px] font-mono uppercase tracking-wider bg-[#0D0D0D] text-[#F5F2EB] hover:bg-[#C84B2F] rounded-sm"
              >
                <Link href="/auth/register">Kayıt Ol</Link>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-[#0D0D0D]"
              aria-label="Menü"
            >
              <div className="flex flex-col gap-[5px] w-5">
                <span
                  className={`block h-[1.5px] bg-[#0D0D0D] transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`}
                />
                <span
                  className={`block h-[1.5px] bg-[#0D0D0D] transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
                />
                <span
                  className={`block h-[1.5px] bg-[#0D0D0D] transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden border-t border-[#0D0D0D]/10 bg-[#F5F2EB] overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="max-w-[1200px] mx-auto px-5 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-[14px] font-medium text-[#0D0D0D] border-b border-[#0D0D0D]/8 last:border-0 hover:text-[#C84B2F] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 mt-1">
              <Button
                variant="outline"
                asChild
                className="flex-1 font-mono text-[12px] uppercase tracking-wider border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#F5F2EB] rounded-sm"
              >
                <Link href="/auth/login">Giriş</Link>
              </Button>
              <Button
                asChild
                className="flex-1 font-mono text-[12px] uppercase tracking-wider bg-[#0D0D0D] text-[#F5F2EB] hover:bg-[#C84B2F] rounded-sm"
              >
                <Link href="/auth/register">Kayıt Ol</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-[88px]" />
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
