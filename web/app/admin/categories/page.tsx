import { Suspense } from "react";
import AdminCategoriesPage from "@/components/modules/admin/AdminCategoriesPage";

export default function AdminCategoriesRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AdminCategoriesPage />
    </Suspense>
  );
}
