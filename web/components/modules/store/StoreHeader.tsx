"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, Package, MapPin, Clock } from "lucide-react";

interface StoreHeaderProps {
  store: {
    id: string;
    storeName: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    rating?: number;
    productCount?: number;
    location?: string;
    handlingHours?: number;
    memberSince?: string;
  };
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="w-full">
      {/* Banner */}
      <div
        className="h-40 md:h-56 w-full bg-linear-to-r from-slate-700 to-slate-900 relative overflow-hidden"
        style={
          store.bannerUrl
            ? {
                backgroundImage: `url(${store.bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* Store info */}
      <div className="max-w-6xl mx-auto px-4 pb-4">
        <div className="flex items-end gap-4 -mt-10 mb-4">
          {/* Logo */}
          <div className="h-20 w-20 rounded-xl border-4 border-background bg-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.storeName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-600">
                {store.storeName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="mb-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">
              {store.storeName}
            </h1>
            {store.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {store.description}
              </p>
            )}
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {store.rating !== undefined && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <strong className="text-foreground">
                {store.rating.toFixed(1)}
              </strong>
              <span>puan</span>
            </span>
          )}
          {store.productCount !== undefined && (
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              <strong className="text-foreground">{store.productCount}</strong>
              <span>products</span>
            </span>
          )}
          {store.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {store.location}
            </span>
          )}
          {store.handlingHours !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Handling: </span>
              <strong className="text-foreground">
                {store.handlingHours} hours
              </strong>
            </span>
          )}
          {store.memberSince && (
            <Badge variant="secondary" className="text-xs">
              {new Date(store.memberSince).getFullYear()}member since
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
