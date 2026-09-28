#!/usr/bin/env python3
"""FlowStock brand system — generator (Python stdlib + fontTools for the wordmark outlines).
Every file is written from brand.py's geometry, so nothing can drift. Run:  python3 build_brand.py"""
import os, re, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brand import *
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")   # writes next to tools/
FONTS = os.environ.get("POPPINS", "/usr/share/fonts/truetype/google-fonts/Poppins-%s.ttf")   # path with %s for the weight
WHITE = "#FFFFFF"; BLACK = "#000000"
G = build(); HEXD, GAMD, ARRD = G["hex"], G["gamma"], G["arrow"]
# a hair-inflated copy of the arrow: covers the anti-aliased edge of the hole so a lime patch leaves no seam
FAT = round_poly(inset(G["arrow_pts"], -.7), 2.3)
VB = "18 12 84 96"                       # tight artboard around the hexagon (2u breathing room)

def tidy(s):
    s = re.sub(r'(?<![\d.])0\.(\d)', r'.\1', s)
    return re.sub(r'(?<![\d.])(\d+)\.0(?![\d])', r'\1', s)
def put(sub, name, s):
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    with open(os.path.join(OUT, sub, name), "w") as f: f.write(tidy(s))
    print(f"{sub}/{name:38s}{len(tidy(s).encode()):>6} B")
def svg(vb, body, title, css="", label=None, cls=""):
    w, h = vb.split()[2:]
    st = f"  <style>\n{css}  </style>\n" if css else ""
    c = f' class="{cls}"' if cls else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg"{c} viewBox="{vb}" width="{w}" height="{h}" role="img" aria-label="{label or title}">\n'
            f'  <title>{title}</title>\n{st}{body}</svg>\n')

# ── the mark, in every colourway ────────────────────────────────────────
def m_primary(x=""): return f'  <path fill-rule="evenodd" fill="{INK}" d="{HEXD}{GAMD}"/>\n  <path fill="{LIME}" d="{ARRD}"/>\n'
def m_reverse():     return f'  <path fill-rule="evenodd" fill="{LIME}" d="{HEXD}{GAMD}{ARRD}"/>\n'
def m_mono(c):       return f'  <path fill-rule="evenodd" fill="{c}" d="{HEXD}{GAMD}{ARRD}"/>\n'
AUTO_CSS = (f"    .l{{fill:{INK}}} .a{{fill:{LIME}}} .d{{display:none;fill:{LIME}}}\n"
            f"    @media (prefers-color-scheme:dark){{.l,.a{{display:none}} .d{{display:inline}}}}\n")
def m_auto(): return (f'  <path class="l" fill-rule="evenodd" d="{HEXD}{GAMD}"/>\n  <path class="a" d="{ARRD}"/>\n'
                      f'  <path class="d" fill-rule="evenodd" d="{HEXD}{GAMD}{ARRD}"/>\n')

def build_marks():
    T = "FlowStock"
    put("mark", "flowstock-mark.svg",              svg(VB, m_primary(), T))
    put("mark", "flowstock-mark-reverse.svg",      svg(VB, m_reverse(), T))
    put("mark", "flowstock-mark-black.svg",        svg(VB, m_mono(BLACK), T))
    put("mark", "flowstock-mark-white.svg",        svg(VB, m_mono(WHITE), T))
    put("mark", "flowstock-mark-currentcolor.svg", svg(VB, m_mono("currentColor"), T))
    put("mark", "flowstock-mark-auto.svg",         svg(VB, m_auto(), T, AUTO_CSS))

