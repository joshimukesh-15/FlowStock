import React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, label, error, id, ...props }, ref) => {
    return (<div className="w-full">
        {label && (<label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[#4C6B55] dark:text-[#CBD5E1] mb-1.5">
            {label}
          </label>)}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-lg border bg-[#F7F3EA] dark:bg-[#1B2A20] px-3 py-2 text-sm text-[#314C3B] dark:text-[#F4F5F7] placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs transition-colors focus:outline-none disabled:bg-[#E2DED2] dark:disabled:bg-slate-950 disabled:text-[#6D8C73] dark:disabled:text-[#4C6B55]",
            error
              ? "border-rose-500 dark:border-rose-500/80 focus:border-rose-600 dark:focus:border-rose-400 focus:ring-1 focus:ring-rose-500"
              : "border-[#BDC9B8] dark:border-[#6D8C73] focus:border-slate-900 dark:focus:border-white focus:ring-1 focus:ring-slate-900 dark:focus:ring-white",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      </div>);
});
Input.displayName = "Input";
