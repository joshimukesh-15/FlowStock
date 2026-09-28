---
version: 6.0.0
name: FlowStock-Design-System
description: Official design system for FlowStock. Built on the Holst Sage palette chosen from the bottom of the swatch (#F7F3EA, #E2DED2, #BDC9B8, #92AA97) paired with the signature Black Iris (#080813) obsidian dark mode.
palette:
  cream: "#F7F3EA"
  sand: "#E2DED2"
  soft_sage: "#BDC9B8"
  sage_primary: "#92AA97"
  black_iris: "#080813"
  citrus: "#E4FD97"

colors:
  # Primary Brand Accent (Holst Sage)
  primary: "#92AA97"
  primary-hover: "#BDC9B8"
  primary-active: "#7C9581"
  on-primary: "#080813"

  # Secondary Spark Accent (Citrus)
  secondary: "#E4FD97"
  secondary-hover: "#d5f57a"
  secondary-muted: "rgba(228, 253, 151, 0.12)"
  secondary-border: "rgba(228, 253, 151, 0.28)"

  # Dark Mode Surfaces (Black Iris Obsidian - NO DARK GREEN)
  canvas: "#080813"
  canvas-soft: "#101020"
  canvas-overlay: "#16162a"
  surface-card: "#121224"
  surface-hover: "#181832"

  # Hairlines & Borders
  hairline: "#202138"
  hairline-strong: "#2c2d4c"
  hairline-sage: "rgba(146, 170, 151, 0.25)"

  # Text / Inks (Dark Mode)
  ink-strong: "#ffffff"
  ink: "#f0f3f8"
  body: "#c2cbda"
  mute: "#7e889b"

  # Light Mode Luxury Counterparts
  light-canvas: "#F7F3EA"
  light-surface: "#ffffff"
  light-surface-raised: "#E2DED2"
  light-hairline: "#BDC9B8"
  light-ink: "#080813"
  light-body: "#4a5568"
  light-mute: "#8a94a6"

  # Status & Semantics
  semantic-success: "#92AA97"
  semantic-info: "#92AA97"
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
  sage-glow: "0 2px 20px -2px rgba(146, 170, 151, 0.35)"
  citrus-glow: "0 2px 18px -2px rgba(228, 253, 151, 0.35)"
  card-elevation: "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock combines a signature **Black Iris (`#080813`) obsidian dark mode** with an organic, bespoke **Holst Sage palette** chosen from the bottom of the swatch:
- **Black Iris (`#080813`)**: The deep midnight void surface. It replaces generic gray with a rich, refined obsidian dark canvas without ANY muddy green background tint.
- **Sage (`#92AA97`)**: The crisp primary brand accent. Carries primary CTAs, active route indicators, live telemetry badges, and focused highlights.
- **Soft Sage (`#BDC9B8`)**: High-fidelity hover states and secondary interactive elements.
- **Warm Cream (`#F7F3EA`)**: The luxurious editorial canvas for Light Mode, eliminating sterile white/gray for a tailored, premium feel.
- **Soft Sand (`#E2DED2`)**: Secondary card surface and pill backgrounds in Light Mode.
- **Citrus (`#E4FD97`)**: High-luminance lemon-lime secondary spark for special alerts and ledger confirmations.

## 2. Token Registry

| Token | Hex / Value | Semantic Role |
|-------|-------------|---------------|
| `sage` | `#92AA97` | Primary action buttons, ledger verification, active state |
| `sage-hover` | `#BDC9B8` | Primary button hover elevation |
| `cream` | `#F7F3EA` | Light mode canvas void background |
| `sand` | `#E2DED2` | Light mode card elevation & secondary surfaces |
| `black-iris` | `#080813` | Root canvas void background in dark mode |
| `iris-surface` | `#121224` | Feature cards, modals, table rows (Dark Mode) |
| `iris-raised` | `#181832` | Elevated popovers, active tabs, hover states |
| `iris-hairline` | `#202138` | Universal 1px border on cards and dividers |
| `ink-strong` | `#ffffff` | Hero headlines, primary KPI metrics (Dark Mode) |
| `ink` | `#f0f3f8` | Primary body typography (Dark Mode) |
| `body` | `#c2cbda` | Secondary descriptions and paragraphs (Dark Mode) |
| `mute` | `#7e889b` | Monospace tags, timestamps, captions |
