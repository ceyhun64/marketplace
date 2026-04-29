import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "500"],
  display: "swap",
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
