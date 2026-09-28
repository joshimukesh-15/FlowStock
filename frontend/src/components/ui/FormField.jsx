"use client";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard Reusable FormField wrapper with consistent label, error, and hint styling.
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-medium text-slate-700 dark:text-[#CBD5E1]"
        >
          {label}
          {required && !String(label).includes("*") && (
            <span className="text-rose-500 ml-0.5">*</span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11px] text-slate-500 dark:text-[#9BA3AF] mt-0.5">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
