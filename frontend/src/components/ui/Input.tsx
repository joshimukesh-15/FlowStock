import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-2xs transition-colors focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:bg-zinc-50 disabled:text-zinc-400",
            error && "border-zinc-900 focus:border-black focus:ring-black",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-zinc-700 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
