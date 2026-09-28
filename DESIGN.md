---
version: 3.0.0
name: FlowStock-Design-System
description: Official design system and tokens for FlowStock — a financial-grade inventory ledger and logistics platform. Built on the signature Forest-to-Mint green palette with Deep Forest (#051F20) canvas and Sage (#8EB69B) accent.
palette:
  deep_forest: "#051F20"
  dark_forest: "#0B2B26"
  forest: "#163832"
  forest_border: "#235347"
  sage: "#8EB69B"
  mint: "#DAF1DE"
  citrus: "#E4FD97"

colors:
  # Primary Brand Accent (Sage)
  primary: "#8EB69B"
  primary-hover: "#DAF1DE"
  primary-active: "#7AA38A"
  on-primary: "#051F20"

  # Secondary Spark Accent (Citrus)
  secondary: "#E4FD97"
  secondary-hover: "#d5f57a"
  secondary-muted: "rgba(228, 253, 151, 0.12)"
  secondary-border: "rgba(228, 253, 151, 0.28)"

  # Dark Mode Surfaces (Forest Void)
  canvas: "#051F20"
  canvas-soft: "#081E1F"
  canvas-overlay: "#0D2924"
  surface-card: "#0B2B26"
  surface-hover: "#163832"

  # Hairlines & Borders
  hairline: "#235347"
  hairline-strong: "#2E6A5A"
  hairline-sage: "rgba(142, 182, 155, 0.22)"

  # Text / Inks (Dark Mode)
  ink-strong: "#ffffff"
  ink: "#f0f3f8"
  body: "#c2cbda"
  mute: "#7e889b"

  # Light Mode Counterparts
  light-canvas: "#f6f8fb"
  light-surface: "#ffffff"
  light-surface-raised: "#EEF7F0"
  light-hairline: "#B8D4BF"
  light-ink: "#051F20"
  light-body: "#4a5568"
  light-mute: "#8a94a6"

  # Status & Semantics
  semantic-success: "#8EB69B"
  semantic-info: "#8EB69B"
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
  citrus-glow: "0 2px 18px -2px rgba(228, 253, 151, 0.35)"
  sage-glow: "0 2px 18px -2px rgba(142, 182, 155, 0.30)"
  card-elevation: "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock uses a signature forest-to-mint green harmony engineered for high-velocity supply chain management:
- **Deep Forest (`#051F20`)**: The deep emerald void canvas. Replaces generic gray with a rich, organic dark surface that evokes stability and precision.
- **Sage (`#8EB69B`)**: The muted sage-green primary accent. Carries active indicators, live status glows, badges, metrics, and interactive highlights.
- **Mint (`#DAF1DE`)**: Soft mint for hover states, secondary highlights, and elevated accent moments.
- **Citrus (`#E4FD97`)**: High-luminance lemon-lime kept as a secondary spark variant for special CTAs.

## 2. Palette Gradient (Dark to Light)

| Step | Hex | Role |
|------|-----|------|
| 1 | `#051F20` | Canvas void / deepest background |
| 2 | `#0B2B26` | Base card surfaces, modals |
| 3 | `#163832` | Raised surfaces, active tabs, hover states |
| 4 | `#235347` | Borders, hairlines, dividers |
| 5 | `#8EB69B` | Primary accent: buttons, badges, active states |
| 6 | `#DAF1DE` | Accent hover, light highlights, on-dark text emphasis |

## 3. Token Registry

| Token | Hex / Value | Semantic Role |
|-------|-------------|---------------|
| `sage` | `#8EB69B` | Primary accent: buttons, active indicators, live metrics |
| `sage-hover` | `#DAF1DE` | Primary button hover, elevated accent |
| `sage-active` | `#7AA38A` | Pressed/active button state |
| `deep-forest` | `#051F20` | Root canvas void background in dark mode |
| `forest-surface` | `#0B2B26` | Feature cards, modals, table rows |
| `forest-raised` | `#163832` | Elevated popovers, active tabs, hover states |
| `forest-hairline` | `#235347` | Universal 1px border on cards and dividers |
| `ink-strong` | `#ffffff` | Hero headlines, primary KPI metrics |
| `ink` | `#f0f3f8` | Primary body typography |
| `body` | `#c2cbda` | Secondary descriptions and paragraphs |
| `mute` | `#7e889b` | Monospace tags, timestamps, captions |
