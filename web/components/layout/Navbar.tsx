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

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "customer" | "merchant" | "admin" | "courier";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="w-9 h-9 bg-[#0D0D0D] rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-lg shadow-black/10">
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" fill="#C84B2F" rx="1" />
        <rect x="9" y="1" width="6" height="6" fill="#F5F2EB" rx="1" />
        <rect x="1" y="9" width="6" height="6" fill="#F5F2EB" rx="1" />
        <rect x="9" y="9" width="6" height="6" fill="#1A4A6B" rx="1" />
      </svg>
    </div>
  );
}

function AvatarCircle({ user }: { user: CurrentUser }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover border border-black/10"
      />
    );
  }
  const initials = (user.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#1A4A6B] flex items-center justify-center text-white text-[10px] font-bold tracking-tighter">
      {initials}
    </div>
  );
}

// ─── Navbar Component ─────────────────────────────────────────────────────────

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
    const onScroll = () => setScrolled(window.scrollY > 30);
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
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none p-4 md:p-6">
        {/* Floating Container */}
        <div
          className={cn(
            "w-full max-w-[1200px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto",
            "rounded-[28px] border",
            scrolled
              ? "bg-white/80 backdrop-blur-xl border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] py-2 px-5"
              : "bg-[#F5F2EB] border-transparent py-4 px-8 shadow-none",
          )}
        >
          <div className="flex items-center h-[48px] gap-2 md:gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <LogoMark />
              <span className="hidden sm:block text-[#0D0D0D] text-xl font-bold font-serif tracking-tight">
                Market<span className="text-[#C84B2F]">place</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-[13px] font-semibold transition-all rounded-full",
                    pathname === link.href
                      ? "bg-[#0D0D0D] text-white"
                      : "text-[#0D0D0D]/70 hover:text-[#0D0D0D] hover:bg-black/5",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Action Group */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex items-center">
                <form
                  onSubmit={handleSearch}
                  className={cn(
                    "flex items-center transition-all duration-300 rounded-full bg-white/50 border border-black/5 overflow-hidden",
                    searchOpen
                      ? "w-[240px] px-3 border-black/20 shadow-sm"
                      : "w-0 px-0 border-transparent",
                  )}
                >
                  <Input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Discover products..."
                    className="border-0 bg-transparent text-xs focus-visible:ring-0 h-9 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>

                {!searchOpen && (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="p-3 text-[#0D0D0D] hover:bg-white rounded-full transition-all border border-transparent hover:border-black/5 shadow-sm"
                  >
                    <Search className="w-[18px] h-[18px]" strokeWidth={2.2} />
                  </button>
                )}
              </div>

              {/* Wishlist & Cart */}
              <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-full">
                <Link
                  href="/wishlist"
                  className="p-2.5 text-[#0D0D0D]/70 hover:text-[#C84B2F] hover:bg-white rounded-full transition-all"
                >
                  <Heart className="w-[18px] h-[18px]" strokeWidth={2} />
                </Link>

                <Link
                  href="/cart"
                  className="relative p-2.5 text-[#0D0D0D]/70 hover:text-[#0D0D0D] hover:bg-white rounded-full transition-all"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#C84B2F] text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Auth / User */}
              <div className="pl-2 ml-1 border-l border-black/10">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="outline-none flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <AvatarCircle user={user} />
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={12}
                      className="w-56 p-2 rounded-2xl border border-black/5 bg-white shadow-xl z-[9999]"
                    >
                      {/* User info header */}
                      <div className="px-3 py-2 border-b border-black/5 mb-1">
                        <p className="text-xs font-bold text-[#0D0D0D] truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-[#7A7060] truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Profile */}
                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-[#0D0D0D] cursor-pointer hover:bg-[#F5F2EB] focus:bg-[#F5F2EB] outline-none"
                        >
                          <User className="w-4 h-4 text-[#7A7060]" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>

                      {/* My Orders */}
                      <DropdownMenuItem asChild>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-[#0D0D0D] cursor-pointer hover:bg-[#F5F2EB] focus:bg-[#F5F2EB] outline-none"
                        >
                          <ClipboardList className="w-4 h-4 text-[#7A7060]" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>

                      {/* Dashboard (role-based) */}
                      {user.role !== "customer" && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={DASHBOARD_HREF[user.role]}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-[#0D0D0D] cursor-pointer hover:bg-[#F5F2EB] focus:bg-[#F5F2EB] outline-none"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#7A7060]" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-1 bg-black/5" />

                      {/* Logout */}
                      <DropdownMenuItem asChild>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-[#C84B2F] cursor-pointer hover:bg-[#FDF0EC] focus:bg-[#FDF0EC] outline-none"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    asChild
                    className="h-10 px-6 rounded-full bg-[#0D0D0D] text-white hover:bg-[#C84B2F] transition-all text-xs font-bold shadow-lg shadow-black/10"
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div
        className={cn(
          "transition-all duration-500",
          scrolled ? "h-[100px]" : "h-[120px]",
        )}
      />
    </>
  );
}
