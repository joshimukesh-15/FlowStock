"use client";
import React from "react";
import { cn } from "@/lib/utils";
export function StatRow({ items, children, columns = 4, className = "", }) {
    const colClassMap = {
        2: "sm:grid-cols-2",
        3: "sm:grid-cols-3",
        4: "sm:grid-cols-2 lg:grid-cols-4",
        5: "sm:grid-cols-3 lg:grid-cols-5",
        6: "sm:grid-cols-3 lg:grid-cols-6",
    };
    return (<div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none overflow-hidden", className)}>
      <div className={cn("grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800", colClassMap[columns])}>
        {items
            ? items.map((item, idx) => (<StatCol key={item.id || idx} label={item.label} value={item.value} subtext={item.subtext} badge={item.badge} icon={item.icon} progress={item.progress}/>))
            : children}
      </div>
    </div>);
}
export function StatCol({ label, value, subtext, badge, icon: Icon, progress, className = "", onClick, }) {
    return (<div onClick={onClick} className={cn("p-3.5 sm:p-4 flex flex-col justify-between transition-colors", onClick && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50", className)}>
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0"/>}
            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {label}
            </span>
          </div>
          {badge}
        </div>

        <div className="mt-1.5 text-lg sm:text-xl font-semibold tracking-tight tabular-nums font-mono text-zinc-950 dark:text-zinc-100">
          {value}
        </div>
      </div>

      {subtext && (<div className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
          {subtext}
        </div>)}

      {progress !== undefined && (<div className="mt-2 w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}/>
        </div>)}
    </div>);
}
