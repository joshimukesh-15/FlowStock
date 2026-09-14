"use client";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * ShinyText from React Bits
 * Provides a subtle animated gradient shimmer over text.
 */
export function ShinyText({
  children,
  className = "",
  speed = 3,
  disabled = false,
}) {
  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent bg-[linear-gradient(110deg,#1e293b,45%,#64748b,55%,#1e293b)] dark:bg-[linear-gradient(110deg,#9BA3AF,45%,#ffffff,55%,#9BA3AF)] bg-[length:250%_100%] animate-[shine_3s_infinite_linear]",
        className
      )}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {children}
    </span>
  );
}
