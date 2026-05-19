import { Suspense } from "react";
import type { Metadata } from "next";
import SiteSettingsPage from "@/components/modules/admin/SiteSettingsPage";

export const metadata: Metadata = {
  title: "Site Settings — Admin",
  robots: { index: false, follow: false },
};

export default function SiteSettingsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border-mid)", borderTopColor: "var(--red)" }}
          />
        </div>
      }
    >
      <SiteSettingsPage />
    </Suspense>
  );
}
