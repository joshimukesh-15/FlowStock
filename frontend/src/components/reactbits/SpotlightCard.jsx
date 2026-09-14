"use client";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SpotlightCard from React Bits
 * Wraps any card container with a smooth, interactive radial spotlight that follows the cursor.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(182, 255, 46, 0.12)",
  spotlightSize = 350,
  as: Component = "div",
  ...props
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <Component
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-xl border border-slate-200/80 dark:border-[#323744] bg-white dark:bg-[#181A20] overflow-hidden transition-shadow duration-200 hover:shadow-md dark:hover:border-[#545963]",
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 h-full">{children}</div>
    </Component>
  );
}
