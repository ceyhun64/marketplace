import { Sidebar } from "@/components/layout/Sidebar";

const courierLinks = [
  { href: "/courier", label: "Dashboard", icon: "grid" },
  { href: "/courier/shipments", label: "Sevkiyatlarım", icon: "truck" },
];

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar links={courierLinks} role="Courier" />
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
