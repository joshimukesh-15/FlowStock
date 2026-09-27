---
version: 1.0.0
name: FlowStock-Design-System
description: Official design system and tokens for FlowStock — a financial-grade inventory ledger and logistics orchestration platform. Built on the VoltAgent aesthetic: an unrelenting near-black (#101010) canvas broken by a single electric-green (#00d992) brand accent, precise 1px hairline borders (#3d3a39), and typography calibrated for mathematical ledger accuracy.
source_inspiration: VoltAgent (awesome-design-md)

colors:
  # Primary Brand Accent (VoltAgent Electric Green)
  primary: "#00d992"
  primary-soft: "#2fd6a1"
  primary-deep: "#10b981"
  on-primary: "#101010"

  # Dark Mode Surfaces (Void Canvas)
  canvas: "#101010"
  canvas-soft: "#1a1a1a"
  canvas-overlay: "#222222"
  surface-card: "#181818"
  surface-hover: "#222222"

  # Hairlines & Borders
  hairline: "#3d3a39"
  hairline-subtle: "#2d2d2d"
  hairline-soft: "#b8b3b0"

  # Text / Inks (Dark Mode)
  ink-strong: "#ffffff"
  ink: "#f2f2f2"
  body: "#bdbdbd"
  mute: "#8b949e"
  canvas-text-soft: "#f5f6f7"

  # Light Mode Counterparts
  light-canvas: "#f8fafc"
  light-surface: "#ffffff"
  light-surface-raised: "#f1f5f9"
  light-hairline: "#e2e8f0"
  light-ink: "#0f172a"
  light-body: "#64748b"
  light-mute: "#94a3b8"

  # Status & Semantics
  semantic-success: "#00d992"
  semantic-warning: "#f5a623"
  semantic-error: "#ef4444"
  semantic-info: "#3b82f6"

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

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 40px
  5xl: 48px
  6xl: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    hoverBackground: "{colors.primary-soft}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.sm}"
    typography: "{typography.body-sm}"
    fontWeight: 600
    shadow: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,217,146,0.2)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    hoverBackground: "{colors.canvas-soft}"
    rounded: "{rounded.sm}"
  card-feature:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  table-ledger:
    headerBackground: "{colors.canvas-soft}"
    headerBorder: "1px solid {colors.hairline}"
    rowBorder: "1px solid {colors.hairline-subtle}"
    numericFont: "{typography.code-tabular}"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock is a financial-grade inventory ledger and logistics engine designed for enterprise warehouse operators.
The UI adheres strictly to the **VoltAgent** design language:
- **Unrelenting Dark Canvas**: In dark mode, `#101010` is the single void background. Cards use `#181818` / `#1a1a1a` with 1px hairline borders (`#3d3a39`).
- **Single Electric Emerald Accent**: `#00d992` carries all primary CTAs, active indicators, and verified ledger states.
- **Engineered Legibility**: Pure Inter typography paired with JetBrains Mono for SKUs, AWBs, stock quantities, and double-entry debits/credits (`tabular-nums`).

## 2. Color Palette & Semantics

| Token | Hex Value | Role |
|-------|-----------|------|
| `primary` | `#00d992` | Primary CTA, verified checkmarks, active status |
| `primary-soft` | `#2fd6a1` | Hover states, secondary interactive cues |
| `primary-deep` | `#10b981` | Inline links, subtle brand anchors |
| `on-primary` | `#101010` | High-contrast label color on electric emerald |
| `canvas` | `#101010` | App & page void canvas in dark mode |
| `canvas-soft` | `#1a1a1a` | Code blocks, input backgrounds, table headers |
| `surface-card` | `#181818` | Feature panels, modal cards, stat cards |
| `hairline` | `#3d3a39` | 1px border on cards, inputs, buttons, and dividers |
| `ink-strong` | `#ffffff` | Hero titles and emphasized KPI metrics |
| `ink` | `#f2f2f2` | Primary body text in dark mode |
| `body` | `#bdbdbd` | Secondary descriptive text |
| `mute` | `#8b949e` | Metadata, timestamps, captions, disabled states |

## 3. Shape & Density Rules
- **No Bubble Pills on Rectangles**: Modals, cards, and inputs use `rounded-lg` (8px-12px). Interactive buttons use `rounded-sm` (6px) or `rounded-lg`. Pills (`rounded-full`) are reserved exclusively for inline status badges (`Active`, `Dispatched`, `Verified`).
- **Eyebrow Restraint**: Maximum 1 small mono eyebrow per 3 sections.
- **Zero Em-Dashes**: Never use the `—` character. Use regular hyphens `-` or standard punctuation.
