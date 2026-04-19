// app/layout.tsx — Root layout
// Add Navbar + Footer to all public pages

import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Space_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: ["400"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marketplace — Thousands of Sellers, One Platform",
    template: "%s | Marketplace",
  },
  description:
    "Find the best price from trusted sellers. Discover the power of a marketplace and independent e-stores combined.",
};

function isPublicRoute(pathname?: string) {
  if (!pathname) return true;
  const dashboardPrefixes = ["/admin", "/merchant", "/courier"];
  return !dashboardPrefixes.some((p) => pathname.startsWith(p));
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} ${spaceMono.variable}`}
    >
      <body
        className="bg-[#F5F2EB] text-[#0D0D0D] antialiased"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
