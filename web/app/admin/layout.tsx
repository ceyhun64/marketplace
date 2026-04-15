import { Sidebar } from "@/components/layout/Sidebar";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/merchants", label: "Merchant'lar", icon: "store" },
  { href: "/admin/products", label: "Ürünler", icon: "package" },
  { href: "/admin/orders", label: "Siparişler", icon: "shopping-cart" },
  { href: "/admin/couriers", label: "Kuryeler", icon: "truck" },
  { href: "/admin/analytics", label: "Analitik", icon: "bar-chart-2" },
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
