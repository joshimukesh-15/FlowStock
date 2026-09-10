"use client";
import React from "react";
import { motion } from "framer-motion";
import { slideUpVariants, useReducedMotion } from "@/motion";
import { cn } from "@/lib/utils";
export const PageHeader = ({ title, subtitle, badge, actions, className, }) => {
    const prefersReducedMotion = useReducedMotion();
    const itemVariants = slideUpVariants(prefersReducedMotion);
    return (<motion.div variants={itemVariants} className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {typeof title === "string" ? (<h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-100 tracking-tight">
              {title}
            </h1>) : (title)}
          {badge}
        </div>
        {subtitle && (<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {subtitle}
          </p>)}
      </div>

      {actions && (<div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>)}
    </motion.div>);
};
