---
version: 7.0.0
name: FlowStock-Design-System
description: Official luxury design system for FlowStock. Built on the Smoky Black (#11120D), Olive Drab (#565449), Bone (#D8CFBC), and Floral White (#FFFBF4) palette.
palette:
  smoky_black: "#11120D"
  olive_drab: "#565449"
  bone: "#D8CFBC"
  floral_white: "#FFFBF4"
  citrus: "#E4FD97"

colors:
  # Primary Brand Accent (Bone)
  primary: "#D8CFBC"
  primary-hover: "#FFFBF4"
  primary-active: "#C5BBA4"
  on-primary: "#11120D"

  # Secondary Spark Accent (Citrus)
  secondary: "#E4FD97"
  secondary-hover: "#d5f57a"
  secondary-muted: "rgba(228, 253, 151, 0.12)"
  secondary-border: "rgba(228, 253, 151, 0.28)"

  # Dark Mode Surfaces (Smoky Black Luxury Void)
  canvas: "#11120D"
  canvas-soft: "#141510"
  canvas-overlay: "#2B2E25"
  surface-card: "#191B15"
  surface-hover: "#23261E"

  # Hairlines & Borders
  hairline: "#33372B"
  hairline-strong: "#565449"
  hairline-bone: "rgba(216, 207, 188, 0.25)"

  # Text / Inks (Dark Mode)
  ink-strong: "#FFFBF4"
  ink: "#D8CFBC"
  body: "#A69E8D"
  mute: "#807D6E"

  # Light Mode Luxury Counterparts
  light-canvas: "#FFFBF4"
  light-surface: "#ffffff"
  light-surface-raised: "#EBE5D8"
  light-hairline: "#E2DED2"
  light-ink: "#11120D"
  light-body: "#565449"
  light-mute: "#807D6E"

  # Status & Semantics
  semantic-success: "#D8CFBC"
  semantic-info: "#D8CFBC"
  semantic-warning: "#f5a623"
  semantic-error: "#ef4444"

typography:
  display-xl:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 60px
    fontWeight: 700
    lineHeight: 64px
    letterSpacing: -0.035em
  display-lg:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 36px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: -0.03em
  display-md:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: -0.025em
  display-sm:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.02em
  eyebrow-mono:
    fontFamily: JetBrains Mono, SFMono-Regular, monospace
    fontSize: 11px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.08em
    textTransform: uppercase
  body-lg:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
  body-md:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  body-sm:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
  code-tabular:
    fontFamily: JetBrains Mono, SFMono-Regular, monospace
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    fontVariantNumeric: tabular-nums

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

shadows:
  bone-glow: "0 2px 20px -2px rgba(216, 207, 188, 0.35)"
  citrus-glow: "0 2px 18px -2px rgba(228, 253, 151, 0.35)"
  card-elevation: "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock uses a signature luxury palette engineered for high-velocity supply chain management, inspired by editorial timepiece design:
- **Smoky Black (`#11120D`)**: The rich, warm obsidian dark canvas void. Deep, sophisticated, and zero dark green tint.
- **Olive Drab (`#565449`)**: Structural hairline borders, secondary tags, and elegant midtone contrast.
- **Bone (`#D8CFBC`)**: The primary brand accent. Carries primary CTAs, active route indicators, live telemetry badges, and glowing focus rings with striking contrast against Smoky Black.
- **Floral White (`#FFFBF4`)**: The editorial canvas for Light Mode, button hover elevations, and crisp dark-mode typography.

## 2. Token Registry

| Token | Hex / Value | Semantic Role |
|-------|-------------|---------------|
| `bone` | `#D8CFBC` | Primary action buttons, ledger verification, active state |
| `bone-hover` | `#FFFBF4` | Primary button hover elevation |
| `smoky-black` | `#11120D` | Root canvas void background in dark mode |
| `smoky-surface` | `#191B15` | Feature cards, modals, table rows (Dark Mode) |
| `smoky-raised` | `#23261E` | Elevated popovers, active tabs, hover states |
| `olive-drab` | `#565449` | Strong borders, hairline accents, secondary badges |
| `floral-white` | `#FFFBF4` | Light mode canvas void & dark mode headlines |

## 3. Brand Logomark & Favicon
The FlowStock emblem is a modern nature-leaf mark:
- **Base Semi-Circle**: Warm cream/beige gradient (`#f5e6d3` → `#d4b896`) grounding the silhouette.
- **Upper Leaf Structure**: 4 progressive leaflets in cyan-to-cobalt gradients (`#a5f3fc` → `#0284c7`, `#38bdf8` → `#0369a1`, `#0ea5e9` → `#1d4ed8`).
- **Vein Highlights**: Fine curvilinear strokes (`stroke="#ffffff"`) providing depth and luminescence across both dark and light modes.
- **Implementations**:
  - `frontend/src/components/ui/Logomark.jsx`: Native vector SVG React component with responsive sizing.
  - `frontend/public/favicon.svg`: Browser tab icon.
  - `frontend/public/flowstock-logomark.svg`: Master mark file.
  - `frontend/public/assets/flowstock-loader.svg`: Loading state in Skeleton.jsx.
  - `frontend/public/assets/flowstock-reveal.svg`: Auth entrance mark in Login.jsx.

