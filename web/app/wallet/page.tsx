import WalletPage from "@/components/modules/wallet/WalletPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet — Marketplace",
  description:
    "View your wallet balance, transaction history, and manage your digital payments.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "My Wallet — BAZR Marketplace",
    description: "Manage your balance, top up funds, and track transactions.",
    type: "website",
  },
};

export default function WalletRoute() {
  return <WalletPage />;
}
