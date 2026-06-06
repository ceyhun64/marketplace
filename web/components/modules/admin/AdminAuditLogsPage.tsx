"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DataPagination } from "@/components/ui/data-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Search,
  RefreshCw,
  ShoppingCart,
  Users,
  Store,
  Package,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// -- Types ---------------------------------------------------------------------

interface AuditLogEntry {
  id: string;
  eventType: "order" | "user" | "merchant" | "product" | string;
  severity: "info" | "warning" | "error" | string;
  message: string;
  actorId: string;
  resourceId: string;
  occurredAt: string;
}

interface AuditLogsResponse {
  total: number;
  page: number;
  limit: number;
  items: AuditLogEntry[];
}

// -- Constants -----------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  order: {
    label: "Order",
    icon: <ShoppingCart className="w-3 h-3" />,
    color: "text-(--info)",
    bg: "bg-(--info-bg)",
  },
  user: {
    label: "User",
    icon: <Users className="w-3 h-3" />,
    color: "text-(--success)",
    bg: "bg-(--success-bg)",
  },
  merchant: {
    label: "Merchant",
    icon: <Store className="w-3 h-3" />,
    color: "text-(--warning)",
    bg: "bg-(--warning-bg)",
  },
  product: {
    label: "Product",
    icon: <Package className="w-3 h-3" />,
    color: "text-(--text-tertiary)",
    bg: "bg-(--off-white-2)",
  },
};

const SEVERITY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  info: {
    icon: <Info className="w-3.5 h-3.5" />,
    color: "text-(--info)",
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: "text-(--warning)",
  },
  error: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-(--danger)",
  },
  success: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-(--success)",
  },
};

// -- Sub-components ------------------------------------------------------------

function EventBadge({ type }: { type: string }) {
  const cfg = EVENT_TYPE_CONFIG[type] ?? {
    label: type,
    icon: <Activity className="w-3 h-3" />,
    color: "text-(--text-tertiary)",
    bg: "bg-(--off-white-2)",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.bg}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  return <span className={cfg.color}>{cfg.icon}</span>;
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-b border-(--border-subtle)">
          <TableCell className="w-8">
            <Skeleton className="h-4 w-4 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-full max-w-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// -- Main Component ------------------------------------------------------------

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { data, isLoading, refetch, isFetching } = useQuery<AuditLogsResponse>({
    queryKey: ["admin-audit-logs", page, eventTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (eventTypeFilter !== "all") params.set("eventType", eventTypeFilter);
      const res = await api.get(`/api/admin/logs?${params}`);
      return res.data as AuditLogsResponse;
    },
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  const entries: AuditLogEntry[] = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  const filtered = search
    ? entries.filter((e) =>
        e.message.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  // Derived counts per event type from current page
  const typeCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] ?? 0) + 1;
    return acc;
  }, {});

  const warningCount = entries.filter(
    (e) => e.severity === "warning" || e.severity === "error",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Audit Logs
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Real-time platform activity — orders, users, merchants, and product
            events.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 border-(--border-mid) text-(--text-secondary)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total events */}
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-4 sm:col-span-1">
          <p className="text-[10px] text-(--text-tertiary) font-semibold uppercase tracking-wider mb-2">
            Total
          </p>
          {isLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold text-(--text-primary)">{data?.total ?? 0}</p>
          )}
        </div>

        {/* Per-type counts */}
        {(["order", "user", "merchant", "product"] as const).map((type) => {
          const cfg = EVENT_TYPE_CONFIG[type];
          return (
            <div
              key={type}
              className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-4 cursor-pointer transition-all hover:border-(--border-mid)"
              onClick={() =>
                setEventTypeFilter((prev) => (prev === type ? "all" : type))
              }
              style={{
                borderColor:
                  eventTypeFilter === type ? "var(--charcoal)" : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-(--text-tertiary) font-semibold uppercase tracking-wider">
                  {cfg.label}
                </p>
                <span className={`${cfg.color} ${cfg.bg} p-1 rounded`}>{cfg.icon}</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-2xl font-bold text-(--text-primary)">
                  {typeCounts[type] ?? 0}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Warnings banner */}
      {!isLoading && warningCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-(--warning-border) bg-(--warning-bg)">
          <AlertTriangle className="w-4 h-4 text-(--warning) shrink-0" />
          <p className="text-sm text-(--text-secondary)">
            <span className="font-semibold">{warningCount}</span> events on this
            page have{" "}
            <span className="font-semibold text-(--warning)">
              warning or error
            </span>{" "}
            severity and may require attention.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
          <Input
            placeholder="Filter by message content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-(--border-mid) h-9"
          />
        </div>
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-44 border-(--border-mid) h-9 text-sm">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="merchant">Merchants</SelectItem>
            <SelectItem value="product">Products</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken) border-b border-(--border-light) hover:bg-(--bg-sunken)">
              <TableHead className="w-8 pl-5" />
              <TableHead className="text-[10px] font-semibold text-(--text-tertiary) uppercase tracking-wider w-28">
                Type
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-(--text-tertiary) uppercase tracking-wider">
                Message
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-(--text-tertiary) uppercase tracking-wider w-40">
                Resource ID
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-(--text-tertiary) uppercase tracking-wider w-40 text-right pr-5">
                Timestamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-(--text-tertiary) opacity-20" />
                  <p className="text-sm text-(--text-tertiary)">
                    No events found
                    {search ? " matching your search" : ""}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => {
                const isExpanded = expandedIds.has(entry.id);
                return (
                  <React.Fragment key={entry.id}>
                    <TableRow
                      className="border-b border-(--border-subtle) hover:bg-(--bg-sunken) transition-colors cursor-pointer"
                      onClick={() => toggleExpand(entry.id)}
                    >
                      {/* Expand chevron */}
                      <TableCell className="pl-5 w-8">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-(--text-tertiary)" />
                          : <ChevronRight className="w-3.5 h-3.5 text-(--text-tertiary)" />}
                      </TableCell>

                      {/* Severity icon */}
                      <TableCell className="w-8">
                        <SeverityIcon severity={entry.severity} />
                      </TableCell>

                      {/* Event type badge */}
                      <TableCell>
                        <EventBadge type={entry.eventType} />
                      </TableCell>

                      {/* Message */}
                      <TableCell className="max-w-0 w-full">
                        <p className="text-sm text-(--text-secondary) truncate">
                          {entry.message}
                        </p>
                      </TableCell>

                      {/* Resource ID */}
                      <TableCell>
                        <span className="font-mono text-[10px] text-(--text-tertiary) truncate block max-w-35">
                          {entry.resourceId.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell className="text-right pr-5">
                        <span className="text-[11px] text-(--text-tertiary) whitespace-nowrap">
                          {new Date(entry.occurredAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-(--bg-sunken)">
                        <TableCell colSpan={6} className="px-5 py-3">
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex gap-3">
                              <span className="text-(--text-tertiary) w-20 shrink-0">Message</span>
                              <span className="text-(--text-primary) break-all">{entry.message}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-(--text-tertiary) w-20 shrink-0">Actor</span>
                              <span className="text-(--text-primary)">{entry.actorId}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-(--text-tertiary) w-20 shrink-0">Resource</span>
                              <span className="text-(--text-primary)">{entry.resourceId}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-(--text-tertiary) w-20 shrink-0">Time</span>
                              <span className="text-(--text-primary)">{new Date(entry.occurredAt).toISOString()}</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-(--text-tertiary)">
            {data?.total ?? 0} total events
          </p>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
