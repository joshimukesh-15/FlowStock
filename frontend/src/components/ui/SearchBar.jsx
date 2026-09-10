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
      <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5 pointer-events-none"/>
      <input type="text" placeholder={placeholder} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-2xs transition-colors focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-200 disabled:opacity-50"/>
      {value && !disabled && (<button type="button" onClick={() => onChange("")} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors" title="Clear search" aria-label="Clear search">
          <X className="w-3.5 h-3.5"/>
        </button>)}
    </form>);
};
