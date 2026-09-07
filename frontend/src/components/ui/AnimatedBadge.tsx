"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASING, useReducedMotion } from "@/motion";

export interface AnimatedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  statusKey?: string | number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  icon?: React.ComponentType<{ className?: string }>;
  pulse?: boolean;
  children: React.ReactNode;
}

const badgeVariants = {
  default: "bg-zinc-100 text-zinc-800 border-zinc-200/80",
  success: "bg-zinc-950 text-white border-zinc-950 font-semibold shadow-2xs",
  warning: "bg-zinc-100 text-zinc-900 border-zinc-300 font-medium",
  danger: "bg-zinc-200 text-zinc-900 border-zinc-300 font-medium",
  info: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  statusKey,
  variant = "default",
  icon: Icon,
  pulse = false,
  className,
  children,
  ...props
}) => {
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

  return (
    <span className="inline-flex items-center justify-center align-middle" {...props}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={key}
          variants={motionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide whitespace-nowrap",
            badgeVariants[variant],
            className
          )}
        >
          {pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
            </span>
          )}
          {Icon && <Icon className="w-3 h-3 shrink-0" />}
          <span>{children}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
