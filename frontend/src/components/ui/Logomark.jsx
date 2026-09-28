import { cn } from "@/lib/utils";

/**
 * Premium Nature-Leaf Logomark
 * Custom designed with warm beige base, blue gradient leaflets, and refined highlights.
 */
export const Logomark = ({ className = "w-6 h-6", ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="95 95 310 310"
      className={cn("select-none shrink-0 inline-block", className)}
      role="img"
      aria-label="FlowStock"
      {...props}
    >
      <defs>
        {/* Base Beige / Warm Cream Gradient */}
        <linearGradient id="fs-base-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e6d3" />
          <stop offset="100%" stopColor="#d4b896" />
        </linearGradient>

        {/* Blue Leaf Gradients */}
        <linearGradient id="fs-leaf-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id="fs-leaf-g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        <linearGradient id="fs-leaf-g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="fs-leaf-g4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Refined shadows */}
        <filter id="fs-shadow-base" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#031b4e" floodOpacity="0.16" />
        </filter>
        <filter id="fs-shadow-leaf" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="-1" dy="3" stdDeviation="3.5" floodColor="#021a38" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Base Beige / Warm Cream Bottom Half Circle */}
      <path
        d="M 125,250 A 125,125 0 0,0 375,250 Z"
        fill="url(#fs-base-grad)"
        filter="url(#fs-shadow-base)"
      />

      {/* 1. Smallest / Outer Left leaflet */}
      <path
        d="M 125,210 C 145,210 170,215 170,230 L 170,250 C 140,250 125,235 125,210 Z"
        fill="url(#fs-leaf-g1)"
        filter="url(#fs-shadow-leaf)"
      />
      <path
        d="M 125,210 C 145,225 170,240 170,250"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* 2. Second leaflet from left */}
      <path
        d="M 170,175 C 190,175 210,185 210,205 L 210,250 C 185,250 170,240 170,220 Z"
        fill="url(#fs-leaf-g2)"
        filter="url(#fs-shadow-leaf)"
      />
      <path
        d="M 170,175 C 190,200 210,225 210,250"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* 3. Third leaflet from left */}
      <path
        d="M 210,140 C 230,140 250,150 250,175 L 250,250 C 220,250 210,240 210,220 Z"
        fill="url(#fs-leaf-g3)"
        filter="url(#fs-shadow-leaf)"
      />
      <path
        d="M 210,140 C 230,170 250,210 250,250"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* 4. Largest right quarter / Main Blue Leaf */}
      <path
        d="M 250,125 A 125,125 0 0,1 375,250 L 250,250 Z"
        fill="url(#fs-leaf-g4)"
        filter="url(#fs-shadow-leaf)"
      />

      {/* Curved Leaf Veins/Details on Main Leaf */}
      <path
        d="M 250,125 Q 310,185 375,250"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M 250,165 Q 295,205 340,250"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M 250,205 Q 280,225 305,250"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
    </svg>
  );
};

export default Logomark;
