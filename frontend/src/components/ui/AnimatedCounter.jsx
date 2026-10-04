import { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "../../motion";
import { DURATION } from "../../motion/tokens";
/**
 * AnimatedCounter
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Sections 6 & 7).
 *
 * Rules:
 * - Animates ONLY on initial load or real value change — never loops.
 * - Animates strictly to the real backend value.
 * - Instantly displays final value without animation when prefers-reduced-motion is active.
 */
export const AnimatedCounter = ({
    value,
    prefix = "",
    suffix = "",
    decimals = 0,
    formatINR = false,
    autoDecimals = false,
    subtleDecimals = true,
    className = "",
    title,
}) => {
    const prefersReducedMotion = useReducedMotion();
    const [displayValue, setDisplayValue] = useState(() => prefersReducedMotion ? value : 0);
    const previousValueRef = useRef(prefersReducedMotion ? value : 0);
    const animationFrameRef = useRef(null);

    const effectiveDecimals = autoDecimals
        ? (Math.abs(value) >= 1000 || value % 1 === 0 ? 0 : (decimals || 2))
        : decimals;

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
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Apply standard deceleration easing approximation: 1 - Math.pow(1 - progress, 3)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = startValue + (endValue - startValue) * easeProgress;
            setDisplayValue(currentVal);
            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(updateCounter);
            }
            else {
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

    // Format numerical value (Microsoft Dynamics 365 Smart Scale)
    const formattedContent = (() => {
        if (formatINR) {
            const absVal = Math.abs(displayValue);
            // Crores scale for figures >= 1 Crore (10M+, e.g. 1,000,000,000 -> 100.00 Cr)
            if (absVal >= 10000000) {
                const cr = displayValue / 10000000;
                const crFormatted = Math.abs(cr) >= 100 ? cr.toFixed(1) : cr.toFixed(2);
                return (
                    <>
                        <span>{crFormatted}</span>
                        <span className="text-[0.75em] font-medium opacity-80 uppercase ml-1 font-sans tracking-wide">Cr</span>
                    </>
                );
            }

            const parts = displayValue.toFixed(effectiveDecimals).split(".");
            const intPart = parseInt(parts[0], 10) || 0;
            const formattedInt = intPart.toLocaleString("en-IN");
            if (parts[1] !== undefined && effectiveDecimals > 0) {
                if (subtleDecimals) {
                    return (
                        <>
                            <span>{formattedInt}</span>
                            <span className="text-[0.75em] font-medium opacity-75">.{parts[1]}</span>
                        </>
                    );
                }
                return `${formattedInt}.${parts[1]}`;
            }
            return formattedInt;
        }
        return displayValue.toLocaleString("en-IN", {
            minimumFractionDigits: effectiveDecimals,
            maximumFractionDigits: effectiveDecimals,
        });
    })();

    const defaultTitle = formatINR && typeof value === "number"
        ? `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : undefined;

    return (
        <span className={className} title={title ?? defaultTitle}>
            {prefix}
            {formattedContent}
            {suffix}
        </span>
    );
};
