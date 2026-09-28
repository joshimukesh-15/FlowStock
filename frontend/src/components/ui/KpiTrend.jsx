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
            ? "bg-slate-100 dark:bg-[#0A3D4A] text-slate-600 dark:text-[#9BA3AF] border-slate-200 dark:border-[#1D8B94]"
            : isGood
                ? "bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 border-zinc-950 dark:border-slate-100 shadow-2xs"
                : "bg-slate-100 dark:bg-[#0A3D4A] text-slate-900 dark:text-[#F4F5F7] border-slate-300 dark:border-[#1D8B94]"}`}>
        {isNeutral ? (<Minus className="w-2.5 h-2.5"/>) : isPositive ? (<TrendingUp className="w-2.5 h-2.5"/>) : (<TrendingDown className="w-2.5 h-2.5"/>)}
        <span>{isPositive ? `+${changePct}%` : `${changePct}%`}</span>
      </span>

      {/* Context Caption */}
      {comparisonText && (<span className="text-[10px] text-slate-400 font-sans truncate">
          {comparisonText}
        </span>)}
    </div>);
}
