"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatINR } from "@/lib/utils";
import { useReducedMotion, EASING, DURATION } from "@/motion";
import { DashboardSummaryResponse } from "@/types/api";
import {
  ShoppingCart,
  ChevronRight,
  PackageCheck,
  Clock,
  FileEdit,
  Activity,
} from "lucide-react";

interface OrderStatusDistributionProps {
  summary: DashboardSummaryResponse | null;
  className?: string;
}

export function OrderStatusDistribution({ summary, className = "" }: OrderStatusDistributionProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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
      barColor: "bg-zinc-950",
      textColor: "text-zinc-950",
      icon: PackageCheck,
      iconColor: "text-zinc-900 bg-zinc-100",
    },
    {
      id: "confirmed",
      shortName: "Confirmed",
      count: confirmedCount,
      pct: confirmedPct,
      value: confirmedValue,
      statusLabel: "Reserved",
      barColor: "bg-zinc-700",
      textColor: "text-zinc-800",
      icon: Clock,
      iconColor: "text-zinc-700 bg-zinc-100",
    },
    {
      id: "draft",
      shortName: "Draft",
      count: draftCount,
      pct: draftPct,
      value: draftValue,
      statusLabel: "In Review",
      barColor: "bg-zinc-400",
      textColor: "text-zinc-700",
      icon: FileEdit,
      iconColor: "text-zinc-500 bg-zinc-100",
    },
    {
      id: "efficiency",
      shortName: "Efficiency",
      count: fulfillmentEfficiency,
      pct: fulfillmentEfficiency,
      value: activeOrderBookValue,
      statusLabel: "Pipeline Rate",
      barColor: "bg-zinc-900",
      textColor: "text-zinc-950",
      icon: Activity,
      iconColor: "text-zinc-900 bg-zinc-100",
      isEfficiencyCard: true,
    },
  ];

  return (
    <Card className={`flex flex-col border border-zinc-200/80 shadow-xs bg-white ${className}`}>
      {/* Compact Header */}
      <CardHeader className="py-2.5 px-4 border-b border-zinc-100 bg-zinc-50/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-zinc-900 text-white shadow-2xs">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <CardTitle className="text-sm font-bold text-zinc-900 tracking-tight">
              Order Fulfillment Distribution
            </CardTitle>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-mono font-semibold text-zinc-800">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-900" />
            </span>
            <span>{totalOrders} Orders</span>
          </div>
        </div>

        {/* Compact 6px Capsule Progress Bar */}
        <div className="w-full h-2 bg-zinc-100 rounded-full p-0.5 flex gap-0.5 overflow-hidden shadow-inner">
          {totalOrders > 0 ? (
            <>
              {fulfilledPct > 0 && (
                <motion.div
                  onMouseEnter={() => setHoveredCard("fulfilled")}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${fulfilledPct}%` }}
                  transition={{ duration: 0.7, ease: EASING.standard }}
                  className={`h-full bg-zinc-950 rounded-full cursor-pointer transition-opacity ${
                    hoveredCard && hoveredCard !== "fulfilled" ? "opacity-30" : "opacity-100"
                  }`}
                  title={`Fulfilled: ${fulfilledCount} orders (${fulfilledPct}%)`}
                />
              )}
              {confirmedPct > 0 && (
                <motion.div
                  onMouseEnter={() => setHoveredCard("confirmed")}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${confirmedPct}%` }}
                  transition={{ duration: 0.7, delay: 0.08, ease: EASING.standard }}
                  className={`h-full bg-zinc-700 rounded-full cursor-pointer transition-opacity ${
                    hoveredCard && hoveredCard !== "confirmed" ? "opacity-30" : "opacity-100"
                  }`}
                  title={`Confirmed: ${confirmedCount} orders (${confirmedPct}%)`}
                />
              )}
              {draftPct > 0 && (
                <motion.div
                  onMouseEnter={() => setHoveredCard("draft")}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${draftPct}%` }}
                  transition={{ duration: 0.7, delay: 0.16, ease: EASING.standard }}
                  className={`h-full bg-zinc-400 rounded-full cursor-pointer transition-opacity ${
                    hoveredCard && hoveredCard !== "draft" ? "opacity-30" : "opacity-100"
                  }`}
                  title={`Draft: ${draftCount} orders (${draftPct}%)`}
                />
              )}
              {cancelledPct > 0 && (
                <motion.div
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${cancelledPct}%` }}
                  transition={{ duration: 0.7, delay: 0.24, ease: EASING.standard }}
                  className="h-full bg-zinc-200 rounded-full opacity-60"
                  title={`Cancelled: ${cancelledCount} orders (${cancelledPct}%)`}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-zinc-200 rounded-full opacity-40" />
          )}
        </div>
      </CardHeader>

      {/* Compact 2x2 Typography Cards Grid */}
      <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {stages.map((stage) => {
            const isHovered = hoveredCard === stage.id;
            const Icon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                onMouseEnter={() => setHoveredCard(stage.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
                transition={{ duration: DURATION.micro }}
                className={`p-2.5 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isHovered
                    ? "bg-zinc-100/90 border-zinc-400 shadow-xs"
                    : "bg-zinc-50/50 border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300"
                }`}
              >
                {/* Header: Label + Pct Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`p-1 rounded ${stage.iconColor}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-800 truncate">
                      {stage.shortName}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-zinc-600 bg-white px-1.5 py-0.2 rounded border border-zinc-200/80 shadow-2xs">
                    {stage.isEfficiencyCard ? `${stage.pct}%` : `${stage.pct}%`}
                  </span>
                </div>

                {/* Typography: Big Number + INR Value */}
                <div className="my-1.5 flex items-baseline justify-between gap-1">
                  <span className={`text-lg font-bold font-mono tracking-tight ${stage.textColor}`}>
                    {stage.isEfficiencyCard ? (
                      <>
                        <AnimatedCounter value={stage.count} />
                        <span className="text-xs font-semibold text-zinc-500">%</span>
                      </>
                    ) : (
                      <>
                        <AnimatedCounter value={stage.count} />
                        <span className="text-[10px] font-normal text-zinc-400 ml-1 font-sans">orders</span>
                      </>
                    )}
                  </span>

                  <span className="text-[10px] font-mono text-zinc-500 truncate">
                    {formatINR(stage.value)}
                  </span>
                </div>

                {/* Micro Progress Line */}
                <div className="w-full bg-zinc-200/80 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{ duration: 0.5, ease: EASING.standard }}
                    className={`h-full ${stage.barColor} rounded-full`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Compact Footer Strip */}
        <div className="py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">Pipeline:</span>
            <span className="font-bold font-mono text-zinc-900 text-xs">
              {formatINR(activeOrderBookValue)}
            </span>
          </div>

          <Link to="/orders">
            <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] gap-1 font-medium hover:bg-white">
              Console
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
