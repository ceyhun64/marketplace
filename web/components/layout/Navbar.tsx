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
  Menu,
  Bell,
  ShoppingCart,
  Truck,
  Star,
  Tag,
  Store,
  Zap,
  Wallet,
  Gift,
  Award,
  Users,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth as useAuthStore } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useNotifications } from "@/queries/useNotifications";
import type { NotifType } from "@/queries/useNotifications";

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
  { label: "Products", href: "/products" },
  { label: "Stores", href: "/stores" },
  { label: "Brands", href: "/brands" },
  { label: "Deals", href: "/deals" },
  { label: "Flash Sale", href: "/flash-sale", highlight: true },
];

const SECONDARY_NAV = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Bestsellers", href: "/bestsellers" },
  { label: "Compare", href: "/compare" },
  { label: "Track Order", href: "/track" },
  { label: "Loyalty", href: "/loyalty" },
  { label: "Referral", href: "/referral" },
  { label: "Gift Cards", href: "/gift-cards" },
];

const DASHBOARD_HREF: Record<UserRole, string> = {
  admin: "/admin",
  merchant: "/merchant",
  courier: "/courier",
  customer: "/profile",
};

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5 group" style={{ textDecoration: "none" }}>
      <div
        className="group-hover:scale-105"
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
      style={{ background: "var(--charcoal)", color: "var(--off-white)" }}
    >
      <User size={16} strokeWidth={2.5} />
    </div>
  );
}

const NOTIF_META: Record<
  NotifType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  order:    { icon: ShoppingCart, bg: "rgba(200,16,46,0.08)",   color: "var(--red)"          },
  deal:     { icon: Tag,          bg: "rgba(234,179,8,0.08)",   color: "#ca8a04"             },
  store:    { icon: Store,        bg: "rgba(59,130,246,0.08)",  color: "#2563eb"             },
  shipping: { icon: Truck,        bg: "rgba(34,197,94,0.08)",   color: "#16a34a"             },
  review:   { icon: Star,         bg: "rgba(168,85,247,0.08)",  color: "#7c3aed"             },
  system:   { icon: Bell,         bg: "rgba(51,51,51,0.06)",    color: "var(--charcoal-soft)" },
};

