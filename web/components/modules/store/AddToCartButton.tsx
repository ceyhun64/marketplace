"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

interface CartItem {
  offerId: string;
  productId: string;
  productName: string;
  image: string;
  price: number;
  merchantSlug: string;
}

interface AddToCartButtonProps {
  offer: CartItem;
  disabled?: boolean;
}

export function AddToCartButton({ offer, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(offer as any);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

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
