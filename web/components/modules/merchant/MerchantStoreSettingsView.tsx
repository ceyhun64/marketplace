"use client";

import { useMerchantProfile } from "@/queries/useMerchant";
import { Skeleton } from "@/components/ui/skeleton";
import StoreSettingsForm from "./StoreSettingsForm";

export default function MerchantStoreSettingsView() {
  const { data, isLoading } = useMerchantProfile();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-1">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Store Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your store profile, visuals and domain
        </p>
      </div>
      <StoreSettingsForm store={data} />
    </div>
  );
}
