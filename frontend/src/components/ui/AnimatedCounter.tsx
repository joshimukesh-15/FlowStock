import React, { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "../../motion";
import { DURATION, EASING } from "../../motion/tokens";

interface AnimatedCounterProps {
  /** The real backend numerical target value */
  value: number;
  /** Optional prefix (e.g. "₹") */
  prefix?: string;
  /** Optional suffix (e.g. "%", " units") */
  suffix?: string;
  /** Number of decimal places (default 0, or 2 for currency) */
  decimals?: number;
  /** Whether to format using Indian Number System (e.g. ₹ 1,23,456) */
  formatINR?: boolean;
  className?: string;
}

/**
 * AnimatedCounter
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Sections 6 & 7).
 *
 * Rules:
 * - Animates ONLY on initial load or real value change — never loops.
 * - Animates strictly to the real backend value.
 * - Instantly displays final value without animation when prefers-reduced-motion is active.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatINR = false,
  className = "",
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(() =>
    prefersReducedMotion ? value : 0
  );
  const previousValueRef = useRef<number>(prefersReducedMotion ? value : 0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If reduced motion is preferred, jump directly to target value
    if (prefersReducedMotion) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = value;
    const durationMs = DURATION.hero * 1000; // 600ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Apply standard deceleration easing approximation: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, prefersReducedMotion]);

  // Format numerical value
  const formattedNumber = (() => {
    if (formatINR) {
      const parts = displayValue.toFixed(decimals).split(".");
      const intPart = parseInt(parts[0], 10) || 0;
      const formattedInt = intPart.toLocaleString("en-IN");
      return parts[1] !== undefined ? `${formattedInt}.${parts[1]}` : formattedInt;
    }
    return displayValue.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  })();

  return (
    <span className={className}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
