---
version: 4.0.0
name: FlowStock-Design-System
description: Official design system for FlowStock. Built on the Holst ocean-teal palette with Deep Ocean (#04222B) canvas and Teal (#4FB8B4) primary accent.
palette:
  deep_ocean: "#04222B"
  ocean_surface: "#0A3D4A"
  ocean_raised: "#10606F"
  teal_accent: "#1D8B94"
  teal_primary: "#4FB8B4"
  teal_hover: "#98D8D0"
  teal_light: "#E2F4F0"
  citrus: "#E4FD97"

colors:
  # Primary Brand Accent (Holst Teal)
  primary: "#4FB8B4"
  primary-hover: "#98D8D0"
  primary-active: "#3BA5A0"
  on-primary: "#04222B"

  # Secondary Spark Accent (Citrus)
  secondary: "#E4FD97"
  secondary-hover: "#d5f57a"
  secondary-muted: "rgba(228, 253, 151, 0.12)"
  secondary-border: "rgba(228, 253, 151, 0.28)"

  # Dark Mode Surfaces (Holst Ocean Void)
  canvas: "#04222B"
  canvas-soft: "#061E26"
  canvas-overlay: "#0D5260"
  surface-card: "#0A3D4A"
  surface-hover: "#10606F"

  # Hairlines & Borders
  hairline: "#10606F"
  hairline-strong: "#1D8B94"
  hairline-accent: "rgba(79, 184, 180, 0.22)"

  # Text / Inks (Dark Mode)
  ink-strong: "#ffffff"
  ink: "#f0f3f8"
  body: "#c2cbda"
  mute: "#7e889b"

  # Light Mode Counterparts
  light-canvas: "#f6f8fb"
  light-surface: "#ffffff"
  light-surface-raised: "#E2F4F0"
  light-hairline: "#98D8D0"
  light-ink: "#04222B"
  light-body: "#4a5568"
  light-mute: "#8a94a6"

  # Status & Semantics
  semantic-success: "#4FB8B4"
  semantic-info: "#4FB8B4"
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
  holst-glow: "0 2px 18px -2px rgba(79, 184, 180, 0.30)"
  citrus-glow: "0 2px 18px -2px rgba(228, 253, 151, 0.35)"
  card-elevation: "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock uses the **Holst** ocean-teal palette -- a 7-step gradient from deep ocean to arctic ice, engineered for a premium financial-grade cockpit:
- **Deep Ocean (`#04222B`)**: The darkest void canvas. A rich, blue-teal black that feels like a deep-water command center.
- **Teal (`#4FB8B4`)**: The vibrant primary accent. Carries buttons, active indicators, live metrics, badges, and interactive highlights with confident energy.
- **Seafoam (`#98D8D0`)**: Soft hover states and secondary highlights. Elegant elevation.
- **Arctic (`#E2F4F0`)**: The lightest highlight for on-dark text emphasis and whisper-thin accents.

## 2. Palette Gradient (Dark to Light)

| Step | Hex | Role |
|------|-----|------|
| 1 | `#04222B` | Canvas void, deepest background |
| 2 | `#0A3D4A` | Base card surfaces, modals, inputs |
| 3 | `#10606F` | Borders, dividers, raised surfaces |
| 4 | `#1D8B94` | Strong borders, secondary accent, sidebar active |
| 5 | `#4FB8B4` | **Primary accent**: buttons, badges, active metrics |
| 6 | `#98D8D0` | Hover states, light accent |
| 7 | `#E2F4F0` | Lightest highlight, on-dark emphasis |

## 3. Token Registry

| Token | Hex / Value | Semantic Role |
|-------|-------------|---------------|
| `holst` | `#4FB8B4` | Primary accent: buttons, active indicators, live metrics |
| `holst-hover` | `#98D8D0` | Primary button hover, elevated accent |
| `holst-active` | `#3BA5A0` | Pressed/active button state |
| `deep-ocean` | `#04222B` | Root canvas void background in dark mode |
| `ocean-surface` | `#0A3D4A` | Feature cards, modals, table rows |
| `ocean-raised` | `#10606F` | Borders, active tabs, hover states |
| `ocean-accent` | `#1D8B94` | Strong borders, secondary teal indicator |
| `ink-strong` | `#ffffff` | Hero headlines, primary KPI metrics |
| `ink` | `#f0f3f8` | Primary body typography |
| `body` | `#c2cbda` | Secondary descriptions and paragraphs |
| `mute` | `#7e889b` | Monospace tags, timestamps, captions |
