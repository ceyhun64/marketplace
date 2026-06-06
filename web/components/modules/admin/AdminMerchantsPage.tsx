"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
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
import { toast } from "sonner";
import PhoneInput from "@/components/ui/phone-input";
import {
  Plus,
  MoreHorizontal,
  Search,
  Store,
  Ban,
  CheckCircle,
  XCircle,
  Building2,
  ShoppingBag,
  TrendingUp,
  Clock,
  UserCheck,
  Loader2,
} from "lucide-react";

interface Merchant {
  id: string;
  storeName: string;
  slug: string;
  email: string;
  customDomain?: string;
  domainVerified: boolean;
  isActive: boolean;
  plan?: string;
  productCount?: number;
  totalSales?: number;
  createdAt: string;
}

interface PendingMerchant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  store?: {
    id: string;
    storeName: string;
    slug: string;
    description?: string;
  };
}

interface CreateMerchantForm {
  storeName: string;
  email: string;
  password: string;
  phone?: string;
  slug?: string;
}

type Tab = "active" | "pending";

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "active",
  );
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null,
  );
  const [selectedPending, setSelectedPending] =
    useState<PendingMerchant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const [merchantToSuspend, setMerchantToSuspend] = useState<Merchant | null>(
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

  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t === "pending" || t === "active") setTab(t);
  }, [searchParams]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchants", search],
    queryFn: async () => {
      const res = await api.get("/api/admin/merchants", { params: { search } });
      const raw = res.data;
      const items = (raw?.items ?? raw ?? []).map((m: any) => ({
        ...m,
        email: m.email ?? m.user?.email ?? "",
        customDomain: m.customDomain ?? null,
        domainVerified: m.domainVerified ?? false,
        plan: m.plan ?? null,
      }));
      return { ...raw, items };
    },
    enabled: tab === "active",
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-merchants-pending"],
    queryFn: async () => {
      const res = await api.get("/api/admin/merchants/pending");
      return res.data as PendingMerchant[];
    },
    enabled: tab === "pending",
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
    mutationFn: (id: string) => api.patch(`/api/admin/merchants/${id}/suspend`),
    onSuccess: () => {
      toast.success("Merchant status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setSuspendConfirmOpen(false);
      setMerchantToSuspend(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to update merchant status"),
  });

  const setupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.post(`/api/admin/store/${id}/setup`, data),
    onSuccess: () => {
      toast.success("Store setup complete");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setSetupOpen(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Setup failed"),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/api/admin/merchants/${userId}/approve`),
    onSuccess: () => {
      toast.success("Merchant approved and activated");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.post(`/api/admin/merchants/${userId}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Application rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-merchants-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setRejectOpen(false);
      setRejectReason("");
      setSelectedPending(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Rejection failed"),
  });

  const merchants: Merchant[] = data?.items || data || [];
  const pending: PendingMerchant[] = pendingData || [];

  const filtered = merchants.filter(
    (m) =>
      !search ||
      m.storeName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: merchants.length,
    active: merchants.filter((m) => m.isActive).length,
    suspended: merchants.filter((m) => !m.isActive).length,
    withDomain: merchants.filter((m) => m.customDomain).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Merchants</h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Manage all sellers on the platform
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
        >
          <Plus className="w-4 h-4" /> New Merchant
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-(--off-white-2) p-1 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange("active")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "active"
              ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
              : "text-(--text-tertiary) hover:text-(--text-secondary)"
          }`}
        >
          Active Merchants
        </button>
        <button
          onClick={() => handleTabChange("pending")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === "pending"
              ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
              : "text-(--text-tertiary) hover:text-(--text-secondary)"
          }`}
        >
          Pending Applications
          {pending.length > 0 && (
            <span className="bg-(--warning) text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {/* ACTIVE TAB */}
      {tab === "active" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Total",
                value: stats.total,
                icon: Building2,
                color: "text-(--text-secondary)",
              },
              {
                label: "Active",
                value: stats.active,
                icon: CheckCircle,
                color: "text-(--success)",
              },
              {
                label: "Suspended",
                value: stats.suspended,
                icon: Ban,
                color: "text-(--danger)",
              },
              {
                label: "Custom Domain",
                value: stats.withDomain,
                icon: TrendingUp,
                color: "text-(--info)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                    {s.label}
                  </p>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-(--text-primary) mt-2">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-(--bg-surface) rounded-xl border border-(--border-light)">
            <div className="p-4 border-b border-(--border-light)">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 border-(--border-mid)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-(--text-tertiary)" />
              </div>
            ) : filtered.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon"><Building2 className="w-5 h-5" /></EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No merchants yet</EmptyTitle>
                </EmptyHeader>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  Add First Merchant
                </Button>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Store
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Email
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Plan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Domain
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Products
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                      Joined
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((merchant) => (
                    <TableRow
                      key={merchant.id}
                      className="hover:bg-(--bg-sunken) border-b border-(--border-subtle)"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-(--charcoal) flex items-center justify-center text-white text-xs font-bold">
                            {merchant.storeName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-(--text-primary)">
                              {merchant.storeName}
                            </p>
                            <p className="text-xs text-(--text-tertiary)">
                              /{merchant.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-(--text-secondary)">
                        {merchant.email}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                            merchant.plan === "Enterprise"
                              ? "bg-(--info-bg) text-(--info)"
                              : merchant.plan === "Pro"
                                ? "bg-(--info-bg) text-(--info)"
                                : "bg-(--off-white-2) text-(--text-secondary)"
                          }`}
                        >
                          {merchant.plan || "Basic"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {merchant.customDomain ? (
                          <div className="flex items-center gap-1">
                            <span className="text-(--text-secondary) text-xs truncate max-w-30">
                              {merchant.customDomain}
                            </span>
                            {merchant.domainVerified ? (
                              <CheckCircle className="w-3 h-3 text-(--success) shrink-0" />
                            ) : (
                              <span className="text-xs text-(--warning)">!</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-(--charcoal-mist) text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-(--text-tertiary)" />
                          <span className="text-sm text-(--text-secondary)">
                            {merchant.productCount ?? 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                            !merchant.isActive
                              ? "bg-(--danger-bg) text-(--danger)"
                              : "bg-(--success-bg) text-(--success)"
                          }`}
                        >
                          {!merchant.isActive ? "Suspended" : "Active"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-(--text-tertiary)">
                        {formatDate(merchant.createdAt)}
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
                                !merchant.isActive
                                  ? "text-(--success)"
                                  : "text-(--danger)"
                              }
                              onClick={() => {
                                setMerchantToSuspend(merchant);
                                setSuspendConfirmOpen(true);
                              }}
                            >
                              {!merchant.isActive ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                                  Activate
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
        </>
      )}

      {/* PENDING TAB */}
      {tab === "pending" && (
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light)">
          <div className="p-5 border-b border-(--border-light)">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-(--warning)" />
              <p className="text-sm font-semibold text-(--text-primary)">
                Merchant Applications Awaiting Review
              </p>
              {pending.length > 0 && (
                <span className="ml-auto text-xs text-(--text-tertiary)">
                  {pending.length} application{pending.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {pendingLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-(--text-tertiary)" />
            </div>
          ) : pending.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon"><UserCheck className="w-5 h-5" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No pending applications</EmptyTitle>
                <EmptyDescription>All caught up!</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
                  <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                    Applicant
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                    Store
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                    Applied
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-(--warning-bg)/30 border-b border-(--border-subtle)"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-(--warning-bg) flex items-center justify-center text-(--warning) text-xs font-bold">
                          {p.firstName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-(--text-primary)">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-(--text-tertiary)">{p.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-(--text-primary)">
                          {p.store?.storeName || (
                            <span className="text-(--charcoal-mist)">—</span>
                          )}
                        </p>
                        <p className="text-xs text-(--text-tertiary) font-mono">
                          /store/{p.store?.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-(--text-tertiary)">
                      {p.phone || <span className="text-(--charcoal-mist)">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-(--text-tertiary) max-w-50 truncate">
                      {p.store?.description || (
                        <span className="text-(--charcoal-mist)">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-(--text-tertiary)">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 bg-(--success) hover:opacity-90 text-white text-xs"
                          onClick={() => approveMutation.mutate(p.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 border-(--danger-border) text-(--danger) hover:bg-(--danger-bg) text-xs"
                          onClick={() => {
                            setSelectedPending(p);
                            setRejectOpen(true);
                          }}
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-120">
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
                <span className="text-sm text-(--text-tertiary) whitespace-nowrap">
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
              <PhoneInput
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v ?? "" }))}
                defaultCountry="TR"
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
        <DialogContent className="sm:max-w-120">
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
                <span className="text-sm text-(--text-tertiary) whitespace-nowrap">
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

      {/* Suspend / Activate Confirm Dialog */}
      <Dialog
        open={suspendConfirmOpen}
        onOpenChange={(o) => {
          setSuspendConfirmOpen(o);
          if (!o) setMerchantToSuspend(null);
        }}
      >
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>
              {merchantToSuspend?.isActive
                ? "Suspend Merchant"
                : "Activate Merchant"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-(--text-secondary)">
              {merchantToSuspend?.isActive ? (
                <>
                  Are you sure you want to{" "}
                  <span className="font-semibold text-(--danger)">suspend</span>{" "}
                  <span className="font-semibold text-(--text-primary)">
                    {merchantToSuspend?.storeName}
                  </span>
                  ? Their store will be hidden and they won&apos;t be able to
                  access the platform.
                </>
              ) : (
                <>
                  Are you sure you want to{" "}
                  <span className="font-semibold text-(--success)">
                    activate
                  </span>{" "}
                  <span className="font-semibold text-(--text-primary)">
                    {merchantToSuspend?.storeName}
                  </span>
                  ? Their store will become visible again.
                </>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendConfirmOpen(false);
                setMerchantToSuspend(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className={
                merchantToSuspend?.isActive
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-(--success) hover:opacity-90 text-white"
              }
              onClick={() =>
                merchantToSuspend &&
                suspendMutation.mutate(merchantToSuspend.id)
              }
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending
                ? "Updating..."
                : merchantToSuspend?.isActive
                  ? "Suspend"
                  : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-110">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-(--text-secondary)">
              Rejecting application from{" "}
              <span className="font-semibold text-(--text-primary)">
                {selectedPending?.firstName} {selectedPending?.lastName}
              </span>{" "}
              for store{" "}
              <span className="font-semibold text-(--text-primary)">
                {selectedPending?.store?.storeName}
              </span>
              .
            </p>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input
                placeholder="e.g. Incomplete information, duplicate application..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <p className="text-xs text-(--text-tertiary)">
                This will be included in the notification email to the
                applicant.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedPending &&
                rejectMutation.mutate({
                  userId: selectedPending.id,
                  reason: rejectReason || undefined,
                })
              }
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
