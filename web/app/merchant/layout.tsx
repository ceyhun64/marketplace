import { Sidebar } from "@/components/layout/Sidebar";

const merchantLinks = [
  { href: "/merchant", label: "Dashboard", icon: "grid" },
  { href: "/merchant/catalogue", label: "Catalogue & Offers", icon: "package" },
  { href: "/merchant/orders", label: "Orders", icon: "shopping-cart" },
  { href: "/merchant/analytics", label: "Analytics", icon: "bar-chart-2" },
  { href: "/merchant/store-settings", label: "Store Settings", icon: "store" },
  { href: "/merchant/invoices", label: "Invoices", icon: "credit-card" },
  { href: "/merchant/plugins", label: "Plugins", icon: "puzzle" },
  { href: "/merchant/subscription", label: "Subscription", icon: "star" },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar links={merchantLinks} role="Merchant" />
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
