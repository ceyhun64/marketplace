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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  Store,
  Truck,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

type UserRole = "Customer" | "Merchant" | "Admin" | "Courier";
type AccountStatus = "Active" | "PendingApproval" | "Suspended" | "Banned";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isDeleted: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: string; icon: React.ReactNode }
> = {
  Customer: {
    label: "Customer",
    color: "bg-(--info-bg) text-(--info)",
    icon: <Users className="w-3 h-3" />,
  },
  Merchant: {
    label: "Merchant",
    color: "bg-(--info-bg) text-(--info)",
    icon: <Store className="w-3 h-3" />,
  },
  Admin: {
    label: "Admin",
    color: "bg-(--danger-bg) text-(--danger)",
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  Courier: {
    label: "Courier",
    color: "bg-(--warning-bg) text-(--warning)",
    icon: <Truck className="w-3 h-3" />,
  },
};

const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; color: string }
> = {
  Active: { label: "Active", color: "bg-(--success-bg) text-(--success)" },
  PendingApproval: {
    label: "Pending",
    color: "bg-(--warning-bg) text-(--warning)",
  },
  Suspended: { label: "Suspended", color: "bg-(--warning-bg) text-(--warning)" },
  Banned: { label: "Banned", color: "bg-(--danger-bg) text-(--danger)" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? {
    label: role,
    color: "bg-(--off-white-2) text-(--text-secondary)",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-(--off-white-2) text-(--text-secondary)",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [banConfirmOpen, setBanConfirmOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);

  const { data, isLoading, refetch } = useQuery<PaginatedUsers>({
    queryKey: ["admin-users", search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await api.get(`/api/admin/users?${params}`);
      // Normalize: backend may return { items, total } or array
      const raw = res.data;
      if (Array.isArray(raw)) return { items: raw, total: raw.length, page: 1, limit: 20 };
      return {
        items: raw?.items ?? raw?.data ?? [],
        total: raw?.total ?? raw?.totalCount ?? 0,
        page: raw?.page ?? 1,
        limit: raw?.limit ?? 20,
      };
    },
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/api/admin/users/${userId}/ban`),
    onSuccess: () => {
      toast.success("User status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setBanConfirmOpen(false);
      setUserToBan(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Operation failed"),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to change role"),
  });

  const users: User[] = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const stats = {
    total: data?.total ?? 0,
    customers: users.filter((u) => u.role === "Customer").length,
    merchants: users.filter((u) => u.role === "Merchant").length,
    banned: users.filter(
      (u) => u.accountStatus === "Banned" || u.accountStatus === "Suspended",
    ).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            User Management
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            All registered users across the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: stats.total,
            icon: Users,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Customers",
            value: stats.customers,
            icon: UserCheck,
            color: "text-(--success)",
            bg: "bg-(--success-bg)",
          },
          {
            label: "Merchants",
            value: stats.merchants,
            icon: Store,
            color: "text-violet-600",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Banned / Suspended",
            value: stats.banned,
            icon: UserX,
            color: "text-(--danger)",
            bg: "bg-(--danger-bg)",
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
            <p className="text-2xl font-bold text-(--text-primary)">
              {isLoading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 border-(--border-mid)"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44 border-(--border-mid)">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Customer">Customers</SelectItem>
            <SelectItem value="Merchant">Merchants</SelectItem>
            <SelectItem value="Courier">Couriers</SelectItem>
            <SelectItem value="Admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                User
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Role
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Phone
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Joined
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Change Role
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-16 text-(--text-tertiary)"
                >
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-(--bg-sunken) border-b border-(--border-subtle)"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-(--charcoal-2) to-(--charcoal) flex items-center justify-center text-white text-xs font-bold">
                        {(user.firstName?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-(--text-primary)">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </p>
                        <p className="text-xs text-(--text-tertiary)">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role as UserRole} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.accountStatus as AccountStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-(--text-tertiary)">
                    {user.phone || <span className="text-(--charcoal-mist)">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-(--text-tertiary)">
                    {new Date(user.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(val) =>
                        changeRoleMutation.mutate({
                          userId: user.id,
                          role: val,
                        })
                      }
                      disabled={user.role === "Admin"}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs border-(--border-mid)">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Merchant">Merchant</SelectItem>
                        <SelectItem value="Courier">Courier</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {user.role !== "Admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 w-7 p-0 ${
                            user.accountStatus === "Banned" ||
                            user.accountStatus === "Suspended"
                              ? "text-(--success) hover:bg-(--success-bg)"
                              : "text-rose-500 hover:bg-(--danger-bg)"
                          }`}
                          onClick={() => {
                            setUserToBan(user);
                            setBanConfirmOpen(true);
                          }}
                        >
                          {user.accountStatus === "Banned" ||
                          user.accountStatus === "Suspended" ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </Button>
          <span className="px-3 py-1 text-sm text-(--text-secondary)">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Detail</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 pb-4 border-b border-(--border-light)">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-(--charcoal-2) to-(--charcoal) flex items-center justify-center text-white text-xl font-bold">
                  {(
                    selectedUser.firstName?.charAt(0) ||
                    selectedUser.email?.charAt(0) ||
                    "?"
                  ).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-(--text-primary)">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={selectedUser.role as UserRole} />
                    <StatusBadge
                      status={selectedUser.accountStatus as AccountStatus}
                    />
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-3 text-(--text-secondary)">
                  <Mail className="w-4 h-4 text-(--text-tertiary) shrink-0" />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-3 text-(--text-secondary)">
                    <Phone className="w-4 h-4 text-(--text-tertiary) shrink-0" />
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-(--text-secondary)">
                  <Calendar className="w-4 h-4 text-(--text-tertiary) shrink-0" />
                  <span>
                    Joined{" "}
                    {new Date(selectedUser.createdAt).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </span>
                </div>
                {selectedUser.lastLoginAt && (
                  <div className="flex items-center gap-3 text-(--text-secondary)">
                    <Shield className="w-4 h-4 text-(--text-tertiary) shrink-0" />
                    <span>
                      Last login:{" "}
                      {new Date(selectedUser.lastLoginAt).toLocaleDateString(
                        "en-US",
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-(--text-tertiary) text-xs font-mono">
                  <span className="text-(--charcoal-mist)">ID:</span>
                  <span>{selectedUser.id}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            {selectedUser && selectedUser.role !== "Admin" && (
              <Button
                variant={
                  selectedUser.accountStatus === "Banned" ||
                  selectedUser.accountStatus === "Suspended"
                    ? "default"
                    : "destructive"
                }
                onClick={() => {
                  setDetailOpen(false);
                  setUserToBan(selectedUser);
                  setBanConfirmOpen(true);
                }}
              >
                {selectedUser.accountStatus === "Banned" ||
                selectedUser.accountStatus === "Suspended"
                  ? "Unban User"
                  : "Ban User"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban / Unban Confirm Dialog */}
      <Dialog
        open={banConfirmOpen}
        onOpenChange={(o) => {
          setBanConfirmOpen(o);
          if (!o) setUserToBan(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {userToBan?.accountStatus === "Banned" ||
              userToBan?.accountStatus === "Suspended"
                ? "Unban User"
                : "Ban User"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-(--text-secondary)">
              {userToBan?.accountStatus === "Banned" ||
              userToBan?.accountStatus === "Suspended" ? (
                <>
                  Restore access for{" "}
                  <span className="font-semibold text-(--text-primary)">
                    {userToBan?.email}
                  </span>
                  ? They will be able to log in again.
                </>
              ) : (
                <>
                  Ban{" "}
                  <span className="font-semibold text-(--text-primary)">
                    {userToBan?.email}
                  </span>
                  ? They will lose access to the platform.
                </>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanConfirmOpen(false);
                setUserToBan(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                userToBan?.accountStatus === "Banned" ||
                userToBan?.accountStatus === "Suspended"
                  ? "default"
                  : "destructive"
              }
              onClick={() => userToBan && banMutation.mutate(userToBan.id)}
              disabled={banMutation.isPending}
            >
              {banMutation.isPending
                ? "Updating..."
                : userToBan?.accountStatus === "Banned" ||
                    userToBan?.accountStatus === "Suspended"
                  ? "Unban"
                  : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
