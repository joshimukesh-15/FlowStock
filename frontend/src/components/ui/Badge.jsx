import React from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = {
  default:
    "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 shadow-xs",
  brand:
    "bg-slate-900 dark:bg-[#B6FF2E]/10 text-white dark:text-[#B6FF2E] border-slate-800 dark:border-[#B6FF2E]/20 shadow-sm",
  success:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20 shadow-xs",
  warning:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20 shadow-xs",
  danger:
    "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20 shadow-xs",
  info:
    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20 shadow-xs",
};

const dotColors = {
  default: "bg-slate-400",
  brand: "bg-[#B6FF2E]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-blue-500",
};

export const Badge = ({ className, variant = "default", showDot = true, children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-colors",
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
