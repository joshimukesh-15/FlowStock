import { DURATION, EASING } from "./tokens";
/**
 * Shared transition presets referencing centralized tokens.
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Section 4 & Section 5).
 */
export const instantTransition = {
    duration: 0,
};
export const microTransition = {
    duration: DURATION.micro,
    ease: EASING.standard,
};
export const normalTransition = {
    duration: DURATION.normal,
    ease: EASING.standard,
};
export const complexTransition = {
    duration: DURATION.complex,
    ease: EASING.emphasized,
};
export const heroTransition = {
    duration: DURATION.hero,
    ease: EASING.emphasized,
};
/**
 * Returns the appropriate transition config given the reduced-motion flag.
 */
export function getTransition(preset, reducedMotion = false) {
    if (reducedMotion)
        return instantTransition;
    switch (preset) {
        case "micro":
            return microTransition;
        case "normal":
            return normalTransition;
        case "complex":
            return complexTransition;
        case "hero":
            return heroTransition;
        default:
            return normalTransition;
    }
}
