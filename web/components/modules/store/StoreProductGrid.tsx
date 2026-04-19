"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface StoreOffer {
  id: string;
  productId: string;
  productName: string;
  productImages: string[];
  price: number;
  stock: number;
  rating: number;
  categoryName?: string;
}

interface StoreProductGridProps {
  storeSlug: string;
  offers: StoreOffer[];
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: "default", label: "Varsayılan" },
  { value: "price_asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price_desc", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "rating", label: "En Yüksek Puan" },
];

export function StoreProductGrid({
  storeSlug,
  offers,
  isLoading,
}: StoreProductGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const { addItem } = useCart();

  const filtered = offers
    .filter((o) => o.productName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mağazada ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Sırala" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Ürün bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((offer) => (
            <div
              key={offer.id}
              className="group border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow"
            >
              <Link href={`/store/${storeSlug}/product/${offer.productId}`}>
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {offer.productImages[0] ? (
                    <Image
                      src={offer.productImages[0]}
                      alt={offer.productName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-4xl">
                      📦
                    </div>
                  )}
                  {offer.stock === 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2 text-xs"
                    >
                      Tükendi
                    </Badge>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <Link href={`/store/${storeSlug}/product/${offer.productId}`}>
                  <h3 className="text-sm font-medium line-clamp-2 hover:underline mb-1">
                    {offer.productName}
                  </h3>
                </Link>

                {offer.categoryName && (
                  <Badge variant="outline" className="text-xs mb-2">
                    {offer.categoryName}
                  </Badge>
                )}

                <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {offer.rating.toFixed(1)}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-base">
                    {offer.price.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-2"
                    disabled={offer.stock === 0}
                    onClick={() =>
                      addItem({
                        offerId: offer.id,
                        productId: offer.productId,
                        productName: offer.productName,
                        productImage: offer.productImages[0] ?? "", // image → productImage
                        merchantId: "", // API'den gelmiyor, StoreOffer'a ekle veya boş bırak
                        merchantStoreName: "", // aynı şekilde
                        merchantSlug: storeSlug,
                        price: offer.price,
                        stock: offer.stock,
                        source: "ESTORE",
                      })
                    }
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