# ── app icons + favicon ────────────────────────────────────────────────
def scaled(body, s): return f'  <g transform="translate(60 60) scale({s}) translate(-60 -60)">\n{body}  </g>\n'
def build_app():
    T = "FlowStock"
    tile = lambda fill, rx: f'  <rect width="120" height="120" rx="{rx}" fill="{fill}"/>\n'
    put("app", "flowstock-app-icon.svg",          svg("0 0 120 120", tile(INK, 27) + scaled(m_reverse(), .74), T))
    put("app", "flowstock-app-icon-light.svg",    svg("0 0 120 120", tile("#F1F5F9", 27) + f'  <rect x=".9" y=".9" width="118.2" height="118.2" rx="26.2" fill="none" stroke="#E2E8F0" stroke-width="1.8"/>\n' + scaled(m_primary(), .74), T))
    put("app", "flowstock-app-icon-maskable.svg", svg("0 0 120 120", tile(INK, 0) + scaled(m_reverse(), .56), T))
    put("app", "flowstock-app-icon-square.svg",   svg("0 0 120 120", tile(INK, 0) + scaled(m_reverse(), .70), T))
    # favicon: bolder one-piece F, no gutter (a 2.6u slit vanishes at 16px), light/dark aware
    fd = HEXD + round_poly(f_single(), 1.4)
    css = (f"    .h{{fill:{INK}}} @media (prefers-color-scheme:dark){{.h{{fill:{LIME}}}}}\n")
    put("app", "favicon.svg", svg("12 12 96 96", f'  <path class="h" fill-rule="evenodd" d="{fd}"/>\n', T, css))

# ── wordmark: outlined from Poppins (SIL OFL), kerned from the font's own GPOS ──
_fonts = {}
def font(w):
    if w not in _fonts: _fonts[w] = TTFont(FONTS % w)
    return _fonts[w]
def _pair_subtables(f):
    gpos = f["GPOS"].table
    idx = {i for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == "kern" for i in fr.Feature.LookupListIndex}
    subs = []
    for i in sorted(idx):
        lk = gpos.LookupList.Lookup[i]
        for st in lk.SubTable:
            if lk.LookupType == 9: st = st.ExtSubTable
            if getattr(st, "LookupType", 2) == 2 or st.__class__.__name__ == "PairPos": subs.append(st)
    return subs
def kern(f, l, r):
    for st in _pair_subtables(f):
        cov = st.Coverage.glyphs
        if l not in cov: continue
        if st.Format == 1:
            for pv in st.PairSet[cov.index(l)].PairValueRecord:
                if pv.SecondGlyph == r:
                    return getattr(pv.Value1, "XAdvance", 0) or 0
        else:
            c1 = st.ClassDef1.classDefs.get(l, 0); c2 = st.ClassDef2.classDefs.get(r, 0)
            v = st.Class1Record[c1].Class2Record[c2].Value1
            if v is not None and getattr(v, "XAdvance", 0): return v.XAdvance
    return 0
def wordmark(parts, cap, track=-.012):
    """parts=[(text, weight)]; returns (path d with origin at baseline-left, width, size)"""
    f0 = font(parts[0][1]); size = cap / (f0["OS/2"].sCapHeight / f0["head"].unitsPerEm)
    x = 0.0; d = ""; prev = None
    for text, wt in parts:
        f = font(wt); gs = f.getGlyphSet(); cm = f.getBestCmap(); u = size / f["head"].unitsPerEm
        for ch in text:
            g = cm[ord(ch)]
            if prev and prev[0] is f: x += kern(f, prev[1], g) * u
            pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
            gs[g].draw(TransformPen(pen, (u, 0, 0, -u, x, 0)))
            d += pen.getCommands()
            x += f["hmtx"][g][0] * u + track * size; prev = (f, g)
    return d, x - track * size, size

WM = [("Flow", "Bold"), ("Stock", "Bold")]
def lockup_parts(wm=None):
    wm = wm or WM
    d, width, size = wordmark(wm, cap=36)
    return d, width
def lockup_h(kind, wm=None):
    d, wd = lockup_parts(wm)
    gap = 20; mx = 0; ty = 48 + 18               # baseline = hex centre (60-12=48) + cap/2
    tx = 84 + gap; W = tx + wd + 2; H = 96
    mark = {"primary": m_primary(), "reverse": m_reverse(), "black": m_mono(BLACK), "white": m_mono(WHITE), "currentcolor": m_mono("currentColor")}[kind]
    wc = {"primary": INK, "reverse": WHITE, "black": BLACK, "white": WHITE, "currentcolor": "currentColor"}[kind]
    body = f'  <g transform="translate(-18 -12)">\n{mark}  </g>\n  <path fill="{wc}" transform="translate({fmt(tx)} {ty})" d="{d}"/>\n'
    return svg(f"0 0 {fmt(W)} {H}", body, "FlowStock")
