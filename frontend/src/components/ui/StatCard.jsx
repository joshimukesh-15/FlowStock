"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { KpiTrend } from "@/components/ui/KpiTrend";
export function StatCard({ title, value, prefix, suffix, decimals = 0, formatINR = false, trend, badge, subText, progress, icon: Icon, className = "", }) {
    return (<div className={cn("relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 overflow-hidden flex flex-col justify-between shadow-none", className)}>
      <div>
        {/* Header: Title + Icon / Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
            {title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            {Icon && (<div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <Icon className="w-3.5 h-3.5"/>
              </div>)}
          </div>
        </div>

        {/* Value + Trend */}
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums font-mono text-zinc-950 dark:text-zinc-50">
            {typeof value === "number" ? (<AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} formatINR={formatINR}/>) : (<span>
                {prefix}
                {value}
                {suffix}
              </span>)}
          </div>

          {trend && (<KpiTrend changePct={trend.value} invertColors={trend.invertColors} comparisonText={trend.label}/>)}
        </div>
      </div>

      {/* Subtext */}
      {subText && (<div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {subText}
        </div>)}

      {/* Micro 2px Progress Bar at bottom edge */}
      {progress !== undefined && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}/>
        </div>)}
    </div>);
}
