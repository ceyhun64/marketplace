"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Bell,
  Heart,
  ChevronDown,
  User,
  ClipboardList,
  Settings,
  LogOut,
  LayoutDashboard,
  Store,
  BarChart2,
  Shield,
  X,
  Package,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "customer" | "merchant" | "admin" | "courier";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  initials?: string;
}

// ─── Hooks (Stublar - Gerçek logic ile değiştirin) ────────────────────────────

function useAuth() {
  return {
    user: null as CurrentUser | null, // Test için burayı mocklayabilirsiniz
    logout: async () => {},
  };
}

function useCartCount(): number {
  return 3; // Örnek sayı
}

function useNotifications() {
  return {
    items: [] as Array<{
      id: string;
      text: string;
      time: string;
      read: boolean;
    }>,
    unreadCount: 0,
    markAllRead: () => {},
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PUBLIC_NAV = [
  { label: "Kategoriler", href: "/categories" },
  { label: "Mağazalar", href: "/stores" },
  { label: "Fırsatlar", href: "/deals" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Müşteri",
  merchant: "Satıcı",
  admin: "Admin",
  courier: "Kurye",
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
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
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
  const notifications = useNotifications();

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
            {/* Logo Area */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <LogoMark />
              <span className="hidden sm:block text-[#0D0D0D] text-xl font-bold font-serif tracking-tight">
                Pazar<span className="text-[#C84B2F]">yeri</span>
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
              {/* Modern Search Bar */}
              <div className="relative flex items-center">
                <div
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
                    placeholder="Ürün keşfedin..."
                    className="border-0 bg-transparent text-xs focus-visible:ring-0 h-9 p-0"
                  />
                  <X
                    className="w-4 h-4 text-gray-400 cursor-pointer ml-2"
                    onClick={() => setSearchOpen(false)}
                  />
                </div>

                {!searchOpen && (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-3 text-[#0D0D0D] hover:bg-white rounded-full transition-all border border-transparent hover:border-black/5 shadow-sm"
                  >
                    <Search className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </button>
                )}
              </div>

              {/* Interaction Icons */}
              <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-full">
                <Link
                  href="/wishlist"
                  className="p-2.5 text-[#0D0D0D]/70 hover:text-[#C84B2F] hover:bg-white rounded-full transition-all"
                >
                  <Heart className="w-4.5 h-4.5" strokeWidth={2} />
                </Link>

                <Link
                  href="/cart"
                  className="relative p-2.5 text-[#0D0D0D]/70 hover:text-[#0D0D0D] hover:bg-white rounded-full transition-all shadow-none hover:shadow-sm"
                >
                  <ShoppingBag className="w-4.5 h-4.5" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#C84B2F] text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Auth / User Section */}
              <div className="pl-2 ml-1 border-l border-black/10">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <AvatarCircle user={user} />
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 mt-4 p-2 rounded-2xl border-white/50 bg-white/90 backdrop-blur-md shadow-xl"
                    >
                      <div className="px-3 py-2 border-b border-black/5 mb-1">
                        <p className="text-xs font-bold">{user.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {user.email}
                        </p>
                      </div>
                      <DropdownMenuItem className="rounded-xl py-2 cursor-pointer focus:bg-black/5">
                        <User className="w-4 h-4 mr-2" /> Profilim
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-2 cursor-pointer focus:bg-black/5">
                        <ClipboardList className="w-4 h-4 mr-2" /> Siparişlerim
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-black/5" />
                      <DropdownMenuItem className="rounded-xl py-2 cursor-pointer text-[#C84B2F] focus:bg-[#FDF0EC]">
                        <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    asChild
                    className="h-10 px-6 rounded-full bg-[#0D0D0D] text-white hover:bg-[#C84B2F] transition-all text-xs font-bold shadow-lg shadow-black/10"
                  >
                    <Link href="/auth/login">Giriş Yap</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Spacer */}
      <div
        className={cn(
          "transition-all duration-500",
          scrolled ? "h-[100px]" : "h-[120px]",
        )}
      />
    </>
  );
}
