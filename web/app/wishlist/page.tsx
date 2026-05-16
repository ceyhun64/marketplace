import WishlistPage from "@/components/modules/wishlist/WishlistPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist — Marketplace",
  description:
    "Save products you love and shop them later. Your personal wishlist on BAZR Marketplace.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "My Wishlist — BAZR Marketplace",
    description: "Save and revisit your favourite products anytime.",
    type: "website",
  },
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
