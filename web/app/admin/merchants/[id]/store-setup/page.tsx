import { Suspense } from "react";
import AdminMerchantStoreSetupPage from "@/components/modules/admin/AdminMerchantStoreSetupPage";

export default function AdminMerchantStoreSetupRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AdminMerchantStoreSetupPage />
    </Suspense>
  );
}
