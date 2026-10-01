import React from "react";
import {
  Warehouse as WarehouseIcon,
  Package,
  CheckCircle2,
  Truck,
  Ban,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const WarehouseTransferVisualizer = ({ transfer, className = "" }) => {
  if (!transfer) return null;

  const status = transfer.status || "REQUESTED";
  const isRequested = status === "REQUESTED";
  const isTransit = status === "IN_TRANSIT";
  const isReceived = status === "RECEIVED";
  const isCancelled = status === "CANCELLED";

  // Step indices: 1 = Requested, 2 = In Transit, 3 = Received
  const currentStep = isCancelled ? 0 : isReceived ? 3 : isTransit ? 2 : 1;

  // Status configuration
  const config = {
    REQUESTED: {
      label: "Requested",
      subtext: "Awaiting Dispatch",
      badgeVariant: "warning",
      icon: Clock,
      pillClass:
        "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      dotClass: "bg-amber-500",
    },
    IN_TRANSIT: {
      label: "In Transit",
      subtext: "En Route to Destination",
      badgeVariant: "warning",
      icon: Truck,
      pillClass:
        "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      dotClass: "bg-amber-500",
    },
    RECEIVED: {
      label: "Delivered",
      subtext: "Stock Reconciled",
      badgeVariant: "success",
      icon: CheckCircle2,
      pillClass:
        "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      dotClass: "bg-emerald-500",
    },
    CANCELLED: {
      label: "Cancelled",
      subtext: "Transfer Terminated",
      badgeVariant: "danger",
      icon: Ban,
      pillClass:
        "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
      dotClass: "bg-rose-500",
    },
  }[status] || {
    label: status,
    subtext: "Live Status",
    badgeVariant: "default",
    icon: Package,
    pillClass:
      "bg-slate-100 dark:bg-[#1E2026] text-slate-700 dark:text-[#D8CFBC] border-slate-200 dark:border-[#2D3039]",
    dotClass: "bg-slate-400",
  };

  const StatusIcon = config.icon;

  const STEPS = [
    { num: 1, label: "Requested" },
    { num: 2, label: "In Transit" },
    { num: 3, label: "Delivered" },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-[#22242B] bg-white dark:bg-[#121316] p-5 text-slate-900 dark:text-[#F4F5F7] shadow-xs space-y-5 ${className}`}
    >
      {/* Route Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-[#22242B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-slate-700 dark:text-[#D8CFBC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                {transfer.transfer_number}
              </span>
              <Badge variant={config.badgeVariant} className="text-[10px] py-0 px-2">
                {status}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#808594] font-mono mt-0.5">
              Inter-Facility Transfer Corridor
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#18191E] border border-slate-200/80 dark:border-[#22242B] text-right">
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
            {transfer.quantity} {transfer.product?.unit || "units"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#808594] truncate max-w-[180px]">
            {transfer.product?.name || "Product Item"}
          </div>
        </div>
      </div>

      {/* Main Route Map (Static Live Type) */}
      <div className="rounded-xl border border-slate-200/80 dark:border-[#22242B] bg-slate-50/60 dark:bg-[#0E0F12] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Origin Facility */}
          <div className="flex flex-col items-center text-center shrink-0 w-32 sm:w-36">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              Origin
            </span>
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center text-slate-800 dark:text-[#D8CFBC] shadow-2xs">
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2.5 line-clamp-1 w-full"
              title={transfer.source_warehouse?.name}
            >
              {transfer.source_warehouse?.name || "Source WH"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-0.5 px-2 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.source_warehouse?.code || "SRC"}
            </span>
          </div>

          {/* Center Corridor & Single Static Live Pill */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-[160px] px-2">
            {/* Horizontal Line with Center Pill */}
            <div className="relative w-full flex items-center justify-center">
              {/* Solid Track Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-slate-200 dark:bg-[#262833]" />

              {/* Progress Line Fill */}
              {!isCancelled && (
                <div
                  className={`absolute left-0 h-0.5 transition-all duration-300 ${
                    isReceived
                      ? "w-full bg-emerald-500"
                      : isTransit
                      ? "w-1/2 bg-amber-500"
                      : "w-0 bg-transparent"
                  }`}
                />
              )}

              {/* Directional arrow at end of track */}
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-[#3A3D47]" />

              {/* Single Static Live Status Pill (Centered on line) */}
              <div
                className={`relative z-10 px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors ${config.pillClass}`}
              >
                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{config.label}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
              </div>
            </div>

            {/* Subtext below the track */}
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-2.5 text-center">
              {config.subtext}
            </span>
          </div>

          {/* Destination Facility */}
          <div className="flex flex-col items-center text-center shrink-0 w-32 sm:w-36">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              Destination
            </span>
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-2xs ${
                isReceived
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-[#18191E] border-slate-200 dark:border-[#262833] text-slate-800 dark:text-[#D8CFBC]"
              }`}
            >
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2.5 line-clamp-1 w-full"
              title={transfer.destination_warehouse?.name}
            >
              {transfer.destination_warehouse?.name || "Dest WH"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#808594] mt-0.5 px-2 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B]">
              {transfer.destination_warehouse?.code || "DEST"}
            </span>
          </div>
        </div>

        {/* Milestone Steps (Static Stepper Bar) */}
        {!isCancelled && (
          <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-[#22242B]/80">
            <div className="flex items-center justify-between max-w-sm mx-auto relative">
              {/* Stepper background connector line */}
              <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-200 dark:bg-[#262833] -z-0" />

              {STEPS.map((step) => {
                const isPassed = currentStep > step.num;
                const isCurrent = currentStep === step.num;

                return (
                  <div key={step.num} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors ${
                        isPassed
                          ? "bg-slate-900 text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] border-slate-900 dark:border-[#D8CFBC]"
                          : isCurrent
                          ? "bg-white dark:bg-[#16171C] text-slate-900 dark:text-white border-slate-900 dark:border-[#D8CFBC] ring-2 ring-slate-900/10 dark:ring-[#D8CFBC]/20"
                          : "bg-white dark:bg-[#18191E] text-slate-400 dark:text-[#7C8189] border-slate-200 dark:border-[#262833]"
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span>{step.num}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono mt-1.5 whitespace-nowrap ${
                        isCurrent
                          ? "font-bold text-slate-900 dark:text-white"
                          : isPassed
                          ? "font-medium text-slate-600 dark:text-[#CBD5E1]"
                          : "text-slate-400 dark:text-[#7C8189]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manifest & Audit Metadata Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] uppercase tracking-wider">
            Product SKU
          </span>
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-[#CBD5E1]">
            {transfer.product?.sku || "N/A"}
          </span>
        </div>

        {transfer.notes && (
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#18191E] border border-slate-200/70 dark:border-[#22242B] flex items-center justify-between gap-2 min-w-0">
            <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] uppercase tracking-wider shrink-0">
              Routing Notes
            </span>
            <span className="font-medium text-slate-700 dark:text-[#CBD5E1] truncate">
              {transfer.notes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
