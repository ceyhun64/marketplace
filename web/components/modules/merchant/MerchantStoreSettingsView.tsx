"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import StoreSettingsForm from "./StoreSettingsForm";

export default function MerchantStoreSettingsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get("/merchant/profile");
      return res.data;
    },
  });

  const profile = data?.data || null;

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mağaza Ayarları</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mağaza profili, görsel ve domain ayarları
        </p>
      </div>
      <StoreSettingsForm store={profile} />
    </div>
  );
}
