import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
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
  preload: false, // Aktif sayfalarda body font değil, isteğe bağlı yüklenir
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
  preload: false, // Sadece kod bloklarında kullanıldığından preload gerekmez
});

export const metadata: Metadata = {
  title: { default: "BAZR — Marketplace & Fulfillment", template: "%s | BAZR" },
  description: "Multi-tenant marketplace with integrated courier fulfillment.",
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
      className={`${manrope.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      <body
        style={{ fontFamily: "var(--font-manrope), sans-serif" }}
        className="antialiased"
      >
        <QueryProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Toaster position="bottom-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
