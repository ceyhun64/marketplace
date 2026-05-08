import NotificationsPage from "@/components/modules/notifications/NotificationsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — Marketplace",
  description: "View your order updates, deals, and platform notifications.",
};

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
