import { Sidebar } from "@/components/layout/Sidebar";

const courierLinks = [
  { href: "/courier", label: "Dashboard", icon: "grid" },
  { href: "/courier/shipments", label: "Kargolarım", icon: "truck" },
  { href: "/courier/profile", label: "Profilim", icon: "user-check" },
];

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--off-white)" }}
    >
      <Sidebar links={courierLinks} role="Courier" />
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
