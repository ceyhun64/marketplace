import { PortalShell } from "@/components/layout/PortalShell";

const merchantLinks = [
  { href: "/merchant", label: "Dashboard", icon: "grid" },
  { href: "/merchant/catalogue", label: "Catalogue & Offers", icon: "package" },
  { href: "/merchant/orders", label: "Orders", icon: "shopping-cart" },
  { href: "/merchant/shipments", label: "Shipments", icon: "truck" },
  { href: "/merchant/analytics", label: "Analytics", icon: "bar-chart-2" },
  { href: "/merchant/reviews", label: "Reviews", icon: "star" },
  { href: "/merchant/store-settings", label: "Store Settings", icon: "store" },
  { href: "/merchant/invoices", label: "Invoices", icon: "credit-card" },
  { href: "/merchant/wallet", label: "Wallet & Payouts", icon: "wallet" },
  { href: "/merchant/plugins", label: "Plugins", icon: "puzzle" },
  { href: "/merchant/subscription", label: "Subscription", icon: "badge-check" },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell links={merchantLinks} role="Merchant">
      {children}
    </PortalShell>
  );
}
