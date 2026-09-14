/**
 * FLOWSTOCK MOTION SYSTEM — TOKENS
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Section 4 & Section 5)
 *
 * All durations in seconds (for Framer Motion compatibility).
 * All animations strictly operate on opacity and transform properties.
 */
export const DURATION = {
    /** 150ms — Micro interactions: button press, toggle, checkbox, tooltip, tag hover */
    micro: 0.15,
    /** 250ms — Normal UI transitions: dropdown, accordion, tab switch, row reveal */
    normal: 0.25,
    /** 350ms — Complex state transitions: modal dialogs, drawers, stepper progress */
    complex: 0.35,
    /** 600ms — Hero reveals, initial dashboard entrance, radar sequence */
    hero: 0.6,
};
export const EASING = {
    /** Emil Kowalski / Apple UI Deceleration curve (fast start, natural settle) */
    standard: [0.23, 1, 0.32, 1],
    /** Emphasized deceleration for modals, popovers, and toasts */
    emphasized: [0.16, 1, 0.3, 1],
    /** Smooth symmetric transition for tab sliders and morphs */
    smooth: [0.77, 0, 0.175, 1],
    /** Linear progression for progress bars and ticker counters */
    linear: [0, 0, 1, 1],
};
export const DISTANCE = {
    /** 4px subtle displacement for buttons and micro-interactions */
    subtle: 4,
    /** 8px displacement for list items, cards, and staggered items */
    normal: 8,
    /** 12px displacement for modal dialogues and popovers */
    modal: 12,
    /** 20px displacement for drawers and panel slide-ins */
    slide: 20,
};
/** Delays used when related elements enter as a sequence. */
export const STAGGER = {
    items: 0.05,
    steps: 0.08,
    timeline: 0.04,
};
/** Shared transform values for small, purposeful UI feedback (Emil Kowalski: never scale from 0). */
export const SCALE = {
    hidden: 0.95,
    modal: 0.96,
    resting: 1,
    progressStart: 0,
    progressEnd: 1,
};
/** Relative offsets used by the one-time warehouse transit cue. */
export const RELATIVE_OFFSET = {
    transitStart: "-100%",
    transitEnd: "400%",
};
