import { Suspense } from "react";
import AdminCouriersPage from "@/components/modules/admin/AdminCouriersPage";

export default function AdminCouriersRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AdminCouriersPage />
    </Suspense>
  );
}
