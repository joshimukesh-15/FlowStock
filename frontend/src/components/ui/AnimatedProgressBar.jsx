import React from "react";
import { motion } from "framer-motion";
import { getTransition, SCALE, useReducedMotion } from "@/motion";
/** A data-bound chart primitive that reveals once when a real value changes. */
export const AnimatedProgressBar = ({ value, className = "bg-slate-900 dark:bg-slate-100", label, }) => {
    const prefersReducedMotion = useReducedMotion();
    const clampedValue = Math.min(100, Math.max(0, value));
    const barClass = className.includes("dark:bg-") ? className : `${className} dark:bg-slate-100`;
    return (<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#23262F]" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clampedValue)}>
      <motion.div className={`h-full w-full origin-left rounded-full ${barClass}`} initial={{ scaleX: SCALE.progressStart }} animate={{ scaleX: clampedValue / 100 }} transition={getTransition("normal", prefersReducedMotion)}/>
    </div>);
};
