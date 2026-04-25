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
  Puzzle, // ← EKLENDİ (admin/merchant plugins)
  FileText, // ← EKLENDİ (admin invoices)
} from "lucide-react";

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
  puzzle: Puzzle, // ← EKLENDİ
  "file-text": FileText, // ← EKLENDİ
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
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:bg-gray-700 transition-colors">
            M
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-none tracking-tight">
              Marketplace
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">
              {role} Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon }) => {
          const active = isActive(href);
          const IconComponent = ICONS[icon] || LayoutGrid;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <IconComponent
                className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-400"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2.5 mb-1">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-gray-700 truncate">
              {user?.email?.split("@")[0]}
            </span>
            <span className="text-[10px] text-gray-400 truncate lowercase">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
