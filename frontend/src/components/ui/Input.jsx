import React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, label, error, id, ...props }, ref) => {
    return (<div className="w-full">
        {label && (<label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#CBD5E1] mb-1.5">
            {label}
          </label>)}
        <input id={id} ref={ref} className={cn("w-full rounded-lg border border-slate-300 dark:border-[#3A404F] bg-white dark:bg-[#181A20] px-3 py-2 text-sm text-slate-900 dark:text-[#F4F5F7] placeholder-zinc-400 dark:placeholder-zinc-500 shadow-2xs transition-colors focus:border-zinc-950 dark:focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-200 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600", error && "border-zinc-900 dark:border-slate-100 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white", className)} {...props}/>
        {error && <p className="mt-1 text-xs text-slate-700 dark:text-[#CBD5E1] font-medium">{error}</p>}
      </div>);
});
Input.displayName = "Input";
