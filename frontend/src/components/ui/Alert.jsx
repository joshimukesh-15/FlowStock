"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
const DEFAULT_ICONS = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
};
const VARIANT_STYLES = {
    info: "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200",
    success: "bg-zinc-950 dark:bg-zinc-900 text-white dark:text-zinc-100 border-zinc-900 dark:border-zinc-700 shadow-xs",
    warning: "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
    danger: "bg-zinc-100 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 font-medium",
};
export const Alert = ({ className, variant = "info", icon: CustomIcon, onClose, title, children, ...props }) => {
    const Icon = CustomIcon || DEFAULT_ICONS[variant];
    return (<div role="alert" className={cn("p-3.5 rounded-lg border text-sm flex items-start gap-2.5 transition-colors", VARIANT_STYLES[variant], className)} {...props}>
      {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5"/>}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-0.5 leading-none">{title}</h5>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
      {onClose && (<button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors -mr-1 -mt-1" aria-label="Dismiss alert">
          <X className="w-3.5 h-3.5"/>
        </button>)}
    </div>);
};
