import { PortalShell } from "@/components/layout/PortalShell";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/merchants", label: "Merchants", icon: "store" },
  { href: "/admin/products", label: "Products", icon: "package" },
  { href: "/admin/orders", label: "Orders", icon: "shopping-cart" },
  { href: "/admin/fulfillment", label: "Fulfillment", icon: "truck" },
  { href: "/admin/couriers", label: "Couriers", icon: "user-check" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/categories", label: "Categories", icon: "tag" },
  { href: "/admin/commission", label: "Commission & Fees", icon: "percent" },
  { href: "/admin/invoices", label: "Invoices", icon: "file-text" },
  { href: "/admin/plugins", label: "Plugin Marketplace", icon: "puzzle" },
  { href: "/admin/analytics", label: "Analytics", icon: "bar-chart-2" },
  { href: "/admin/subscription", label: "Subscriptions", icon: "credit-card" },
  { href: "/admin/logs", label: "Audit Logs", icon: "activity" },
  { href: "/admin/site-settings", label: "Site Settings", icon: "layout" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell links={adminLinks} role="Admin">
      {children}
    </PortalShell>
  );
}
