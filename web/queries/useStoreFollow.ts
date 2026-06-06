"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface FollowStatus {
  followerCount: number;
  isFollowing: boolean;
}

const storeFollowKeys = {
  status: (slug: string) => ["store", slug, "follow"] as const,
};

export function useStoreFollowStatus(slug: string) {
  return useQuery({
    queryKey: storeFollowKeys.status(slug),
    queryFn: async () => {
      const { data } = await api.get<FollowStatus>(`/api/store/${slug}/follow`);
      return data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useFollowStore(slug: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = storeFollowKeys.status(slug);

  const follow = useMutation({
    mutationFn: () => api.post<FollowStatus>(`/api/store/${slug}/follow`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<FollowStatus>(key);
      queryClient.setQueryData<FollowStatus>(key, (old) =>
        old
          ? { followerCount: old.followerCount + 1, isFollowing: true }
          : { followerCount: 1, isFollowing: true },
      );
      return { prev };
    },
    onSuccess: (res) => {
      queryClient.setQueryData<FollowStatus>(key, res.data);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
  });

  const unfollow = useMutation({
    mutationFn: () => api.delete<FollowStatus>(`/api/store/${slug}/follow`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<FollowStatus>(key);
      queryClient.setQueryData<FollowStatus>(key, (old) =>
        old
          ? { followerCount: Math.max(0, old.followerCount - 1), isFollowing: false }
          : { followerCount: 0, isFollowing: false },
      );
      return { prev };
    },
    onSuccess: (res) => {
      queryClient.setQueryData<FollowStatus>(key, res.data);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
  });

  const toggle = () => {
    const current = queryClient.getQueryData<FollowStatus>(key);
    if (current?.isFollowing) {
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  };

  return {
    isLoggedIn: !!user,
    isPending: follow.isPending || unfollow.isPending,
    toggle,
  };
}
