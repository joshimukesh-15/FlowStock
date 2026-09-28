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
            ? "bg-[#E2DED2] dark:bg-[#314C3B] text-[#4C6B55] dark:text-[#9BA3AF] border-[#BDC9B8] dark:border-[#6D8C73]"
            : isGood
                ? "bg-slate-950 dark:bg-[#E2DED2] text-white dark:text-[#1B2A20] border-zinc-950 dark:border-[#E2DED2] shadow-2xs"
                : "bg-[#E2DED2] dark:bg-[#314C3B] text-[#314C3B] dark:text-[#F4F5F7] border-[#BDC9B8] dark:border-[#6D8C73]"}`}>
        {isNeutral ? (<Minus className="w-2.5 h-2.5"/>) : isPositive ? (<TrendingUp className="w-2.5 h-2.5"/>) : (<TrendingDown className="w-2.5 h-2.5"/>)}
        <span>{isPositive ? `+${changePct}%` : `${changePct}%`}</span>
      </span>

      {/* Context Caption */}
      {comparisonText && (<span className="text-[10px] text-[#6D8C73] font-sans truncate">
          {comparisonText}
        </span>)}
    </div>);
}
