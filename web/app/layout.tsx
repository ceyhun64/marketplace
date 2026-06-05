import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "BAZR — Marketplace & Fulfillment", template: "%s | BAZR" },
  description:
    "Multi-tenant marketplace with integrated courier fulfillment. Shop thousands of products from verified sellers.",
  metadataBase: new URL("https://bazr.com"),
  openGraph: {
    title: "BAZR — Marketplace & Fulfillment",
    description:
      "Multi-tenant marketplace with integrated courier fulfillment. Shop thousands of products from verified sellers.",
    type: "website",
    siteName: "BAZR Marketplace",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAZR — Marketplace & Fulfillment",
    description:
      "Shop thousands of products from verified sellers on BAZR Marketplace.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${cormorant.variable} ${jetbrainsMono.variable} ${inter.variable}`}
    >
      <body
        style={{ fontFamily: "var(--font-manrope), sans-serif" }}
        className="antialiased overflow-x-clip"
      >
        <QueryProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Toaster position="bottom-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
