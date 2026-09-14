"use client";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const Card = ({
  className,
  children,
  spotlight = false,
  spotlightColor = "rgba(182, 255, 46, 0.12)",
  spotlightSize = 350,
  ...props
}) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!spotlight || !divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (spotlight) setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (spotlight) setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#323744] rounded-xl shadow-2xs transition-all overflow-hidden",
        spotlight && "hover:shadow-md dark:hover:border-[#545963]",
        className
      )}
      {...props}
    >
      {spotlight && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 z-0"
          style={{
            opacity,
            background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4 border-b border-slate-100 dark:border-[#262A34]", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4", className)} {...props}>
    {children}
  </div>
);
