import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { emptyStateContentVariants, emptyStateIconVariants, useReducedMotion, } from "@/motion";
/**
 * Empty state — FLOWSTOCK_MOTION_SPEC.md (Section 6).
 *
 * Very subtle motion: the icon settles into place with a soft rise.
 * No looping, no cartoon-style animation. Instant when reduced motion is on.
 * Color + text carry the message independently of any motion.
 */
export const EmptyState = ({ icon: Icon, title, description, action, className, compact = false, }) => {
    const prefersReducedMotion = useReducedMotion();
    const iconVariants = emptyStateIconVariants(prefersReducedMotion);
    const contentVariants = emptyStateContentVariants(prefersReducedMotion);
    return (<motion.div variants={contentVariants} initial="hidden" animate="visible" className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-4 py-12", className)}>
      <motion.div variants={iconVariants} initial="hidden" animate="visible" className="flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 dark:border-[#33372B] bg-slate-50 dark:bg-[#23261E]/50 text-slate-400 dark:text-[#7C8189] shadow-xs">
          <Icon className="h-7 w-7" strokeWidth={1.5}/>
        </span>
      </motion.div>

      <motion.div variants={contentVariants} initial="hidden" animate="visible" className="mt-4 space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-[#E2E8F0]">{title}</p>
        {description && <p className="text-xs text-slate-500 dark:text-[#9BA3AF] max-w-sm leading-relaxed">{description}</p>}
        {action && <div className="pt-3">{action}</div>}
      </motion.div>
    </motion.div>);
};
