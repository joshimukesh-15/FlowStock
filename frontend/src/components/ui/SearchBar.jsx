"use client";
import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
export const SearchBar = ({ value, onChange, onSubmit, placeholder = "Search...", className, disabled = false, }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit)
            onSubmit(e);
    };
    return (<form onSubmit={handleSubmit} className={cn("relative flex-1", className)}>
      <Search className="w-4 h-4 text-slate-400 dark:text-[#7C8189] absolute left-3 top-2.5 pointer-events-none"/>
      <input type="text" placeholder={placeholder} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-[#3A404F] bg-white dark:bg-[#181A20] text-slate-900 dark:text-[#F4F5F7] placeholder-zinc-400 dark:placeholder-zinc-500 shadow-2xs transition-colors focus:border-zinc-950 dark:focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-200 disabled:opacity-50"/>
      {value && !disabled && (<button type="button" onClick={() => onChange("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors" title="Clear search" aria-label="Clear search">
          <X className="w-3.5 h-3.5"/>
        </button>)}
    </form>);
};
