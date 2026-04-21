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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  Tag,
  Image as ImageIcon,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  images: string[];
  tags: string[];
  isApproved: boolean;
  createdByName?: string;
  createdAt: string;
  offerCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

interface ProductForm {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  tags: string;
  images: string[];
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    tags: "",
    images: [],
  });
  const [imageInput, setImageInput] = useState("");

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: async () => {
      const res = await api.get("/api/products", {
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

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/api/products", data),
    onSuccess: () => {
      toast.success("Ürün başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["pending-products"] });
      setAddOpen(false);
      setForm({
        name: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        tags: "",
        images: [],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Ürün oluşturulamadı");
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post(`/api/admin/products/${id}/approve`, { approved }),
    onSuccess: (_, { approved }) => {
      toast.success(approved ? "Ürün onaylandı" : "Ürün reddedildi");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["pending-products"] });
    },
    onError: () => toast.error("İşlem başarısız"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      toast.success("Ürün silindi");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Ürün silinemedi"),
  });

  const allProducts: Product[] = productsData?.items || productsData || [];
  const pendingProducts: Product[] = pendingData?.items || pendingData || [];
  const categories: Category[] = categoriesData?.items || categoriesData || [];

  const rootCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter(
    (c) => c.parentId === form.categoryId,
  );

  const filtered = allProducts.filter(
    (p) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setForm((f) => ({ ...f, images: [...f.images, imageInput.trim()] }));
      setImageInput("");
    }
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      description: form.description,
      categoryId: form.subcategoryId || form.categoryId,
      images: form.images,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-500 mt-1">
            Master katalog — tüm ürünleri yönetin ve onaylayın
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ürün Ekle
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{allProducts.length}</p>
              <p className="text-xs text-gray-500">Toplam Ürün</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {allProducts.filter((p) => p.isApproved).length}
              </p>
              <p className="text-xs text-gray-500">Onaylı</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{pendingProducts.length}</p>
              <p className="text-xs text-gray-500">Onay Bekliyor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tüm Ürünler</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Onay Bekleyen
            {pendingProducts.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingProducts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Ürün adı veya kategori..."
                    className="pl-9"
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
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Henüz ürün yok</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setAddOpen(true)}
                  >
                    İlk Ürünü Ekle
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Ürün</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Etiketler</TableHead>
                      <TableHead>Teklifler</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="w-24">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {product.categoryName || "—"}
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
                        <TableCell className="text-sm">
                          {product.offerCount ?? 0} teklif
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              product.isApproved
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }
                            variant="outline"
                          >
                            {product.isApproved ? "Onaylı" : "Bekliyor"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(product.createdAt).toLocaleDateString(
                            "tr-TR",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!product.isApproved && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Bu ürünü silmek istediğinizden emin misiniz?",
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {pendingLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : pendingProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CheckCircle className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Onay bekleyen ürün yok</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Ürün</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Ekleyen</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Karar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {product.categoryName || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {product.createdByName || "Merchant"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(product.createdAt).toLocaleDateString(
                            "tr-TR",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              onClick={() =>
                                approveMutation.mutate({
                                  id: product.id,
                                  approved: true,
                                })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                              onClick={() =>
                                approveMutation.mutate({
                                  id: product.id,
                                  approved: false,
                                })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reddet
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Ürün Adı *</Label>
              <Input
                placeholder="Örn: iPhone 15 Pro"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama *</Label>
              <Textarea
                placeholder="Ürün hakkında kısa açıklama..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ana Kategori *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v, subcategoryId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
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
                  <Label>Alt Kategori</Label>
                  <Select
                    value={form.subcategoryId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, subcategoryId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alt kategori" />
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
            <div className="space-y-1.5">
              <Label>Etiketler</Label>
              <Input
                placeholder="teknoloji, akıllı telefon, apple (virgülle ayırın)"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400">
                Etiketleri virgülle ayırarak girin
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Görseller</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Görsel URL ekle..."
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddImage()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImage}
                  disabled={!imageInput.trim()}
                >
                  Ekle
                </Button>
              </div>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.images.map((img, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-6 h-6 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-xs text-gray-600 truncate max-w-[100px]">
                        {img.split("/").pop()}
                      </span>
                      <button
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            images: f.images.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-gray-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                !form.name ||
                !form.description ||
                !form.categoryId
              }
            >
              {createMutation.isPending ? "Ekleniyor..." : "Ürünü Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
