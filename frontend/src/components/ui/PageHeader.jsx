"use client";
import React from "react";
import { motion } from "framer-motion";
import { slideUpVariants, useReducedMotion } from "@/motion";
import { cn } from "@/lib/utils";
export const PageHeader = ({ title, subtitle, badge, actions, className, }) => {
    const prefersReducedMotion = useReducedMotion();
    const itemVariants = slideUpVariants(prefersReducedMotion);
    return (<motion.div variants={itemVariants} className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", className)}>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          {typeof title === "string" ? (<h1 className="text-lg font-semibold sm:text-xl text-[#1B2A20] dark:text-[#F4F5F7] tracking-tight">
              {title}
            </h1>) : (title)}
          {badge}
        </div>
        {subtitle && (<p className="text-xs text-[#6D8C73] dark:text-[#9BA3AF] mt-0.5">
            {subtitle}
          </p>)}
      </div>

      {actions && (<div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>)}
    </motion.div>);
};
