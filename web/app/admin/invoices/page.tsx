import { Suspense } from "react";
import AdminInvoicesPage from "@/components/modules/admin/AdminInvoicesPage";

export default function AdminInvoicesRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AdminInvoicesPage />
    </Suspense>
  );
}
