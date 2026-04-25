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
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  monthlyPrice: number;
  isActive: boolean;
  category: string;
  subscriberCount: number;
  createdAt: string;
}

interface PluginFormData {
  name: string;
  description: string;
  version: string;
  monthlyPrice: number;
  category: string;
}

const EMPTY_FORM: PluginFormData = {
  name: "",
  description: "",
  version: "1.0.0",
  monthlyPrice: 0,
  category: "analytics",
};

export default function AdminPluginsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editPlugin, setEditPlugin] = useState<Plugin | null>(null);
  const [form, setForm] = useState<PluginFormData>(EMPTY_FORM);

  const { data: plugins, isLoading } = useQuery<Plugin[]>({
    queryKey: ["admin-plugins", search],
    queryFn: async () => {
      const res = await api.get(`/plugins?search=${search}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PluginFormData) => api.post("/plugins", data),
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
      api.put(`/plugins/${id}`, data),
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
      api.patch(`/plugins/${id}/toggle`, { isActive: active }),
    onSuccess: () => {
      toast.success("Plugin status updated");
      qc.invalidateQueries({ queryKey: ["admin-plugins"] });
    },
    onError: () => toast.error("Failed to toggle plugin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plugins/${id}`),
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
      description: p.description,
      version: p.version,
      monthlyPrice: p.monthlyPrice,
      category: p.category,
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Plugin Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage available plugins for merchants
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-xl gap-2 bg-gray-900 hover:bg-gray-800"
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
                <Label className="text-xs font-medium text-gray-600">
                  Name
                </Label>
                <Input
                  placeholder="e.g. Advanced Analytics"
                  className="rounded-xl border-gray-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Description
                </Label>
                <Textarea
                  placeholder="What does this plugin do?"
                  className="rounded-xl border-gray-200 resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">
                    Version
                  </Label>
                  <Input
                    placeholder="1.0.0"
                    className="rounded-xl border-gray-200"
                    value={form.version}
                    onChange={(e) =>
                      setForm({ ...form, version: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">
                    Monthly Price ($)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="rounded-xl border-gray-200"
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
                <Label className="text-xs font-medium text-gray-600">
                  Category
                </Label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="analytics">Analytics</option>
                  <option value="marketing">Marketing</option>
                  <option value="fulfillment">Fulfillment</option>
                  <option value="payment">Payment</option>
                  <option value="inventory">Inventory</option>
                  <option value="crm">CRM</option>
                </select>
              </div>
              <Button
                className="w-full rounded-xl bg-gray-900 hover:bg-gray-800"
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {editPlugin ? "Save Changes" : "Create Plugin"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search plugins..."
              className="pl-9 rounded-xl border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Plugin
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Category
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Version
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Price/mo
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Subscribers
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
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
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Puzzle className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400 max-w-[200px] truncate">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">
                      v{p.version}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm font-semibold text-gray-900">
                          {p.monthlyPrice === 0
                            ? "Free"
                            : `$${p.monthlyPrice}/mo`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-sm text-gray-700">
                          {p.subscriberCount}
                        </span>
                      </div>
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
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-medium text-green-600">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400">
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
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete plugin "${p.name}"? This cannot be undone.`
                              )
                            ) {
                              deleteMutation.mutate(p.id);
                            }
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

        {!isLoading && (plugins ?? []).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Puzzle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No plugins found</p>
            <p className="text-xs mt-1">
              Create the first plugin using the button above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
