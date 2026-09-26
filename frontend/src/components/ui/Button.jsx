import React, { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const springPhysics = { type: "spring", stiffness: 420, damping: 26 };

export const Button = React.forwardRef((
  {
    className,
    variant = "primary",
    size = "md",
    isLoading = false,
    children,
    disabled,
    onPointerEnter,
    onPointerLeave,
    ...props
  },
  ref
) => {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const buttonRef = useRef(null);

  // Sync ref
  const setCombinedRef = (node) => {
    buttonRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const trackCoords = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      setOrigin({
        x: Math.round(((e.clientX - r.left) / r.width) * 100),
        y: Math.round(((e.clientY - r.top) / r.height) * 100),
      });
    }
  };

  const handlePointerEnter = (e) => {
    if (!disabled && !isLoading) {
      trackCoords(e);
      setHovered(true);
    }
    onPointerEnter?.(e);
  };

  const handlePointerLeave = (e) => {
    if (!disabled && !isLoading) {
      trackCoords(e);
      setHovered(false);
    }
    onPointerLeave?.(e);
  };

  const baseStyles =
    "relative inline-flex items-center justify-center font-medium select-none cursor-pointer overflow-hidden rounded-lg outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF2E] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#14171F] disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200";

  const variants = {
    primary:
      "bg-[#B6FF2E] text-[#14171F] font-semibold border border-[#B6FF2E] shadow-sm hover:border-[#a3f01b]",
    secondary:
      "bg-slate-100 dark:bg-[#23262F] text-slate-900 dark:text-[#F4F5F7] border border-slate-200 dark:border-[#323744] hover:bg-slate-200/80 dark:hover:bg-[#2C303B]",
    outline:
      "border border-slate-300 dark:border-[#323744] bg-white dark:bg-[#23262F] text-slate-900 dark:text-[#F4F5F7] hover:bg-slate-50 dark:hover:bg-[#2C303B] shadow-2xs",
    danger:
      "bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white border border-[#dc2626] shadow-sm",
    ghost:
      "text-slate-600 dark:text-[#9BA3AF] hover:bg-slate-100 dark:hover:bg-[#23262F] hover:text-slate-950 dark:hover:text-[#F4F5F7]",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1.5 h-8 gap-1.5",
    md: "text-sm px-4 py-2 h-9 gap-2",
    lg: "text-base px-5 py-2.5 h-11 gap-2.5",
  };

  const spinnerSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-4.5 h-4.5",
  };

  const isInteractive = !disabled && !isLoading;
  const canAnimate = isInteractive && !prefersReducedMotion;
  const isPrimary = variant === "primary";

  return (
    <motion.button
      ref={setCombinedRef}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      whileTap={canAnimate ? { scale: 0.97 } : undefined}
      transition={springPhysics}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={() => isInteractive && setHovered(true)}
      onBlur={() => isInteractive && setHovered(false)}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {/* 1. PRIMARY: Clip-Path Circle Reveal Overlay */}
      {isPrimary && canAnimate && (
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            clipPath: hovered
              ? `circle(150% at ${origin.x}% ${origin.y}%)`
              : `circle(0% at ${origin.x}% ${origin.y}%)`,
          }}
          transition={{ type: "tween", duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "pointer-events-none absolute inset-0 z-20 flex items-center justify-center font-semibold bg-[#14171F] text-[#B6FF2E]",
            sizes[size]
          )}
        >
          {children}
        </motion.span>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <Loader2 className={cn("animate-spin shrink-0 z-10", spinnerSizes[size])} />
      )}

      {/* Button Content — completely stable in the DOM, never jumps */}
      <span className="relative z-10 inline-flex items-center justify-center gap-[inherit]">
        {children}
      </span>
    </motion.button>
  );
});

Button.displayName = "Button";