def lockup_v(kind, wm=None):
    d, wd = wordmark(wm or WM, cap=30)[:2]
    W = max(wd, 84) + 4; mk = (W - 84) / 2; ty = 96 + 16 + 30
    mark = {"primary": m_primary(), "reverse": m_reverse(), "black": m_mono(BLACK), "white": m_mono(WHITE), "currentcolor": m_mono("currentColor")}[kind]
    wc = {"primary": INK, "reverse": WHITE, "black": BLACK, "white": WHITE, "currentcolor": "currentColor"}[kind]
    body = f'  <g transform="translate({fmt(mk-18)} -12)">\n{mark}  </g>\n  <path fill="{wc}" transform="translate({fmt((W-wd)/2)} {ty})" d="{d}"/>\n'
    return svg(f"0 0 {fmt(W)} {ty+8}", body, "FlowStock")
def build_lockups():
    for kind in ("primary", "reverse", "black", "white", "currentcolor"):
        n = "" if kind == "primary" else "-" + kind
        put("lockup", f"flowstock-logo{n}.svg", lockup_h(kind))
        put("lockup", f"flowstock-logo-stacked{n}.svg", lockup_v(kind))

# ── motion ─────────────────────────────────────────────────────────────
POP = (.34, 1.4, .64, 1); OUTC = (.16, 1, .3, 1); IO = (.65, 0, .35, 1)
def cb(c): return "cubic-bezier(%s)" % ",".join(("%g" % v) for v in c)
def _X(c, u): x1, y1, x2, y2 = c; return 3*(1-u)**2*u*x1 + 3*(1-u)*u**2*x2 + u**3
def _Y(c, u): x1, y1, x2, y2 = c; return 3*(1-u)**2*u*y1 + 3*(1-u)*u**2*y2 + u**3
def time_at(c, prog):
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m = (lo + hi) / 2
        if _Y(c, m) < prog: lo = m
        else: hi = m
    return _X(c, lo)
RIM = round_poly([(CX + 40*math.sin(math.radians(a)), CY - 40*math.cos(math.radians(a))) for a in (0, 60, 120, 180, 240, 300)], 6.4)
SHIFT = 28   # arrow is ~24.3u wide; 28 moves it fully clear of its own clip window

