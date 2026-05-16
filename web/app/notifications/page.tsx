import NotificationsPage from "@/components/modules/notifications/NotificationsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — Marketplace",
  description: "View your order updates, deals, and platform notifications.",
  robots: { index: false, follow: false },
};

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
