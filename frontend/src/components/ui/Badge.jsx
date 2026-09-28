import React from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = {
  default:
    "bg-slate-100 dark:bg-[#23261E] text-slate-700 dark:text-[#D8CFBC] border-slate-200/80 dark:border-[#33372B]",
  brand:
    "bg-[#11120D] text-[#FFFBF4] dark:bg-[#D8CFBC]/15 dark:text-[#D8CFBC] border-[#565449]/40 dark:border-[#D8CFBC]/30",
  bone:
    "bg-[#D8CFBC]/25 text-[#565449] dark:text-[#D8CFBC] border-[#D8CFBC]/50 dark:border-[#D8CFBC]/30",
  success:
    "bg-[#D8CFBC]/20 text-[#565449] dark:text-[#D8CFBC] border-[#D8CFBC]/40 dark:border-[#D8CFBC]/30",
  warning:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-500/20",
  danger:
    "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-500/20",
  info:
    "bg-[#D8CFBC]/20 text-[#565449] dark:text-[#D8CFBC] border-[#D8CFBC]/40 dark:border-[#D8CFBC]/30",
};

const dotColors = {
  default: "bg-slate-400 dark:bg-slate-500",
  brand: "bg-[#D8CFBC]",
  bone: "bg-[#D8CFBC]",
  success: "bg-[#565449] dark:bg-[#D8CFBC]",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
  info: "bg-[#565449] dark:bg-[#D8CFBC]",
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
