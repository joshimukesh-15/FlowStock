"use client";
import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Box, Sparkles, Layers } from "lucide-react";
import {
  Cam, disposer, facing, fit, mk, place, pointer, prism, proj,
  reflect, register, rrect, seg, solid, put, tdone, tset, tval, tween, unproj, tour, inject,
} from "@/lib/hairlineKernel";

const BAYS = 2, TIERS = 3, N = 6;
const W_BIN = 38, D_BIN = 34, H_PALLET = 3.5, H_TOTE = 20;
const X_MIN = 0, X_MAX = 96, Y_MIN = 0, Y_MAX = 42, Z_TOP = 114;
const REST_DY = [0, 2, 1, 6, 0, 3];
const NAMES = ["bay 1·1", "bay 2·1", "bay 1·2", "bay 2·2", "bay 1·3", "bay 2·3"];
const TOUR_STOPS = [[194, 102], [243, 174], [194, 197], null];

function rack(P) {
  const posts = [2, 48, 94];
  const paths = [];
  for (const x of posts) {
    paths.push([seg(P(x, 2, 0), P(x, 2, Z_TOP)), "lo"]);
    paths.push([seg(P(x, 40, 0), P(x, 40, Z_TOP)), "sil"]);
    for (let tz = 0; tz < TIERS; tz++) {
      const z0 = 4 + tz * 36, z1 = z0 + 36;
      paths.push([seg(P(x, 2, z0), P(x, 40, z1)), "lo"]);
    }
  }
  for (let tz = 0; tz < TIERS; tz++) {
    const z = 4 + tz * 36;
    paths.push([seg(P(2, 2, z), P(94, 2, z)), "lo"]);
    paths.push([seg(P(2, 40, z), P(94, 40, z)), "sil"]);
  }
  return paths;
}

function slotMeta(i) {
  const bx = i % BAYS, tz = Math.floor(i / BAYS);
  const x0 = 6 + bx * 46, x1 = x0 + W_BIN;
  const y0 = 4, y1 = y0 + D_BIN;
  const zs = 4 + tz * 36;
  return { bx, tz, x0, x1, y0, y1, zs };
}

