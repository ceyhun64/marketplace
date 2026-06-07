"use client";

import { useMerchantProfile } from "@/queries/useMerchant";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Store } from "lucide-react";
import StoreSettingsForm from "./StoreSettingsForm";

export default function MerchantStoreSettingsView() {
  const { data, isLoading, isError, refetch } = useMerchantProfile();

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

  if (!data) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Store className="w-5 h-5" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{isError ? "Couldn't load store profile" : "No store profile found"}</EmptyTitle>
          <EmptyDescription>
            {isError
              ? "Something went wrong while loading your store settings."
              : "We couldn't find a store profile for your account."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">Store Settings</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          Manage your store profile, visuals and domain
        </p>
      </div>
      <StoreSettingsForm store={data} />
    </div>
  );
}
