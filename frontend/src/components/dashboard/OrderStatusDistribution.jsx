"use client";
import React, { useState } from "react";
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
            barColor: "bg-zinc-950 dark:bg-zinc-100",
            textColor: "text-zinc-950 dark:text-zinc-100",
            icon: PackageCheck,
            iconColor: "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800",
        },
        {
            id: "confirmed",
            shortName: "Confirmed",
            count: confirmedCount,
            pct: confirmedPct,
            value: confirmedValue,
            statusLabel: "Reserved",
            barColor: "bg-zinc-700 dark:bg-zinc-300",
            textColor: "text-zinc-800 dark:text-zinc-200",
            icon: Clock,
            iconColor: "text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800",
        },
        {
            id: "draft",
            shortName: "Draft",
            count: draftCount,
            pct: draftPct,
            value: draftValue,
            statusLabel: "In Review",
            barColor: "bg-zinc-400 dark:bg-zinc-500",
            textColor: "text-zinc-700 dark:text-zinc-300",
            icon: FileEdit,
            iconColor: "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800",
        },
        {
            id: "efficiency",
            shortName: "Efficiency",
            count: fulfillmentEfficiency,
            pct: fulfillmentEfficiency,
            value: activeOrderBookValue,
            statusLabel: "Pipeline Rate",
            barColor: "bg-zinc-900 dark:bg-zinc-200",
            textColor: "text-zinc-950 dark:text-zinc-100",
            icon: Activity,
            iconColor: "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800",
            isEfficiencyCard: true,
        },
    ];
    return (<Card className={`flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-none rounded-lg bg-white dark:bg-zinc-900 ${className}`}>
      {/* Compact Header */}
      <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <ShoppingCart className="w-3.5 h-3.5"/>
            </div>
            <CardTitle className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 tracking-tight">
              Order fulfillment distribution
            </CardTitle>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
            <span className="inline-flex rounded-full h-1.5 w-1.5 bg-zinc-900 dark:bg-zinc-100 shrink-0"/>
            <span>{totalOrders} orders</span>
          </div>
        </div>

        {/* Compact Capsule Distribution Bar */}
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full flex gap-0.5 overflow-hidden">
          {totalOrders > 0 ? (<>
              {fulfilledPct > 0 && (<motion.div onMouseEnter={() => setHoveredCard("fulfilled")} onMouseLeave={() => setHoveredCard(null)} initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${fulfilledPct}%` }} transition={{ duration: 0.7, ease: EASING.standard }} className={`h-full bg-zinc-950 dark:bg-zinc-100 rounded-full cursor-pointer transition-opacity ${hoveredCard && hoveredCard !== "fulfilled" ? "opacity-30" : "opacity-100"}`} title={`Fulfilled: ${fulfilledCount} orders (${fulfilledPct}%)`}/>)}
              {confirmedPct > 0 && (<motion.div onMouseEnter={() => setHoveredCard("confirmed")} onMouseLeave={() => setHoveredCard(null)} initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${confirmedPct}%` }} transition={{ duration: 0.7, delay: 0.08, ease: EASING.standard }} className={`h-full bg-zinc-600 dark:bg-zinc-300 rounded-full cursor-pointer transition-opacity ${hoveredCard && hoveredCard !== "confirmed" ? "opacity-30" : "opacity-100"}`} title={`Confirmed: ${confirmedCount} orders (${confirmedPct}%)`}/>)}
              {draftPct > 0 && (<motion.div onMouseEnter={() => setHoveredCard("draft")} onMouseLeave={() => setHoveredCard(null)} initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${draftPct}%` }} transition={{ duration: 0.7, delay: 0.16, ease: EASING.standard }} className={`h-full bg-zinc-400 dark:bg-zinc-500 rounded-full cursor-pointer transition-opacity ${hoveredCard && hoveredCard !== "draft" ? "opacity-30" : "opacity-100"}`} title={`Draft: ${draftCount} orders (${draftPct}%)`}/>)}
              {cancelledPct > 0 && (<motion.div initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${cancelledPct}%` }} transition={{ duration: 0.7, delay: 0.24, ease: EASING.standard }} className="h-full bg-zinc-200 dark:bg-zinc-700 rounded-full opacity-60" title={`Cancelled: ${cancelledCount} orders (${cancelledPct}%)`}/>)}
            </>) : (<div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 rounded-full opacity-40"/>)}
        </div>
      </CardHeader>

      {/* 4 Columns Divided by Thin Hairlines (No Nested Cards) */}
      <CardContent className="p-0 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
          {stages.map((stage) => {
            const isHovered = hoveredCard === stage.id;
            const Icon = stage.icon;
            return (<div key={stage.id} onMouseEnter={() => setHoveredCard(stage.id)} onMouseLeave={() => setHoveredCard(null)} className={`p-3.5 transition-colors flex flex-col justify-between ${isHovered ? "bg-zinc-50/80 dark:bg-zinc-800/50" : "bg-transparent"}`}>
                <div>
                  {/* Label + Pct Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0"/>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-300 truncate">
                        {stage.shortName}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                      {stage.pct}%
                    </span>
                  </div>

                  {/* Big Number + Total Value */}
                  <div className="mt-1.5 flex items-baseline justify-between gap-1">
                    <span className={`text-lg sm:text-xl font-semibold font-mono tabular-nums tracking-tight ${stage.textColor}`}>
                      {stage.isEfficiencyCard ? (<>
                          <AnimatedCounter value={stage.count}/>
                          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">%</span>
                        </>) : (<>
                          <AnimatedCounter value={stage.count}/>
                          <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1 font-sans">orders</span>
                        </>)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                    {formatINR(stage.value)}
                  </div>
                  {/* Micro Progress Line */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-0.5 rounded-full overflow-hidden">
                    <motion.div initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.5, ease: EASING.standard }} className={`h-full ${stage.barColor} rounded-full`}/>
                  </div>
                </div>
              </div>);
        })}
        </div>

        {/* Compact Footer Strip */}
        <div className="py-2 px-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Total Pipeline:</span>
            <span className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 text-xs">
              {formatINR(activeOrderBookValue)}
            </span>
          </div>

          <Link to="/orders">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
              Orders Console
              <ChevronRight className="w-3 h-3"/>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>);
}
