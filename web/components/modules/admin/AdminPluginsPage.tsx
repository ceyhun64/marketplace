"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Puzzle,
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Package,
  Loader2,
} from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  isActive: boolean;
  isFeatured: boolean;
  category: string;
  minimumPlan: string;
  developerName?: string;
  documentationUrl?: string;
  isSubscribed: boolean;
  createdAt: string;
}

interface PluginFormData {
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  category: string;
  minimumPlan: string;
  isFeatured: boolean;
}

const EMPTY_FORM: PluginFormData = {
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  category: "analytics",
  minimumPlan: "Pro",
  isFeatured: false,
};

export default function AdminPluginsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editPlugin, setEditPlugin] = useState<Plugin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plugin | null>(null);
  const [form, setForm] = useState<PluginFormData>(EMPTY_FORM);

  const { data: plugins, isLoading } = useQuery<Plugin[]>({
    queryKey: ["admin-plugins", search],
    queryFn: async () => {
      const res = await api.get(`/api/plugins?search=${search}`);
      // Backend ApiResponse<GetPluginsResult> döndürür: { data: { items: [...] } }
      const body = res.data;
      return Array.isArray(body)
        ? body
        : (body?.items ?? body?.data?.items ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PluginFormData) => api.post("/api/plugins", data),
    onSuccess: () => {
      toast.success("Plugin created");
      qc.invalidateQueries({ queryKey: ["admin-plugins"] });
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error("Failed to create plugin"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PluginFormData }) =>
      api.put(`/api/plugins/${id}`, data),
    onSuccess: () => {
      toast.success("Plugin updated");
      qc.invalidateQueries({ queryKey: ["admin-plugins"] });
      setOpen(false);
      setEditPlugin(null);
    },
    onError: () => toast.error("Failed to update plugin"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/api/plugins/${id}/toggle`, { isActive: active }),
    onSuccess: () => {
      toast.success("Plugin status updated");
      qc.invalidateQueries({ queryKey: ["admin-plugins"] });
    },
    onError: () => toast.error("Failed to toggle plugin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/plugins/${id}`),
    onSuccess: () => {
      toast.success("Plugin deleted");
      qc.invalidateQueries({ queryKey: ["admin-plugins"] });
    },
    onError: () => toast.error("Failed to delete plugin"),
  });

  const openCreate = () => {
    setEditPlugin(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (p: Plugin) => {
    setEditPlugin(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      monthlyPrice: p.monthlyPrice,
      category: p.category,
      minimumPlan: p.minimumPlan,
      isFeatured: p.isFeatured,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editPlugin) {
      updateMutation.mutate({ id: editPlugin.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Plugin Marketplace
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Manage available plugins for merchants
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-xl gap-2 bg-(--charcoal) hover:bg-(--charcoal-2)"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4" />
              Add Plugin
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editPlugin ? "Edit Plugin" : "New Plugin"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-(--text-secondary)">
                  Name
                </Label>
                <Input
                  placeholder="e.g. Advanced Analytics"
                  className="rounded-xl border-(--border-mid)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-(--text-secondary)">
                  Description
                </Label>
                <Textarea
                  placeholder="What does this plugin do?"
                  className="rounded-xl border-(--border-mid) resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-(--text-secondary)">
                  Slug (URL-safe)
                </Label>
                <Input
                  placeholder="e.g. advanced-analytics"
                  className="rounded-xl border-(--border-mid)"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-(--text-secondary)">
                    Minimum Plan
                  </Label>
                  <Select value={form.minimumPlan} onValueChange={(v) => setForm({ ...form, minimumPlan: v })}>
                    <SelectTrigger className="w-full rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-(--text-secondary)">
                    Monthly Price ($)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="rounded-xl border-(--border-mid)"
                    value={form.monthlyPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        monthlyPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-(--text-secondary)">
                  Category
                </Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="fulfillment">Fulfillment</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full rounded-xl bg-(--charcoal) hover:bg-(--charcoal-2)"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editPlugin ? "Save Changes" : "Create Plugin"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-2xl shadow-sm">
        <div className="p-4 border-b border-(--border-light)">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
            <Input
              placeholder="Search plugins..."
              className="pl-9 rounded-xl border-(--border-mid)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken)">
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Plugin
              </TableHead>
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Category
              </TableHead>
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Min Plan
              </TableHead>
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Price/mo
              </TableHead>
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Featured
              </TableHead>
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Status
              </TableHead>
              <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20 rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (plugins ?? []).map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-(--bg-sunken) transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-(--off-white-2) flex items-center justify-center">
                          <Puzzle className="w-4 h-4 text-(--text-tertiary)" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-(--text-primary)">
                            {p.name}
                          </p>
                          <p className="text-xs text-(--text-tertiary) max-w-[200px] truncate">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-(--off-white-2) text-(--text-secondary) px-2 py-1 rounded-full capitalize">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-(--text-secondary)">
                      {p.minimumPlan}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-(--success)" />
                        <span className="text-sm font-semibold text-(--text-primary)">
                          {p.monthlyPrice === 0
                            ? "Free"
                            : `$${p.monthlyPrice}/mo`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.isFeatured ? (
                        <span className="text-xs bg-(--warning-bg) text-(--warning) px-2 py-1 rounded-full">
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-(--text-tertiary)">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: p.id,
                            active: !p.isActive,
                          })
                        }
                        className="flex items-center gap-1.5"
                      >
                        {p.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-(--success)" />
                            <span className="text-xs font-medium text-(--success)">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-(--text-tertiary)" />
                            <span className="text-xs font-medium text-(--text-tertiary)">
                              Inactive
                            </span>
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="w-3.5 h-3.5 text-(--text-tertiary)" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!isLoading && (plugins ?? []).length === 0 && (
          <div className="text-center py-16 text-(--text-tertiary)">
            <Puzzle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No plugins found</p>
            <p className="text-xs mt-1">
              Create the first plugin using the button above
            </p>
          </div>
        )}
      </div>

      {/* -- Delete confirmation -- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plugin?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Delete plugin "${deleteTarget?.name}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate(deleteTarget!.id, {
                  onSuccess: () => setDeleteTarget(null),
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
    </div>
  );
}
