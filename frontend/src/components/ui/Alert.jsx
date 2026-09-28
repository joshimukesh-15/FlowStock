"use client";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
const DEFAULT_ICONS = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
};
const VARIANT_STYLES = {
    info: "bg-slate-100 dark:bg-[#23261E]/50 border-slate-200 dark:border-[#3A404F] text-slate-800 dark:text-[#E2E8F0]",
    success: "bg-slate-950 dark:bg-[#191B15] text-white dark:text-[#F4F5F7] border-zinc-900 dark:border-[#3A404F] shadow-xs",
    warning: "bg-slate-100 dark:bg-[#23261E]/50 border-slate-300 dark:border-[#3A404F] text-slate-900 dark:text-[#F4F5F7]",
    danger: "bg-slate-100 dark:bg-[#191B15]/60 border-slate-300 dark:border-[#33372B] text-slate-900 dark:text-[#E2E8F0] font-medium",
};
export const Alert = ({ className, variant = "info", icon: CustomIcon, onClose, title, children, ...props }) => {
    const Icon = CustomIcon || DEFAULT_ICONS[variant];
    return (<div role="alert" className={cn("p-3.5 rounded-lg border text-sm flex items-start gap-2.5 transition-colors", VARIANT_STYLES[variant], className)} {...props}>
      {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5"/>}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-0.5 leading-none">{title}</h5>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
      {onClose && (<button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors -mr-1 -mt-1" aria-label="Dismiss alert">
          <X className="w-3.5 h-3.5"/>
        </button>)}
    </div>);
};
