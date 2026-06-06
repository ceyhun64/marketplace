"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Store,
  Package,
  ShoppingCart,
  Truck,
  BarChart2,
  CreditCard,
  Tag,
  Clock,
  UserCheck,
  Star,
  LogOut,
  Puzzle,
  FileText,
  BadgeCheck,
  Bell,
  TrendingUp,
  Users,
  Activity,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ICONS: Record<string, React.ElementType> = {
  grid: LayoutGrid,
  store: Store,
  package: Package,
  "shopping-cart": ShoppingCart,
  truck: Truck,
  "bar-chart-2": BarChart2,
  "credit-card": CreditCard,
  tag: Tag,
  clock: Clock,
  "user-check": UserCheck,
  users: Users,
  star: Star,
  puzzle: Puzzle,
  "file-text": FileText,
  "badge-check": BadgeCheck,
  bell: Bell,
  "trending-up": TrendingUp,
  activity: Activity,
  percent: Percent,
};

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  links: NavLink[];
  role: string;
  /** Controlled by the parent PortalShell for the mobile Sheet */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  links,
  role,
  mobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Hydration guard — prevents server/client mismatch for user-specific UI.
  // rehydrate() is already called synchronously in QueryProvider before any
  // queries run, so auth state is available by the time this renders.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth guard: once hydrated, redirect to login if unauthenticated or
  // if the user's role doesn't match the portal they're trying to access.
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(pathname ?? "/")}`,
      );
      return;
    }
    if (role && user.role !== role) {
      // Role mismatch — send to the correct portal or home
      const roleRoutes: Record<string, string> = {
        Admin: "/admin",
        Merchant: "/merchant",
        Courier: "/courier",
        Customer: "/",
      };
      router.replace(roleRoutes[user.role] ?? "/");
    }
  }, [mounted, user, role, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href !== "/admin" && href !== "/merchant" && href !== "/courier") {
      return pathname.startsWith(href + "/");
    }
    return false;
  };

  const displayEmail = mounted ? (user?.email ?? "") : "";

  // -- Shared inner content -------------------------------------------------
  // Rendered identically inside both the desktop <aside> and the mobile <Sheet>

  const SidebarBrand = (
    <div
      className="h-14 flex items-center px-4 shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <Link href="/" className="flex items-center gap-3 group">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ background: "var(--red)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" fill="white" rx="1" />
            <rect
              x="9"
              y="2"
              width="5"
              height="5"
              fill="rgba(255,255,255,0.5)"
              rx="1"
            />
            <rect
              x="2"
              y="9"
              width="5"
              height="5"
              fill="rgba(255,255,255,0.5)"
              rx="1"
            />
            <rect x="9" y="9" width="5" height="5" fill="white" rx="1" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span
            className="text-white text-sm leading-none tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MarketPlace
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.18em] mt-1"
            style={{ color: "var(--red)", fontFamily: "var(--font-sans)" }}
          >
            {role} Panel
          </span>
        </div>
      </Link>
    </div>
  );

  const SidebarNav = (
    <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
      {links.map(({ href, label, icon }) => {
        const active = isActive(href);
        const Icon = ICONS[icon] || LayoutGrid;
        return (
          <Link
            key={href}
            href={href}
            // Close mobile sheet on navigation
            onClick={() => onMobileOpenChange?.(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium transition-all duration-150",
              active
                ? "text-white"
                : "text-white/55 hover:bg-white/8 hover:text-white/90",
            )}
            style={active ? { background: "var(--red)" } : undefined}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarFooter = (
    <div
      className="p-2.5 shrink-0"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: "var(--red)" }}
        >
          {displayEmail.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-white/80 truncate">
            {displayEmail.split("@")[0]}
          </span>
          <span className="text-[10px] text-white/35 truncate lowercase">
            {displayEmail}
          </span>
        </div>
      </div>

      {/* Sign Out — min-h-[44px] for touch target */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 w-full px-3 min-h-11 rounded-md text-xs font-medium transition-colors text-white/45 hover:bg-red-500/15 hover:text-(--red)"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* -- Desktop sidebar — always visible on lg+ ------------------------ */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col z-40"
        style={{
          background: "var(--charcoal)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {SidebarBrand}
        {SidebarNav}
        {SidebarFooter}
      </aside>

      {/* -- Mobile sidebar — Sheet for < lg ------------------------------- */}
      {/*
       * SheetContent close button is styled for the dark theme via
       * the [&>button:first-of-type] selector targeting the direct-child
       * Radix close button rendered by shadcn's SheetContent.
       */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-60 p-0 flex flex-col border-0 [&>button:first-of-type]:text-white/50 [&>button:first-of-type]:hover:text-white [&>button:first-of-type]:ring-offset-0"
          style={{ background: "var(--charcoal)" }}
        >
          {SidebarBrand}
          {SidebarNav}
          {SidebarFooter}
        </SheetContent>
      </Sheet>
    </>
  );
}
