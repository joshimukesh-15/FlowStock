import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { skeletonPulseVariants, useReducedMotion } from "@/motion";
/**
 * Skeleton loaders — FLOWSTOCK_MOTION_SPEC.md (Section 6).
 *
 * - Mirrors the real layout exactly (rows/columns/cards), never fake shapes.
 * - A soft opacity pulse only; never an artificial delay on real data.
 * - Collapses to a static block when prefers-reduced-motion is active.
 */
export const Skeleton = ({ className }) => {
    const prefersReducedMotion = useReducedMotion();
    return (<motion.span aria-hidden="true" variants={skeletonPulseVariants(prefersReducedMotion)} initial="initial" animate="animate" className={cn("block rounded-md bg-zinc-200/70", className)}/>);
};
/** Reads out the loading state for assistive tech without blocking paint. */
export const SkeletonAnnouncer = ({ label }) => (<span role="status" className="sr-only">
    {label}
  </span>);
/** Mirrors a real table: one header bar + `rows` row bars with column widths. */
export const TableSkeleton = ({ rows = 5, columns = ["w-24", "flex-1", "w-20", "w-16", "w-24"], className }) => {
    const skeletonRows = {
        cells: columns,
    };
    return (<div role="presentation" className={cn("p-4 space-y-3", className)}>
      {/* Header bar */}
      <Skeleton className="h-7 w-full max-w-md"/>
      {/* Column-aligned rows: mirror the real table layout */}
      {Array.from({ length: rows }).map((_, rowIdx) => (<div key={`row-${rowIdx}`} className="flex items-center gap-4 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
          {skeletonRows.cells.map((cellCls, cellIdx) => (<Skeleton key={`cell-${rowIdx}-${cellIdx}`} className={cn("h-3.5", cellCls)}/>))}
        </div>))}
    </div>);
};
/** Mirrors a KPI/summary card: icon block, label, big number, sub-lines. */
export const CardSkeleton = ({ className }) => {
    return (<div className={cn("p-4 space-y-3", className)} role="presentation">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28"/>
        <Skeleton className="h-8 w-8 rounded-lg"/>
      </div>
      <Skeleton className="h-8 w-36"/>
      <Skeleton className="h-3 w-44"/>
      <Skeleton className="h-2 w-full"/>
    </div>);
};
/** Mirrors a vertical stack list (activity feeds, event logs). */
export const ListSkeleton = ({ rows = 4, className }) => {
    return (<div className={cn("space-y-2.5", className)} role="presentation">
      {Array.from({ length: rows }).map((_, idx) => (<div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-100">
          <Skeleton className="h-8 w-8 rounded-md"/>
          <div className="flex-1 space-y-1.5 pt-1">
            <Skeleton className="h-3 w-3/5"/>
            <Skeleton className="h-2.5 w-4/5"/>
          </div>
        </div>))}
    </div>);
};
