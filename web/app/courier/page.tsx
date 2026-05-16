import CourierDashboardPage from "@/components/modules/courier/CourierDashboardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courier Dashboard — Marketplace",
  robots: { index: false, follow: false },
};

export default function CourierDashboardRoute() {
  return <CourierDashboardPage />;
}
