"use client";

import { useState } from "react";
import {
  useMerchantOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  usePublishToggle,
} from "@/queries/useMerchant";
import { useProducts } from "@/queries/useProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OfferFormData {
  productId: string;
  price: string;
  stock: string;
  publishToMarket: boolean;
  publishToStore: boolean;
}

const EMPTY_FORM: OfferFormData = {
  productId: "",
  price: "",
  stock: "",
  publishToMarket: false,
  publishToStore: true,
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={`rounded-lg p-2 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OfferFormDialog({
  open,
  onOpenChange,
  initialData,
  offerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: OfferFormData & { id?: string };
  offerId?: string;
}) {
  const isEdit = !!offerId;
  const [form, setForm] = useState<OfferFormData>(initialData ?? EMPTY_FORM);

  const { data: products, isLoading: productsLoading } = useProducts();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();

  const set = (key: keyof OfferFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!isEdit && !form.productId) {
      toast.error("Lütfen bir ürün seçin.");
      return;
    }
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (isNaN(price) || price <= 0) {
      toast.error("Geçerli bir fiyat girin.");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error("Geçerli bir stok miktarı girin.");
      return;
    }

    try {
      if (isEdit && offerId) {
        await updateOffer.mutateAsync({
          id: offerId,
          price,
          stock,
          publishToMarket: form.publishToMarket,
          publishToStore: form.publishToStore,
        });
        toast.success("Teklif güncellendi.");
      } else {
        await createOffer.mutateAsync({
          productId: form.productId,
          price,
          stock,
          publishToMarket: form.publishToMarket,
          publishToStore: form.publishToStore,
        });
        toast.success("Teklif oluşturuldu.");
      }
      onOpenChange(false);
    } catch {
      toast.error("İşlem başarısız. Lütfen tekrar deneyin.");
    }
  };

  const isPending = createOffer.isPending || updateOffer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Teklifi Düzenle" : "Yeni Teklif Ekle"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Ürün</Label>
              {productsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={form.productId} onValueChange={(v) => set("productId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.items?.map((p: { id: string; name: string }) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fiyat (₺)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stok</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Yayın Ayarları</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Marketplace'de Yayınla</p>
                <p className="text-xs text-muted-foreground">
                  Tüm alıcılar görebilir, Buy Box'a girer
                </p>
              </div>
              <Switch
                checked={form.publishToMarket}
                onCheckedChange={(v) => set("publishToMarket", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">E-Mağazada Yayınla</p>
                <p className="text-xs text-muted-foreground">
                  Sadece kendi mağazanızda görünür
                </p>
              </div>
              <Switch
                checked={form.publishToStore}
                onCheckedChange={(v) => set("publishToStore", v)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Teklif Ekle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MerchantOffersPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "market" | "store" | "inactive">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<{ open: boolean; offer?: any }>({ open: false });

  const { data, isLoading } = useMerchantOffers();
  const deleteOffer = useDeleteOffer();
  const publishToggle = usePublishToggle();

  const offers: any[] = data ?? [];

  // Stats
  const totalOffers = offers.length;
  const marketplaceOffers = offers.filter((o) => o.publishToMarket).length;
  const storeOffers = offers.filter((o) => o.publishToStore).length;
  const lowStockOffers = offers.filter((o) => o.stock < 5 && o.stock >= 0).length;

  // Filtered
  const filtered = offers
    .filter((o) => {
      if (search) {
        const q = search.toLowerCase();
        if (!o.productName?.toLowerCase().includes(q)) return false;
      }
      if (filterStatus === "market") return o.publishToMarket;
      if (filterStatus === "store") return o.publishToStore && !o.publishToMarket;
      if (filterStatus === "inactive") return !o.publishToMarket && !o.publishToStore;
      return true;
    });

  const handleToggleMarket = async (offer: any) => {
    try {
      await publishToggle.mutateAsync({
        id: offer.id,
        publishToMarket: !offer.publishToMarket,
        publishToStore: offer.publishToStore,
      });
      toast.success(
        offer.publishToMarket
          ? "Marketplace'den kaldırıldı."
          : "Marketplace'de yayınlandı."
      );
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  const handleToggleStore = async (offer: any) => {
    try {
      await publishToggle.mutateAsync({
        id: offer.id,
        publishToMarket: offer.publishToMarket,
        publishToStore: !offer.publishToStore,
      });
      toast.success(
        offer.publishToStore
          ? "E-mağazadan kaldırıldı."
          : "E-mağazada yayınlandı."
      );
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" teklifini silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteOffer.mutateAsync(id);
      toast.success("Teklif silindi.");
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tekliflerim</h1>
          <p className="text-sm text-muted-foreground">
            Marketplace ve e-mağaza fiyat & stok yönetimi
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Teklif
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Teklif"
          value={totalOffers}
          sub="aktif kayıt"
          icon={Package}
          color="bg-slate-600"
        />
        <StatsCard
          title="Marketplace"
          value={marketplaceOffers}
          sub="yayında"
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <StatsCard
          title="E-Mağaza"
          value={storeOffers}
          sub="yayında"
          icon={Store}
          color="bg-emerald-600"
        />
        <StatsCard
          title="Düşük Stok"
          value={lowStockOffers}
          sub="5 adetten az"
          icon={ShoppingBag}
          color="bg-amber-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ürün adı ile ara..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="market">Marketplace'de</SelectItem>
                <SelectItem value="store">Sadece E-Mağaza</SelectItem>
                <SelectItem value="inactive">Yayında Değil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Fiyat</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-center">Marketplace</TableHead>
                <TableHead className="text-center">E-Mağaza</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {search || filterStatus !== "all"
                      ? "Filtreyle eşleşen teklif bulunamadı."
                      : "Henüz teklif eklenmemiş. Yeni Teklif butonuna tıklayın."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {offer.productImage && (
                          <img
                            src={offer.productImage}
                            alt={offer.productName}
                            className="h-9 w-9 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{offer.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {offer.categoryName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₺{Number(offer.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          offer.stock === 0
                            ? "font-semibold text-red-600"
                            : offer.stock < 5
                            ? "font-semibold text-amber-600"
                            : "text-foreground"
                        }
                      >
                        {offer.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={offer.publishToMarket}
                        onCheckedChange={() => handleToggleMarket(offer)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={offer.publishToStore}
                        onCheckedChange={() => handleToggleStore(offer)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditOffer({
                                open: true,
                                offer: {
                                  id: offer.id,
                                  productId: offer.productId,
                                  price: String(offer.price),
                                  stock: String(offer.stock),
                                  publishToMarket: offer.publishToMarket,
                                  publishToStore: offer.publishToStore,
                                },
                              })
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(offer.id, offer.productName)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OfferFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editOffer.offer && (
        <OfferFormDialog
          open={editOffer.open}
          onOpenChange={(v) => setEditOffer({ open: v })}
          initialData={editOffer.offer}
          offerId={editOffer.offer.id}
        />
      )}
    </div>
  );
}
