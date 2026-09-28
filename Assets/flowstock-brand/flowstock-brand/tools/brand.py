"""FlowStock brand geometry — one source of truth (pure stdlib)."""
import math
K = math.cos(math.radians(30))

def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

def round_poly(pts, r):
    """closed path through pts with every corner filleted by radius r (arcs)"""
    n = len(pts); segs = []
    for i in range(n):
        p0, p1, p2 = pts[i-1], pts[i], pts[(i+1) % n]
        a = (p0[0]-p1[0], p0[1]-p1[1]); b = (p2[0]-p1[0], p2[1]-p1[1])
        la, lb = math.hypot(*a), math.hypot(*b)
        ua, ub = (a[0]/la, a[1]/la), (b[0]/lb, b[1]/lb)
        cosang = max(-1, min(1, ua[0]*ub[0] + ua[1]*ub[1]))
        ang = math.acos(cosang)                      # interior angle at the vertex
        t = r / math.tan(ang/2)
        t = min(t, la/2, lb/2)
        rr = t * math.tan(ang/2)                     # radius actually used if clamped
        s = (p1[0]+ua[0]*t, p1[1]+ua[1]*t); e = (p1[0]+ub[0]*t, p1[1]+ub[1]*t)
        cross = ua[0]*ub[1] - ua[1]*ub[0]
        sweep = 1 if cross < 0 else 0
        segs.append((s, e, rr, sweep))
    d = f"M{fmt(segs[0][0][0])} {fmt(segs[0][0][1])}"
    for i, (s, e, rr, sw) in enumerate(segs):
        if i: d += f"L{fmt(s[0])} {fmt(s[1])}"
        d += f"A{fmt(rr)} {fmt(rr)} 0 0 {sw} {fmt(e[0])} {fmt(e[1])}"
    return d + "Z"

# ── the hexagon: pointy-top, circumradius 46, centre (60,60) ─────────────
CX, CY, R = 60.0, 60.0, 46.0
HEX = [(CX + R*math.sin(math.radians(a)), CY - R*math.cos(math.radians(a))) for a in (0, 60, 120, 180, 240, 300)]
HEX_R = 8.0

# ── the F: stem + top arm are one cut-out (Γ); the flow arrow is a separate piece ──
def gamma(x0=38.5, x1=82.5, y0=34.0, y1=86.0, stem=14.0, arm=12.5):
    slant = arm / math.tan(math.radians(60))         # top arm ends on a 60° cut — the hexagon's own angle
    return [(x0, y0), (x1, y0), (x1-slant, y0+arm), (x0+stem, y0+arm), (x0+stem, y1), (x0, y1)]

GUTTER = 2.6
def arrow(x0=38.5+14.0+GUTTER, y0=56.0, h=13.0, body=13.0):
    tip = (h/2) / math.tan(math.radians(30))         # 30° chevron — the hexagon's other angle
    return [(x0, y0), (x0+body, y0), (x0+body+tip, y0+h/2), (x0+body, y0+h), (x0, y0+h)]

def build(F=None, A=None, r_hex=HEX_R, r_f=1.6, r_a=1.6):
    F = F or gamma(); A = A or arrow()
    return dict(hex=round_poly(HEX, r_hex), gamma=round_poly(F, r_f), arrow=round_poly(A, r_a),
                gamma_pts=F, arrow_pts=A)

INK, LIME, DARK = "#23262F", "#B6FF2E", "#0D1117"

def f_single(x0=38.5, x1=82.5, y0=34.0, y1=86.0, stem=17.0, arm=15.0, ay=None, ah=15.0, tipx=None):
    """one-piece bold F for tiny sizes (favicon): no gutter, thicker strokes"""
    slant = arm / math.tan(math.radians(60)); ay = ay if ay is not None else y0 + 0.5*(y1-y0) - ah/2 + 2
    tip = (ah/2) / math.tan(math.radians(30)); bx = (tipx if tipx else x1 - 3) - tip
    return [(x0,y0),(x1,y0),(x1-slant,y0+arm),(x0+stem,y0+arm),(x0+stem,ay),(bx,ay),(bx+tip,ay+ah/2),(bx,ay+ah),(x0+stem,ay+ah),(x0+stem,y1),(x0,y1)]

def inset(poly, d):
    """offset a convex polygon inward by d (negative d grows it)"""
    n=len(poly); cx=sum(p[0] for p in poly)/n; cy=sum(p[1] for p in poly)/n; lines=[]
    for i in range(n):
        (x1,y1),(x2,y2)=poly[i],poly[(i+1)%n]; ex,ey=x2-x1,y2-y1; L=math.hypot(ex,ey); nx,ny=-ey/L,ex/L
        if (cx-x1)*nx+(cy-y1)*ny<0: nx,ny=-nx,-ny
        lines.append(((x1+nx*d,y1+ny*d),(ex,ey)))
    out=[]
    for i in range(n):
        (p,u),(q,v)=lines[i-1],lines[i]; den=u[0]*v[1]-u[1]*v[0]
        t=((q[0]-p[0])*v[1]-(q[1]-p[1])*v[0])/den; out.append((p[0]+u[0]*t,p[1]+u[1]*t))
    return out
