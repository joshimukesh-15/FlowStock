import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Top Tier-1 MNC Enterprise Button Component (Linear, Stripe, Vercel standard)
 * 
 * Features:
 * - Single-source DOM hierarchy: zero duplicate children, zero layout desync
 * - Crisp corporate typography: whitespace-nowrap, tracking-tight, leading-none optical centering
 * - 60fps GPU-accelerated CSS transitions: zero coordinate-tracking overhead
 * - High-contrast accessible palettes with calibrated light/dark mode elevation
 * - Subtle haptic spring feedback on click (whileTap)
 */
export const Button = React.forwardRef((
  {
    className,
    variant = "primary",
    size = "md",
    type = "button",
    isLoading = false,
    children,
    disabled,
    ...props
  },
  ref
) => {
  const prefersReducedMotion = useReducedMotion();

  const baseStyles =
    "relative inline-flex items-center justify-center font-medium leading-none whitespace-nowrap select-none cursor-pointer tracking-tight outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d992] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101010] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed transition-all duration-150 ease-out";

  const variants = {
    primary:
      "bg-[#00d992] hover:bg-[#2fd6a1] active:bg-[#10b981] text-[#101010] font-semibold border border-[#00d992] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,217,146,0.2)] hover:shadow-[0_2px_8px_rgba(0,217,146,0.35)]",
    default:
      "bg-[#00d992] hover:bg-[#2fd6a1] active:bg-[#10b981] text-[#101010] font-semibold border border-[#00d992] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,217,146,0.2)] hover:shadow-[0_2px_8px_rgba(0,217,146,0.35)]",
    solid:
      "bg-slate-900 hover:bg-black active:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:active:bg-slate-200 dark:text-slate-950 font-medium border border-slate-900 dark:border-white shadow-2xs",
    dark:
      "bg-slate-900 hover:bg-black active:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:active:bg-slate-200 dark:text-slate-950 font-medium border border-slate-900 dark:border-white shadow-2xs",
    secondary:
      "bg-slate-100 hover:bg-slate-200/90 active:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#1a1a1a] dark:hover:bg-[#242424] dark:active:bg-[#181818] dark:text-[#bdbdbd] dark:hover:text-white border border-slate-200/80 dark:border-[#3d3a39] shadow-2xs",
    outline:
      "bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 dark:bg-[#101010] dark:hover:bg-[#181818] dark:active:bg-[#141414] dark:text-[#f2f2f2] dark:hover:text-white dark:border-[#3d3a39] dark:hover:border-[#4d4a49] shadow-2xs",
    ghost:
      "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:bg-slate-200/70 dark:text-[#8b949e] dark:hover:text-[#f2f2f2] dark:hover:bg-[#1a1a1a]/80 dark:active:bg-[#1a1a1a]",
    danger:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium border border-rose-600 shadow-2xs",
    "danger-subtle":
      "bg-rose-50 hover:bg-rose-100 active:bg-rose-200/80 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50",
    "subtle-danger":
      "bg-rose-50 hover:bg-rose-100 active:bg-rose-200/80 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50",
  };

  const sizes = {
    xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md font-medium",
    sm: "h-8 px-3 text-xs gap-1.5 rounded-md font-medium",
    md: "h-9 px-3.5 text-xs sm:text-sm gap-2 rounded-lg font-medium",
    lg: "h-10 px-4 text-sm gap-2.5 rounded-lg font-medium",
    xl: "h-11 px-5 text-base gap-2.5 rounded-xl font-semibold",
    icon: "h-9 w-9 p-0 rounded-lg shrink-0",
    "icon-xs": "h-7 w-7 p-0 rounded-md shrink-0",
    "icon-sm": "h-8 w-8 p-0 rounded-md shrink-0",
    "icon-lg": "h-10 w-10 p-0 rounded-lg shrink-0",
  };

  const spinnerSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-3.5 h-3.5 sm:w-4 sm:h-4",
    lg: "w-4 h-4",
    xl: "w-4.5 h-4.5",
    icon: "w-4 h-4",
    "icon-xs": "w-3 h-3",
    "icon-sm": "w-3.5 h-3.5",
    "icon-lg": "w-4 h-4",
  };

  const isInteractive = !disabled && !isLoading;
  const canAnimate = isInteractive && !prefersReducedMotion;
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;
  const spinnerSizeClass = spinnerSizes[size] || spinnerSizes.md;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      whileTap={canAnimate ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(baseStyles, variantClass, sizeClass, className)}
      {...props}
    >
      {isLoading && (
        <Loader2 className={cn("animate-spin shrink-0 text-current", spinnerSizeClass)} />
      )}
      <span className="inline-flex items-center justify-center gap-1.5 leading-none shrink-0 pointer-events-none">
        {children}
      </span>
    </motion.button>
  );
});

Button.displayName = "Button";

export default Button;
