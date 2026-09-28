"use client";
import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { clearApiCache } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Premium RefreshButton component.
 * Features:
 * - Anticipatory 45-degree hover tilt
 * - Rock-solid, zero-layout-shift container
 * - Smooth 360-degree continuous spin during data refresh without rewind or glitch
 * - Physics spring tap feedback
 */
export function RefreshButton({
  onClick,
  isRefreshing = false,
  disabled = false,
  label = "Refresh",
  className = "",
  size = "sm",
  variant = "outline",
  iconClassName = "w-3.5 h-3.5",
  children,
  ...props
}) {
  const [internalSpin, setInternalSpin] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const isSpinning = isRefreshing || internalSpin;

  const handleClick = async (e) => {
    if (isSpinning || disabled) return;
    setInternalSpin(true);

    // Invalidate stale in-memory cached responses so refresh pulls fresh data from backend
    try {
      clearApiCache();
    } catch {
      // Ignore cache clearing errors if not applicable
    }

    const minAnimationPromise = new Promise((resolve) => setTimeout(resolve, 750));

    try {
      if (onClick) {
        await Promise.all([onClick(e), minAnimationPromise]);
      } else {
        await minAnimationPromise;
      }
    } catch (err) {
      console.error("Refresh action failed:", err);
    } finally {
      setInternalSpin(false);
    }
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-busy={isSpinning}
      aria-label={typeof children === "string" ? children : label}
      onClick={handleClick}
      whileTap={!disabled && !isSpinning && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium leading-none whitespace-nowrap select-none cursor-pointer tracking-tight transition-all duration-150 ease-out outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11120D] disabled:opacity-50 disabled:pointer-events-none",
        size === "xs" && "h-7 px-2.5 text-xs",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-9 px-3.5 text-xs sm:text-sm",
        size === "lg" && "h-10 px-4 text-sm font-medium",
        size === "xl" && "h-11 px-5 text-base font-semibold",
        variant === "outline" &&
          "border-slate-300 dark:border-[#33372B] bg-white dark:bg-[#191B15] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-50 dark:hover:bg-[#191B15] hover:text-slate-900 dark:hover:text-white shadow-2xs",
        variant === "primary" &&
          "bg-[#D8CFBC] text-[#11120D] border border-[#FFFBF4] font-semibold hover:bg-[#FFFBF4] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_3px_rgba(216,207,188,0.2)] hover:shadow-[0_2px_8px_rgba(216,207,188,0.35)]",
        isSpinning && "cursor-wait",
        className
      )}
      {...props}
    >
      <span className="grid place-items-center w-3.5 h-3.5 shrink-0 overflow-visible">
        <RefreshCw
          className={cn(
            iconClassName,
            "origin-center transition-colors duration-200",
            isSpinning && !prefersReducedMotion
              ? "animate-spin text-slate-900 dark:text-[#D8CFBC]"
              : "text-slate-500 dark:text-[#9BA3AF] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-slate-900 dark:group-hover:text-white"
          )}
        />
      </span>
      <span className="whitespace-nowrap">{children || label}</span>
    </motion.button>
  );
}

export default RefreshButton;
