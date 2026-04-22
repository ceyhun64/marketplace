"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

export interface CartItem {
  offerId: string;
  productId: string;
  productName: string;
  productImage?: string; // image → productImage
  price: number;
  merchantId: string; // eksikti
  merchantStoreName?: string;
  stock?: number;
  source?: string;
  merchantSlug?: string;
}

interface AddToCartButtonProps {
  offerId: string;
  productId: string;
  productName: string;
  price: number;
  merchantId: string;
  image?: string;
  variant?: "default" | "small";
  disabled?: boolean;
}

export function AddToCartButton({
  offerId,
  productId,
  productName,
  price,
  merchantId,
  image,
  variant = "default",
  disabled,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      offerId,
      productId,
      productName,
      productImage: image,
      price,
      merchantId,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (variant === "small") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs"
        disabled={disabled || added}
        onClick={handleAdd}
      >
        {added ? (
          <>
            <Check className="h-3 w-3" />
            Eklendi
          </>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3" />
            Ekle
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full gap-2"
      disabled={disabled || added}
      onClick={handleAdd}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Sepete Eklendi
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Sepete Ekle
        </>
      )}
    </Button>
  );
}
