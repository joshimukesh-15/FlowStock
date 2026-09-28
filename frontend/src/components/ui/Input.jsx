import React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, label, error, id, ...props }, ref) => {
    return (<div className="w-full">
        {label && (<label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#CBD5E1] mb-1.5">
            {label}
          </label>)}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-lg border bg-white dark:bg-[#191B15] px-3 py-2 text-sm text-slate-900 dark:text-[#F4F5F7] placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs transition-colors focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600",
            error
              ? "border-rose-500 dark:border-rose-500/80 focus:border-rose-600 dark:focus:border-rose-400 focus:ring-1 focus:ring-rose-500"
              : "border-slate-300 dark:border-[#3A404F] focus:border-slate-900 dark:focus:border-white focus:ring-1 focus:ring-slate-900 dark:focus:ring-white",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      </div>);
});
Input.displayName = "Input";
