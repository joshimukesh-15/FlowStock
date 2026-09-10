"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASING, useReducedMotion } from "@/motion";
import { badgeVariants } from "./Badge";
export const AnimatedBadge = ({ statusKey, variant = "default", icon: Icon, pulse = false, className, children, ...props }) => {
    const prefersReducedMotion = useReducedMotion();
    const key = statusKey !== undefined ? String(statusKey) : undefined;
    const motionVariants = {
        initial: {
            opacity: 0,
            scale: prefersReducedMotion ? 1 : 0.88,
            y: prefersReducedMotion ? 0 : -2,
        },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: prefersReducedMotion ? 0 : DURATION.micro,
                ease: EASING.emphasized,
            },
        },
        exit: {
            opacity: 0,
            scale: prefersReducedMotion ? 1 : 0.88,
            y: prefersReducedMotion ? 0 : 2,
            transition: {
                duration: prefersReducedMotion ? 0 : DURATION.micro,
                ease: EASING.standard,
            },
        },
    };
    return (<span className="inline-flex items-center justify-center align-middle" {...props}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={key} variants={motionVariants} initial="initial" animate="animate" exit="exit" className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide whitespace-nowrap", badgeVariants[variant], className)}>
          {pulse && (<span className="inline-flex rounded-full h-1.5 w-1.5 bg-current shrink-0"/>)}
          {Icon && <Icon className="w-3 h-3 shrink-0"/>}
          <span>{children}</span>
        </motion.span>
      </AnimatePresence>
    </span>);
};
