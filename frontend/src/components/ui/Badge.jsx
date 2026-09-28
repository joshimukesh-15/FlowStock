import React from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = {
  default:
    "bg-slate-100 dark:bg-[#1E222B] text-slate-700 dark:text-[#CBD5E1] border-slate-200/80 dark:border-[#323744]",
  brand:
    "bg-slate-900 dark:bg-[#8EB69B]/15 text-white dark:text-[#8EB69B] border-slate-800 dark:border-[#8EB69B]/30",
  success:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-500/20",
  warning:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-500/20",
  danger:
    "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-500/20",
  info:
    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-500/20",
};

const dotColors = {
  default: "bg-slate-400 dark:bg-slate-500",
  brand: "bg-[#8EB69B]",
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
  info: "bg-blue-500 dark:bg-blue-400",
};

export const Badge = ({ className, variant = "default", showDot = true, children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight border transition-colors select-none",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

export default Badge;
