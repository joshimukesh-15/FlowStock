---
version: 2.0.0
name: FlowStock-Design-System
description: Official design system and tokens for FlowStock — a financial-grade inventory ledger and logistics platform. Built on the signature Black Iris (#080813), Citrus (#E4FD97), and Frozen (#A0BDDB) palette.
palette:
  black_iris: "#080813"
  citrus: "#E4FD97"
  frozen: "#A0BDDB"

colors:
  # Primary Brand Accent (Citrus)
  primary: "#E4FD97"
  primary-hover: "#d5f57a"
  primary-active: "#c3e65c"
  on-primary: "#080813"

  # Secondary Accent (Frozen)
  secondary: "#A0BDDB"
  secondary-hover: "#b4cce3"
  secondary-muted: "rgba(160, 189, 219, 0.12)"
  secondary-border: "rgba(160, 189, 219, 0.25)"

  # Dark Mode Surfaces (Black Iris Void)
  canvas: "#080813"
  canvas-soft: "#101020"
  canvas-overlay: "#16162a"
  surface-card: "#121224"
  surface-hover: "#181832"

  # Hairlines & Borders
  hairline: "#202138"
  hairline-strong: "#2c2d4c"
  hairline-frozen: "rgba(160, 189, 219, 0.22)"

  # Text / Inks (Dark Mode)
  ink-strong: "#ffffff"
  ink: "#f0f3f8"
  body: "#c2cbda"
  mute: "#7e889b"

  # Light Mode Counterparts
  light-canvas: "#f6f8fb"
  light-surface: "#ffffff"
  light-surface-raised: "#edf2f8"
  light-hairline: "#d8e2ec"
  light-ink: "#080813"
  light-body: "#4a5568"
  light-mute: "#8a94a6"

  # Status & Semantics
  semantic-success: "#E4FD97"
  semantic-info: "#A0BDDB"
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
  frozen-glow: "0 2px 18px -2px rgba(160, 189, 219, 0.25)"
  card-elevation: "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock uses a signature three-color harmony engineered for high-velocity supply chain management:
- **Black Iris (`#080813`)**: The deep midnight void surface. It replaces generic gray with a rich, refined indigo-tinged dark canvas.
- **Citrus (`#E4FD97`)**: High-luminance lemon-lime accent. Carries primary CTAs, active confirmation states, and key ledger metrics.
- **Frozen (`#A0BDDB`)**: Calming ice-blue accent. Used for secondary metadata, subtle borders, carrier logistics indicators, and waypoint telemetry.

## 2. Token Registry

| Token | Hex / Value | Semantic Role |
|-------|-------------|---------------|
| `citrus` | `#E4FD97` | Primary action buttons, ledger verification, active state |
| `citrus-hover` | `#d5f57a` | Primary button hover elevation |
| `frozen` | `#A0BDDB` | Secondary accent, route badges, transit telemetry |
| `black-iris` | `#080813` | Root canvas void background in dark mode |
| `iris-surface` | `#121224` | Feature cards, modals, table rows |
| `iris-raised` | `#181832` | Elevated popovers, active tabs, hover states |
| `iris-hairline` | `#202138` | Universal 1px border on cards and dividers |
| `ink-strong` | `#ffffff` | Hero headlines, primary KPI metrics |
| `ink` | `#f0f3f8` | Primary body typography |
| `body` | `#c2cbda` | Secondary descriptions and paragraphs |
| `mute` | `#7e889b` | Monospace tags, timestamps, captions |
