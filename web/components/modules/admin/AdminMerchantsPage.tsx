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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Search,
  Store,
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
      toast.success("Merchant created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setCreateOpen(false);
      setForm({ storeName: "", email: "", password: "", phone: "", slug: "" });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to create merchant"),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/merchants/${id}/suspend`),
    onSuccess: () => {
      toast.success("Merchant status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
    onError: () => toast.error("Operation failed"),
  });

  const setupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.post(`/api/admin/merchants/${id}/setup`, data),
    onSuccess: () => {
      toast.success("Store setup complete");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setSetupOpen(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Setup failed"),
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Merchants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all sellers on the platform
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Plus className="w-4 h-4" /> New Merchant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Building2,
            color: "text-gray-700",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle,
            color: "text-emerald-600",
          },
          {
            label: "Suspended",
            value: stats.suspended,
            icon: Ban,
            color: "text-rose-600",
          },
          {
            label: "Custom Domain",
            value: stats.withDomain,
            icon: TrendingUp,
            color: "text-violet-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 border-gray-200"
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
            <Building2 className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No merchants yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setCreateOpen(true)}
            >
              Add First Merchant
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Store
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Plan
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Domain
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Products
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Joined
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((merchant) => (
                <TableRow
                  key={merchant.id}
                  className="hover:bg-gray-50 border-b border-gray-50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                        {merchant.storeName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
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
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        merchant.subscriptionPlan === "Enterprise"
                          ? "bg-violet-100 text-violet-700"
                          : merchant.subscriptionPlan === "Pro"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {merchant.subscriptionPlan || "Basic"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {merchant.customDomain ? (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-700 text-xs truncate max-w-[120px]">
                          {merchant.customDomain}
                        </span>
                        {merchant.domainVerified ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <span className="text-xs text-amber-500">!</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {merchant.productCount ?? 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        merchant.isSuspended
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {merchant.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">
                    {new Date(merchant.createdAt).toLocaleDateString("en-US")}
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
                          <Store className="w-4 h-4 mr-2" /> Setup Store
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={
                            merchant.isSuspended
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }
                          onClick={() => suspendMutation.mutate(merchant.id)}
                        >
                          {merchant.isSuspended ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" /> Activate
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 mr-2" /> Suspend
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
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create New Merchant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Store Name *</Label>
              <Input
                placeholder="e.g. Tech Store"
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
              <Label>Store URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  /store/
                </span>
                <Input
                  placeholder="tech-store"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="merchant@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="+1 5xx xxx xxxx"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
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
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Setup Store — {selectedMerchant?.storeName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Store Name</Label>
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
              <Label>Store Description</Label>
              <Input
                placeholder="Short store description..."
                value={setupForm.description}
                onChange={(e) =>
                  setSetupForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              Cancel
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
              {setupMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
