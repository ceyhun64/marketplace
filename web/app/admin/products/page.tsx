import { Suspense } from "react";
import AdminProductsPage from "@/components/modules/admin/AdminProductsPage";

export default function AdminProductsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AdminProductsPage />
    </Suspense>
  );
}
