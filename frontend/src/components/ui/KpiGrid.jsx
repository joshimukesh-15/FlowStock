"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { slideUpVariants, useReducedMotion } from "@/motion";

/**
 * Reusable responsive KPI card grid wrapper with motion animation support.
 */
export function KpiGrid({
  children,
  cols = 4,
  className = "",
  variants,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();
  const defaultVariants = slideUpVariants(prefersReducedMotion);

  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  };

  return (
    <motion.div
      variants={variants || defaultVariants}
      className={cn("grid gap-3 sm:gap-3.5", colClasses[cols] || colClasses[4], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default KpiGrid;
