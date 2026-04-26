"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  ChevronDown,
  User,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth as useAuthStore } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

type UserRole = "customer" | "merchant" | "admin" | "courier";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

function useAuth() {
  const { user: storeUser, logout } = useAuthStore();
  const user: CurrentUser | null = storeUser
    ? {
        id: storeUser.id,
        name: storeUser.name,
        email: storeUser.email,
        role: storeUser.role.toLowerCase() as UserRole,
      }
    : null;
  return { user, logout };
}

function useCartCount(): number {
  const cart = useCart();
  return cart.totalItems();
}

const PUBLIC_NAV = [
  { label: "Categories", href: "/categories" },
  { label: "Stores", href: "/stores" },
  { label: "Deals", href: "/deals" },
];

const DASHBOARD_HREF: Record<UserRole, string> = {
  admin: "/admin",
  merchant: "/merchant",
  courier: "/courier",
  customer: "/profile",
};

function LogoMark() {
  return (
    <div
      className="flex items-center gap-2.5 group"
      style={{ textDecoration: "none" }}
    >
      {/* Red accent square */}
      <div
        style={{
          width: 28,
          height: 28,
          background: "var(--red)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition:
            "transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out)",
          boxShadow: "0 2px 8px rgba(200,16,46,0.25)",
        }}
        className="group-hover:scale-105"
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
          lineHeight: 1,
        }}
      >
        BAZR
      </span>
    </div>
  );
}


function AvatarCircle({ user }: { user: CurrentUser }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover"
        style={{ border: "1.5px solid var(--border-mid)" }}
      />
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{
        background: "var(--charcoal)",
        color: "var(--off-white)",
      }}
    >
      {/* Lucide-react ikonu örneği */}
      <User size={16} strokeWidth={2.5} />

      {/* Eğer kütüphane kullanmıyorsan buraya direkt SVG de koyabilirsin */}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const cartCount = useCartCount();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none"
        style={{ padding: "1rem 1.25rem" }}
      >
        <div
          className={cn(
            "w-full pointer-events-auto transition-all",
            "rounded-2xl",
          )}
          style={{
            maxWidth: 1300,
            background: scrolled
              ? "rgba(255,255,255,0.9)"
              : "rgba(255,255,255,0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: scrolled
              ? "1px solid var(--border-light)"
              : "1px solid rgba(51,51,51,0.06)",
            boxShadow: scrolled ? "var(--shadow-md)" : "var(--shadow-sm)",
            padding: scrolled ? "0.625rem 1.25rem" : "0.875rem 1.5rem",
            transition:
              "background var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out), padding var(--duration-base) var(--ease-out)",
          }}
        >
          <div className="flex items-center h-10 gap-4">
            {/* Logo */}
            <Link
              href="/"
              style={{ textDecoration: "none" }}
              className="shrink-0"
            >
              <LogoMark />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    fontWeight: pathname === link.href ? 600 : 500,
                    color:
                      pathname === link.href
                        ? "var(--charcoal)"
                        : "var(--charcoal-soft)",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    background:
                      pathname === link.href
                        ? "var(--off-white-2)"
                        : "transparent",
                    textDecoration: "none",
                    transition:
                      "color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
                    letterSpacing: "0.01em",
                  }}
                  className="hover:text-[var(--charcoal)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <div className="relative flex items-center">
                <form
                  onSubmit={handleSearch}
                  className={cn(
                    "flex items-center transition-all rounded-lg overflow-hidden",
                    searchOpen ? "w-[200px] px-3" : "w-0 px-0",
                  )}
                  style={{
                    background: searchOpen
                      ? "var(--off-white-2)"
                      : "transparent",
                    border: searchOpen
                      ? "1.5px solid var(--border-mid)"
                      : "1.5px solid transparent",
                    boxShadow: searchOpen
                      ? "inset 0 1px 3px rgba(51,51,51,0.05)"
                      : "none",
                    transition: "width var(--duration-slow) var(--ease-out)",
                  }}
                >
                  <Input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="border-0 bg-transparent text-xs focus-visible:ring-0 h-8 p-0"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "var(--charcoal)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="ml-2 transition-colors"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>

                {!searchOpen && (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg transition-all"
                    style={{
                      color: "var(--charcoal-soft)",
                      background: "transparent",
                    }}
                  >
                    <Search className="w-[17px] h-[17px]" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Wishlist & Cart */}
              <div className="hidden sm:flex items-center gap-0.5">
                <Link
                  href="/wishlist"
                  className="p-2 rounded-lg transition-all"
                  style={{
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                  }}
                >
                  <Heart className="w-[17px] h-[17px]" strokeWidth={2} />
                </Link>

                <Link
                  href="/cart"
                  className="relative p-2 rounded-lg transition-all"
                  style={{
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                  }}
                >
                  <ShoppingBag className="w-[17px] h-[17px]" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span
                      className="absolute top-1 right-1 w-3.5 h-3.5 text-[8px] font-bold rounded-full flex items-center justify-center"
                      style={{
                        background: "var(--red)",
                        color: "white",
                        fontFamily: "var(--font-mono)",
                        border: "2px solid var(--off-white)",
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Auth */}
              <div
                className="pl-2 ml-1"
                style={{ borderLeft: "1px solid var(--border-light)" }}
              >
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="outline-none flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <AvatarCircle user={user} />
                        <ChevronDown
                          className="w-3 h-3"
                          style={{ color: "var(--charcoal-soft)" }}
                        />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={12}
                      className="w-52 p-1.5 rounded-xl animate-in fade-in zoom-in-95"
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                    >
                      <div className="px-3 py-2 mb-1">
                        <p
                          className="text-[11px] font-semibold truncate"
                          style={{
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.1em",
                            color: "var(--charcoal)",
                            textTransform: "uppercase",
                          }}
                        >
                          {user.name}
                        </p>
                        <p
                          className="text-[10px] truncate mt-0.5"
                          style={{ color: "var(--charcoal-soft)" }}
                        >
                          {user.email}
                        </p>
                      </div>

                      {[
                        { href: "/profile", icon: User, label: "Profile" },
                        {
                          href: "/orders",
                          icon: ClipboardList,
                          label: "Orders",
                        },
                      ].map(({ href, icon: Icon, label }) => (
                        <DropdownMenuItem key={href} asChild>
                          <Link
                            href={href}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer"
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-body)",
                              fontWeight: 500,
                              color: "var(--charcoal-mid)",
                              textDecoration: "none",
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </Link>
                        </DropdownMenuItem>
                      ))}

                      {user.role !== "customer" && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={DASHBOARD_HREF[user.role]}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer"
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-body)",
                              fontWeight: 500,
                              color: "var(--charcoal-mid)",
                              textDecoration: "none",
                            }}
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator
                        className="my-1"
                        style={{ background: "var(--border-light)" }}
                      />

                      <DropdownMenuItem asChild>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer"
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            color: "var(--red)",
                          }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href="/auth/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "0.5rem",
                      background: "var(--charcoal)",
                      color: "var(--white)",
                      fontSize: "0.8125rem",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      textDecoration: "none",
                      transition:
                        "background var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)",
                    }}
                    className="hover:bg-[var(--charcoal-mid)] active:scale-95"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div
        style={{
          height: scrolled ? "5.5rem" : "6.5rem",
          transition: "height var(--duration-base) var(--ease-out)",
        }}
      />
    </>
  );
}
