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

  // FlowStock main brand color system (Obsidian #090A0C & Bone #D8CFBC)
  const config = {
    REQUESTED: {
      label: "Requested",
      detail: "Staged for Dispatch",
      icon: Clock,
      progressWidth: "w-1/4",
      trackColor: "bg-amber-500",
      pillClass:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
      badgeClass:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      iconClass: "text-amber-600 dark:text-amber-400",
      dotClass: "bg-amber-500",
      corridorText: "Staged for Dispatch",
    },
    IN_TRANSIT: {
      label: "In Transit",
      detail: "En Route to Destination",
      icon: Truck,
      progressWidth: "w-2/3",
      trackColor: "bg-[#090A0C] dark:bg-[#D8CFBC]",
      pillClass:
        "bg-[#090A0C] text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] border border-[#090A0C] dark:border-[#D8CFBC]",
      badgeClass:
        "bg-[#090A0C] text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] border border-[#090A0C] dark:border-[#D8CFBC]",
      iconClass: "text-[#D8CFBC] dark:text-[#090A0C]",
      dotClass: "bg-[#D8CFBC] dark:bg-[#090A0C]",
      corridorText: "En Route in Corridor",
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
      corridorText: "Direct Transit • Reconciled",
    },
    CANCELLED: {
      label: "Cancelled",
      detail: "Transfer Terminated",
      icon: Ban,
      progressWidth: "w-1/4",
      trackColor: "bg-rose-500",
      pillClass:
        "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30",
      badgeClass:
        "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      iconClass: "text-rose-600 dark:text-rose-400",
      dotClass: "bg-rose-500",
      corridorText: "Transfer Cancelled",
    },
  }[status] || {
    label: status,
    detail: "Status Logged",
    icon: Package,
    progressWidth: "w-1/4",
    trackColor: "bg-slate-400",
    pillClass:
      "bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-[#D8CFBC] border border-slate-300 dark:border-[#343742]",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-[#1E2026] dark:text-[#D8CFBC] border border-slate-200 dark:border-[#343742]",
    iconClass: "text-slate-600 dark:text-[#D8CFBC]",
    dotClass: "bg-slate-400",
    corridorText: "Active Transfer",
  };

  const StatusIcon = config.icon;

  const arrowColor =
    isReceived || isTransit
      ? "text-[#090A0C] dark:text-[#D8CFBC]"
      : isCancelled
      ? "text-rose-500"
      : "text-slate-300 dark:text-[#3A3D47]";

  const originDotClass =
    isReceived || isTransit
      ? "bg-[#090A0C] dark:bg-[#D8CFBC]"
      : isRequested
      ? "bg-amber-500"
      : "bg-slate-400 dark:bg-slate-500";

  const destDotClass =
    isReceived
      ? "bg-[#090A0C] dark:bg-[#D8CFBC]"
      : "bg-slate-400 dark:bg-slate-500";

  return (
    <div className={`w-full max-w-full space-y-4 text-slate-900 dark:text-[#F4F5F7] ${className}`}>
      {/* Route Header Info Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-[#22242B] bg-slate-50/60 dark:bg-[#121316]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-4 h-4 text-slate-700 dark:text-[#D8CFBC]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
            <p className="text-[11px] text-slate-400 dark:text-[#808594] font-mono mt-0.5 truncate">
              Inter-Facility Transfer Corridor
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-[#22242B] text-right shrink-0">
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
            {transfer.quantity} {transfer.product?.unit || "units"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#808594] truncate max-w-[180px]">
            {transfer.product?.name || "Product Item"}
          </div>
        </div>
      </div>

      {/* Main Route Corridor (Fluid, Zero-Overlap, Harmonious Left & Right Sizing) */}
      <div className="w-full rounded-xl border border-slate-200/80 dark:border-[#22242B] bg-slate-50/70 dark:bg-[#0B0C0E] p-4 sm:p-6 overflow-hidden">
        {/* Top Centered Status Hero Capsule (Never overlaps route line or arrow) */}
        <div className="flex justify-center mb-5">
          <div
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full shadow-xs transition-colors ${config.pillClass}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${config.iconClass}`} />
            <span className="text-xs font-bold tracking-tight whitespace-nowrap">
              {config.label}
            </span>
            <span className="text-[10px] opacity-75 font-mono whitespace-nowrap hidden sm:inline">
              • {config.detail}
            </span>
          </div>
        </div>

        {/* 3-Column Physical Corridor Path: Origin <---> Rail <---> Destination */}
        <div className="flex items-start justify-between w-full">
          {/* Origin Facility (Left Side) */}
          <div className="w-28 sm:w-36 flex flex-col items-center text-center shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2.5 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${originDotClass}`} />
              Origin
            </span>
            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center text-slate-900 dark:text-[#D8CFBC] shadow-xs">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              {(isReceived || isTransit) && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C] flex items-center justify-center shadow-2xs border border-white dark:border-[#18191E]"
                  title="Dispatched"
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <span
              className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#FFFBF4] mt-2.5 text-center leading-snug w-full break-words"
              title={transfer.source_warehouse?.name}
            >
              {transfer.source_warehouse?.name || "Source Warehouse"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-1 px-1.5 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.source_warehouse?.code || "SRC"}
            </span>
          </div>

          {/* Center Corridor & Route Rail */}
          <div className="flex-1 min-w-0 mx-2 sm:mx-6 flex flex-col items-center justify-start">
            {/* Header spacer aligning with Origin/Destination labels */}
            <div className="h-4 mb-2.5 flex items-center justify-center">
              <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] uppercase tracking-wider">
                Corridor
              </span>
            </div>

            {/* Horizontal Route Rail (48px tall, vertically centered with warehouse icons) */}
            <div className="h-11 sm:h-12 w-full flex items-center relative">
              {/* Background Track Rail */}
              <div className="w-full h-1 sm:h-1.5 rounded-full bg-slate-200 dark:bg-[#22242B]" />

              {/* Progress Rail Fill (Obsidian / Bone brand colors) */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 sm:h-1.5 rounded-full ${config.progressWidth} ${config.trackColor} transition-all duration-300`}
              />

              {/* Mid-Transit Vehicle Marker */}
              {isTransit && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-2/3 w-6 h-6 rounded-full bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C] flex items-center justify-center shadow-xs border border-white dark:border-[#0B0C0E]"
                  title="En route"
                >
                  <Truck className="w-3 h-3" />
                </div>
              )}

              {/* Directional Terminal Arrow (Matches rail color on delivery, no negative margin) */}
              <ArrowRight
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${arrowColor}`}
              />
            </div>

            {/* Route Detail Subtitle */}
            <div className="mt-2.5 text-center">
              <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594]">
                {config.corridorText}
              </span>
            </div>
          </div>

          {/* Destination Facility (Right Side) */}
          <div className="w-28 sm:w-36 flex flex-col items-center text-center shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2.5 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${destDotClass}`} />
              Destination
            </span>
            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center text-slate-900 dark:text-[#D8CFBC] shadow-xs">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              {isReceived && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C] flex items-center justify-center shadow-2xs border border-white dark:border-[#18191E]"
                  title="Delivered & Reconciled"
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <span
              className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#FFFBF4] mt-2.5 text-center leading-snug w-full break-words"
              title={transfer.destination_warehouse?.name}
            >
              {transfer.destination_warehouse?.name || "Dest Warehouse"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-1 px-1.5 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.destination_warehouse?.code || "DEST"}
            </span>
          </div>
        </div>
      </div>

      {/* Manifest & Audit Details Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200/70 dark:border-[#22242B] bg-slate-50/60 dark:bg-[#121316] text-xs">
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
              Notes:
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
