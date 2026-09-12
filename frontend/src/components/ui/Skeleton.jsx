import React from "react";
import { cn } from "@/lib/utils";

/**
 * High-performance, GPU-accelerated CSS shimmer skeleton loader.
 * Employs a continuous sliding light sweep gradient matching the dark/light palette.
 */
export const Skeleton = ({ className, ...props }) => {
  return (
    <span
      aria-hidden="true"
      className={cn("block rounded-md skeleton-shimmer", className)}
      {...props}
    />
  );
};

/** Reads out the loading state for assistive tech without blocking paint. */
export const SkeletonAnnouncer = ({ label = "Loading data..." }) => (
  <span role="status" className="sr-only">
    {label}
  </span>
);

/** Mirrors a KPI row: 2 to 4 responsive stat cards */
export const KpiRowSkeleton = ({ count = 4, className }) => {
  return (
    <div
      role="presentation"
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          <Skeleton className="h-7 w-32" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-12" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
};

/** Mirrors search bar, status tabs, and action button toolbar */
export const FilterBarSkeleton = ({ className }) => {
  return (
    <div
      role="presentation"
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40",
        className
      )}
    >
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  );
};

/** Mirrors a real table: header row + clean column-aligned data rows */
export const TableSkeleton = ({
  rows = 6,
  columns = ["w-24", "flex-1", "w-24", "w-20", "w-16"],
  className,
}) => {
  return (
    <div
      role="presentation"
      className={cn(
        "rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden",
        className
      )}
    >
      {/* Table header bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/80">
        {columns.map((colWidth, idx) => (
          <Skeleton key={`th-${idx}`} className={cn("h-3", colWidth)} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="flex items-center gap-4 px-3 py-2.5"
          >
            {columns.map((colWidth, colIdx) => (
              <Skeleton
                key={`cell-${rowIdx}-${colIdx}`}
                className={cn("h-3.5", colWidth)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Mirrors a single KPI/summary card */
export const CardSkeleton = ({ className }) => {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3",
        className
      )}
      role="presentation"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3 w-44" />
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  );
};

/** Mirrors a vertical stack list (activity feeds, event logs). */
export const ListSkeleton = ({ rows = 4, className }) => {
  return (
    <div className={cn("space-y-2", className)} role="presentation">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
        >
          <Skeleton className="h-7 w-7 rounded-md shrink-0" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-4/5" />
          </div>
          <Skeleton className="h-2.5 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
};

/** Complete page loading state with header, toolbar, and content placeholder */
export const PageSkeleton = ({
  hasKpis = false,
  kpiCount = 4,
  tableRows = 6,
  className,
}) => {
  return (
    <div className={cn("space-y-4 max-w-7xl mx-auto", className)} role="presentation">
      <SkeletonAnnouncer />
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Optional KPI Row */}
      {hasKpis && <KpiRowSkeleton count={kpiCount} />}

      {/* Toolbar / Filters */}
      <FilterBarSkeleton />

      {/* Table Data */}
      <TableSkeleton rows={tableRows} />
    </div>
  );
};
