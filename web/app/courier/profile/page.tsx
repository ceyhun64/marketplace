import CourierProfilePage from "@/components/modules/courier/CourierProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profilim — Courier Dashboard",
  robots: { index: false, follow: false },
};

export default function CourierProfileRoute() {
  return <CourierProfilePage />;
}
