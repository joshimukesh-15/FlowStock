import { useState, useEffect } from "react";
import { useReducedMotion as useFramerReducedMotion } from "framer-motion";
/**
 * Hook wrapping prefers-reduced-motion media query.
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Section 4 & Section 5).
 *
 * When reduced motion is requested by OS or browser settings:
 * - Returns true.
 * - All animated components must collapse durations to 0 / instant rendering.
 */
export function useReducedMotion() {
    // Sync with Framer Motion's internal reduced-motion tracker if available
    const framerPreference = useFramerReducedMotion();
    const [matches, setMatches] = useState(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return false;
        }
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setMatches(mediaQuery.matches);
        const handler = (event) => {
            setMatches(event.matches);
        };
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
        else {
            // Fallback for older browsers
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener(handler);
        }
    }, []);
    return Boolean(framerPreference || matches);
}
