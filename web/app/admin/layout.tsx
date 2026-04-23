import { Sidebar } from "@/components/layout/Sidebar";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/merchants", label: "Merchant'lar", icon: "store" },
  { href: "/admin/products", label: "Ürünler", icon: "package" },
  { href: "/admin/products/pending", label: "Onay Bekleyenler", icon: "clock" },
  { href: "/admin/orders", label: "Siparişler", icon: "shopping-cart" },
  { href: "/admin/fulfillment", label: "Fulfillment", icon: "truck" },
  { href: "/admin/couriers", label: "Kuryeler", icon: "user-check" },
  { href: "/admin/categories", label: "Kategoriler", icon: "tag" },
  { href: "/admin/analytics", label: "Analitik", icon: "bar-chart-2" },
  { href: "/admin/subscription", label: "Abonelikler", icon: "credit-card" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar links={adminLinks} role="Admin" />
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
