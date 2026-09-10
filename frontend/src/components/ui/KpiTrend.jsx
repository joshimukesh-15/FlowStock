"use client";
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
export function KpiTrend({ changePct, comparisonText = "vs 30d", invertColors = false, className = "", }) {
    const isPositive = changePct > 0;
    const isNeutral = changePct === 0;
    // If invertColors is true (e.g. For overdue/aging), decrease is good!
    const isGood = invertColors ? !isPositive : isPositive;
    return (<div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Clean Trend Badge with Up/Down Arrow & Percentage */}
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-tight border transition-colors ${isNeutral
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
            : isGood
                ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100 shadow-2xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"}`}>
        {isNeutral ? (<Minus className="w-2.5 h-2.5"/>) : isPositive ? (<TrendingUp className="w-2.5 h-2.5"/>) : (<TrendingDown className="w-2.5 h-2.5"/>)}
        <span>{isPositive ? `+${changePct}%` : `${changePct}%`}</span>
      </span>

      {/* Context Caption */}
      {comparisonText && (<span className="text-[10px] text-zinc-400 font-sans truncate">
          {comparisonText}
        </span>)}
    </div>);
}
