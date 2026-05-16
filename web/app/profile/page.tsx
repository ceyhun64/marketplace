import ProfilePage from "@/components/modules/profile/ProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile — Marketplace",
  description: "Manage your account details, addresses, and preferences.",
  robots: { index: false, follow: false },
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
