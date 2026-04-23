"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

const ICONS: Record<string, string> = {
  grid: "▦",
  store: "🏪",
  package: "📦",
  "shopping-cart": "🛒",
  truck: "🚚",
  "bar-chart-2": "📊",
  "credit-card": "💳",
  tag: "🏷️",
  clock: "⏳",
  "user-check": "👤",
  star: "⭐",
};

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
    // Root dashboard links (e.g. /admin, /merchant) - exact match only
    const segments = href.split("/").filter(Boolean);
    if (segments.length === 1) return false;
    // Sub-pages: pathname must start with href followed by / or end exactly
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-base font-bold text-gray-900 tracking-tight"
        >
          Marketplace
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{role} Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base leading-none">
                {ICONS[icon] ?? "•"}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User / logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        {user && (
          <p className="text-xs text-gray-500 mb-2 truncate">{user.email}</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Sign Out →
        </button>
      </div>
    </aside>
  );
}
