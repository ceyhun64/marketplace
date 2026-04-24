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
    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" fill="white" rx="1" />
        <rect x="9" y="2" width="5" height="5" fill="#e5e7eb" rx="1" />
        <rect x="2" y="9" width="5" height="5" fill="#e5e7eb" rx="1" />
        <rect x="9" y="9" width="5" height="5" fill="white" rx="1" />
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
        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-100"
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
    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-medium">
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
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none p-4 md:p-5">
        <div
          className={cn(
            "w-full max-w-[1100px] transition-all duration-300 ease-in-out pointer-events-auto",
            "rounded-2xl border bg-white/70 backdrop-blur-md",
            scrolled
              ? "border-gray-200/50 shadow-sm py-2 px-4 translate-y-[-4px]"
              : "border-transparent py-3 px-6 shadow-none",
          )}
        >
          <div className="flex items-center h-10 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <LogoMark />
              <span className="hidden sm:block text-black text-lg font-bold tracking-tight">
                Marketplace
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-[13px] font-medium transition-colors rounded-lg",
                    pathname === link.href
                      ? "text-black bg-gray-100"
                      : "text-gray-500 hover:text-black hover:bg-gray-50",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Action Group */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <div className="relative flex items-center">
                <form
                  onSubmit={handleSearch}
                  className={cn(
                    "flex items-center transition-all duration-300 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden",
                    searchOpen
                      ? "w-[200px] px-3 border-gray-200 shadow-inner"
                      : "w-0 px-0 border-transparent",
                  )}
                >
                  <Input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="border-0 bg-transparent text-xs focus-visible:ring-0 h-8 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="ml-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>

                {!searchOpen && (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <Search className="w-[18px] h-[18px]" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Wishlist & Cart */}
              <div className="hidden sm:flex items-center gap-0.5">
                <Link
                  href="/wishlist"
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-gray-50 rounded-full transition-all"
                >
                  <Heart className="w-[18px] h-[18px]" strokeWidth={2} />
                </Link>

                <Link
                  href="/cart"
                  className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-full transition-all"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-black text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Auth / User */}
              <div className="pl-2 ml-1 border-l border-gray-100">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="outline-none flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <AvatarCircle user={user} />
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={12}
                      className="w-52 p-1.5 rounded-xl border border-gray-100 bg-white shadow-lg animate-in fade-in zoom-in-95"
                    >
                      <div className="px-3 py-2 mb-1">
                        <p className="text-[11px] font-semibold text-black truncate uppercase tracking-wider">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          Profile
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Orders
                        </Link>
                      </DropdownMenuItem>

                      {user.role !== "customer" && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={DASHBOARD_HREF[user.role]}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-1 bg-gray-100" />

                      <DropdownMenuItem asChild>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    asChild
                    className="h-9 px-5 rounded-lg bg-black text-white hover:bg-gray-800 transition-all text-xs font-medium"
                  >
                    <Link href="/auth/login">Login</Link>
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
          "transition-all duration-300",
          scrolled ? "h-24" : "h-28",
        )}
      />
    </>
  );
}
