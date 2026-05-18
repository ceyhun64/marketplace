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
  AlertTriangle,
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
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
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setAddOpen(false);
      setForm({ name: "", slug: "", parentId: "", iconUrl: "" });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.put(`/api/categories/${id}`, data),
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditOpen(false);
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete"),
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

  const openDelete = (cat: Category) => {
    setDeleteTarget(cat);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Categories</h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Manage root and sub-categories
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
        >
          <Plus className="w-4 h-4" />
          New Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Root Categories",
            value: rootCategories.length,
            icon: FolderOpen,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Subcategories",
            value: categories.filter((c) => c.parentId).length,
            icon: Folder,
            color: "text-(--success)",
            bg: "bg-(--success-bg)",
          },
          {
            label: "Total",
            value: categories.length,
            icon: Tag,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-(--text-primary)">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category Tree */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--charcoal)" />
        </div>
      ) : rootCategories.length === 0 ? (
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) flex flex-col items-center justify-center py-16 text-(--text-tertiary)">
          <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No categories yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setAddOpen(true)}
          >
            Add First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rootCategories.map((cat) => {
            const withSubs = getCategoryWithSubs(cat);
            return (
              <div
                key={cat.id}
                className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden"
              >
                {/* Root Category Row */}
                <div className="flex items-center justify-between p-4 hover:bg-(--bg-sunken) border-b border-(--border-light)">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-(--info-bg) rounded-lg flex items-center justify-center">
                      {cat.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.iconUrl} alt="" className="w-5 h-5" />
                      ) : (
                        <FolderOpen className="w-4 h-4 text-(--info)" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-(--text-primary)">
                        {cat.name}
                      </p>
                      <p className="text-xs text-(--text-tertiary)">/{cat.slug}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {withSubs.subCategories?.length ?? 0} sub
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
                      className="h-8 w-8 p-0 text-(--danger) hover:text-(--danger) hover:bg-(--danger-bg)"
                      onClick={() => openDelete(cat)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sub Categories */}
                {(withSubs.subCategories?.length ?? 0) > 0 && (
                  <div className="divide-y divide-(--border-subtle)">
                    {withSubs.subCategories!.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-(--bg-sunken)"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-3 h-3 text-(--charcoal-mist)" />
                          <div className="w-6 h-6 bg-(--success-bg) rounded flex items-center justify-center">
                            <Folder className="w-3 h-3 text-(--success)" />
                          </div>
                          <div>
                            <p className="text-sm text-(--text-secondary)">{sub.name}</p>
                            <p className="text-xs text-(--text-tertiary)">/{sub.slug}</p>
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
                            className="h-7 w-7 p-0 text-(--danger) hover:text-(--danger) hover:bg-(--danger-bg)"
                            onClick={() => openDelete(sub)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <CategoryFormFields
            form={form}
            setForm={setForm}
            rootCategories={rootCategories}
            showParent
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
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
              Cancel
            </Button>
            <Button
              onClick={() =>
                editTarget &&
                updateMutation.mutate({ id: editTarget.id, data: form })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-(--danger)" />
              Delete Category
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-(--text-secondary)">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-(--text-primary)">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
        <Label>Category Name *</Label>
        <Input
          placeholder="e.g. Electronics"
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              name: e.target.value,
              slug: e.target.value
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
            }))
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>URL Slug</Label>
        <Input
          placeholder="electronics"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
      </div>
      {showParent && (
        <div className="space-y-1.5">
          <Label>Parent Category (Optional)</Label>
          <Select
            value={form.parentId || "none"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, parentId: v === "none" ? "" : v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Root category (leave empty)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Root Category —</SelectItem>
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
        <Label>Icon URL (Optional)</Label>
        <Input
          placeholder="https://..."
          value={form.iconUrl}
          onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
        />
      </div>
    </div>
  );
}
