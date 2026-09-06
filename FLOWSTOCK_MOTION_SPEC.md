# FLOWSTOCK — MOTION SYSTEM SPEC (Addendum to Master Build Spec)

This document governs the motion/animation layer of FlowStock. It does **not**
override `FLOWSTOCK_MASTER_SPEC.md` — it operates under it. Where anything here
conflicts with the master spec (especially the FREE-ONLY mandate), the master
spec wins.

---

## 0. PREREQUISITE GATE (read first — do not skip)

**This spec must not be executed until the underlying application already works.**

Motion is applied to real, functioning UI backed by real data — it is never built
against placeholder screens or before business logic exists. Concretely:

- Do not begin this spec until the phases in the master spec's Section 9 that cover
  the relevant module are already at their Definition of Done (e.g., don't animate
  the order lifecycle component until real order data and status transitions exist
  and are tested).
- If asked to apply this spec to a project where the target feature isn't built yet,
  **stop and say so** — do not invent fake data or fake states to animate against
  "for now." (This mirrors Section 20 of this spec and Section 0.2 of the master spec.)
- Treat this as its own phase — call it **Phase 10.5: Motion System** — inserted
  after the core module phases (3–10) are functionally complete and tested, and
  before final security/performance hardening (15–18). Motion added earlier than
  this will be repeatedly broken by ongoing feature changes and is wasted effort.

---

## 1. SCOPE RULE

- Do NOT rebuild the application.
- Do NOT change backend architecture or business logic.
- Do NOT change data flow, API contracts, or state shape.
- Only touch: presentation-layer animation, transitions, and the motion
  infrastructure described below.
