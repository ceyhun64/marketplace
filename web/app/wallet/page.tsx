import WalletPage from "@/components/modules/wallet/WalletPage";
import { Wallet } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet — Marketplace",
  description:
    "View your wallet balance, transaction history, and manage your digital payments.",
};

export default function WalletRoute() {
  return <WalletPage />;
}
