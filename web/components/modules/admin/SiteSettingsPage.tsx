"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Megaphone,
  Layout,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  ExternalLink,
  Loader2,
  X,
  ImageIcon,
  Info,
  Eye,
  ToggleRight,
  ToggleLeft,
  GripVertical,
  Type,
  MousePointerClick,
  Paintbrush,
  Tag as TagIcon,
} from "lucide-react";
import {
  useAdminAnnouncements,
  useAdminHeroSettings,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useToggleAnnouncement,
  useUpdateHeroSettings,
  type AnnouncementItem,
  type UpsertAnnouncementPayload,
  type UpdateHeroPayload,
} from "@/queries/useSiteSettings";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED DESIGN-SYSTEM PRIMITIVES
// These mirror the patterns used by AdminCommissionPage and AdminAuditLogsPage.
// ═══════════════════════════════════════════════════════════════════════════════

function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-(--border-light) bg-(--bg-sunken)/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-(--off-white-2) shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-(--text-primary) truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-(--text-tertiary) truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
        {label}
      </Label>
      {hint && (
        <p className="text-xs text-(--text-tertiary) leading-snug -mt-0.5">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-(--border-light) bg-(--bg-sunken)/50">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="px-6 divide-y divide-(--border-subtle)">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="py-4 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SiteSettingsPage() {
  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Site Settings
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Manage the announcement bar and hero section that all visitors see.
          </p>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-(--border-mid) bg-(--bg-sunken)/60">
        <Info className="w-4 h-4 text-(--text-tertiary) mt-0.5 shrink-0" />
        <p className="text-xs text-(--text-secondary) leading-relaxed">
          Changes are live immediately after saving. The frontend caches content
          for 5 minutes — visitors on the site will see updates within that
          window.
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="announcements">
        <TabsList className="border border-(--border-light) bg-(--bg-sunken)/50 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="announcements"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg data-[state=active]:bg-(--bg-surface) data-[state=active]:shadow-sm data-[state=active]:text-(--text-primary) text-(--text-tertiary)"
          >
            <Megaphone className="w-3.5 h-3.5" />
            Announcement Bar
          </TabsTrigger>
          <TabsTrigger
            value="hero"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg data-[state=active]:bg-(--bg-surface) data-[state=active]:shadow-sm data-[state=active]:text-(--text-primary) text-(--text-tertiary)"
          >
            <Layout className="w-3.5 h-3.5" />
            Hero Section
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-6">
          <AnnouncementsTab />
        </TabsContent>

        <TabsContent value="hero" className="mt-6">
          <HeroTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ANNOUNCEMENT BAR
// ═══════════════════════════════════════════════════════════════════════════════

const EMPTY_ANN: UpsertAnnouncementPayload = {
  text: "",
  ctaText: "",
  ctaUrl: "",
  backgroundColor: "#1e1e1e",
  textColor: "rgba(255,255,255,0.85)",
  isActive: true,
  sortOrder: 0,
};

function AnnouncementsTab() {
  const { data: items = [], isLoading, refetch } = useAdminAnnouncements();
  const toggleMutation = useToggleAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(
    null,
  );
  const [previewIdx, setPreviewIdx] = useState(0);

  const activeItems = items.filter((i) => i.isActive);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: AnnouncementItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <>
      {/* ── Summary stat ── */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: items.length },
            { label: "Active", value: activeItems.length, accent: true },
            { label: "Inactive", value: items.length - activeItems.length },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-(--bg-surface) rounded-xl border border-(--border-light) px-5 py-4"
            >
              <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider mb-1.5">
                {s.label}
              </p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  s.accent ? "text-(--success)" : "text-(--text-primary)"
                }`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Main table card ── */}
      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (
        <SectionCard
          icon={<Megaphone className="w-4 h-4 text-(--text-secondary)" />}
          title="Announcement Items"
          subtitle="Rotates every 5 seconds. Only active items are shown to visitors."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2 border-(--border-mid) text-(--text-secondary) h-8 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={openAdd}
                className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white h-8 text-xs"
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>
          }
        >
          {/* Column headers */}
          <div
            className="grid text-xs font-semibold uppercase tracking-wider text-(--text-tertiary) py-2.5 border-b border-(--border-subtle)"
            style={{ gridTemplateColumns: "1.5rem 1fr 6rem 4rem 5rem 4rem" }}
          >
            <span />
            <span>Content</span>
            <span>CTA</span>
            <span className="text-center">Order</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Megaphone className="w-8 h-8 text-(--border-mid)" />
              <div className="text-center">
                <p className="text-sm font-medium text-(--text-secondary)">
                  No announcements yet
                </p>
                <p className="text-xs text-(--text-tertiary) mt-0.5">
                  Click "Add" to create the first one.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-(--border-subtle)">
              {items.map((item) => (
                <AnnouncementRow
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onToggle={() =>
                    toggleMutation.mutate(item.id, {
                      onSuccess: () =>
                        toast.success(
                          item.isActive ? "Deactivated." : "Activated.",
                        ),
                      onError: () => toast.error("Failed to update status."),
                    })
                  }
                  onDelete={() => setDeleteTarget(item)}
                  isToggling={
                    toggleMutation.isPending &&
                    toggleMutation.variables === item.id
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Live preview ── */}
      {activeItems.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-3.5 h-3.5 text-(--text-tertiary)" />
            <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">
              Live Preview
            </p>
          </div>
          <div className="rounded-xl overflow-hidden border border-(--border-light)">
            <div
              className="flex items-center justify-center gap-3 py-2.5 px-4 text-xs"
              style={{
                background:
                  activeItems[previewIdx % activeItems.length]?.backgroundColor,
                color: activeItems[previewIdx % activeItems.length]?.textColor,
              }}
            >
              {activeItems.length > 1 && (
                <button
                  onClick={() =>
                    setPreviewIdx(
                      (p) => (p - 1 + activeItems.length) % activeItems.length,
                    )
                  }
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  ←
                </button>
              )}
              <span>
                {activeItems[previewIdx % activeItems.length]?.text}
                {activeItems[previewIdx % activeItems.length]?.ctaText && (
                  <span className="font-bold underline ml-1">
                    {activeItems[previewIdx % activeItems.length].ctaText}
                  </span>
                )}
              </span>
              {activeItems.length > 1 && (
                <button
                  onClick={() =>
                    setPreviewIdx((p) => (p + 1) % activeItems.length)
                  }
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit dialog ── */}
      <AnnouncementDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />

      {/* ── Delete confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the item from rotation. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate(deleteTarget!.id, {
                  onSuccess: () => {
                    toast.success("Announcement deleted.");
                    setDeleteTarget(null);
                  },
                  onError: () => toast.error("Failed to delete."),
                })
              }
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Single announcement row ───────────────────────────────────────────────────

function AnnouncementRow({
  item,
  onEdit,
  onToggle,
  onDelete,
  isToggling,
}: {
  item: AnnouncementItem;
  onEdit: (i: AnnouncementItem) => void;
  onToggle: () => void;
  onDelete: (i: AnnouncementItem) => void;
  isToggling: boolean;
}) {
  return (
    <div
      className="grid items-center py-3.5 text-sm hover:bg-(--bg-sunken)/40 transition-colors duration-100 rounded-lg"
      style={{ gridTemplateColumns: "1.5rem 1fr 6rem 4rem 5rem 4rem" }}
    >
      <GripVertical className="w-3.5 h-3.5 text-(--border-mid)" />

      {/* Content */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 border border-(--border-light)"
          style={{ background: item.backgroundColor }}
        />
        <span className="truncate text-sm text-(--text-primary)">
          {item.text}
        </span>
      </div>

      {/* CTA */}
      <div className="truncate">
        {item.ctaText ? (
          <a
            href={item.ctaUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-(--info) hover:underline"
          >
            {item.ctaText}
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
          </a>
        ) : (
          <span className="text-xs text-(--text-tertiary)">—</span>
        )}
      </div>

      {/* Sort */}
      <span className="text-center text-xs tabular-nums text-(--text-tertiary)">
        {item.sortOrder}
      </span>

      {/* Toggle */}
      <div className="flex justify-center">
        {isToggling ? (
          <Loader2 className="w-4 h-4 animate-spin text-(--text-tertiary)" />
        ) : (
          <button
            onClick={onToggle}
            className="transition-opacity duration-150 hover:opacity-80"
          >
            {item.isActive ? (
              <ToggleRight className="w-5 h-5 text-(--success)" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-(--text-tertiary)" />
            )}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg hover:bg-(--off-white-3) transition-colors text-(--text-tertiary)"
          aria-label="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-(--text-tertiary)"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Add / Edit dialog ─────────────────────────────────────────────────────────

function AnnouncementDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: AnnouncementItem | null;
}) {
  const [form, setForm] = useState<UpsertAnnouncementPayload>(EMPTY_ANN);
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isEdit = !!editing;

  // Pre-fill on open
  useEffect(() => {
    setForm(
      editing
        ? {
            text: editing.text,
            ctaText: editing.ctaText ?? "",
            ctaUrl: editing.ctaUrl ?? "",
            backgroundColor: editing.backgroundColor,
            textColor: editing.textColor,
            isActive: editing.isActive,
            sortOrder: editing.sortOrder,
          }
        : EMPTY_ANN,
    );
  }, [editing, open]);

  const set = (
    key: keyof UpsertAnnouncementPayload,
    value: string | boolean | number,
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.text.trim()) {
      toast.error("Text is required.");
      return;
    }
    const payload = {
      ...form,
      ctaText: form.ctaText?.trim() || undefined,
      ctaUrl: form.ctaUrl?.trim() || undefined,
    };
    const opts = {
      onSuccess: () => {
        toast.success(
          isEdit ? "Announcement updated." : "Announcement created.",
        );
        onClose();
      },
      onError: () =>
        toast.error(isEdit ? "Failed to update." : "Failed to create."),
    };
    if (isEdit && editing)
      updateMutation.mutate({ id: editing.id, ...payload }, opts);
    else createMutation.mutate(payload, opts);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-(--text-primary)">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Text */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
              Announcement Text *
            </Label>
            <Textarea
              value={form.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder="Free shipping on orders over $500 — "
              maxLength={200}
              rows={2}
              className="resize-none text-sm border-(--border-mid) bg-(--bg-surface) focus:border-(--charcoal)"
            />
            <p className="text-xs text-(--text-tertiary) text-right">
              {form.text.length}/200
            </p>
          </div>

          {/* CTA row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                CTA Label
              </Label>
              <Input
                value={form.ctaText ?? ""}
                onChange={(e) => set("ctaText", e.target.value)}
                placeholder="Shop now"
                className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                CTA URL
              </Label>
              <Input
                value={form.ctaUrl ?? ""}
                onChange={(e) => set("ctaUrl", e.target.value)}
                placeholder="/products"
                className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
              />
            </div>
          </div>

          {/* Colors row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                Background
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.backgroundColor}
                  onChange={(e) => set("backgroundColor", e.target.value)}
                  className="w-9 h-9 rounded-lg border border-(--border-light) cursor-pointer p-0.5 bg-(--bg-surface)"
                />
                <Input
                  value={form.backgroundColor}
                  onChange={(e) => set("backgroundColor", e.target.value)}
                  className="font-mono text-xs h-9 border-(--border-mid) bg-(--bg-surface)"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                Text Color
              </Label>
              <Input
                value={form.textColor}
                onChange={(e) => set("textColor", e.target.value)}
                className="font-mono text-xs h-9 border-(--border-mid) bg-(--bg-surface)"
                placeholder="rgba(255,255,255,0.85)"
              />
            </div>
          </div>

          {/* Sort + Active row */}
          <div className="flex items-end gap-5">
            <div className="space-y-1.5 w-28">
              <Label className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                Sort Order
              </Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  set("sortOrder", parseInt(e.target.value, 10) || 0)
                }
                className="text-sm h-9 border-(--border-mid) bg-(--bg-surface) text-center"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Switch
                id="ann-dialog-active"
                checked={form.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
              <Label
                htmlFor="ann-dialog-active"
                className="text-sm cursor-pointer text-(--text-secondary)"
              >
                Active
              </Label>
            </div>
          </div>

          {/* Inline preview */}
          <div
            className="rounded-xl text-xs text-center py-2.5 px-4 transition-all duration-200"
            style={{ background: form.backgroundColor, color: form.textColor }}
          >
            {form.text || "Preview…"}
            {form.ctaText && (
              <span className="font-bold underline ml-1">{form.ctaText}</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="border-(--border-mid) text-(--text-secondary)"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !form.text.trim()}
            className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white min-w-22.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function HeroTab() {
  const { data: existing, isLoading } = useAdminHeroSettings();
  const saveMutation = useUpdateHeroSettings();

  const [form, setForm] = useState<UpdateHeroPayload>({
    badgeText: "",
    headline: "",
    headlineAccent: "",
    subtitle: "",
    searchPlaceholder: "",
    primaryCtaText: "",
    primaryCtaHref: "",
    secondaryCtaText: "",
    secondaryCtaHref: "",
    backgroundImageUrl: "",
    tags: [],
    isActive: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Pre-fill when server data arrives
  useEffect(() => {
    if (!existing) return;
    setForm({
      badgeText: existing.badgeText,
      headline: existing.headline,
      headlineAccent: existing.headlineAccent ?? "",
      subtitle: existing.subtitle,
      searchPlaceholder: existing.searchPlaceholder,
      primaryCtaText: existing.primaryCtaText,
      primaryCtaHref: existing.primaryCtaHref,
      secondaryCtaText: existing.secondaryCtaText ?? "",
      secondaryCtaHref: existing.secondaryCtaHref ?? "",
      backgroundImageUrl: existing.backgroundImageUrl ?? "",
      tags: existing.tags ?? [],
      isActive: existing.isActive,
    });
    setIsDirty(false);
  }, [existing]);

  const set = <K extends keyof UpdateHeroPayload>(
    key: K,
    value: UpdateHeroPayload[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  };

  // Tag management
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) =>
    set(
      "tags",
      form.tags.filter((x) => x !== t),
    );
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && form.tags.length)
      removeTag(form.tags[form.tags.length - 1]);
  };

  const handleSave = () => {
    if (!form.headline.trim()) {
      toast.error("Headline is required.");
      return;
    }
    if (!form.primaryCtaText.trim()) {
      toast.error("Primary CTA text is required.");
      return;
    }

    saveMutation.mutate(
      {
        ...form,
        headlineAccent: form.headlineAccent || undefined,
        secondaryCtaText: form.secondaryCtaText || undefined,
        secondaryCtaHref: form.secondaryCtaHref || undefined,
        backgroundImageUrl: form.backgroundImageUrl || undefined,
      } as UpdateHeroPayload,
      {
        onSuccess: () => {
          toast.success("Hero section saved.", {
            description: "Visible to visitors within 5 minutes.",
          });
          setIsDirty(false);
        },
        onError: () => toast.error("Failed to save hero section."),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </div>
        <div className="space-y-6">
          <SkeletonCard rows={2} />
          <SkeletonCard rows={3} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Section header with Active toggle + Save */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Switch
            id="hero-active"
            checked={form.isActive}
            onCheckedChange={(v) => set("isActive", v)}
          />
          <Label
            htmlFor="hero-active"
            className="text-sm cursor-pointer text-(--text-secondary)"
          >
            {form.isActive ? "Hero section is live" : "Hero section is hidden"}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white min-w-30"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          )}
          {!isDirty && !saveMutation.isPending && (
            <span className="text-xs text-(--success) font-medium px-3 py-1.5 bg-(--success-bg) rounded-lg border border-(--success-border)">
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT column */}
        <div className="space-y-6">
          {/* Badge + Headline */}
          <SectionCard
            icon={<Type className="w-4 h-4 text-(--info)" />}
            title="Badge & Headline"
            subtitle="Top-level visual identity of the hero"
          >
            <FieldRow label="Badge Pill Text">
              <Input
                value={form.badgeText}
                onChange={(e) => set("badgeText", e.target.value)}
                placeholder="Next-Gen Commerce"
                maxLength={60}
                className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
              />
            </FieldRow>
            <Separator className="bg-(--border-subtle)" />
            <FieldRow
              label="Headline"
              hint={`Use \\n to split the headline across multiple lines.\nExample: "Premium Marketplace\\nMeets Fast Delivery."`}
            >
              <Textarea
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
                placeholder={"Premium Marketplace\nMeets Fast Delivery."}
                rows={3}
                className="resize-none text-sm border-(--border-mid) bg-(--bg-surface) font-display"
              />
            </FieldRow>
            <Separator className="bg-(--border-subtle)" />
            <FieldRow
              label="Accent Word(s)"
              hint="Which word(s) in the headline should receive the italic red accent style. Leave blank to use the first capitalised noun."
            >
              <Input
                value={form.headlineAccent ?? ""}
                onChange={(e) => set("headlineAccent", e.target.value)}
                placeholder="Marketplace"
                maxLength={40}
                className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
              />
            </FieldRow>
          </SectionCard>

          {/* Subtitle */}
          <SectionCard
            icon={<Type className="w-4 h-4 text-(--text-tertiary)" />}
            title="Subtitle"
            subtitle="Supporting copy beneath the headline"
          >
            <FieldRow label="Body Copy">
              <Textarea
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="We redefine digital commerce…"
                rows={3}
                className="resize-none text-sm border-(--border-mid) bg-(--bg-surface)"
              />
            </FieldRow>
          </SectionCard>

          {/* Search bar */}
          <SectionCard
            icon={
              <MousePointerClick className="w-4 h-4 text-(--text-tertiary)" />
            }
            title="Search Bar"
            subtitle="Placeholder text inside the search input"
          >
            <FieldRow label="Placeholder">
              <Input
                value={form.searchPlaceholder}
                onChange={(e) => set("searchPlaceholder", e.target.value)}
                placeholder="Search products, stores..."
                maxLength={80}
                className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
              />
            </FieldRow>
          </SectionCard>
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          {/* CTAs */}
          <SectionCard
            icon={<MousePointerClick className="w-4 h-4 text-(--warning)" />}
            title="Call-to-Action Buttons"
            subtitle="Primary (search) and optional secondary button"
          >
            <FieldRow label="Primary CTA">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={form.primaryCtaText}
                  onChange={(e) => set("primaryCtaText", e.target.value)}
                  placeholder="Label — Search"
                  maxLength={40}
                  className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
                />
                <Input
                  value={form.primaryCtaHref}
                  onChange={(e) => set("primaryCtaHref", e.target.value)}
                  placeholder="URL — /products"
                  className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
                />
              </div>
            </FieldRow>
            <Separator className="bg-(--border-subtle)" />
            <FieldRow label="Secondary CTA (optional)">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={form.secondaryCtaText ?? ""}
                  onChange={(e) => set("secondaryCtaText", e.target.value)}
                  placeholder="Label — Explore Stores"
                  maxLength={40}
                  className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
                />
                <Input
                  value={form.secondaryCtaHref ?? ""}
                  onChange={(e) => set("secondaryCtaHref", e.target.value)}
                  placeholder="URL — /stores"
                  className="text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
                />
              </div>
            </FieldRow>
          </SectionCard>

          {/* Tags */}
          <SectionCard
            icon={<TagIcon className="w-4 h-4 text-(--success)" />}
            title="Quick-Filter Tags"
            subtitle="Pill chips shown beneath the search bar"
          >
            <FieldRow label="Tags">
              {/* Tag chip input */}
              <div
                className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg min-h-11 cursor-text"
                style={{
                  border: "1.5px solid var(--border-mid)",
                  background: "var(--bg-surface)",
                }}
                onClick={(e) =>
                  (
                    e.currentTarget.querySelector("input") as HTMLInputElement
                  )?.focus()
                }
              >
                {form.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium rounded-full bg-(--off-white-2) border border-(--border-light) text-(--text-secondary) hover:bg-(--off-white-3)"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full hover:text-red-500 transition-colors"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKey}
                  placeholder={
                    form.tags.length === 0 ? "Add a tag and press Enter…" : ""
                  }
                  className="flex-1 min-w-30 text-xs outline-none bg-transparent text-(--text-primary) placeholder:text-(--text-tertiary)"
                />
              </div>
              <p className="text-xs text-(--text-tertiary) mt-1.5">
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-(--off-white-3) font-mono text-[0.625rem] border border-(--border-light)">
                  Enter
                </kbd>{" "}
                to add ·{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-(--off-white-3) font-mono text-[0.625rem] border border-(--border-light)">
                  Backspace
                </kbd>{" "}
                to remove last
              </p>
            </FieldRow>
          </SectionCard>

          {/* Background image */}
          <SectionCard
            icon={<Paintbrush className="w-4 h-4 text-(--text-tertiary)" />}
            title="Background Image"
            subtitle="Optional hero background. Leave blank for the default gradient."
          >
            <FieldRow
              label="Image URL"
              hint="Paste a CDN or publicly accessible URL. Supported: .jpg, .png, .webp"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={form.backgroundImageUrl ?? ""}
                  onChange={(e) => set("backgroundImageUrl", e.target.value)}
                  placeholder="https://cdn.example.com/hero.jpg"
                  className="flex-1 text-sm h-9 border-(--border-mid) bg-(--bg-surface)"
                />
                {form.backgroundImageUrl && (
                  <button
                    onClick={() => set("backgroundImageUrl", "")}
                    className="p-2 rounded-lg border border-(--border-light) hover:border-red-300 hover:bg-red-50 transition-colors text-(--text-tertiary)"
                    aria-label="Clear image URL"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </FieldRow>

            {/* Image preview */}
            {form.backgroundImageUrl ? (
              <div
                className="mb-4 rounded-xl overflow-hidden border border-(--border-light)"
                style={{ height: 96 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.backgroundImageUrl}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              </div>
            ) : (
              <div
                className="mb-4 rounded-xl flex items-center justify-center gap-2 border-(--border-light)"
                style={{
                  height: 72,
                  border: "1.5px dashed var(--border-mid)",
                  background: "var(--bg-sunken)",
                }}
              >
                <ImageIcon className="w-4 h-4 text-(--text-tertiary)" />
                <span className="text-xs text-(--text-tertiary)">
                  Default off-white gradient background
                </span>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── Floating unsaved-changes bar ── */}
      {isDirty && (
        <div
          className="fixed bottom-6 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
          style={{
            background: "var(--charcoal)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            Unsaved changes
          </span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-1.5 text-xs bg-(--red) hover:bg-(--red-dark) text-white"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                Save Now
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