- If achieving a described animation would require a data/API change (e.g., you need
  a field the backend doesn't return), stop and flag it — do not silently add a
  workaround that fakes the missing data.

---

## 2. INSPECTION STEP (mandatory, before writing any animation code)

Before changing anything, inspect and report on:

1. Current frontend stack and version (confirm Next.js/React/Tailwind versions in use)
2. Any animation library already present in `package.json` (if none, see Section 3)
3. Reusable component structure (shared Button, Card, Table, Modal, etc.)
4. Routing structure
5. Design tokens currently in use (colors, spacing, radii, typography)
6. Responsive breakpoints currently defined
7. Any existing accessibility handling (focus states, ARIA, reduced-motion handling)

Do not proceed to implementation until this inspection is done and reported.

---

## 3. TECHNOLOGY — FREE-ONLY CHECK (overrides Section 21 of the original brief)

The original brief lists Framer Motion, GSAP, CSS, Rive, and Lottie as options.
Per the master spec's FREE-ONLY mandate, these are **not** equally safe:

| Library | Status | Verdict |
|---|---|---|
| CSS transitions/animations | Free, built-in | ✅ Use freely |
| Framer Motion (`motion` package) | Free, MIT-licensed, no paid tier | ✅ Default choice for React UI transitions |
| GSAP core | Free/MIT as of current versions | ✅ Allowed **only** if a complex timeline genuinely can't be done with Framer Motion/CSS — confirm current licensing before adding, since this has changed over time |
| Rive | Runtime is free, but the **Rive authoring/editor tool** has paid tiers for teams | ⚠️ Avoid unless a free-tier-compatible asset already exists — do not assume access to paid authoring tools |
| Lottie | Runtime (`lottie-react`) is free, but Lottie files are normally authored in **Adobe After Effects (paid)** | ⚠️ Avoid unless using pre-made, freely-licensed Lottie files — do not assume access to paid authoring tools |

**Default rule for this project: use CSS transitions + Framer Motion only.**
Do not add GSAP, Rive, or Lottie unless the user explicitly approves it after being
told about the licensing caveat above.

Do not introduce more than one animation library without explicit approval.

---

## 4. MOTION PRINCIPLES (unchanged from original brief — kept as-is)

- Micro interaction: 100–180ms
- Normal UI transition: 180–300ms
- Complex state transition: 300–500ms
- Hero/brand animation: 500–1000ms
- Animate `transform` and `opacity` only wherever possible — avoid animating
  layout-triggering properties (width, height, top/left) except where unavoidable
- Must respect `prefers-reduced-motion` everywhere, with no exceptions
- Motion must never be the *only* channel carrying information — color/text/state
  must independently convey the same meaning (accessibility requirement, not optional)

---

## 5. CENTRALIZED MOTION ARCHITECTURE (mandatory structure)

Create a single motion module, not scattered inline values:

```
/motion
  tokens.ts        (durations, easing curves, distances)
  variants.ts       (reusable Framer Motion variants: fadeIn, slideUp, stagger, etc.)
  transitions.ts    (shared transition configs)
  useReducedMotion.ts (hook wrapping prefers-reduced-motion, used everywhere)
```

Rules:
- No component may hardcode a duration, easing curve, or distance value directly.
  Every animated value comes from `/motion/tokens.ts`.
- Every animated component must consume the reduced-motion hook and provide an
  instant/no-motion fallback — this is not optional per-component, it's structural.

---

## 6. FEATURE-BY-FEATURE SCOPE (from original brief — kept, with real-data rule reinforced)

Apply motion to the following areas **only once their underlying feature is real
and tested** (see Section 0):

- Landing page hero (operational-data visualization, not particles)
- Dashboard entrance sequence (structure → KPIs → charts → alerts → tables)
- KPI number count-up (only on initial load or real value change — never looping)
- Inventory ledger/timeline transitions (driven by real movement records)
- Order lifecycle stepper (driven strictly by real `order.status` — see Section 7)
- Warehouse zone/rack visualization and transfer animation (2D/2.5D, not 3D unless
  it demonstrably improves usability)
- Purchase → inventory workflow visualization
- Table interactions (hover, selection, sort/filter/pagination transitions —
  never animate every row individually on large tables)
- Sidebar navigation transitions
- Modal/drawer transitions (opacity + scale + translate, no dramatic zoom)
- Notifications (enter/exit only, no flashing/looping warnings)
- Global search overlay and staggered results
- Chart entrance animations (one-time reveal, not continuous)
- Empty states (subtle only, no cartoon-style motion)
- Skeleton loaders (must mirror real layout, never artificially delay the user)
- Success/error/warning feedback (fast, subtle)
- Micro-interactions on buttons, cards, dropdowns, tabs, checkboxes, switches, inputs, tooltips
- Mobile warehouse flow — speed over visual effects; short scan-confirmation animation only

---

## 7. REAL-DATA-ONLY RULE (critical — carried over and reinforced)

This is the single most important rule in this document:

- Every animated state must be a direct rendering of real backend state.
- `order.status = "PACKED"` → the stepper shows exactly that step as current,
  computed from the real enum value, not a hardcoded index.
- `inventory.quantity = 42` → the UI displays 42, and any count-up animation
  animates *to* 42, not to an arbitrary or rounded number.
- Never build a demo/fake animated state "to show off the motion" that doesn't
  correspond to what the backend would actually return. If you need to preview
  an animation during development, use the project's real seed/demo data
  (defined in the master spec's Section 36/"Demo Mode"), never invented data.

---

## 8. PERFORMANCE RULE

- Animate only `transform` and `opacity`.
- No continuous blur, no large/animated box-shadows, no unnecessary canvas or
  large-scale DOM animation.
- Dashboard and table performance must not visibly degrade after motion is added —
  this must be checked, not assumed (see DoD below).

---

## 9. DEFINITION OF DONE — MOTION PHASE

This phase is only complete when **all** of the following are true:

- [ ] Prerequisite gate satisfied: the animated features already work correctly
      without animation before motion was added.
- [ ] Only CSS transitions and/or Framer Motion are used, unless the user explicitly
      approved GSAP/Rive/Lottie with the licensing caveat acknowledged.
- [ ] `/motion` module exists and every component pulls tokens from it — no hardcoded
      durations/easings/distances found anywhere else in the codebase.
- [ ] Every animated state was checked against real data — order steppers, inventory
      numbers, and stock movements match actual backend values (not hardcoded demo values).
- [ ] `prefers-reduced-motion` was tested (via OS/browser setting) and confirmed to
      produce instant, non-animated transitions across the app — not just on one screen.
- [ ] No information is conveyed by motion alone — spot-checked on at least the order
      lifecycle and inventory status indicators.
- [ ] Dashboard, product list/table, and mobile warehouse flow were tested for
      performance regressions after motion was added (visually smooth, no jank).
- [ ] Every screen listed in Section 6 was manually walked through: Dashboard,
      Products, Inventory, Warehouses, Orders, Purchasing, Suppliers, Shipments,
      Invoices, Analytics, mobile warehouse UI, mobile responsive layouts, and
      reduced-motion mode.
- [ ] No new dependency was added beyond what Section 3 allows without explicit
      user approval.

---

## 10. FINAL STANDARD (unchanged from original brief)

The result should feel like an expensive, professionally designed B2B SaaS product —
not a college site with lots of animations. If any single animation doesn't improve
understanding, feedback, navigation, hierarchy, or perceived quality, remove it.
