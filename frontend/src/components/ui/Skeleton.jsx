import React from "react";
import { cn } from "@/lib/utils";

// ALL SHIMMER SKELETONS REMOVED PER USER REQUEST
export const Skeleton = () => null;
export const SkeletonAnnouncer = ({ label = "Loading data..." }) => (
  <span role="status" className="sr-only">{label}</span>
);
export const KpiRowSkeleton = () => null;
export const FilterBarSkeleton = () => null;
export const TableSkeleton = () => null;
export const CardSkeleton = () => null;
export const ListSkeleton = () => null;

/** 
 * Main page loading state, replaced with the premium animated SVG logo 
 * per user request, instead of the heavy shimmer block skeleton. 
 */
export const PageSkeleton = ({ className }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[50vh] space-y-6 w-full", className)} role="presentation">
      <SkeletonAnnouncer />
      <div className="relative">
        <img 
          src="/assets/flowstock-loader.svg" 
          alt="Loading FlowStock..." 
          className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-xl" 
        />
      </div>
      <div className="flex flex-col items-center space-y-2">
        <div className="h-1.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#A0BDDB] w-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          Initializing Workspace
        </p>
      </div>
    </div>
  );
};
