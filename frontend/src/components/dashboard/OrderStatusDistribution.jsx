"use client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatINR } from "@/lib/utils";
import { useReducedMotion, EASING } from "@/motion";
import { ShoppingCart, ChevronRight, PackageCheck, Clock, FileEdit, Activity, } from "lucide-react";
export function OrderStatusDistribution({ summary, className = "" }) {
    const [hoveredCard, setHoveredCard] = useState(null);
    const prefersReducedMotion = useReducedMotion();
    const orders = summary?.orders;
    const totalOrders = orders?.total_orders ?? 0;
    const draftCount = orders?.draft_count ?? 0;
    const confirmedCount = orders?.confirmed_count ?? 0;
    const fulfilledCount = orders?.fulfilled_count ?? 0;
    const cancelledCount = orders?.cancelled_count ?? 0;
    const draftValue = orders?.draft_value ?? 0;
    const confirmedValue = orders?.confirmed_value ?? 0;
    const fulfilledValue = orders?.fulfilled_value ?? 0;
    const activeOrderBookValue = orders?.active_order_book_value ?? 0;
    // Compute percentages
    const safeTotal = totalOrders > 0 ? totalOrders : 1;
    const fulfilledPct = totalOrders > 0 ? Math.round((fulfilledCount / safeTotal) * 100) : 0;
    const confirmedPct = totalOrders > 0 ? Math.round((confirmedCount / safeTotal) * 100) : 0;
    const draftPct = totalOrders > 0 ? Math.round((draftCount / safeTotal) * 100) : 0;
    const cancelledPct = totalOrders > 0 ? Math.max(0, 100 - fulfilledPct - confirmedPct - draftPct) : 0;
    // Conversion / Fulfillment efficiency rate
    const nonCancelledTotal = fulfilledCount + confirmedCount + draftCount;
    const fulfillmentEfficiency = nonCancelledTotal > 0
        ? Math.round((fulfilledCount / nonCancelledTotal) * 100)
        : 0;
    const stages = [
        {
            id: "fulfilled",
            shortName: "Fulfilled",
            count: fulfilledCount,
            pct: fulfilledPct,
            value: fulfilledValue,
            statusLabel: "Dispatched",
            barColor: "bg-emerald-500",
            textColor: "text-slate-900 dark:text-[#F4F5F7]",
            icon: PackageCheck,
            iconColor: "text-emerald-500",
        },
        {
            id: "confirmed",
            shortName: "Confirmed",
            count: confirmedCount,
            pct: confirmedPct,
            value: confirmedValue,
            statusLabel: "Reserved",
            barColor: "bg-[#565449] dark:bg-[#D8CFBC]",
            textColor: "text-slate-900 dark:text-[#F4F5F7]",
            icon: Clock,
            iconColor: "text-[#565449] dark:text-[#D8CFBC]",
        },
        {
            id: "draft",
            shortName: "Draft",
            count: draftCount,
            pct: draftPct,
            value: draftValue,
            statusLabel: "In Review",
            barColor: "bg-amber-500",
            textColor: "text-slate-900 dark:text-[#F4F5F7]",
            icon: FileEdit,
            iconColor: "text-amber-500",
        },
        {
            id: "efficiency",
            shortName: "Efficiency",
            count: fulfillmentEfficiency,
            pct: fulfillmentEfficiency,
            value: activeOrderBookValue,
            statusLabel: "Pipeline Rate",
            barColor: "bg-[#D8CFBC] dark:bg-[#D8CFBC]",
            textColor: "text-slate-900 dark:text-[#F4F5F7]",
            icon: Activity,
            iconColor: "text-[#565449] dark:text-[#D8CFBC]",
            isEfficiencyCard: true,
        },
    ];
    return (<Card className={`flex flex-col border border-slate-200 dark:border-[#22242B] shadow-xs rounded-xl bg-white dark:bg-[#121316] overflow-hidden ${className}`}>
      {/* Compact Header with Refined MNC Hairline Border */}
      <CardHeader className="py-3 px-4 border-b border-slate-200/80 dark:border-[#22242B] bg-slate-50/60 dark:bg-[#090A0C]/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8CFBC]/25 text-[#565449] dark:text-[#D8CFBC] border border-[#565449]/25 dark:border-[#D8CFBC]/30">
              <ShoppingCart className="w-3.5 h-3.5"/>
            </div>
            <CardTitle className="text-[13px] font-semibold text-slate-900 dark:text-[#F4F5F7] tracking-tight">
              Order fulfillment distribution
            </CardTitle>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#18191E] border border-slate-200/60 dark:border-[#22242B] text-[11px] font-mono font-medium text-slate-700 dark:text-[#9BA3AF]">
            <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#565449] dark:bg-[#D8CFBC] shrink-0 animate-pulse"/>
            <span>{totalOrders} orders</span>
          </div>
        </div>

        {/* Subtle, Slim Micro-Distribution Meter (3px height with smooth rounded caps) */}
        <div className="w-full h-1 bg-slate-200/70 dark:bg-[#1A1C22] rounded-full flex gap-0.5 overflow-hidden">
          {totalOrders > 0 ? (<>
              {fulfilledPct > 0 && (<motion.div onMouseEnter={() => setHoveredCard("fulfilled")} onMouseLeave={() => setHoveredCard(null)} initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${fulfilledPct}%` }} transition={{ duration: 0.7, ease: EASING.standard }} className={`h-full bg-emerald-600/80 dark:bg-emerald-500/80 rounded-full cursor-pointer transition-opacity ${hoveredCard && hoveredCard !== "fulfilled" ? "opacity-30" : "opacity-100"}`} title={`Fulfilled: ${fulfilledCount} orders (${fulfilledPct}%)`}/>)}
              {confirmedPct > 0 && (<motion.div onMouseEnter={() => setHoveredCard("confirmed")} onMouseLeave={() => setHoveredCard(null)} initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${confirmedPct}%` }} transition={{ duration: 0.7, delay: 0.08, ease: EASING.standard }} className={`h-full bg-[#565449] dark:bg-[#D8CFBC] rounded-full cursor-pointer transition-opacity ${hoveredCard && hoveredCard !== "confirmed" ? "opacity-30" : "opacity-100"}`} title={`Confirmed: ${confirmedCount} orders (${confirmedPct}%)`}/>)}
              {draftPct > 0 && (<motion.div onMouseEnter={() => setHoveredCard("draft")} onMouseLeave={() => setHoveredCard(null)} initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${draftPct}%` }} transition={{ duration: 0.7, delay: 0.16, ease: EASING.standard }} className={`h-full bg-amber-500/80 rounded-full cursor-pointer transition-opacity ${hoveredCard && hoveredCard !== "draft" ? "opacity-30" : "opacity-100"}`} title={`Draft: ${draftCount} orders (${draftPct}%)`}/>)}
              {cancelledPct > 0 && (<motion.div initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${cancelledPct}%` }} transition={{ duration: 0.7, delay: 0.24, ease: EASING.standard }} className="h-full bg-slate-300 dark:bg-[#22242B] rounded-full opacity-60" title={`Cancelled: ${cancelledCount} orders (${cancelledPct}%)`}/>)}
            </>) : (<div className="w-full h-full bg-slate-200 dark:bg-[#18191E] rounded-full opacity-40"/>)}
        </div>
      </CardHeader>

      {/* 4 Columns Divided by Thin Hairlines (No Nested Cards) */}
      <CardContent className="p-0 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-[#22242B]">
          {stages.map((stage) => {
            const isHovered = hoveredCard === stage.id;
            const Icon = stage.icon;
            return (<div key={stage.id} onMouseEnter={() => setHoveredCard(stage.id)} onMouseLeave={() => setHoveredCard(null)} className={`p-3.5 transition-colors flex flex-col justify-between ${isHovered ? "bg-slate-50/80 dark:bg-[#18191E]/60" : "bg-transparent"}`}>
                <div>
                  {/* Label + Pct Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 ${stage.iconColor} shrink-0`}/>
                      <span className="text-[12px] font-medium text-slate-600 dark:text-[#9BA3AF] truncate">
                        {stage.shortName}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-[#9BA3AF] bg-slate-100 dark:bg-[#18191E] border border-slate-200/50 dark:border-[#22242B] px-1.5 py-0.5 rounded">
                      {stage.pct}%
                    </span>
                  </div>

                  {/* Big Number + Total Value */}
                  <div className="mt-1.5 flex items-baseline justify-between gap-1">
                    <span className={`text-lg sm:text-xl font-bold font-mono tabular-nums tracking-tight ${stage.textColor}`}>
                      {stage.isEfficiencyCard ? (<>
                          <AnimatedCounter value={stage.count}/>
                          <span className="text-xs font-medium text-slate-400 dark:text-[#7C8189]">%</span>
                        </>) : (<>
                          <AnimatedCounter value={stage.count}/>
                          <span className="text-[10px] font-normal text-slate-400 dark:text-[#7C8189] ml-1 font-sans">orders</span>
                        </>)}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-[#7C8189] truncate" title={formatINR(stage.value)}>
                    {formatINR(stage.value, { autoDecimals: true, smartScale: true })}
                  </div>
                  {/* Micro Sleek Telemetry Indicator Line */}
                  <div className="w-full bg-slate-100 dark:bg-[#1A1C22] h-0.5 rounded-full overflow-hidden">
                    <motion.div initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.5, ease: EASING.standard }} className={`h-full ${stage.barColor} rounded-full`}/>
                  </div>
                </div>
              </div>);
        })}
        </div>

        {/* Compact Footer Strip */}
        <div className="py-2 px-4 border-t border-slate-200/80 dark:border-[#22242B] bg-slate-50/40 dark:bg-[#090A0C]/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-[#9BA3AF]">Total Pipeline:</span>
            <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-[#F4F5F7] text-xs" title={formatINR(activeOrderBookValue)}>
              {formatINR(activeOrderBookValue, { autoDecimals: true, smartScale: true })}
            </span>
          </div>

          <Link to="/orders">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 font-medium text-slate-600 dark:text-[#9BA3AF] hover:text-slate-900 dark:hover:text-[#D8CFBC]">
              Orders Console
              <ChevronRight className="w-3 h-3"/>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>);
}
