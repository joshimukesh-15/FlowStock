"use client";
import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clearApiCache } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Universal animated RefreshButton component.
 * Provides micro-interaction on hover (rotate 45deg) and guaranteed smooth 
 * spinning animation for at least 700ms when clicked.
 */
export function RefreshButton({
  onClick,
  isRefreshing = false,
  disabled = false,
  label = "Refresh",
  className = "",
  size = "sm",
  variant = "outline",
  iconClassName = "w-3.5 h-3.5",
  children,
  ...props
}) {
  const [internalSpin, setInternalSpin] = useState(false);

  const isSpinning = isRefreshing || internalSpin;

  const handleClick = async (e) => {
    if (isSpinning || disabled) return;
    setInternalSpin(true);

    // Invalidate stale in-memory cached responses so refresh pulls fresh data from backend
    try {
      clearApiCache();
    } catch {
      // Ignore cache clearing errors if not applicable
    }

    const minAnimationPromise = new Promise((resolve) => setTimeout(resolve, 750));

    try {
      if (onClick) {
        await Promise.all([onClick(e), minAnimationPromise]);
      } else {
        await minAnimationPromise;
      }
    } catch (err) {
      console.error("Refresh action failed:", err);
    } finally {
      setInternalSpin(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || isSpinning}
      onClick={handleClick}
      className={cn(
        "group gap-1.5 transition-all select-none",
        isSpinning && "cursor-wait opacity-90",
        className
      )}
      {...props}
    >
      <RefreshCw
        className={cn(
          "shrink-0 transition-transform duration-300",
          iconClassName,
          isSpinning
            ? "animate-spin text-slate-900 dark:text-[#B6FF2E]"
            : "text-slate-600 dark:text-[#9BA3AF] group-hover:rotate-45 group-hover:text-slate-900 dark:group-hover:text-white group-active:rotate-90"
        )}
      />
      <span>{children || label}</span>
    </Button>
  );
}

export default RefreshButton;
