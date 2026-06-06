import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
  SHIPMENT_STATUS_COLORS,
  SHIPMENT_STATUS_LABELS,
  type ShipmentStatus,
  PLAN_COLORS,
  PLAN_LABELS,
  type PlanType,
} from "@/types/enums";

// -- Account status ------------------------------------------------------------

type AccountStatus = "Active" | "PendingApproval" | "Suspended" | "Banned";

const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  Active:          "bg-(--success-bg) text-(--success)",
  PendingApproval: "bg-(--warning-bg) text-(--warning)",
  Suspended:       "bg-(--warning-bg) text-(--warning)",
  Banned:          "bg-(--danger-bg)  text-(--danger)",
};

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  Active:          "Active",
  PendingApproval: "Pending",
  Suspended:       "Suspended",
  Banned:          "Banned",
};

// -- Props ---------------------------------------------------------------------

type StatusBadgeProps = { className?: string } & (
  | { type: "order";    status: OrderStatus    | string }
  | { type: "shipment"; status: ShipmentStatus | string }
  | { type: "account";  status: AccountStatus  | string }
  | { type: "plan";     status: PlanType       | string }
);

// -- Component -----------------------------------------------------------------

export function StatusBadge({ className, type, status }: StatusBadgeProps) {
  let colorClass: string;
  let label: string;

  switch (type) {
    case "order":
      colorClass = ORDER_STATUS_COLORS[status as OrderStatus]
        ?? "bg-(--off-white-2) text-(--text-secondary)";
      label = ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
      break;
    case "shipment":
      colorClass = SHIPMENT_STATUS_COLORS[status as ShipmentStatus]
        ?? "bg-(--off-white-2) text-(--text-secondary)";
      label = SHIPMENT_STATUS_LABELS[status as ShipmentStatus] ?? status;
      break;
    case "account":
      colorClass = ACCOUNT_STATUS_COLORS[status as AccountStatus]
        ?? "bg-(--off-white-2) text-(--text-secondary)";
      label = ACCOUNT_STATUS_LABELS[status as AccountStatus] ?? status;
      break;
    case "plan":
      colorClass = PLAN_COLORS[status as PlanType]
        ?? "bg-(--off-white-2) text-(--text-secondary)";
      label = PLAN_LABELS[status as PlanType] ?? status;
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
