"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
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
                  className="h-32 w-32 object-cover rounded-lg border border-(--border-mid) shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-product.png";
                  }}
                />
              ))}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-(--text-primary)">{product.name}</h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-(--text-tertiary)">
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
            <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="text-sm text-(--text-secondary) leading-relaxed">
              {product.description || "—"}
            </p>
          </div>
          {product.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-(--off-white-2) text-(--text-secondary) text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 bg-(--bg-sunken) rounded-lg p-3">
            <div>
              <p className="text-xs text-(--text-tertiary)">Added By</p>
              <p className="text-sm font-medium">{product.createdByName}</p>
            </div>
            <div>
              <p className="text-xs text-(--text-tertiary)">Store</p>
              <p className="text-sm font-medium">{product.merchantStoreName}</p>
            </div>
            <div>
              <p className="text-xs text-(--text-tertiary)">Date</p>
              <p className="text-sm font-medium">
                {formatDate(product.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-(--success) hover:opacity-90"
              disabled={isLoading}
              onClick={() => onApprove(product.id)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-(--danger-border) text-(--danger) hover:bg-(--danger-bg)"
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
      const res = await api.get("/api/admin/products/pending");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.patch(`/api/admin/products/${productId}/approve`);
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
      const res = await api.patch(`/api/admin/products/${productId}/reject`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Pending Approval
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Review and approve or reject merchant products
          </p>
        </div>
        {products.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-(--warning-bg) text-(--warning) px-3 py-1.5 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            {products.length} pending
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
        <Input
          placeholder="Search by name, store or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-(--border-mid)"
        />
      </div>

      {/* Products Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border-light)">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Pending Products
            <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
              ({filtered.length} products)
            </span>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide w-12">
                Image
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Product
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Category
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Store
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide text-right">
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
                  className="text-center py-16 text-(--text-tertiary)"
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
                  className="hover:bg-(--bg-sunken) border-b border-(--border-subtle) cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <TableCell>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-(--border-light)"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-product.png";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-(--off-white-2) flex items-center justify-center">
                        <Package className="w-5 h-5 text-(--text-tertiary)" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-(--text-primary)">
                      {product.name}
                    </p>
                    <p className="text-xs text-(--text-tertiary) line-clamp-1 max-w-50">
                      {product.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-(--text-secondary)">
                      {product.categoryName}
                      {product.subcategoryName && (
                        <span className="text-(--text-tertiary)">
                          {" "}
                          / {product.subcategoryName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-(--text-tertiary)" />
                      <span className="text-sm text-(--text-secondary)">
                        {product.merchantStoreName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-(--text-tertiary)">
                    {formatDate(product.createdAt)}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-(--text-tertiary) hover:text-(--text-secondary)"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-(--success) hover:opacity-90"
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
                        className="h-7 text-xs border-(--danger-border) text-(--danger) hover:bg-(--danger-bg)"
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
