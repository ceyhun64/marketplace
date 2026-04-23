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
} from "lucide-react";

// İkon haritasını Lucide bileşenleri ile güncelledik
const ICONS: Record<string, any> = {
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
    if (pathname === href) return true;
    return pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-50 border-r border-slate-200 flex flex-col z-40">
      {/* Brand Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition-colors">
            M
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 leading-none tracking-tight">
              Marketplace
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">
              {role} Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon }) => {
          const active = isActive(href);
          const IconComponent = ICONS[icon] || LayoutGrid;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200 ring-1 ring-black/5"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <IconComponent
                className={`w-[18px] h-[18px] ${active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User & Footer Section */}
      <div className="p-4 border-t border-slate-200 bg-white/50">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {user?.email?.split("@")[0]}
            </span>
            <span className="text-[10px] text-slate-500 truncate lowercase">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          Oturumu Kapat
        </button>
      </div>
    </aside>
  );
}
