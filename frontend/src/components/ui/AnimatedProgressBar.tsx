import React from "react";
import { motion } from "framer-motion";
import { getTransition, SCALE, useReducedMotion } from "@/motion";

interface AnimatedProgressBarProps {
  value: number;
  className?: string;
  label: string;
}

/** A data-bound chart primitive that reveals once when a real value changes. */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  className = "bg-zinc-900",
  label,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedValue)}
    >
      <motion.div
        className={`h-full w-full origin-left rounded-full ${className}`}
        initial={{ scaleX: SCALE.progressStart }}
        animate={{ scaleX: clampedValue / 100 }}
        transition={getTransition("normal", prefersReducedMotion)}
      />
    </div>
  );
};
