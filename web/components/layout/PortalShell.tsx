"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface PortalShellProps {
  links: NavLink[];
  role: string;
  children: React.ReactNode;
}

/**
 * Client wrapper for all portal layouts (Admin, Merchant, Courier).
 *
 * Desktop (lg+):
 *   - Fixed charcoal sidebar, 240px wide
 *   - Main content offset by ml-60
 *
 * Mobile / Tablet (< lg):
 *   - Fixed charcoal top bar with hamburger + logo
 *   - Sidebar slides in as a shadcn Sheet from the left
 *   - Main content is full-width, padded top for the 56px top bar
 */
export function PortalShell({ links, role, children }: PortalShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--off-white)" }}
    >
      <Sidebar
        links={links}
        role={role}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {/* -- Mobile / tablet top bar — hidden on lg+ ------------------------- */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4"
        style={{
          background: "var(--charcoal)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Hamburger — min-h-11 for 44px touch target */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.7)" }}
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: "var(--red)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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
          <span
            className="text-white text-sm tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MarketPlace
          </span>
        </Link>

        <div className="flex-1" />

        <span
          className="text-[9px] uppercase tracking-[0.18em]"
          style={{ color: "var(--red)", fontFamily: "var(--font-mono)" }}
        >
          {role}
        </span>
      </div>


      {/*
       * Main content
       *  - pt-18 on mobile clears the 56px fixed top bar plus a 16px breathing gap
       *  - lg:pt-10 removes that offset once the sidebar is always visible
       *  - ml-0 → lg:ml-60 tracks the sidebar width on desktop
       *  - min-w-0 prevents flex child from overflowing the parent
       */}
      <main className="flex-1 min-w-0 pt-18 lg:pt-10 lg:ml-60 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}