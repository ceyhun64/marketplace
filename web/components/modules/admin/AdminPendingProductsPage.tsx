"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <DialogTitle className="text-lg">Product Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {product.images?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Image ${i + 1}`}
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-product.png";
                  }}
                />
              ))}
            </div>
          )}
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
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {product.description || "—"}
            </p>
          </div>
          {product.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tags
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
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
            <div>
              <p className="text-xs text-gray-400">Added By</p>
              <p className="text-sm font-medium">{product.createdByName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Store</p>
              <p className="text-sm font-medium">{product.merchantStoreName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-medium">
                {new Date(product.createdAt).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
              onClick={() => onApprove(product.id)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50"
              disabled={isLoading}
              onClick={() => onReject(product.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
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
      toast.success("Product approved");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
      setSelectedProduct(null);
    },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.patch(`/api/products/${productId}/approve`, {
        approved: false,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Product rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
      setSelectedProduct(null);
    },
    onError: () => toast.error("Failed to reject"),
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Pending Approval
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve or reject merchant products
          </p>
        </div>
        {products.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            {products.length} pending
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, store or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-gray-200"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Pending Products
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} products)
            </span>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">
                Image
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Product
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Category
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Store
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Action
              </TableHead>
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
                  <p className="text-sm font-medium">No pending products</p>
                  <p className="text-xs mt-1">
                    All products have been reviewed
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-gray-50 border-b border-gray-50 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <TableCell>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100"
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
                  <TableCell className="text-xs text-gray-400">
                    {new Date(product.createdAt).toLocaleDateString("en-US")}
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
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        disabled={isActioning}
                        onClick={(e) => {
                          e.stopPropagation();
                          approveMutation.mutate(product.id);
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                        disabled={isActioning}
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectMutation.mutate(product.id);
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
