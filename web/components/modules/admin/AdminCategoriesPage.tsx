"use client";

import { useState, useMemo } from "react";
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
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  Package,
  AlertTriangle,
  Loader2,
  Tag,
} from "lucide-react";

// -- Types ---------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
  productCount: number;
  subCategories: Category[];
}

interface CategoryForm {
  name: string;
  slug: string;
  parentId: string;
  iconUrl: string;
  sortOrder: string;
}

// -- Helpers -------------------------------------------------------------------

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  parentId: "",
  iconUrl: "",
  sortOrder: "0",
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildPayload(form: CategoryForm) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    parentId: form.parentId || null,
    iconUrl: form.iconUrl.trim() || null,
    sortOrder: parseInt(form.sortOrder, 10) || 0,
  };
}

function getApiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
}

function isUrl(val: string): boolean {
  return val.startsWith("http://") || val.startsWith("https://");
}

// -- Main Page -----------------------------------------------------------------

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/api/categories");
      return Array.isArray(data) ? data : [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post("/api/categories", payload),
    onSuccess: () => {
      toast.success("Category created");
      invalidate();
      setDialogMode(null);
    },
    onError: (err) => toast.error(getApiError(err, "Failed to create category")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      api.put(`/api/categories/${id}`, payload),
    onSuccess: () => {
      toast.success("Category updated");
      invalidate();
      setDialogMode(null);
      setEditTarget(null);
    },
    onError: (err) => toast.error(getApiError(err, "Failed to update category")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getApiError(err, "Failed to delete category")),
  });

  const rootCategories = data ?? [];
  const subCount = rootCategories.reduce((acc, c) => acc + c.subCategories.length, 0);
  const totalProducts = rootCategories.reduce(
    (acc, c) =>
      acc +
      c.productCount +
      c.subCategories.reduce((a, sc) => a + sc.productCount, 0),
    0,
  );

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () =>
    setExpanded(new Set(rootCategories.filter((c) => c.subCategories.length > 0).map((c) => c.id)));

  const collapseAll = () => setExpanded(new Set());

  const openAdd = (preParentId = "") => {
    setEditTarget(null);
    setDefaultParentId(preParentId);
    setDialogMode("add");
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setDefaultParentId(cat.parentId ?? "");
    setDialogMode("edit");
  };

  const handleFormSubmit = (form: CategoryForm) => {
    const payload = buildPayload(form);
    if (dialogMode === "edit" && editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Categories</h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Manage root categories and subcategories
          </p>
        </div>
        <Button
          onClick={() => openAdd()}
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
            colorText: "text-blue-600",
            colorBg: "bg-blue-50",
          },
          {
            label: "Subcategories",
            value: subCount,
            icon: Folder,
            colorText: "text-emerald-600",
            colorBg: "bg-emerald-50",
          },
          {
            label: "Products in Categories",
            value: totalProducts,
            icon: Tag,
            colorText: "text-violet-600",
            colorBg: "bg-violet-50",
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
              <div className={`p-1.5 rounded-lg ${s.colorBg}`}>
                <s.icon className={`w-4 h-4 ${s.colorText}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-(--text-primary)">
              {isLoading ? <span className="text-(--text-tertiary)">—</span> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tree */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-(--charcoal-mist)" />
        </div>
      ) : rootCategories.length === 0 ? (
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) flex flex-col items-center justify-center py-24 gap-3">
          <FolderOpen className="w-10 h-10 text-(--charcoal-mist) opacity-25" />
          <p className="text-sm font-medium text-(--text-tertiary)">No categories yet</p>
          <Button variant="outline" size="sm" onClick={() => openAdd()}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add First Category
          </Button>
        </div>
      ) : (
        <>
          {/* Expand controls */}
          {rootCategories.some((c) => c.subCategories.length > 0) && (
            <div className="flex items-center gap-2 -mt-4">
              <button
                className="text-xs text-(--text-tertiary) hover:text-(--text-secondary) underline-offset-2 hover:underline"
                onClick={expandAll}
              >
                Expand all
              </button>
              <span className="text-(--text-tertiary) text-xs">·</span>
              <button
                className="text-xs text-(--text-tertiary) hover:text-(--text-secondary) underline-offset-2 hover:underline"
                onClick={collapseAll}
              >
                Collapse all
              </button>
            </div>
          )}

          <div className="space-y-2">
            {rootCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                isExpanded={expanded.has(cat.id)}
                onToggle={() => toggleExpanded(cat.id)}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onAddSub={(id) => {
                  openAdd(id);
                  setExpanded((prev) => new Set([...prev, id]));
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Form Dialog */}
      {dialogMode !== null && (
        <CategoryDialog
          mode={dialogMode}
          editTarget={editTarget}
          defaultParentId={defaultParentId}
          rootCategories={rootCategories}
          isSaving={isSaving}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setDialogMode(null);
            setEditTarget(null);
          }}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// -- Category Card (root row + expandable subs) ---------------------------------

function CategoryCard({
  cat,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddSub,
}: {
  cat: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddSub: (parentId: string) => void;
}) {
  const hasSubs = cat.subCategories.length > 0;

  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
      {/* Root row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-(--bg-sunken) transition-colors cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Expand chevron */}
        <div className="w-4 shrink-0 text-(--charcoal-mist)">
          {hasSubs ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Icon */}
        <CategoryIcon icon={cat.iconUrl} size="md" isRoot />

        {/* Name + slug */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-(--text-primary) leading-tight">
            {cat.name}
          </p>
          <p className="text-xs text-(--text-tertiary) font-mono mt-0.5">/{cat.slug}</p>
        </div>

        {/* Badges */}
        <div
          className="flex items-center gap-1.5 mr-1"
          onClick={(e) => e.stopPropagation()}
        >
          {hasSubs && (
            <Badge variant="secondary" className="text-xs gap-1 pointer-events-none">
              <Folder className="w-3 h-3" />
              {cat.subCategories.length}
            </Badge>
          )}
          {cat.productCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1 text-(--text-tertiary) pointer-events-none">
              <Package className="w-3 h-3" />
              {cat.productCount}
            </Badge>
          )}
          <span className="text-xs text-(--text-tertiary) font-mono w-6 text-right">
            #{cat.sortOrder}
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-(--text-tertiary) hover:text-(--text-primary)"
            onClick={() => onAddSub(cat.id)}
          >
            <Plus className="w-3 h-3" />
            Add Sub
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-(--text-tertiary) hover:text-(--text-primary)"
            onClick={() => onEdit(cat)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(cat)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Subcategory rows */}
      {isExpanded && hasSubs && (
        <div className="border-t border-(--border-light) divide-y divide-(--border-subtle)">
          {cat.subCategories.map((sub) => (
            <SubCategoryRow key={sub.id} sub={sub} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// -- Subcategory Row ------------------------------------------------------------

function SubCategoryRow({
  sub,
  onEdit,
  onDelete,
}: {
  sub: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  return (
    <div className="flex items-center gap-3 pl-14 pr-4 py-3 hover:bg-(--bg-sunken) transition-colors">
      <CategoryIcon icon={sub.iconUrl} size="sm" isRoot={false} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-(--text-secondary) leading-tight">{sub.name}</p>
        <p className="text-xs text-(--text-tertiary) font-mono mt-0.5">/{sub.slug}</p>
      </div>

      <div className="flex items-center gap-1.5 mr-1">
        {sub.productCount > 0 && (
          <Badge variant="outline" className="text-xs gap-1 text-(--text-tertiary)">
            <Package className="w-3 h-3" />
            {sub.productCount}
          </Badge>
        )}
        <span className="text-xs text-(--text-tertiary) font-mono w-6 text-right">
          #{sub.sortOrder}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-(--text-tertiary) hover:text-(--text-primary)"
          onClick={() => onEdit(sub)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(sub)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// -- Category Icon -------------------------------------------------------------

function CategoryIcon({
  icon,
  size,
  isRoot,
}: {
  icon?: string | null;
  size: "sm" | "md";
  isRoot: boolean;
}) {
  const dim = size === "md" ? "w-8 h-8" : "w-6 h-6";
  const iconDim = size === "md" ? "w-4 h-4" : "w-3 h-3";
  const bg = isRoot ? "bg-blue-50" : "bg-emerald-50";
  const FolderIcon = isRoot ? FolderOpen : Folder;
  const iconColor = isRoot ? "text-blue-500" : "text-emerald-500";

  return (
    <div
      className={`${dim} ${bg} rounded-${size === "md" ? "lg" : "md"} flex items-center justify-center shrink-0 overflow-hidden`}
    >
      {icon ? (
        isUrl(icon) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon}
            alt=""
            className="w-full h-full object-contain p-0.5"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className={size === "md" ? "text-base" : "text-sm"}>{icon}</span>
        )
      ) : (
        <FolderIcon className={`${iconDim} ${iconColor}`} />
      )}
    </div>
  );
}

// -- Category Form Dialog -------------------------------------------------------

function CategoryDialog({
  mode,
  editTarget,
  defaultParentId,
  rootCategories,
  isSaving,
  onSubmit,
  onClose,
}: {
  mode: "add" | "edit";
  editTarget: Category | null;
  defaultParentId: string;
  rootCategories: Category[];
  isSaving: boolean;
  onSubmit: (form: CategoryForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CategoryForm>(() =>
    mode === "edit" && editTarget
      ? {
          name: editTarget.name,
          slug: editTarget.slug,
          parentId: editTarget.parentId ?? "",
          iconUrl: editTarget.iconUrl ?? "",
          sortOrder: String(editTarget.sortOrder),
        }
      : { ...EMPTY_FORM, parentId: defaultParentId },
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.slug.trim()) errs.slug = "Slug is required";
    else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(form.slug))
      errs.slug = "Only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      ...(slugManuallyEdited ? {} : { slug: toSlug(name) }),
    }));
    if (errors.name) setErrors((e) => ({ ...e, name: "" }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setForm((f) => ({ ...f, slug: cleaned }));
    if (errors.slug) setErrors((e) => ({ ...e, slug: "" }));
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
  };

  // Prevent selecting self or descendants as parent
  const availableParents = useMemo(
    () => rootCategories.filter((c) => c.id !== editTarget?.id),
    [rootCategories, editTarget],
  );

  const selectedParent = availableParents.find((c) => c.id === form.parentId);

  // If the category being edited has subs, it can't be moved to a sub position
  const hasSubcategories = editTarget
    ? (editTarget.subCategories?.length ?? 0) > 0
    : false;

  const title =
    mode === "edit"
      ? `Edit: ${editTarget?.name}`
      : form.parentId
        ? `New subcategory under "${selectedParent?.name ?? "…"}"`
        : "New Root Category";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>
              Name <span className="text-(--danger)">*</span>
            </Label>
            <Input
              placeholder="e.g. Electronics"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={errors.name ? "border-red-400 focus-visible:ring-red-300" : ""}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label>URL Slug</Label>
            <Input
              placeholder="electronics"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={`font-mono text-sm ${errors.slug ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            />
            {errors.slug ? (
              <p className="text-xs text-red-500">{errors.slug}</p>
            ) : form.slug ? (
              <p className="text-xs text-(--text-tertiary)">
                URL:{" "}
                <code className="bg-(--bg-sunken) px-1.5 py-0.5 rounded text-[11px]">
                  /categories/{form.slug}
                </code>
              </p>
            ) : null}
          </div>

          {/* Parent */}
          <div className="space-y-1.5">
            <Label>Parent Category</Label>
            {hasSubcategories ? (
              <div className="flex items-center gap-2 rounded-lg border border-(--border-light) bg-(--bg-sunken) px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-(--text-tertiary)">
                  Cannot change parent — this category has{" "}
                  <strong>{editTarget?.subCategories.length} subcategories</strong>. Remove them
                  first.
                </p>
              </div>
            ) : (
              <Select
                value={form.parentId || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, parentId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Root Category (no parent) —</SelectItem>
                  {availableParents.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sort order + icon */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
              />
              <p className="text-xs text-(--text-tertiary)">Lower = appears first</p>
            </div>

            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex items-center gap-2">
                {form.iconUrl && (
                  <div className="w-8 h-8 shrink-0 rounded-lg border border-(--border-light) bg-(--bg-sunken) flex items-center justify-center overflow-hidden">
                    {isUrl(form.iconUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.iconUrl}
                        alt=""
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-base leading-none">{form.iconUrl}</span>
                    )}
                  </div>
                )}
                <Input
                  placeholder="Emoji or URL"
                  value={form.iconUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, iconUrl: e.target.value }))
                  }
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-(--text-tertiary)">Paste an emoji or image URL</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim() || !form.slug.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : mode === "edit" ? (
              "Save Changes"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Delete Dialog -------------------------------------------------------------

function DeleteDialog({
  target,
  isPending,
  onConfirm,
  onClose,
}: {
  target: Category;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const hasSubs = target.subCategories.length > 0;
  const hasProducts = target.productCount > 0;
  const isBlocked = hasSubs || hasProducts;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Category
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-(--text-secondary)">
            You are about to delete{" "}
            <span className="font-semibold text-(--text-primary)">
              &ldquo;{target.name}&rdquo;
            </span>
            .
          </p>

          {hasSubs && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                This category has{" "}
                <strong>{target.subCategories.length} subcategories</strong>. You
                must delete or reassign them before deleting this category.
              </p>
            </div>
          )}

          {hasProducts && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                This category has{" "}
                <strong>{target.productCount} products</strong> assigned to it.
                Move them to another category first.
              </p>
            </div>
          )}

          {!isBlocked && (
            <p className="text-xs text-(--text-tertiary)">
              This action is permanent and cannot be undone.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending || isBlocked}
            title={isBlocked ? "Resolve the warnings above before deleting" : undefined}
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
