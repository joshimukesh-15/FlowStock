import React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, label, error, id, ...props }, ref) => {
    return (<div className="w-full">
        {label && (<label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            {label}
          </label>)}
        <input id={id} ref={ref} className={cn("w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-2xs transition-colors focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-200 disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600", error && "border-zinc-900 dark:border-zinc-100 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white", className)} {...props}/>
        {error && <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium">{error}</p>}
      </div>);
});
Input.displayName = "Input";
