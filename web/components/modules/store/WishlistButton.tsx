"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWishlistCheck, useAddToWishlist, useRemoveFromWishlist } from "@/queries/useWishlist";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  variant?: "default" | "icon";
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  variant = "default",
  className = "",
}: WishlistButtonProps) {
  const { data: checkData, isLoading } = useWishlistCheck(productId);
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  const inWishlist = checkData?.inWishlist ?? false;
  const isPending = addMutation.isPending || removeMutation.isPending;

  const handleToggle = async () => {
    try {
      if (inWishlist) {
        await removeMutation.mutateAsync(productId);
        toast.success(productName ? `"${productName}" istek listesinden çıkarıldı.` : "İstek listesinden çıkarıldı.");
      } else {
        await addMutation.mutateAsync(productId);
        toast.success(productName ? `"${productName}" istek listesine eklendi.` : "İstek listesine eklendi.");
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error("İstek listesi için giriş yapmalısınız.");
      } else {
        toast.error("Bir hata oluştu, tekrar deneyin.");
      }
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading || isPending}
        className={`flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm hover:border-red-300 transition-all disabled:opacity-50 ${className}`}
        aria-label={inWishlist ? "İstek listesinden çıkar" : "İstek listesine ekle"}
        title={inWishlist ? "İstek listesinden çıkar" : "İstek listesine ekle"}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}`}
        />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleToggle}
      disabled={isLoading || isPending}
      className={`gap-2 border-gray-200 hover:border-red-300 hover:text-red-500 transition-all ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${inWishlist ? "fill-red-500 text-red-500" : ""}`}
      />
      {inWishlist ? "İstek Listesinde" : "İstek Listesine Ekle"}
    </Button>
  );
}
