import { motion } from "framer-motion";
import {
  Warehouse as WarehouseIcon,
  Package,
  CheckCircle2,
  Truck,
  Ban,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useReducedMotion } from "@/motion";
import { Badge } from "@/components/ui/Badge";

export const WarehouseTransferVisualizer = ({ transfer, className = "" }) => {
  const prefersReducedMotion = useReducedMotion();
  const status = transfer?.status || "REQUESTED";
  const isRequested = status === "REQUESTED";
  const isTransit = status === "IN_TRANSIT";
  const isReceived = status === "RECEIVED";
  const isCancelled = status === "CANCELLED";

  // Color config based on status
  const theme = isCancelled
    ? {
        accent: "#F43F5E",
        bgLight: "bg-rose-500/10",
        borderLight: "border-rose-500/30",
        text: "text-rose-600 dark:text-rose-400",
        stroke: "#F43F5E",
        badgeVariant: "danger",
      }
    : isReceived
    ? {
        accent: "#10B981",
        bgLight: "bg-emerald-500/10",
        borderLight: "border-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400",
        stroke: "#10B981",
        badgeVariant: "success",
      }
    : isTransit
    ? {
        accent: "#F59E0B",
        bgLight: "bg-amber-500/10",
        borderLight: "border-amber-500/30",
        text: "text-amber-600 dark:text-amber-400",
        stroke: "#F59E0B",
        badgeVariant: "warning",
      }
    : {
        // REQUESTED
        accent: "#D97706",
        bgLight: "bg-amber-500/10",
        borderLight: "border-amber-500/30",
        text: "text-amber-600 dark:text-amber-400",
        stroke: "#F59E0B",
        badgeVariant: "warning",
      };

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-[#22242B] bg-slate-50/70 dark:bg-[#0E0F12] p-4 sm:p-5 text-slate-900 dark:text-[#F4F5F7] shadow-xs ${className}`}
    >
      {/* Top Route Manifest Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-4 border-b border-slate-200/80 dark:border-[#1E2026]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center shrink-0">
            <Truck className="w-3.5 h-3.5 text-slate-700 dark:text-[#D8CFBC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
                {transfer.transfer_number}
              </span>
              <Badge variant={theme.badgeVariant} className="text-[10px] py-0 px-2">
                {status}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-[#808594] font-mono mt-0.5">
              Inter-Facility Transfer Corridor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#16171C] border border-slate-200/80 dark:border-[#22242B] text-right shadow-2xs">
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              {transfer.quantity} {transfer.product?.unit || "units"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#808594] block truncate max-w-[140px]">
              {transfer.product?.name || "Product"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Motion Route Corridor */}
      <div className="relative rounded-xl border border-slate-200/80 dark:border-[#1E2026] bg-white dark:bg-[#121316] p-4 sm:p-6 overflow-hidden shadow-xs">
        {/* Subtle Background Circuit Grid Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "20px 20px",
            color: "#94a3b8",
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
          {/* Source Facility Node */}
          <div className="flex flex-col items-center text-center shrink-0 w-28 sm:w-36">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              Source
            </span>
            <div className="relative group">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#262833] flex items-center justify-center text-slate-800 dark:text-[#D8CFBC] shadow-xs transition-transform duration-200 group-hover:scale-105">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121316] shadow-xs" />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2.5 line-clamp-1 w-full"
              title={transfer.source_warehouse?.name}
            >
              {transfer.source_warehouse?.name || "Source WH"}
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#18191E] border border-slate-200/60 dark:border-[#22242B]">
              {transfer.source_warehouse?.code || "SRC"}
            </span>
          </div>

          {/* Central Animated Route Corridor */}
          <div className="flex-1 relative flex flex-col items-center justify-center min-w-[140px] px-1 sm:px-4">
            {/* SVG Corridor Track with Motion Flow */}
            <div className="w-full relative h-14 flex items-center justify-center">
              <svg
                className="w-full h-8 overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 24"
              >
                {/* Underlay Guide Line */}
                <line
                  x1="0"
                  y1="12"
                  x2="100"
                  y2="12"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-[#22242B]"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Animated Directional Flow (Dashed Stream) */}
                {!isCancelled && (
                  <motion.line
                    x1="0"
                    y1="12"
                    x2="100"
                    y2="12"
                    stroke={theme.stroke}
                    strokeWidth="2.5"
                    strokeDasharray={isReceived ? "100 0" : "4 4"}
                    animate={
                      prefersReducedMotion || isReceived
                        ? {}
                        : {
                            strokeDashoffset: [0, -16],
                          }
                    }
                    transition={{
                      repeat: Infinity,
                      duration: isTransit ? 0.8 : 1.2,
                      ease: "linear",
                    }}
                    strokeLinecap="round"
                    strokeOpacity={isReceived ? 1 : 0.85}
                  />
                )}

                {/* Cancelled Broken Line Indicator */}
                {isCancelled && (
                  <line
                    x1="0"
                    y1="12"
                    x2="100"
                    y2="12"
                    stroke="#F43F5E"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.5"
                  />
                )}
              </svg>

              {/* Dynamic Traveling Beacon Pulse (Left to Right along path) */}
              {(isRequested || isTransit) && !prefersReducedMotion && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full pointer-events-none flex items-center justify-center"
                  animate={{
                    left: ["0%", "100%"],
                    opacity: [0, 0.9, 1, 0.9, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: isTransit ? 2.2 : 3.4,
                    ease: "easeInOut",
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-lg"
                    style={{
                      backgroundColor: theme.accent,
                      boxShadow: `0 0 10px ${theme.accent}`,
                    }}
                  />
                </motion.div>
              )}

              {/* Central Motion Hardware Pod (The Center Part) */}
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: [0, -3, 0],
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut",
                }}
                className="absolute z-20 flex flex-col items-center"
              >
                {/* Tactile Capsule Card */}
                <div className="relative group/pill">
                  {/* Subtle Radar Ripple Glow */}
                  {(isRequested || isTransit) && !prefersReducedMotion && (
                    <motion.div
                      animate={{
                        scale: [1, 1.25, 1.45],
                        opacity: [0.6, 0.25, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.4,
                        ease: "easeOut",
                      }}
                      className="absolute -inset-1 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${theme.accent}40 0%, transparent 70%)`,
                      }}
                    />
                  )}

                  {/* High-Precision Hardware Capsule */}
                  <div className="relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-[#16171C] border border-slate-200/90 dark:border-[#2D3039] shadow-md dark:shadow-black/40 backdrop-blur-md">
                    {/* Status Icon with Animated Beacon */}
                    <div className="relative flex items-center justify-center">
                      {(isRequested || isTransit) && !prefersReducedMotion && (
                        <span
                          className="absolute w-4 h-4 rounded-full animate-ping opacity-40"
                          style={{ backgroundColor: theme.accent }}
                        />
                      )}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center relative shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: `${theme.accent}18`,
                          color: theme.accent,
                        }}
                      >
                        {isTransit ? (
                          <Truck className="w-3 h-3" />
                        ) : isReceived ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : isCancelled ? (
                          <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        ) : (
                          <Package className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    {/* Status Label */}
                    <span className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight whitespace-nowrap">
                      {isTransit
                        ? "In Transit"
                        : isReceived
                        ? "Delivered"
                        : isCancelled
                        ? "Cancelled"
                        : "Requested"}
                    </span>

                    {/* Directional Flow Chevrons */}
                    {!isReceived && !isCancelled && (
                      <div className="flex items-center text-amber-500 dark:text-amber-400 font-mono text-[11px] font-bold leading-none select-none">
                        <motion.span
                          animate={
                            prefersReducedMotion
                              ? {}
                              : { opacity: [0.2, 1, 0.2] }
                          }
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            delay: 0,
                          }}
                        >
                          ›
                        </motion.span>
                        <motion.span
                          animate={
                            prefersReducedMotion
                              ? {}
                              : { opacity: [0.2, 1, 0.2] }
                          }
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            delay: 0.2,
                          }}
                        >
                          ›
                        </motion.span>
                        <motion.span
                          animate={
                            prefersReducedMotion
                              ? {}
                              : { opacity: [0.2, 1, 0.2] }
                          }
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            delay: 0.4,
                          }}
                        >
                          ›
                        </motion.span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Telemetry Tag below the capsule */}
                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/90 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#2D3039] text-[10px] font-mono text-slate-500 dark:text-[#9BA3AF] shadow-2xs whitespace-nowrap">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isReceived
                        ? "bg-emerald-500"
                        : isCancelled
                        ? "bg-rose-500"
                        : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span>
                    {isTransit
                      ? "En Route • Active Dispatch"
                      : isReceived
                      ? "Completed • Stock Reconciled"
                      : isCancelled
                      ? "Terminated • Route Severed"
                      : "Awaiting Dispatch • Route Staged"}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Destination Facility Node */}
          <div className="flex flex-col items-center text-center shrink-0 w-28 sm:w-36">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#808594] mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              Destination
            </span>
            <div className="relative group">
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                  isReceived
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-[#18191E] border-slate-200 dark:border-[#262833] text-slate-800 dark:text-[#D8CFBC]"
                }`}
              >
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#121316] shadow-xs ${
                  isReceived ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
            </div>
            <span
              className="text-xs font-bold text-slate-900 dark:text-[#FFFBF4] mt-2.5 line-clamp-1 w-full"
              title={transfer.destination_warehouse?.name}
            >
              {transfer.destination_warehouse?.name || "Dest WH"}
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-[#808594] mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#18191E] border border-slate-200/60 dark:border-[#22242B]">
              {transfer.destination_warehouse?.code || "DEST"}
            </span>
          </div>
        </div>
      </div>

      {/* Manifest Route Notes & Audit Meta */}
      {transfer.notes && (
        <div className="mt-3.5 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-[#14151A] border border-slate-200/70 dark:border-[#22242B] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-[#9BA3AF] truncate min-w-0">
            <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-[#808594] uppercase tracking-wider shrink-0">
              Routing Notes:
            </span>
            <span className="truncate text-slate-700 dark:text-[#CBD5E1]">
              {transfer.notes}
            </span>
          </div>
          {transfer.created_at && (
            <span className="font-mono text-[10px] text-slate-400 dark:text-[#808594] shrink-0">
              Created: {new Date(transfer.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
