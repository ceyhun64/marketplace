import { Sidebar } from "@/components/layout/Sidebar";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/merchants", label: "Merchants", icon: "store" },
  { href: "/admin/products", label: "Products", icon: "package" },
  { href: "/admin/products/pending", label: "Pending Approval", icon: "clock" },
  { href: "/admin/orders", label: "Orders", icon: "shopping-cart" },
  { href: "/admin/fulfillment", label: "Fulfillment", icon: "truck" },
  { href: "/admin/couriers", label: "Couriers", icon: "user-check" },
  { href: "/admin/categories", label: "Categories", icon: "tag" },
  { href: "/admin/invoices", label: "Invoices", icon: "file-text" },
  { href: "/admin/plugins", label: "Plugin Marketplace", icon: "puzzle" },
  { href: "/admin/analytics", label: "Analytics", icon: "bar-chart-2" },
  { href: "/admin/subscription", label: "Subscriptions", icon: "credit-card" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <Sidebar links={adminLinks} role="Admin" />
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
