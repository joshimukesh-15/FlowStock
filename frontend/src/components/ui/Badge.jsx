import React from "react";
import { cn } from "@/lib/utils";
export const badgeVariants = {
    default: "bg-slate-100 dark:bg-[#2C303B] text-slate-700 dark:text-[#9BA3AF] border-slate-200 dark:border-[#323744]",
    brand: "bg-[#B6FF2E]/15 text-slate-900 dark:text-[#B6FF2E] border-[#B6FF2E]/30 font-medium",
    success: "bg-emerald-500/12 text-emerald-700 dark:text-[#10B981] border-emerald-500/25 font-medium",
    warning: "bg-amber-500/12 text-amber-700 dark:text-[#F59E0B] border-amber-500/25 font-medium",
    danger: "bg-rose-500/12 text-rose-700 dark:text-[#EF4444] border-rose-500/25 font-medium",
    info: "bg-blue-500/12 text-blue-700 dark:text-[#3B82F6] border-blue-500/25 font-medium",
};
export const Badge = ({ className, variant = "default", children, ...props }) => {
    return (<span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border tracking-wide", badgeVariants[variant], className)} {...props}>
      {children}
    </span>);
};
