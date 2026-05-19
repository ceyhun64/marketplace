import { PortalShell } from "@/components/layout/PortalShell";

const courierLinks = [
  { href: "/courier", label: "Dashboard", icon: "grid" },
  { href: "/courier/shipments", label: "My Shipments", icon: "truck" },
  { href: "/courier/earnings", label: "My Earnings", icon: "trending-up" },
  { href: "/courier/profile", label: "My Profile", icon: "user-check" },
];

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell links={courierLinks} role="Courier">
      {children}
    </PortalShell>
  );
}
