import React from "react";
import { cn } from "@/lib/utils";
export const badgeVariants = {
    default: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-medium",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-medium",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 font-medium",
};
export const Badge = ({ className, variant = "default", children, ...props }) => {
    return (<span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border tracking-wide", badgeVariants[variant], className)} {...props}>
      {children}
    </span>);
};
