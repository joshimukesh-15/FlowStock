import React from "react";
import {
  Warehouse as WarehouseIcon,
  Package,
  CheckCircle2,
  Truck,
  Ban,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const WarehouseTransferVisualizer = ({ transfer, className = "" }) => {
  if (!transfer) return null;

  const status = transfer.status || "REQUESTED";
  const isRequested = status === "REQUESTED";
  const isTransit = status === "IN_TRANSIT";
  const isReceived = status === "RECEIVED";
  const isCancelled = status === "CANCELLED";

  // Status configuration - single unified card per status
  const config = {
    REQUESTED: {
      label: "Requested",
      detail: "Staged for Dispatch",
      badgeVariant: "warning",
      icon: Clock,
      progressWidth: "w-1/3",
      progressColor: "bg-amber-500",
      trackDotColor: "bg-amber-500",
      pillClass:
        "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300",
      iconClass: "text-amber-600 dark:text-amber-400",
      liveDot: "bg-amber-500 animate-pulse",
    },
    IN_TRANSIT: {
      label: "In Transit",
      detail: "En Route to Destination",
      badgeVariant: "warning",
      icon: Truck,
      progressWidth: "w-2/3",
      progressColor: "bg-amber-500",
      trackDotColor: "bg-amber-500",
      pillClass:
        "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300",
      iconClass: "text-amber-600 dark:text-amber-400",
      liveDot: "bg-amber-500 animate-pulse",
    },
    RECEIVED: {
      label: "Delivered",
      detail: "Stock Reconciled",
      badgeVariant: "success",
      icon: CheckCircle2,
      progressWidth: "w-full",
      progressColor: "bg-emerald-500",
      trackDotColor: "bg-emerald-500",
      pillClass:
        "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300",
      iconClass: "text-emerald-600 dark:text-emerald-400",
      liveDot: "bg-emerald-500",
    },
    CANCELLED: {
      label: "Cancelled",
      detail: "Transfer Terminated",
      badgeVariant: "danger",
      icon: Ban,
      progressWidth: "w-1/3",
      progressColor: "bg-rose-500",
      trackDotColor: "bg-rose-500",
      pillClass:
        "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/50 text-rose-800 dark:text-rose-300",
      iconClass: "text-rose-600 dark:text-rose-400",
      liveDot: "bg-rose-500",
    },
  }[status] || {
    label: status,
    detail: "Status Logged",
    badgeVariant: "default",
    icon: Package,
    progressWidth: "w-1/3",
    progressColor: "bg-slate-400",
    trackDotColor: "bg-slate-400",
    pillClass:
      "bg-slate-100 dark:bg-[#1E2026] border-slate-300 dark:border-[#2D3039] text-slate-800 dark:text-[#D8CFBC]",
    iconClass: "text-slate-600 dark:text-[#D8CFBC]",
    liveDot: "bg-slate-400",
  };

  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-[#22242B] bg-white dark:bg-[#121316] p-5 text-slate-900 dark:text-[#F4F5F7] shadow-xs space-y-4 ${className}`}
    >
      {/* Route Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#22242B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-slate-700 dark:text-[#D8CFBC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                {transfer.transfer_number}
              </span>
              <Badge variant={config.badgeVariant} className="text-[10px] py-0 px-2 font-mono">
                {status}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-[#808594] font-mono mt-0.5">
              Inter-Facility Transfer Corridor
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#18191E] border border-slate-200/80 dark:border-[#22242B] text-right">
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
            {transfer.quantity} {transfer.product?.unit || "units"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#808594] truncate max-w-[200px]">
            {transfer.product?.name || "Product Item"}
          </div>
        </div>
      </div>

      {/* Main Route Canvas */}
      <div className="rounded-xl border border-slate-200/80 dark:border-[#22242B] bg-slate-50/70 dark:bg-[#0E0F12] p-6">
        <div className="flex items-center justify-between gap-6">
          {/* Origin Facility (Left) */}
          <div className="flex flex-col items-center text-center shrink-0 w-40">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
              Origin
            </span>
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center text-slate-800 dark:text-[#D8CFBC] shadow-2xs">
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2 text-center leading-snug w-full"
              title={transfer.source_warehouse?.name}
            >
              {transfer.source_warehouse?.name || "Source Warehouse"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-1 px-2 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.source_warehouse?.code || "SRC"}
            </span>
          </div>

          {/* Center Corridor Track & Unified Status Capsule */}
          <div className="flex-1 flex items-center justify-center relative min-w-[200px]">
            {/* The Horizontal Route Rail */}
            <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-200/80 dark:bg-[#262833] overflow-hidden">
              {/* Progress Line Fill */}
              <div
                className={`h-full ${config.progressWidth} ${config.progressColor} transition-all duration-300`}
              />
            </div>

            {/* Right Directional Arrow Cap on the Rail */}
            <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-[#3A3D47]" />

            {/* The Center Live-Status Capsule (Single, Perfectly Centered) */}
            <div
              className={`relative z-10 px-4 py-1.5 rounded-full border shadow-xs flex items-center gap-2.5 transition-colors ${config.pillClass}`}
            >
              <StatusIcon className={`w-4 h-4 shrink-0 ${config.iconClass}`} />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-bold tracking-tight">
                  {config.label}
                </span>
                <span className="text-[10px] opacity-75 font-medium">
                  • {config.detail}
                </span>
              </div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${config.liveDot}`} />
            </div>
          </div>

          {/* Destination Facility (Right) */}
          <div className="flex flex-col items-center text-center shrink-0 w-40">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isReceived ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
                }`}
              />
              Destination
            </span>
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-2xs transition-colors ${
                isReceived
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-[#18191E] border-slate-200 dark:border-[#262833] text-slate-800 dark:text-[#D8CFBC]"
              }`}
            >
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2 text-center leading-snug w-full"
              title={transfer.destination_warehouse?.name}
            >
              {transfer.destination_warehouse?.name || "Dest Warehouse"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-1 px-2 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.destination_warehouse?.code || "DEST"}
            </span>
          </div>
        </div>
      </div>

      {/* Manifest & Audit Details Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] uppercase tracking-wider font-semibold">
            Product SKU:
          </span>
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-[#CBD5E1]">
            {transfer.product?.sku || "N/A"}
          </span>
        </div>

        {transfer.notes && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] uppercase tracking-wider font-semibold shrink-0">
              Notes:
            </span>
            <span className="text-slate-600 dark:text-[#CBD5E1] truncate max-w-xs">
              {transfer.notes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
