"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Search,
  Store,
  User,
  Ban,
  CheckCircle,
  Building2,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

interface Merchant {
  id: string;
  storeName: string;
  slug: string;
  email: string;
  customDomain?: string;
  domainVerified: boolean;
  isSuspended: boolean;
  subscriptionPlan?: string;
  productCount?: number;
  totalSales?: number;
  createdAt: string;
}

interface CreateMerchantForm {
  storeName: string;
  email: string;
  password: string;
  phone?: string;
  slug?: string;
}

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null,
  );
  const [form, setForm] = useState<CreateMerchantForm>({
    storeName: "",
    email: "",
    password: "",
    phone: "",
    slug: "",
  });
  const [setupForm, setSetupForm] = useState({
    storeName: "",
    slug: "",
    description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchants", search],
    queryFn: async () => {
      const res = await api.get("/api/admin/merchants", { params: { search } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMerchantForm) =>
      api.post("/api/admin/merchants", data),
    onSuccess: () => {
      toast.success("Merchant başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setCreateOpen(false);
      setForm({ storeName: "", email: "", password: "", phone: "", slug: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Merchant oluşturulamadı");
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/merchants/${id}/suspend`),
    onSuccess: () => {
      toast.success("Merchant durumu güncellendi");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
    onError: () => toast.error("İşlem başarısız"),
  });

  const setupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.post(`/api/admin/merchants/${id}/setup`, data),
    onSuccess: () => {
      toast.success("Mağaza kurulumu tamamlandı");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setSetupOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Kurulum başarısız");
    },
  });

  const merchants: Merchant[] = data?.items || data || [];

  const filtered = merchants.filter(
    (m) =>
      !search ||
      m.storeName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: merchants.length,
    active: merchants.filter((m) => !m.isSuspended).length,
    suspended: merchants.filter((m) => m.isSuspended).length,
    withDomain: merchants.filter((m) => m.customDomain).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform üzerindeki tüm satıcıları yönetin
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Merchant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Merchant",
            value: stats.total,
            icon: Building2,
            color: "text-blue-600",
          },
          {
            label: "Aktif",
            value: stats.active,
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            label: "Askıda",
            value: stats.suspended,
            icon: Ban,
            color: "text-red-600",
          },
          {
            label: "Özel Domain",
            value: stats.withDomain,
            icon: TrendingUp,
            color: "text-purple-600",
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

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Merchant adı veya email ile ara..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Henüz merchant yok</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setCreateOpen(true)}
              >
                İlk Merchant'ı Ekle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Mağaza</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((merchant) => (
                  <TableRow key={merchant.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {merchant.storeName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {merchant.storeName}
                          </p>
                          <p className="text-xs text-gray-400">
                            /{merchant.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {merchant.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          merchant.subscriptionPlan === "Enterprise"
                            ? "border-purple-300 text-purple-700 bg-purple-50"
                            : merchant.subscriptionPlan === "Pro"
                              ? "border-blue-300 text-blue-700 bg-blue-50"
                              : "border-gray-300 text-gray-600"
                        }
                      >
                        {merchant.subscriptionPlan || "Basic"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {merchant.customDomain ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-700 text-xs truncate max-w-[120px]">
                            {merchant.customDomain}
                          </span>
                          {merchant.domainVerified ? (
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <span className="text-xs text-orange-500">!</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          {merchant.productCount ?? 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          merchant.isSuspended
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-green-100 text-green-700 border-green-200"
                        }
                        variant="outline"
                      >
                        {merchant.isSuspended ? "Askıda" : "Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {new Date(merchant.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMerchant(merchant);
                              setSetupForm({
                                storeName: merchant.storeName,
                                slug: merchant.slug,
                                description: "",
                              });
                              setSetupOpen(true);
                            }}
                          >
                            <Store className="w-4 h-4 mr-2" />
                            Mağaza Kur / Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={
                              merchant.isSuspended
                                ? "text-green-600"
                                : "text-red-600"
                            }
                            onClick={() => suspendMutation.mutate(merchant.id)}
                          >
                            {merchant.isSuspended ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aktifleştir
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 mr-2" />
                                Askıya Al
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Merchant Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Yeni Merchant Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Mağaza Adı *</Label>
              <Input
                id="storeName"
                placeholder="Örn: Tech Store"
                value={form.storeName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    storeName: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Mağaza URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  /store/
                </span>
                <Input
                  id="slug"
                  placeholder="tech-store"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="merchant@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre *</Label>
              <Input
                id="password"
                type="password"
                placeholder="En az 8 karakter"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+90 5xx xxx xx xx"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={
                createMutation.isPending ||
                !form.storeName ||
                !form.email ||
                !form.password
              }
            >
              {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Mağaza Kur — {selectedMerchant?.storeName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Mağaza Adı</Label>
              <Input
                value={setupForm.storeName}
                onChange={(e) =>
                  setSetupForm((f) => ({ ...f, storeName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  /store/
                </span>
                <Input
                  value={setupForm.slug}
                  onChange={(e) =>
                    setSetupForm((f) => ({ ...f, slug: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mağaza Açıklaması</Label>
              <Input
                placeholder="Kısa mağaza tanımı..."
                value={setupForm.description}
                onChange={(e) =>
                  setSetupForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() =>
                selectedMerchant &&
                setupMutation.mutate({
                  id: selectedMerchant.id,
                  data: setupForm,
                })
              }
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
