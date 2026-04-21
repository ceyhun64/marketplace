"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  FolderOpen,
  Folder,
  Tag,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  iconUrl?: string;
  sortOrder: number;
  subCategories?: Category[];
}

interface CategoryForm {
  name: string;
  slug: string;
  parentId: string;
  iconUrl: string;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    slug: "",
    parentId: "",
    iconUrl: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/api/categories");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: object) => api.post("/api/categories", d),
    onSuccess: () => {
      toast.success("Kategori oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setAddOpen(false);
      setForm({ name: "", slug: "", parentId: "", iconUrl: "" });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Oluşturulamadı"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.put(`/api/categories/${id}`, data),
    onSuccess: () => {
      toast.success("Kategori güncellendi");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditOpen(false);
    },
    onError: () => toast.error("Güncellenemedi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      toast.success("Kategori silindi");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Silinemedi"),
  });

  const categories: Category[] = data?.items || data || [];
  const rootCategories = categories.filter((c) => !c.parentId);

  const getCategoryWithSubs = (cat: Category): Category => ({
    ...cat,
    subCategories: categories.filter((c) => c.parentId === cat.id),
  });

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId || "",
      iconUrl: cat.iconUrl || "",
    });
    setEditOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ana ve alt kategorileri yönetin
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Kategori
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{rootCategories.length}</p>
              <p className="text-xs text-gray-500">Ana Kategori</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Folder className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {categories.filter((c) => c.parentId).length}
              </p>
              <p className="text-xs text-gray-500">Alt Kategori</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Tag className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-gray-500">Toplam</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tree */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : rootCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz kategori yok</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setAddOpen(true)}
            >
              İlk Kategoriyi Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rootCategories.map((cat) => {
            const withSubs = getCategoryWithSubs(cat);
            return (
              <Card key={cat.id}>
                <CardContent className="p-0">
                  {/* Root Category Row */}
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        {cat.iconUrl ? (
                          <img src={cat.iconUrl} alt="" className="w-5 h-5" />
                        ) : (
                          <FolderOpen className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cat.name}</p>
                        <p className="text-xs text-gray-400">/{cat.slug}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {withSubs.subCategories?.length ?? 0} alt
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (
                            confirm(
                              "Bu kategoriyi silmek istediğinizden emin misiniz?",
                            )
                          )
                            deleteMutation.mutate(cat.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Sub Categories */}
                  {(withSubs.subCategories?.length ?? 0) > 0 && (
                    <div className="divide-y divide-gray-50">
                      {withSubs.subCategories!.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                              <Folder className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">
                                {sub.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                /{sub.slug}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openEdit(sub)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Bu alt kategoriyi silmek istediğinizden emin misiniz?",
                                  )
                                )
                                  deleteMutation.mutate(sub.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Yeni Kategori</DialogTitle>
          </DialogHeader>
          <CategoryFormFields
            form={form}
            setForm={setForm}
            rootCategories={rootCategories}
            showParent
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name}
            >
              {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
          </DialogHeader>
          <CategoryFormFields
            form={form}
            setForm={setForm}
            rootCategories={rootCategories.filter(
              (c) => c.id !== editTarget?.id,
            )}
            showParent
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() =>
                editTarget &&
                updateMutation.mutate({ id: editTarget.id, data: form })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryFormFields({
  form,
  setForm,
  rootCategories,
  showParent,
}: {
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  rootCategories: Category[];
  showParent: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Kategori Adı *</Label>
        <Input
          placeholder="Örn: Elektronik"
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              name: e.target.value,
              slug: e.target.value
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "")
                .replace(/ğ/g, "g")
                .replace(/ü/g, "u")
                .replace(/ş/g, "s")
                .replace(/ı/g, "i")
                .replace(/ö/g, "o")
                .replace(/ç/g, "c"),
            }))
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>URL Slug</Label>
        <Input
          placeholder="elektronik"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
      </div>
      {showParent && (
        <div className="space-y-1.5">
          <Label>Üst Kategori (Opsiyonel)</Label>
          <Select
            value={form.parentId || "none"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, parentId: v === "none" ? "" : v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Ana kategori (boş bırakın)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Ana Kategori —</SelectItem>
              {rootCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>İkon URL (Opsiyonel)</Label>
        <Input
          placeholder="https://..."
          value={form.iconUrl}
          onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
        />
      </div>
    </div>
  );
}
