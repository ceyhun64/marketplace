import { Sidebar } from "@/components/layout/Sidebar";

const merchantLinks = [
  { href: "/merchant", label: "Dashboard", icon: "grid" },
  {
    href: "/merchant/catalogue",
    label: "Katalog & Teklifler",
    icon: "package",
  },
  { href: "/merchant/orders", label: "Siparişler", icon: "shopping-cart" },
  { href: "/merchant/analytics", label: "Analitik", icon: "bar-chart-2" },
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
