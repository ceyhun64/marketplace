"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  merchantId?: string;
}

export const meKeys = {
  all: ["me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: meKeys.all,
    queryFn: async () => {
      const { data } = await api.get<MeResponse>("/api/auth/me");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) => api.put("/api/auth/me", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}