function NotificationDropdown() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications();
  const preview = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2.5 rounded-lg transition-all"
          style={{ color: "var(--charcoal-soft)", background: "transparent" }}
          aria-label="Notifications"
        >
          <Bell className="w-4.25 h-4.25" strokeWidth={2} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 text-[8px] font-bold rounded-full flex items-center justify-center"
              style={{
                background: "var(--red)",
                color: "white",
                fontFamily: "var(--font-mono)",
                border: "2px solid var(--off-white)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-80 p-0 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95"
        style={{
          background: "var(--white)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--border-light)" }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: "var(--charcoal)" }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--red)",
                  color: "white",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); markAllRead(); }}
              className="text-[11px] font-semibold transition-colors"
              style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-90 overflow-y-auto">
          {isLoading && (
            <div className="py-8 flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
              <p className="text-xs" style={{ color: "var(--charcoal-mist)" }}>Loading…</p>
            </div>
          )}

          {!isLoading && preview.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2">
              <Bell className="w-8 h-8" style={{ color: "rgba(51,51,51,0.15)" }} />
              <p
                className="text-xs"
                style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
              >
                No notifications yet
              </p>
            </div>
          )}

          {preview.map((notif) => {
            const meta = NOTIF_META[notif.type];
            const Icon = meta.icon;
            return (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                style={{
                  borderBottom: "1px solid rgba(51,51,51,0.04)",
                  background: notif.read ? "transparent" : "rgba(200,16,46,0.02)",
                }}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.link) window.location.href = notif.link;
                }}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: meta.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  </div>
                  {!notif.read && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white"
                      style={{ background: "var(--red)" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold leading-snug truncate"
                    style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                  >
                    {notif.title}
                  </p>
                  <p
                    className="text-[11px] leading-relaxed mt-0.5 line-clamp-2"
                    style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
                  >
                    {notif.message}
                  </p>
                </div>
                <span
                  className="text-[10px] shrink-0 mt-0.5"
                  style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                >
                  {notif.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t" style={{ borderColor: "var(--border-light)" }}>
          <a
            href="/notifications"
            className="flex items-center justify-center w-full py-3 text-xs font-semibold transition-colors hover:bg-gray-50"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            View all notifications →
          </a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const cartCount = useCartCount();

  const [mounted, setMounted]               = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerBottom, setHeaderBottom]     = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateBottom = () => {
      if (headerRef.current)
        setHeaderBottom(headerRef.current.getBoundingClientRect().bottom);
    };
    updateBottom();
    window.addEventListener("scroll", updateBottom, { passive: true });
    window.addEventListener("resize", updateBottom);
    return () => {
      window.removeEventListener("scroll", updateBottom);
      window.removeEventListener("resize", updateBottom);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <>
      {/*
        data-fixed-header is used by globals.css to compensate for the
        scrollbar-width shift that Radix adds when a dropdown opens.
      */}
      <header
        ref={headerRef}
        data-fixed-header
        className="flex flex-col items-center pointer-events-none"
        style={{ padding: "0.75rem 0.75rem sm:1rem sm:1.25rem" }}
      >
        <div
          className={cn("w-full pointer-events-auto transition-all rounded-2xl")}
          style={{
            maxWidth: 1300,
            background: scrolled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: scrolled
              ? "1px solid var(--border-light)"
              : "1px solid rgba(51,51,51,0.06)",
            boxShadow: scrolled ? "var(--shadow-md)" : "var(--shadow-sm)",
            padding: scrolled ? "0.5rem 1rem" : "0.75rem 1.25rem",
            transition:
              "background var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out), padding var(--duration-base) var(--ease-out)",
          }}
        >
          <div className="flex items-center h-10 gap-3 md:gap-4">
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none" }} className="shrink-0">
              <LogoMark />
            </Link>

            {/* Desktop Nav — hidden below lg */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    fontWeight: pathname === link.href ? 600 : 500,
                    color: link.highlight
                      ? "var(--red)"
                      : pathname === link.href
                      ? "var(--charcoal)"
                      : "var(--charcoal-soft)",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "0.5rem",
                    background:
                      pathname === link.href ? "var(--off-white-2)" : "transparent",
                    textDecoration: "none",
                    transition:
                      "color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
                    letterSpacing: "0.01em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  className="hover:text-(--charcoal)"
                >
                  {link.highlight && <Zap className="w-3 h-3" />}
                  {link.label}
                </Link>
              ))}

              {/* More dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "var(--charcoal-soft)",
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      letterSpacing: "0.01em",
                      transition:
                        "color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
                    }}
                    className="hover:text-(--charcoal) hover:bg-(--off-white-2)"
                  >
                    More
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="w-44 p-1.5 rounded-xl animate-in fade-in zoom-in-95"
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border-light)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  {SECONDARY_NAV.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer"
                        style={{
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-body)",
                          fontWeight: 500,
                          color: "var(--charcoal-mid)",
                          textDecoration: "none",
                        }}
                      >
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="flex-1" />

            {/* Action icons */}
            <div className="flex items-center gap-1">

              {/* Search — expands inline on md+, hidden behind mobile menu on xs/sm */}
              <div className="relative flex items-center">
                <form
                  onSubmit={handleSearch}
                  className={cn(
                    "hidden md:flex items-center transition-all rounded-lg overflow-hidden",
                    searchOpen ? "w-50 px-3" : "w-0 px-0",
                  )}
                  style={{
                    background: searchOpen ? "var(--off-white-2)" : "transparent",
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
                    style={{ fontFamily: "var(--font-body)", color: "var(--charcoal)" }}
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
                    className="hidden md:flex p-2.5 rounded-lg transition-all"
                    style={{ color: "var(--charcoal-soft)", background: "transparent" }}
                    aria-label="Search"
                  >
                    <Search className="w-4.25 h-4.25" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Wishlist — hidden on xs, shown sm+ */}
              <Link
                href="/wishlist"
                className="hidden sm:flex p-2.5 rounded-lg transition-all"
                style={{ color: "var(--charcoal-soft)", textDecoration: "none" }}
                aria-label="Wishlist"
              >
                <Heart className="w-4.25 h-4.25" strokeWidth={2} />
              </Link>

              {/* Notifications — logged-in only */}
              {user && <NotificationDropdown />}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2.5 rounded-lg transition-all"
                style={{ color: "var(--charcoal-soft)", textDecoration: "none" }}
                aria-label="Cart"
              >
                <ShoppingBag className="w-4.25 h-4.25" strokeWidth={2} />
                {mounted && cartCount > 0 && (
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

              {/* Hamburger — shown below lg, min 44px tap area */}
              <button
                type="button"
                className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg transition-all"
                style={{ color: "var(--charcoal-soft)" }}
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen
                  ? <X className="w-4.25 h-4.25" strokeWidth={2} />
                  : <Menu className="w-4.25 h-4.25" strokeWidth={2} />
                }
              </button>
            </div>

            {/* Auth — desktop only */}
            <div
              className="hidden lg:block pl-2 ml-1"
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
                      <ChevronDown className="w-3 h-3" style={{ color: "var(--charcoal-soft)" }} />
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
                      <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--charcoal-soft)" }}>
                        {user.email}
                      </p>
                    </div>

                    {[
                      { href: "/profile",     icon: User,          label: "Profile"      },
                      { href: "/orders",      icon: ClipboardList, label: "Orders"       },
                      { href: "/track",       icon: MapPin,        label: "Track Order"  },
                      { href: "/wallet",      icon: Wallet,        label: "Wallet"       },
                      { href: "/loyalty",     icon: Award,         label: "Loyalty"      },
                      { href: "/referral",    icon: Users,         label: "Referral"     },
                      { href: "/help-center", icon: HelpCircle,    label: "Help Center"  },
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
                  className="hover:bg-(--charcoal-mid) active:scale-95"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ─────────────────────────────────────── */}
      {/*
       * Positioned just below the header using headerBottom.
       * max-h-[85dvh] + overflow-y-auto prevents overflow on short screens.
       * The inner nav uses padding-bottom to clear iOS home-indicator.
       */}
      {mobileMenuOpen && (
        <div
          className="fixed left-0 right-0 z-40 pointer-events-auto"
          style={{ top: headerBottom }}
        >
          <div
            className="mx-3 sm:mx-5 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "85dvh",
              overflowY: "auto",
            }}
          >
            <nav className="flex flex-col p-3 pb-safe">
              {/* ── Mobile search ────────────────────────────────────────── */}
              <form onSubmit={handleSearch} className="relative mb-2">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--charcoal-soft)" }}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, stores..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--off-white-2)",
                    border: "1.5px solid var(--border-mid)",
                    fontFamily: "var(--font-body)",
                    color: "var(--charcoal)",
                  }}
                />
              </form>

              {/* ── Primary nav ──────────────────────────────────────────── */}
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    fontWeight: pathname === link.href ? 600 : 500,
                    color: link.highlight
                      ? "var(--red)"
                      : pathname === link.href
                      ? "var(--charcoal)"
                      : "var(--charcoal-soft)",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    background:
                      pathname === link.href ? "var(--off-white-2)" : "transparent",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    minHeight: 44,
                  }}
                >
                  {link.highlight && <Zap className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}

              {/* ── Secondary nav ─────────────────────────────────────────── */}
              <div style={{ height: 1, background: "var(--border-light)", margin: "0.5rem 0" }} />
              {SECONDARY_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--charcoal-soft)",
                    padding: "0.625rem 1rem",
                    borderRadius: "0.75rem",
                    textDecoration: "none",
                    display: "block",
                    minHeight: 44,
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* ── Utility links ─────────────────────────────────────────── */}
              <div style={{ height: 1, background: "var(--border-light)", margin: "0.5rem 0" }} />
              {[
                { href: "/wishlist",    icon: Heart,      label: "Wishlist"    },
                { href: "/cart",        icon: ShoppingBag,label: "Cart"        },
                { href: "/wallet",      icon: Wallet,     label: "Wallet"      },
                { href: "/loyalty",     icon: Award,      label: "Loyalty"     },
                { href: "/referral",    icon: Users,      label: "Referral"    },
                { href: "/gift-cards",  icon: Gift,       label: "Gift Cards"  },
                { href: "/track",       icon: MapPin,     label: "Track Order" },
                { href: "/help-center", icon: HelpCircle, label: "Help Center" },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "var(--charcoal-soft)",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    minHeight: 44,
                  }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {label}
                  {/* Cart badge in mobile menu */}
                  {href === "/cart" && mounted && cartCount > 0 && (
                    <span
                      className="w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                      style={{
                        background: "var(--red)",
                        color: "white",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              ))}

              {/* ── Auth section ──────────────────────────────────────────── */}
              <div style={{ height: 1, background: "var(--border-light)", margin: "0.5rem 0" }} />
              {user ? (
                <>
                  {/* Logged-in: user info row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <AvatarCircle user={user} />
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                      >
                        {user.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--charcoal-soft)" }}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Dashboard link for non-customers */}
                  {user.role !== "customer" && (
                    <Link
                      href={DASHBOARD_HREF[user.role]}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--charcoal-soft)",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.75rem",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        minHeight: 44,
                      }}
                    >
                      <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
                      Dashboard
                    </Link>
                  )}

                  {/* Sign out */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 rounded-xl text-[0.9375rem] font-medium transition-colors"
                    style={{
                      color: "var(--red)",
                      fontFamily: "var(--font-body)",
                      padding: "0.75rem 1rem",
                      minHeight: 44,
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                    Sign Out
                  </button>
                </>
              ) : (
                /* Guest: Sign In CTA */
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-1 my-1 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--charcoal)",
                    padding: "0.875rem 1.5rem",
                    minHeight: 48,
                    fontFamily: "var(--font-body)",
                    textDecoration: "none",
                  }}
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
