import CourierShipmentsPage from "@/components/modules/courier/CourierShipmentsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Shipments — Courier Dashboard",
  robots: { index: false, follow: false },
};

export default function CourierShipmentsRoute() {
  return <CourierShipmentsPage />;
}
