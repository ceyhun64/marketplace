"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import MultiImageUploader from "@/components/ui/multiImageUploader";

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  merchantStoreName?: string;
  images: string[];
  tags: string[];
  price: number;
  stock: number;
  isApproved: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

interface Merchant {
  id: string;
  storeName: string;
  slug: string;
}

interface ProductForm {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  tags: string;
  images: string[];
  price: string;
  stock: string;
  merchantId: string;
  publishToMarket: boolean;
  publishToStore: boolean;
}

const defaultForm: ProductForm = {
  name: "",
  description: "",
  categoryId: "",
  subcategoryId: "",
  tags: "",
  images: [],
  price: "",
  stock: "0",
  merchantId: "",
  publishToMarket: false,
  publishToStore: true,
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(defaultForm);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: async () => {
      const res = await api.get("/api/products/admin/all", {
        params: { search, limit: 100 },
      });
      return res.data;
    },
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-products"],
    queryFn: async () => {
      const res = await api.get("/api/admin/products/pending");
      return res.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/api/categories");
      return res.data;
    },
  });

  const { data: merchantsData } = useQuery({
    queryKey: ["admin-merchants-list"],
    queryFn: async () => {
      const res = await api.get("/api/admin/merchants", {
        params: { limit: 200 },
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/api/products", data),
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["pending-products"] });
      handleDialogClose(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create product");
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => {
      if (approved) {
        return api.patch(`/api/admin/products/${id}/approve`);
      } else {
        return api.delete(`/api/products/${id}`);
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? "Product approved" : "Product rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["pending-products"] });
    },
    onError: () => toast.error("Operation failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const allProducts: Product[] = productsData?.items || productsData || [];
  const pendingProducts: Product[] = pendingData?.items || pendingData || [];
  const categories: Category[] = categoriesData?.items || categoriesData || [];
  const merchants: Merchant[] = merchantsData?.items || merchantsData || [];

  const rootCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter(
    (c) => c.parentId === form.categoryId,
  );

  const filtered = allProducts.filter(
    (p) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
      p.merchantStoreName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = () => {
    const priceNum = parseFloat(form.price);
    const stockNum = parseInt(form.stock, 10);

    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (!form.categoryId) return toast.error("Please select a category");
    if (isNaN(priceNum) || priceNum < 0)
      return toast.error("Please enter a valid price");
    if (isNaN(stockNum) || stockNum < 0)
      return toast.error("Please enter a valid stock quantity");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.subcategoryId || form.categoryId,
      images: form.images,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      price: priceNum,
      stock: stockNum,
      merchantId: form.merchantId || undefined,
      publishToMarket: form.publishToMarket,
      publishToStore: form.publishToStore,
    };
    createMutation.mutate(payload);
  };

  const handleDialogClose = (open: boolean) => {
    setAddOpen(open);
    if (!open) setForm(defaultForm);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Master catalog — manage and approve all products
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2 bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Products",
            value: allProducts.length,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Approved",
            value: allProducts.filter((p) => p.isApproved).length,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Pending Approval",
            value: pendingProducts.length,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingProducts.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingProducts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, category or merchant..."
                  className="pl-9 border-gray-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            {productsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No products yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAddOpen(true)}
                >
                  Add First Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-100">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Product
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Merchant
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Price / Stock
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tags
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-gray-50 border-b border-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.categoryName || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.merchantStoreName || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <span className="font-semibold">
                          ${product.price?.toFixed(2) ?? "—"}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">
                          / {product.stock} pcs
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.tags?.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {(product.tags?.length ?? 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${product.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {product.isApproved ? "Approved" : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(product.createdAt).toLocaleDateString(
                          "en-US",
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!product.isApproved && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() =>
                                approveMutation.mutate({
                                  id: product.id,
                                  approved: true,
                                })
                              }
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this product?",
                                )
                              )
                                deleteMutation.mutate(product.id);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {pendingLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : pendingProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No pending products</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-100">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Product
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Added By
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Price
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-gray-50 border-b border-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(product as any).category ??
                          (product as any).categoryName ??
                          "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(product as any).merchant?.storeName ??
                          (product as any).merchantStoreName ??
                          "Merchant"}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-700">
                        ${(product as any).price?.toFixed(2) ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(product.createdAt).toLocaleDateString(
                          "en-US",
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            onClick={() =>
                              approveMutation.mutate({
                                id: product.id,
                                approved: true,
                              })
                            }
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5"
                            onClick={() =>
                              approveMutation.mutate({
                                id: product.id,
                                approved: false,
                              })
                            }
                            disabled={approveMutation.isPending}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new product to the catalog.
              Products added by an admin are automatically approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Images */}
            <MultiImageUploader
              label="Product Images"
              folder="marketplace/products"
              maxFiles={6}
              onUpdate={(urls) => setForm((f) => ({ ...f, images: urls }))}
            />

            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input
                placeholder="e.g. iPhone 15 Pro"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea
                placeholder="Brief product description..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stock *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Main Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v, subcategoryId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {rootCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Subcategory</Label>
                  <Select
                    value={form.subcategoryId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, subcategoryId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Merchant */}
            {merchants.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assign to Merchant</Label>
                <Select
                  value={form.merchantId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, merchantId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select merchant (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  If left blank, the system will assign one automatically.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                placeholder="technology, smartphone, apple (comma separated)"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400">Separate tags with commas</p>
            </div>

            {/* Publish toggles */}
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.publishToStore}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publishToStore: e.target.checked }))
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">
                  Publish to E-Store
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.publishToMarket}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      publishToMarket: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">
                  Publish to Marketplace
                </span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                !form.name ||
                !form.description ||
                !form.categoryId ||
                !form.price
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