def motion(kind, theme):
    dark = theme == "dark"
    hexfill = LIME if dark else INK
    hexd = HEXD + GAMD + (ARRD if dark else "")
    CL = FAT if dark else ARRD
    clip = f'  <defs><clipPath id="fs-c"><path d="{CL}"/></clipPath></defs>\n'
    if kind == "reveal":
        pop_d, pop_t = .7, time_at(POP, 1.0) * .7
        delay = round(pop_t * .7, 2)
        if dark:
            css = ("    /* rest state is the default; keyframes only describe the way in */\n"
                   f"    .p{{transform-origin:60px 60px;animation:fs-pop {pop_d}s {cb(POP)} both}}\n"
                   f"    .k{{transform:translateX({SHIFT}px);animation:fs-open .8s {cb((.22,1,.36,1))} {delay}s both}}\n"
                   f"    @keyframes fs-pop{{from{{opacity:0;transform:scale(.7)}}}}\n"
                   f"    @keyframes fs-open{{from{{transform:none}}}}\n"
                   "    @media (prefers-reduced-motion:reduce){.p,.k{animation:none}}\n")
            cover = f'<g clip-path="url(#fs-c)"><path class="k" fill="{LIME}" d="{FAT}"/></g>'
        else:
            css = ("    /* rest state is the default; keyframes only describe the way in */\n"
                   f"    .p{{transform-origin:60px 60px;animation:fs-pop {pop_d}s {cb(POP)} both}}\n"
                   f"    .k{{animation:fs-in .8s {cb((.22,1,.36,1))} {delay}s both}}\n"
                   f"    @keyframes fs-pop{{from{{opacity:0;transform:scale(.7)}}}}\n"
                   f"    @keyframes fs-in{{from{{transform:translateX(-{SHIFT}px)}}}}\n"
                   "    @media (prefers-reduced-motion:reduce){.p,.k{animation:none}}\n")
            cover = f'<g clip-path="url(#fs-c)"><path class="k" fill="{LIME}" d="{ARRD}"/></g>'
        body = clip + f'  <g class="p">\n    <path fill-rule="evenodd" fill="{hexfill}" d="{hexd}"/>\n    {cover}\n  </g>\n'
        return svg(VB, body, "FlowStock", css), round(delay + .8, 2)
    if kind == "loader":
        D = 1.6; layers = [(34, .16), (22, .3), (12, .6), (5, 1.0)]; tail = DARK if dark else LIME
        css = "    /* a fading comet orbits the rim; the arrow breathes once per lap */\n"
        for i, (L, a) in enumerate(layers, 1):
            css += f"    .t{i}{{stroke-dasharray:{L} {100-L};opacity:0;animation:fs-o{i} {D}s linear infinite}}\n"
        css += f"    .k{{animation:fs-br {D}s cubic-bezier(.4,0,.2,1) infinite}}\n"
        for i, (L, a) in enumerate(layers, 1):
            css += f"    @keyframes fs-o{i}{{from{{stroke-dashoffset:{L};opacity:{a}}}to{{stroke-dashoffset:{L-100};opacity:{a}}}}}\n"
        if dark:
            css += "    .k{opacity:0}\n    @keyframes fs-br{0%,100%{opacity:0}50%{opacity:.75}}\n"
        else:
            css += "    @keyframes fs-br{0%,100%{opacity:.4}50%{opacity:1}}\n"
        css += "    @media (prefers-reduced-motion:reduce){.t1,.t2,.t3,.t4{display:none}}\n"
        comet = "".join(f'    <path class="t{i}" pathLength="100" d="{RIM}"/>\n' for i in range(1, 5))
        arr = f'<g clip-path="url(#fs-c)"><path class="k" fill="{LIME}" d="{CL}"/></g>'
        body = (clip + f'  <path fill-rule="evenodd" fill="{hexfill}" d="{hexd}"/>\n'
                f'  <g fill="none" stroke="{tail}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">\n{comet}  </g>\n  {arr}\n')
        return svg(VB, body, "Loading", css), D
    if kind == "ambient":
        D = 3.6; gcol = LIME if dark else "#F7FFD6"
        css = ("    /* one glint crosses the arrow, then the mark holds still */\n"
               f"    .g{{animation:fs-gl {D}s {cb(IO)} infinite}}\n"
               f"    @keyframes fs-gl{{0%{{transform:translateX(0)}}30%,100%{{transform:translateX(46px)}}}}\n"
               "    @media (prefers-reduced-motion:reduce){.g{animation:none}}\n")
        base = "" if dark else f'<path fill="{LIME}" d="{ARRD}"/>'
        glint = f'<rect class="g" x="42" y="52" width="9" height="21" fill="{gcol}" transform="skewX(0)"/>'
        body = (clip + f'  <path fill-rule="evenodd" fill="{hexfill}" d="{hexd}"/>\n'
                f'  <g clip-path="url(#fs-c)">{base}{glint}</g>\n')
        return svg(VB, body, "FlowStock", css), D
def build_motion():
    for kind in ("reveal", "loader", "ambient"):
        for theme in ("light", "dark"):
            s, t = motion(kind, theme)
            put("motion", f"flowstock-{kind}{'-on-dark' if theme=='dark' else ''}.svg", s)
            print("   ", kind, theme, "duration/cycle", t)

if __name__ == "__main__":
    build_marks(); build_app(); build_lockups(); build_motion()
