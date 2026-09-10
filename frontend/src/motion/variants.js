import { DURATION, EASING, DISTANCE, SCALE, STAGGER } from "./tokens";
/**
 * FLOWSTOCK MOTION SYSTEM — REUSABLE VARIANTS
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Sections 4, 5, 8).
 *
 * All variants animate transform and opacity only.
 * Functions accept reducedMotion flag to provide instant no-motion fallback.
 */
export const fadeInVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.standard,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.micro,
            ease: EASING.standard,
        },
    },
});
export const slideUpVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
        y: reducedMotion ? 0 : DISTANCE.normal,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.standard,
        },
    },
    exit: {
        opacity: 0,
        y: reducedMotion ? 0 : -DISTANCE.subtle,
        transition: {
            duration: reducedMotion ? 0 : DURATION.micro,
            ease: EASING.standard,
        },
    },
});
export const modalBackdropVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.standard,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.micro,
            ease: EASING.standard,
        },
    },
});
export const modalContentVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
        scale: reducedMotion ? SCALE.resting : SCALE.modal,
        y: reducedMotion ? 0 : DISTANCE.modal,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.complex,
            ease: EASING.emphasized,
        },
    },
    exit: {
        opacity: 0,
        scale: reducedMotion ? 1 : 0.98,
        y: reducedMotion ? 0 : DISTANCE.subtle,
        transition: {
            duration: reducedMotion ? 0 : DURATION.micro,
            ease: EASING.standard,
        },
    },
});
export const toastVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
        y: reducedMotion ? 0 : DISTANCE.slide,
        scale: reducedMotion ? 1 : 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.emphasized,
        },
    },
    exit: {
        opacity: 0,
        y: reducedMotion ? 0 : DISTANCE.normal,
        scale: reducedMotion ? 1 : 0.95,
        transition: {
            duration: reducedMotion ? 0 : DURATION.micro,
            ease: EASING.standard,
        },
    },
});
export const createStaggerContainer = (staggerChildren = STAGGER.items, delayChildren = 0, reducedMotion = false) => ({
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: reducedMotion ? 0 : staggerChildren,
            delayChildren: reducedMotion ? 0 : delayChildren,
        },
    },
});
/**
 * Skeleton shimmer — a soft, one-directional opacity pulse used ONLY as a
 * loading placeholder that mirrors the real layout. Never delays real data.
 */
export const skeletonPulseVariants = (reducedMotion = false) => ({
    initial: { opacity: reducedMotion ? 0.5 : 0.55 },
    animate: {
        opacity: reducedMotion ? 0.5 : 1,
        transition: {
            duration: reducedMotion ? 0 : DURATION.hero,
            ease: EASING.smooth,
            repeat: reducedMotion ? 0 : Infinity,
            repeatType: "reverse",
        },
    },
});
/**
 * Empty state — an icon that settles into place with a soft rise,
 * plus a gentle float cue that stops after a single pass (never loops).
 */
export const emptyStateIconVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
        scale: reducedMotion ? 1 : SCALE.hidden,
        y: reducedMotion ? 0 : DISTANCE.subtle,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.emphasized,
        },
    },
});
export const emptyStateContentVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
        y: reducedMotion ? 0 : DISTANCE.subtle,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.standard,
            delay: reducedMotion ? 0 : STAGGER.items,
        },
    },
});
/**
 * Popover / dropdown — anchored menu that opens with a compact scale+translate
 * and closes fast. Origin is handled by the parent transform-origin class.
 */
export const popoverVariants = (reducedMotion = false) => ({
    hidden: {
        opacity: 0,
        scale: reducedMotion ? 1 : 0.96,
        y: reducedMotion ? 0 : -DISTANCE.subtle,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: reducedMotion ? 0 : DURATION.normal,
            ease: EASING.emphasized,
        },
    },
    exit: {
        opacity: 0,
        scale: reducedMotion ? 1 : 0.97,
        y: reducedMotion ? 0 : -DISTANCE.subtle,
        transition: {
            duration: reducedMotion ? 0 : DURATION.micro,
            ease: EASING.standard,
        },
    },
});
