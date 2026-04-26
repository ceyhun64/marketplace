"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
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
} from "lucide-react";

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
  star: Star,
  puzzle: Puzzle,
  "file-text": FileText,
};

interface NavLink {
  href: string;
  label: string;
  icon: string;
}
interface SidebarProps {
  links: NavLink[];
  role: string;
}

export function Sidebar({ links, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };
  const isActive = (href: string) => {
    // Mevcut sayfa (pathname) tam olarak linke eşitse aktiftir
    if (pathname === href) return true;

    // Eğer link sadece kök dizin değilse (yani /admin/ gibi bir alt yol ise)
    // ve pathname bu yol ile başlıyorsa yine aktiftir.
    // Bu sayede /admin/merchants/new sayfasındayken "Merchants" aktif kalır.
    if (href !== "/admin" && href !== "/merchant" && href !== "/courier") {
      return pathname.startsWith(href + "/");
    }

    return false;
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{
        background: "var(--charcoal)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Brand */}
      <div
        className="h-16 flex items-center px-5"
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
              style={{
                fontFamily: "var(--font-display)",
              }}
            >
              MarketPlace
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.18em] mt-1"
              style={{
                color: "var(--red)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {role} Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon }) => {
          const active = isActive(href);
          const Icon = ICONS[icon] || LayoutGrid;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150"
              style={
                active
                  ? { background: "var(--red)", color: "#fff" }
                  : { color: "rgba(244,244,242,0.55)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--off-white)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(244,244,242,0.55)";
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3 px-2 py-2.5 mb-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "var(--red)" }}
          >
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white/80 truncate">
              {user?.email?.split("@")[0]}
            </span>
            <span className="text-[10px] text-white/35 truncate lowercase">
              {user?.email}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ color: "rgba(244,244,242,0.45)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(204,16,22,0.15)";
            (e.currentTarget as HTMLElement).style.color = "var(--red)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color =
              "rgba(244,244,242,0.45)";
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
