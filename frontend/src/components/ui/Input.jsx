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
            "w-full rounded-xl border bg-white dark:bg-[#181A20] px-3.5 py-2 text-sm text-slate-900 dark:text-[#FFFBF4] placeholder:text-slate-400 dark:placeholder:text-[#7C8189] shadow-2xs transition-all duration-150 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-[#11120D] disabled:text-slate-400 dark:disabled:text-slate-600",
            error
              ? "border-rose-500 dark:border-rose-500/80 focus:border-rose-600 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
              : "border-slate-200 dark:border-[#33372B] hover:border-slate-300 dark:hover:border-[#565449] focus:border-[#565449] dark:focus:border-[#D8CFBC] focus:ring-2 focus:ring-[#D8CFBC]/25",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      </div>);
});
Input.displayName = "Input";
