# FlowStock — Brand mark

Open `preview.html` to see everything running, including a colour tester.

## The idea

A stock unit, cut with an F.

- **The hexagon** is a unit of stock. It is also the silhouette of an isometric box, which keeps the shape from the previous logo.
- **The stem of the F** is the stock: the thing that stays.
- **The arrow** is the flow. It is the only lime element, and it sits apart from the stem (a 2.6-unit gutter) because it is already leaving.
- **Every angle comes from the hexagon:** 60° for the cut on the top arm, 30° for the arrow's tip.

The F is cut out of the hexagon rather than coloured in, so the background shows through it. That is why one shape works on any colour.

## Files

| Folder | Contents |
|---|---|
| `mark/` | The symbol: `flowstock-mark` (primary), `-reverse`, `-black`, `-white`, `-currentcolor`, `-auto` |
| `lockup/` | Symbol + wordmark, horizontal and stacked, in primary, reverse, black, white and currentcolor |
| `app/` | `favicon.svg`, app icons (dark, light, square, maskable) |
| `motion/` | `reveal`, `loader`, `ambient`, each with an `-on-dark` version |
| `png/` | `favicon.ico`, apple-touch-icon, icon-192, icon-512, icon-512-maskable, 1200×630 social card |
| `tools/` | Generator scripts and the colour picker (see below) |

## Colour: matching any background

Brand colours: ink `#23262F`, lime `#B6FF2E`.

Choose the colourway with this rule, in order. `tools/flowstock-picker.js` implements it:

| # | If the background has… | Use | Result |
|---|---|---|---|
| 1 | ≥ 4.5:1 contrast with ink | **Primary**: ink hexagon, lime arrow | light and bright surfaces |
| 2 | ≥ 4.5:1 contrast with lime | **Reverse**: lime hexagon | dark surfaces |
| 3 | ≥ 3:1 contrast with white | **White** mono | mid and saturated colours |
| 4 | otherwise | **Black** mono | |

Tested against a sweep of 4,096 colours across the whole RGB cube: **the worst case is 3.36:1**, so nothing falls through. Examples:

| Background | Colourway | Contrast |
|---|---|---|
| White, Paper, Yellow, Lime | Primary | 15.1, 13.8, 10.7, 12.5 |
| Near-black, Navy, Slate | Reverse | 15.6, 12.7, 6.3 |
| Red `#E5484D`, Mid grey, Teal | White | 3.9, 3.9, 3.4 |

```js
import flowstockVariant from './tools/flowstock-picker.js';
flowstockVariant('#E5484D');   // { variant: 'white', file: 'flowstock-mark-white.svg', ratio: 3.9 }
```

**On dark surfaces do not use the ink hexagon.** Ink on `#0D1117` is 1.25:1 and disappears.

`flowstock-mark-auto.svg` switches between primary and reverse on the system light/dark setting. Inside `<img>` it follows the operating system, not your page's own theme toggle. If your app has its own theme switch, inline the SVG or use the picker.

## Sizes and clear space

- **Clear space:** keep a quarter of the mark's width free on every side.
- **Minimum size:** the full mark is 24px tall. Below that the gutter between stem and arrow closes, so use `app/favicon.svg` (thicker, one-piece F), which stays clear at 16px.
- The lockup should not go below 20px tall.

| Context | Use |
|---|---|
| Header | `lockup/flowstock-logo.svg`, 28–36px tall |
| Sidebar, collapsed | `mark/flowstock-mark.svg`, 24–32px |
| Favicon | `app/favicon.svg` + `png/favicon.ico` |
| App icon | `app/flowstock-app-icon.svg`; PWA: `png/icon-512-maskable.png` |

## Usage

```html
<!-- Header -->
<img src="/brand/lockup/flowstock-logo.svg" height="32" alt="FlowStock">

<!-- Favicon and app icons -->
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/brand/app/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/png/apple-touch-icon.png">

<!-- Social card -->
<meta property="og:image" content="https://your-site.com/brand/png/og-1200x630.png">
```

To colour the mark with CSS, inline `mark/flowstock-mark-currentcolor.svg` and set `color:`:

```css
.logo { color: #fff; }   /* the hexagon takes this colour; the F shows the background */
```

Use `aria-hidden="true"` when the mark sits beside the word "FlowStock".

## Motion

The arrow is the only element that moves independently, so motion always reads as flow.

| File | Use | Timing |
|---|---|---|
| `flowstock-reveal` | Splash, hero | Plays once, about 1s: hexagon pops, arrow slides out of the stem |
| `flowstock-loader` | Pending states | 1.6s per lap: a comet orbits the rim, the arrow breathes |
| `flowstock-ambient` | Persistent header mark | 3.6s cycle: one glint crosses the arrow, then it holds still |

- **Resting state is the default.** If animation can't run, you get the finished logo, never a blank.
- **On dark** versions open the arrow out of the hexagon instead of sliding it in, and the loader's comet is ink so it works on any dark background.
- All files honour `prefers-reduced-motion`.
- Use the loader for waits over about 300ms, and let the current lap finish before unmounting it.
- Inside `<img>`, animations play on load. To replay, change the `src` with a `?t=` query, as `preview.html` does.

## Don't

- Don't fill in the F, or recolour the arrow away from lime on the primary mark.
- Don't put the ink hexagon on a dark background, or the lime hexagon on a light one.
- Don't rotate, stretch, outline, or add shadows or gradients.
- Don't separate the hexagon from the F.

## Regenerating

Every SVG is written from one geometry file, so nothing drifts. From `tools/`:

```
python3 build_brand.py      # all SVGs (needs fontTools and Poppins; set POPPINS=/path/Poppins-%s.ttf if needed)
python3 build_preview.py    # preview.html
node check_colors.js        # colour-rule test
```

`export.js` renders the PNGs (needs Playwright), and `favicon.ico` is assembled from the three favicon PNGs.

## Wordmark and licence

The wordmark is outlined from **Poppins Bold** (SIL Open Font License), kerned from the font's own pair data. It is a placeholder for a custom or licensed typeface: swapping it does not touch the mark. The name is set as one word, "FlowStock", with no space and no second colour.

## Checked

Rendered in Chromium and stepped through frame by frame, including at 16, 24, 32 and 48px, with animation disabled, and with reduced motion on. Not yet run in Firefox or Safari; nothing here uses a feature they lack, but check the loader and the on-dark reveal there before shipping.
