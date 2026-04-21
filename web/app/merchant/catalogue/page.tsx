"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Package,
  Globe,
  Store,
  TrendingUp,
  DollarSign,
  Pencil,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

interface Offer {
  id: string;
  productId: string;
  productName: string;
  productImages: string[];
  productCategoryName?: string;
  price: number;
  stock: number;
  publishToMarket: boolean;
  publishToStore: boolean;
  rating: number;
  isDeleted: boolean;
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export default function MerchantCataloguePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    tags: "",
    images: [] as string[],
  });
  const [imageInput, setImageInput] = useState("");
  const [offerForm, setOfferForm] = useState({
    price: "",
    stock: "",
    publishToMarket: false,
    publishToStore: true,
  });
  const [editForm, setEditForm] = useState({ price: "", stock: "" });

  const { data: offersData, isLoading } = useQuery({
    queryKey: ["merchant-offers"],
    queryFn: async () => {
      const res = await api.get("/api/merchant/offers");
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
    mutationFn: async () => {
      const productRes = await api.post("/api/products", {
        name: productForm.name,
        description: productForm.description,
        categoryId: productForm.subcategoryId || productForm.categoryId,
        images: productForm.images,
        tags: productForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      const productId = productRes.data?.id || productRes.data?.productId;

      await api.post("/api/merchant/offers", {
        productId,
        price: parseFloat(offerForm.price),
        stock: parseInt(offerForm.stock),
        publishToMarket: offerForm.publishToMarket,
        publishToStore: offerForm.publishToStore,
      });
    },
    onSuccess: () => {
      toast.success("Ürün ve teklif başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
      setAddOpen(false);
      setProductForm({
        name: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        tags: "",
        images: [],
      });
      setOfferForm({
        price: "",
        stock: "",
        publishToMarket: false,
        publishToStore: true,
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Ürün oluşturulamadı");
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.put(`/api/merchant/offers/${id}`, data),
    onSuccess: () => {
      toast.success("Teklif güncellendi");
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
      setEditOpen(false);
    },
    onError: () => toast.error("Güncellenemedi"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      publishToMarket,
      publishToStore,
    }: {
      id: string;
      publishToMarket: boolean;
      publishToStore: boolean;
    }) =>
      api.patch(`/api/merchant/offers/${id}/publish`, {
        publishToMarket,
        publishToStore,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
    },
    onError: () => toast.error("Güncelleme başarısız"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/merchant/offers/${id}`),
    onSuccess: () => {
      toast.success("Teklif kaldırıldı");
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
    },
    onError: () => toast.error("Kaldırılamadı"),
  });

  const offers: Offer[] = offersData?.items || offersData || [];
  const categories: Category[] = categoriesData?.items || categoriesData || [];
  const rootCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter(
    (c) => c.parentId === productForm.categoryId,
  );
  const filtered = offers.filter(
    (o) =>
      !search || o.productName?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: offers.length,
    inMarket: offers.filter((o) => o.publishToMarket).length,
    inStore: offers.filter((o) => o.publishToStore).length,
    totalStock: offers.reduce((sum, o) => sum + (o.stock || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürün Kataloğum</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ürünlerinizi ve fiyatlarınızı yönetin
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ürün Ekle
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Ürün",
            value: stats.total,
            icon: Package,
            color: "text-blue-600",
          },
          {
            label: "Marketplace'de",
            value: stats.inMarket,
            icon: Globe,
            color: "text-green-600",
          },
          {
            label: "E-Mağazada",
            value: stats.inStore,
            icon: Store,
            color: "text-purple-600",
          },
          {
            label: "Toplam Stok",
            value: stats.totalStock,
            icon: TrendingUp,
            color: "text-orange-500",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Ürün ara..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
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
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>E-Mağaza</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-20">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {offer.productImages?.[0] ? (
                          <img
                            src={offer.productImages[0]}
                            alt={offer.productName}
                            className="w-10 h-10 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {offer.productName}
                          </p>
                          {offer.productCategoryName && (
                            <p className="text-xs text-gray-400">
                              {offer.productCategoryName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="font-semibold text-sm">
                          {offer.price?.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          offer.stock > 10
                            ? "border-green-200 text-green-700"
                            : offer.stock > 0
                              ? "border-orange-200 text-orange-700"
                              : "border-red-200 text-red-700"
                        }
                      >
                        {offer.stock} adet
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={offer.publishToMarket}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({
                            id: offer.id,
                            publishToMarket: checked,
                            publishToStore: offer.publishToStore,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={offer.publishToStore}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({
                            id: offer.id,
                            publishToMarket: offer.publishToMarket,
                            publishToStore: checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="text-xs text-gray-600">
                          {offer.rating?.toFixed(1) || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditOffer(offer);
                            setEditForm({
                              price: offer.price?.toString(),
                              stock: offer.stock?.toString(),
                            });
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (
                              confirm(
                                "Bu teklifi kaldırmak istediğinizden emin misiniz?",
                              )
                            )
                              deleteMutation.mutate(offer.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ürün & Teklif Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Ürün Bilgileri
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Ürün Adı *</Label>
                  <Input
                    placeholder="Örn: iPhone 15 Pro Max"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Açıklama *</Label>
                  <Textarea
                    rows={2}
                    placeholder="Ürün açıklaması..."
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kategori *</Label>
                    <Select
                      value={productForm.categoryId}
                      onValueChange={(v) =>
                        setProductForm((f) => ({
                          ...f,
                          categoryId: v,
                          subcategoryId: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçin" />
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
                        value={productForm.subcategoryId}
                        onValueChange={(v) =>
                          setProductForm((f) => ({ ...f, subcategoryId: v }))
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
                    placeholder="teknoloji, telefon (virgülle)"
                    value={productForm.tags}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, tags: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Görseller</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Görsel URL..."
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && imageInput.trim()) {
                          setProductForm((f) => ({
                            ...f,
                            images: [...f.images, imageInput.trim()],
                          }));
                          setImageInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (imageInput.trim()) {
                          setProductForm((f) => ({
                            ...f,
                            images: [...f.images, imageInput.trim()],
                          }));
                          setImageInput("");
                        }
                      }}
                    >
                      Ekle
                    </Button>
                  </div>
                  {productForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {productForm.images.map((img, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                        >
                          <span className="truncate max-w-[100px]">
                            {img.split("/").pop()}
                          </span>
                          <button
                            className="text-gray-400 hover:text-red-500"
                            onClick={() =>
                              setProductForm((f) => ({
                                ...f,
                                images: f.images.filter((_, idx) => idx !== i),
                              }))
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Fiyat & Stok
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fiyat (₺) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={offerForm.price}
                      onChange={(e) =>
                        setOfferForm((f) => ({ ...f, price: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stok *</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={offerForm.stock}
                      onChange={(e) =>
                        setOfferForm((f) => ({ ...f, stock: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">E-Mağazamda Göster</p>
                    <p className="text-xs text-gray-400">
                      Kendi mağaza sayfanızda yayınlansın
                    </p>
                  </div>
                  <Switch
                    checked={offerForm.publishToStore}
                    onCheckedChange={(v) =>
                      setOfferForm((f) => ({ ...f, publishToStore: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Marketplace'e Yayınla</p>
                    <p className="text-xs text-gray-400">
                      Genel pazaryerinde görünsün (Pro+ gerekir)
                    </p>
                  </div>
                  <Switch
                    checked={offerForm.publishToMarket}
                    onCheckedChange={(v) =>
                      setOfferForm((f) => ({ ...f, publishToMarket: v }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !productForm.name ||
                !productForm.description ||
                !productForm.categoryId ||
                !offerForm.price ||
                !offerForm.stock
              }
            >
              {createMutation.isPending ? "Ekleniyor..." : "Ürünü Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Teklif Düzenle — {editOffer?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Fiyat (₺)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stok</Label>
              <Input
                type="number"
                min="0"
                value={editForm.stock}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, stock: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() =>
                editOffer &&
                updateOfferMutation.mutate({
                  id: editOffer.id,
                  data: {
                    price: parseFloat(editForm.price),
                    stock: parseInt(editForm.stock),
                  },
                })
              }
              disabled={updateOfferMutation.isPending}
            >
              {updateOfferMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
