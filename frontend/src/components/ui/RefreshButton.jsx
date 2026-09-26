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
      whileTap={!disabled && !isSpinning && !prefersReducedMotion ? { scale: 0.96 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium select-none cursor-pointer transition-colors duration-150 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF2E] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#14171F] disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-9 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-base",
        variant === "outline" &&
          "border-slate-300 dark:border-[#323744] bg-white dark:bg-[#23262F] text-slate-800 dark:text-[#F4F5F7] hover:bg-slate-50 dark:hover:bg-[#2C303B] hover:text-slate-950 dark:hover:text-white shadow-2xs",
        variant === "primary" &&
          "bg-[#B6FF2E] text-[#14171F] border border-[#B6FF2E] font-semibold hover:bg-[#a3f01b]",
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
              ? "animate-spin text-slate-900 dark:text-[#B6FF2E]"
              : "text-slate-500 dark:text-[#9BA3AF] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-slate-900 dark:group-hover:text-white"
          )}
        />
      </span>
      <span className="whitespace-nowrap">{children || label}</span>
    </motion.button>
  );
}

export default RefreshButton;
