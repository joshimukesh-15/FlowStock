---
version: 5.0.0
name: FlowStock-Design-System
description: Official design system for FlowStock. Built on the Holst Sage organic palette, ensuring absolute premium aesthetics in both Light (Cream/Sand) and Dark (Olive/Forest) modes.
palette:
  cream: "#F7F3EA"
  sand: "#E2DED2"
  light_sage: "#BDC9B8"
  sage: "#92AA97"
  deep_sage: "#6D8C73"
  olive: "#4C6B55"
  dark_olive: "#314C3B"
  forest_void: "#1B2A20"

colors:
  # Primary Brand Accent
  primary: "#92AA97"
  primary-hover: "#BDC9B8"
  primary-active: "#6D8C73"
  on-primary: "#1B2A20"

  # Dark Mode Surfaces (Forest Void)
  canvas: "#1B2A20"
  surface-card: "#314C3B"
  surface-hover: "#4C6B55"
  hairline: "#4C6B55"
  hairline-strong: "#6D8C73"
  ink-strong: "#F7F3EA"
  ink: "#E2DED2"
  body: "#BDC9B8"
  mute: "#92AA97"

  # Light Mode Surfaces (Cream & Sand)
  light-canvas: "#F7F3EA"
  light-surface: "#E2DED2"
  light-surface-raised: "#BDC9B8"
  light-hairline: "#BDC9B8"
  light-ink-strong: "#1B2A20"
  light-ink: "#314C3B"
  light-body: "#4C6B55"
  light-mute: "#6D8C73"
---

# FlowStock Design System Specification

## 1. Overview & Philosophy
FlowStock has upgraded from artificial "tech" colors to a bespoke, organic **Holst Sage** palette. This ensures the UI feels like a premium, tailored product rather than generic software. It works beautifully in both modes:
- **Light Mode**: Feels like premium stationary. Cream (`#F7F3EA`) canvas, Sand (`#E2DED2`) cards, and Deep Olive (`#314C3B`) text.
- **Dark Mode**: Feels like a serene, high-end cockpit. Dark Forest (`#1B2A20`) canvas, Olive (`#314C3B`) cards, and Sage (`#92AA97`) accents.

## 2. Palette Gradient (Light to Dark)

| Step | Hex | Light Mode Role | Dark Mode Role |
|------|-----|-----------------|----------------|
| 1 | `#F7F3EA` | **Canvas Void** | Primary Text (Headings) |
| 2 | `#E2DED2` | **Card Surfaces** | Secondary Text |
| 3 | `#BDC9B8` | Borders / Hover | Hover Accent |
| 4 | `#92AA97` | Primary Accent | **Primary Accent** |
| 5 | `#6D8C73` | Muted Text | Strong Borders |
| 6 | `#4C6B55` | Secondary Text | Raised Surfaces / Borders |
| 7 | `#314C3B` | Primary Text | **Card Surfaces** |
| 8 | `#1B2A20` | Contrast Elements | **Canvas Void** |
