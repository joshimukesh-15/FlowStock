import React from "react";
import {
  Warehouse as WarehouseIcon,
  Package,
  Check,
  Truck,
  Ban,
  Clock,
  ArrowRight,
} from "lucide-react";

export const WarehouseTransferVisualizer = ({ transfer, className = "" }) => {
  if (!transfer) return null;

  const status = transfer.status || "REQUESTED";
  const isRequested = status === "REQUESTED";
  const isTransit = status === "IN_TRANSIT";
  const isReceived = status === "RECEIVED";
  const isCancelled = status === "CANCELLED";

  // Main brand color config (Obsidian #090A0C & Bone #D8CFBC) - NO green
  const config = {
    REQUESTED: {
      label: "Requested",
      detail: "Staged for Dispatch",
      icon: Clock,
      progressWidth: "w-1/3",
      trackColor: "bg-amber-500",
      pillClass:
        "bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-[#FFFBF4] border border-slate-300 dark:border-[#343742]",
      badgeClass:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      iconClass: "text-amber-600 dark:text-amber-400",
      dotClass: "bg-amber-500",
    },
    IN_TRANSIT: {
      label: "In Transit",
      detail: "En Route to Destination",
      icon: Truck,
      progressWidth: "w-2/3",
      trackColor: "bg-[#090A0C] dark:bg-[#D8CFBC]",
      pillClass:
        "bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-[#FFFBF4] border border-slate-300 dark:border-[#343742]",
      badgeClass:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      iconClass: "text-amber-600 dark:text-amber-400",
      dotClass: "bg-amber-500",
    },
    RECEIVED: {
      label: "Delivered",
      detail: "Stock Reconciled",
      icon: Check,
      progressWidth: "w-full",
      trackColor: "bg-[#090A0C] dark:bg-[#D8CFBC]",
      pillClass:
        "bg-[#090A0C] text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] border border-[#090A0C] dark:border-[#D8CFBC]",
      badgeClass:
        "bg-[#090A0C] text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] border border-[#090A0C] dark:border-[#D8CFBC]",
      iconClass: "text-[#D8CFBC] dark:text-[#090A0C]",
      dotClass: "bg-[#D8CFBC] dark:bg-[#090A0C]",
    },
    CANCELLED: {
      label: "Cancelled",
      detail: "Transfer Terminated",
      icon: Ban,
      progressWidth: "w-1/3",
      trackColor: "bg-rose-500",
      pillClass:
        "bg-white dark:bg-[#1C1E24] text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700/50",
      badgeClass:
        "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      iconClass: "text-rose-600 dark:text-rose-400",
      dotClass: "bg-rose-500",
    },
  }[status] || {
    label: status,
    detail: "Status Logged",
    icon: Package,
    progressWidth: "w-1/3",
    trackColor: "bg-slate-400",
    pillClass:
      "bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-[#D8CFBC] border border-slate-300 dark:border-[#343742]",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-[#1E2026] dark:text-[#D8CFBC] border-slate-200 dark:border-[#343742]",
    iconClass: "text-slate-600 dark:text-[#D8CFBC]",
    dotClass: "bg-slate-400",
  };

  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-[#22242B] bg-white dark:bg-[#121316] p-5 sm:p-6 text-slate-900 dark:text-[#F4F5F7] shadow-xs space-y-5 ${className}`}
    >
      {/* Route Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-[#22242B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-slate-700 dark:text-[#D8CFBC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                {transfer.transfer_number}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${config.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                {status}
              </span>
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
          <div className="text-[11px] text-slate-500 dark:text-[#808594] truncate max-w-[220px]">
            {transfer.product?.name || "Product Item"}
          </div>
        </div>
      </div>

      {/* Main Route Corridor (Clean, Wide, Static, Luxury Finish) */}
      <div className="rounded-xl border border-slate-200/80 dark:border-[#22242B] bg-slate-50/70 dark:bg-[#0B0C0E] p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Origin Facility (Left) */}
          <div className="flex flex-col items-center text-center shrink-0 w-44">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
              Origin
            </span>
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center text-slate-900 dark:text-[#D8CFBC] shadow-xs">
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2.5 text-center leading-snug w-full"
              title={transfer.source_warehouse?.name}
            >
              {transfer.source_warehouse?.name || "Source Warehouse"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-1 px-2 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.source_warehouse?.code || "SRC"}
            </span>
          </div>

          {/* Center Corridor & Single Main-Color Status Capsule */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-w-[200px] px-2 sm:px-4">
            {/* The Horizontal Route Rail */}
            <div className="relative w-full flex items-center justify-center">
              {/* Background Track Line */}
              <div className="absolute left-0 right-0 h-1 rounded-full bg-slate-200 dark:bg-[#22242B]" />

              {/* Progress Rail (Main Brand Color: Obsidian / Bone) */}
              <div
                className={`absolute left-0 h-1 rounded-full ${config.progressWidth} ${config.trackColor} transition-all duration-300`}
              />

              {/* Directional Terminal Arrow */}
              <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-[#3A3D47]" />

              {/* Compact Unified Status Capsule */}
              <div
                className={`relative z-10 px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-2 transition-colors ${config.pillClass}`}
              >
                <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${config.iconClass}`} />
                <span className="text-xs font-bold tracking-tight whitespace-nowrap">
                  {config.label}
                </span>
                <span className="text-[10px] opacity-75 font-mono whitespace-nowrap">
                  • {config.detail}
                </span>
              </div>
            </div>
          </div>

          {/* Destination Facility (Right) */}
          <div className="flex flex-col items-center text-center shrink-0 w-44">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isReceived
                    ? "bg-[#090A0C] dark:bg-[#D8CFBC]"
                    : "bg-slate-400 dark:bg-slate-500"
                }`}
              />
              Destination
            </span>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs transition-colors border ${
                isReceived
                  ? "bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C] border-[#090A0C] dark:border-[#D8CFBC]"
                  : "bg-white dark:bg-[#18191E] border-slate-200 dark:border-[#262833] text-slate-700 dark:text-[#D8CFBC]"
              }`}
            >
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2.5 text-center leading-snug w-full"
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
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-[#808594]">
            Product SKU:
          </span>
          <span className="font-mono font-semibold text-slate-900 dark:text-[#FFFBF4]">
            {transfer.product?.sku || "N/A"}
          </span>
        </div>

        {transfer.notes && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-[#808594] shrink-0">
              Routing Notes:
            </span>
            <span className="text-slate-600 dark:text-[#CBD5E1] truncate max-w-sm">
              {transfer.notes}
            </span>
          </div>
        )}

        {transfer.created_at && (
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-[#808594] font-mono text-[10px]">
            <span>Created:</span>
            <span>{new Date(transfer.created_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