export function HairlineBay({
  className = "",
  description = "Hover bins to simulate real-time stock retrieval & ledger sync",
}) {
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const figureRef = useRef(null);
  const tourRef = useRef(null);

  const [activeLocation, setActiveLocation] = useState("rest");
  const [isPlaying, setIsPlaying] = useState(false);
  const [travelIntensity, setTravelIntensity] = useState(28);

  useEffect(() => {
    if (!stageRef.current || !svgRef.current) return;
    const stage = stageRef.current;
    const svg = svgRef.current;
    inject(stage);

    const bag = disposer();
    let currentTravel = travelIntensity;

    const C = Cam(45, 0.5, 1.48);
    fit(C, [
      [X_MIN, Y_MIN, 0], [X_MAX, Y_MIN, 0],
      [X_MIN, Y_MAX + 44, 0], [X_MAX, Y_MAX + 44, 0],
      [X_MIN, Y_MIN, Z_TOP], [X_MAX, Y_MIN, Z_TOP],
      [X_MIN, Y_MAX + 44, Z_TOP], [X_MAX, Y_MAX + 44, Z_TOP],
    ], 200, 166);
    const P = proj(C), front = facing(C);

    const g = mk("g", {}, svg);
    const footRing = rrect(X_MIN - 2, Y_MIN - 2, X_MAX + 2, Y_MAX + 4, 3, 4);
    reflect(svg, g, P, front, footRing, 0, 12);

    const rackLines = rack(P);
    for (const [d, cls] of rackLines) mk("path", { d, class: cls }, g);

    const bins = [];
    for (let i = 0; i < N; i++) {
      const meta = slotMeta(i);
      const grp = mk("g", {}, g);
      const palSolid = solid(grp);
      const toteSolid = solid(grp);
      const frontCrease = mk("path", { class: "nf lo" }, grp);
      const forkNotches = mk("path", { class: "nf lo" }, grp);
      const dots = [];
      for (let k = 0; k < 3; k++) {
        dots.push(mk("circle", { r: 1.05, class: "dot " + (k <= meta.tz ? "m" : "off") }, grp));
      }
      bins.push({
        meta, grp, palSolid, toteSolid, frontCrease, forkNotches, dots,
        dy: tween(REST_DY[i]),
      });
    }

    function draw(i, yOffset) {
      const b = bins[i], m = b.meta;
      const y0 = m.y0 + yOffset, y1 = m.y1 + yOffset;

      const palRing = rrect(m.x0, y0, m.x1, y1, 1.8, 4);
      const palInner = rrect(m.x0 + 0.8, y0 + 0.8, m.x1 - 0.8, y1 - 0.8, 1, 4);
      put(b.palSolid, prism(P, front, palRing, palInner, m.zs, m.zs + H_PALLET));

      const f1 = seg(P(m.x0 + 5, y1, m.zs + 0.8), P(m.x0 + 13, y1, m.zs + 0.8));
      const f2 = seg(P(m.x0 + W_BIN - 13, y1, m.zs + 0.8), P(m.x0 + W_BIN - 5, y1, m.zs + 0.8));
      b.forkNotches.setAttribute("d", f1 + f2);

      const zTote0 = m.zs + H_PALLET, zTote1 = zTote0 + H_TOTE;
      const toteRing = rrect(m.x0 + 2, y0 + 2, m.x1 - 2, y1 - 2, 2.5, 4);
      const toteInner = rrect(m.x0 + 3.2, y0 + 3.2, m.x1 - 3.2, y1 - 3.2, 1.3, 4);
      put(b.toteSolid, prism(P, front, toteRing, toteInner, zTote0, zTote1));

      const lip = seg(P(m.x0 + 10, y1 - 2, zTote0 + 14), P(m.x1 - 10, y1 - 2, zTote0 + 14));
      b.frontCrease.setAttribute("d", lip);

      for (let k = 0; k < 3; k++) {
        place(b.dots[k], P(m.x0 + 10 + k * 5, y1 - 2, zTote0 + 8));
      }
    }

    function hit([sx, sy]) {
      for (let tz = TIERS - 1; tz >= 0; tz--) {
        const zTop = 4 + tz * 36 + H_PALLET + H_TOTE;
        const [wx, wy] = unproj(C, sx, sy, zTop);
        if (wy >= 2 && wy <= 42) {
          if (wx >= 5 && wx <= 46) return tz * BAYS + 0;
          if (wx >= 51 && wx <= 92) return tz * BAYS + 1;
        }
      }
      return -1;
    }

    const B = register(stage, (_dt, now) => {
      let moving = false;
      for (let i = 0; i < N; i++) {
        const bn = bins[i];
        draw(i, tval(bn.dy, now));
        if (!tdone(bn.dy, now)) moving = true;
      }
      return moving;
    });
    bag.add(B.unregister);

    let act = -1;
    function setActive(a) {
      if (a === act) return;
      const now = performance.now();
      const from = a >= 0 ? a : (act >= 0 ? act : 3);
      act = a;

      for (let i = 0; i < N; i++) {
        const bn = bins[i];
        const delay = Math.abs(i - from) * 45;
        const target = a < 0 ? REST_DY[i] : (i === a ? currentTravel : (bn.meta.tz === bins[a].meta.tz ? 3 : 0));
        tset(bn.dy, target, now, delay);

        const isHi = a < 0 ? i === 3 : i === a;
        bn.toteSolid.sil.classList.toggle("hi", isHi);
        bn.palSolid.sil.classList.toggle("hi", isHi);
        bn.dots[bn.meta.tz].classList.toggle("m", !isHi);
      }

      setActiveLocation(a < 0 ? "rest" : NAMES[a]);
      B.wake();
    }

    for (let i = 0; i < N; i++) draw(i, REST_DY[i]);
    bins[3].toteSolid.sil.classList.toggle("hi", true);
    bins[3].palSolid.sil.classList.toggle("hi", true);

    bag.add(pointer(stage, {
      move: (p) => setActive(hit(p)),
      leave: () => setActive(-1),
    }));
    bag.add(() => svg.replaceChildren());

    figureRef.current = {
      setTravel: (val) => { currentTravel = val; },
      startTour: () => {
        if (tourRef.current) tourRef.current.stop();
        tourRef.current = tour(stage, TOUR_STOPS, () => {});
      },
      stopTour: () => {
        if (tourRef.current) {
          tourRef.current.stop();
          tourRef.current = null;
        }
      },
    };

    return () => {
      if (tourRef.current) tourRef.current.stop();
      bag.dispose();
    };
  }, []);

  const toggleTour = () => {
    if (isPlaying) {
      figureRef.current?.stopTour();
      setIsPlaying(false);
    } else {
      figureRef.current?.startTour();
      setIsPlaying(true);
    }
  };

  const resetRest = () => {
    if (tourRef.current) {
      tourRef.current.stop();
      tourRef.current = null;
      setIsPlaying(false);
    }
    setActiveLocation("rest");
  };

  return (
    <div className={`relative group/bay ${className}`}>
      {/* Decorative ambient backdrop */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-b from-[#D8CFBC]/30 via-[#D8CFBC]/10 to-transparent opacity-70 blur-xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#E2DED2] dark:border-[#22242B] bg-[#FFFBF4]/90 dark:bg-[#121316]/95 backdrop-blur-xl shadow-lg hover:shadow-2xl dark:hover:shadow-black/70 transition-all duration-500 overflow-hidden">
        
        {/* Top telemetry & HUD Bar */}
        <div className="px-5 py-3.5 border-b border-[#E2DED2]/90 dark:border-[#22242B] flex items-center justify-between gap-3 bg-[#F8F5EE]/90 dark:bg-[#18191E]/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#565449] dark:bg-[#D8CFBC] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#11120D] dark:bg-[#D8CFBC]" />
            </span>
            <span className="font-mono text-[11px] font-bold text-[#11120D] dark:text-[#F4F5F7] uppercase tracking-wider">
              BAY · 04 PICKING STAGE
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#EBE5D8] dark:bg-[#22242B] text-[#565449] dark:text-[#D8CFBC] border border-[#D8CFBC]/70 dark:border-[#343742] font-semibold">
              3-TIER CANTILEVER
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#807D6E] dark:text-[#808594] hidden xs:inline">
              Active Bin:
            </span>
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-[#D8CFBC] dark:bg-[#D8CFBC] text-[#11120D] border border-[#C5BBA4] dark:border-[#D8CFBC] shadow-2xs">
              {activeLocation}
            </span>
          </div>
        </div>

        {/* Isometric SVG Stage */}
        <div className="relative p-2 sm:p-4 flex items-center justify-center bg-[#FAF7EF]/60 dark:bg-[#0B0C0E]/50">
          <div
            ref={stageRef}
            data-hairline
            className="w-full max-w-[440px] aspect-[5/4] cursor-grab active:cursor-grabbing relative select-none"
          >
            <svg
              ref={svgRef}
              viewBox="0 0 400 320"
              aria-hidden="true"
              className="w-full h-full block"
            />
          </div>

          {/* Micro overlay tag */}
          <div className="absolute bottom-3 left-4 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#807D6E] dark:text-[#808594]">
            <Layers className="w-3 h-3 text-[#565449] dark:text-[#D8CFBC]" />
            <span>Physical Stock Staging Bay</span>
          </div>
        </div>

        {/* Bottom Action & Control Deck */}
        <div className="px-5 py-3 border-t border-[#E2DED2]/90 dark:border-[#22242B] bg-[#F8F5EE]/80 dark:bg-[#18191E]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTour}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? "bg-[#11120D] text-[#FFFBF4] dark:bg-[#D8CFBC] dark:text-[#11120D] shadow-xs"
                  : "bg-[#FFFBF4] dark:bg-[#22242B] hover:bg-[#F0EBE0] dark:hover:bg-[#2A2D37] text-[#11120D] dark:text-[#F4F5F7] border border-[#E2DED2] dark:border-[#383B47]"
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? "Pause Tour" : "Autoplay Flow"}</span>
            </button>

            <button
              type="button"
              onClick={resetRest}
              title="Reset to rest pose"
              className="p-1.5 rounded-lg bg-[#FFFBF4] dark:bg-[#22242B] hover:bg-[#F0EBE0] dark:hover:bg-[#2A2D37] text-[#565449] dark:text-[#A0A5B2] border border-[#E2DED2] dark:border-[#383B47] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#565449] dark:text-[#A0A5B2] text-[11px] font-mono">
            <Box className="w-3.5 h-3.5 text-[#565449] dark:text-[#D8CFBC] shrink-0" />
            <span>{description}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
