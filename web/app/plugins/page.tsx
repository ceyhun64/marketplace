import PluginsPage from "@/components/modules/plugins/PluginsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plugin Marketplace — BAZR",
  description:
    "Power up your store with integrations for analytics, marketing, shipping, and more.",
  openGraph: {
    title: "Plugin Marketplace — BAZR",
    description: "Extend your merchant store with powerful plugins.",
    type: "website",
  },
};

export default function PluginsRoute() {
  return <PluginsPage />;
}
