"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { wishlistKeys } from "@/queries/useWishlist";
import { useHybridWishlist } from "@/hooks/use-hybrid-wishlist";
import { useLocalWishlist } from "@/hooks/use-wishlist-local";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { toast } from "sonner";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string) => UUID_REGEX.test(id);

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  productImage?: string;
  price?: number;
  variant?: "default" | "icon";
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  productImage,
  price,
  variant = "default",
  className = "",
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { toggle } = useHybridWishlist();
  const local = useLocalWishlist();
  const [isPending, setIsPending] = useState(false);

  // Logged in user → Check from API
  const { data: checkData } = useQuery({
    queryKey: wishlistKeys.check(productId),
    queryFn: async () => {
      const { data } = await api.get<{
        productId: string;
        inWishlist: boolean;
      }>(`/api/wishlist/check/${productId}`);
      return data;
    },
    enabled: !!user && isValidUUID(productId), // Only run if logged in and valid UUID
    staleTime: 1000 * 60 * 2,
  });

  // Active state: API data if logged in, otherwise local store
  const inWishlist = user
    ? (checkData?.inWishlist ?? false)
    : local.hasItem(productId);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      const added = await toggle(productId, {
        productName,
        productImage,
        price,
      });

      if (added) {
        toast.success(
          productName
            ? `"${productName}" added to wishlist`
            : "Added to wishlist",
          {
            // Gently remind the guest user
            description: !user
              ? "Your list will be transferred to your account when you log in."
              : undefined,
            duration: !user ? 4000 : 2000,
          },
        );
      } else {
        toast.success(
          productName
            ? `"${productName}" removed from wishlist`
            : "Removed from wishlist",
          { duration: 2000 },
        );
      }
    } catch {
      toast.error("Something went wrong, please try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm hover:border-red-300 transition-all disabled:opacity-50 ${className}`}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-200 ${
            inWishlist
              ? "fill-red-500 text-red-500 scale-110"
              : "text-gray-400 hover:text-red-400"
          }`}
        />
        {/* Guest badge: how many items are waiting */}
        {!user && local.count() > 0 && local.hasItem(productId) && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleToggle}
      disabled={isPending}
      className={`gap-2 border-gray-200 hover:border-red-300 hover:text-red-500 transition-all ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          inWishlist ? "fill-red-500 text-red-500" : ""
        }`}
      />
      {inWishlist ? "In Wishlist" : "Add to Wishlist"}
    </Button>
  );
}
