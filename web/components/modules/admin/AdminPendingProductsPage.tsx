"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Package,
  Clock,
  Store,
  Tag,
} from "lucide-react";

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  subcategoryName?: string;
  images: string[];
  tags: string[];
  createdByName: string;
  merchantStoreName: string;
  createdAt: string;
}

function ProductDetailDialog({
  product,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: {
  product: PendingProduct | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading: boolean;
}) {
  if (!product) return null;
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Ürün Detayı</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Images */}
          {product.images?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Görsel ${i + 1}`}
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-product.png";
                  }}
                />
              ))}
            </div>
          )}

          {/* Name & Category */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Tag className="w-4 h-4" />
              <span>{product.categoryName}</span>
              {product.subcategoryName && (
                <>
                  <span>/</span>
                  <span>{product.subcategoryName}</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Açıklama
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {product.description || "—"}
            </p>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Etiketler
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
            <div>
              <p className="text-xs text-gray-400">Oluşturan</p>
              <p className="text-sm font-medium">{product.createdByName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Mağaza</p>
              <p className="text-sm font-medium">{product.merchantStoreName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tarih</p>
              <p className="text-sm font-medium">
                {new Date(product.createdAt).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              onClick={() => onApprove(product.id)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Onayla
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              disabled={isLoading}
              onClick={() => onReject(product.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reddet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPendingProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pending-products"],
    queryFn: async () => {
      const res = await api.get("/api/products/admin/pending");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.patch(`/api/products/${productId}/approve`, {
        approved: true,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ürün onaylandı");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
      setSelectedProduct(null);
    },
    onError: () => toast.error("Onaylama başarısız"),
  });

  const rejectMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.patch(`/api/products/${productId}/approve`, {
        approved: false,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ürün reddedildi");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
      setSelectedProduct(null);
    },
    onError: () => toast.error("Reddetme başarısız"),
  });

  const products: PendingProduct[] = data?.data || [];
  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.merchantStoreName?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase()),
  );

  const isActioning = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Onay Bekleyen Ürünler
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Merchant'ların eklediği ürünleri incele ve onayla/reddet
          </p>
        </div>
        {products.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            {products.length} bekliyor
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Ürün adı, mağaza veya kategori ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Bekleyen Ürünler
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} ürün)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs w-12">Görsel</TableHead>
                  <TableHead className="text-xs">Ürün Adı</TableHead>
                  <TableHead className="text-xs">Kategori</TableHead>
                  <TableHead className="text-xs">Mağaza</TableHead>
                  <TableHead className="text-xs">Tarih</TableHead>
                  <TableHead className="text-xs text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-16 text-gray-400"
                    >
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">
                        Onay bekleyen ürün yok
                      </p>
                      <p className="text-xs mt-1">Tüm ürünler incelendi</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <TableCell>
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-product.png";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                          {product.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {product.categoryName}
                          {product.subcategoryName && (
                            <span className="text-gray-400">
                              {" "}
                              / {product.subcategoryName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {product.merchantStoreName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString(
                          "tr-TR",
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            disabled={isActioning}
                            onClick={(e) => {
                              e.stopPropagation();
                              approveMutation.mutate(product.id);
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            disabled={isActioning}
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectMutation.mutate(product.id);
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onApprove={(id) => approveMutation.mutate(id)}
        onReject={(id) => rejectMutation.mutate(id)}
        isLoading={isActioning}
      />
    </div>
  );
}
