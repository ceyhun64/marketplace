import { Suspense } from "react";
import AdminDashboardPage from "@/components/modules/admin/AdminDashboardPage";

export default function AdminDashboardRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AdminDashboardPage />
    </Suspense>
  );
}
