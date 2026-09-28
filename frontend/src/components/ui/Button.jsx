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
    "relative inline-flex items-center justify-center font-medium leading-none whitespace-nowrap select-none cursor-pointer tracking-tight outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#92AA97] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1B2A20] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed transition-all duration-150 ease-out";

  const variants = {
    primary:
      "bg-[#92AA97] hover:bg-[#BDC9B8] active:bg-[#6D8C73] text-[#1B2A20] font-semibold border border-[#BDC9B8] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_16px_rgba(146,170,151,0.30)] hover:shadow-[0_4px_22px_rgba(146,170,151,0.45)]",
    default:
      "bg-[#92AA97] hover:bg-[#BDC9B8] active:bg-[#6D8C73] text-[#1B2A20] font-semibold border border-[#BDC9B8] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_16px_rgba(146,170,151,0.30)] hover:shadow-[0_4px_22px_rgba(146,170,151,0.45)]",
    citrus:
      "bg-[#E4FD97] hover:bg-[#d5f57a] active:bg-[#c3e65c] text-[#1B2A20] font-semibold border border-[#d5f57a] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_12px_rgba(228,253,151,0.3)] hover:shadow-[0_4px_18px_rgba(228,253,151,0.45)]",
    solid:
      "bg-[#1B2A20] hover:bg-black active:bg-[#314C3B] text-white dark:bg-[#F7F3EA] dark:hover:bg-[#E2DED2] dark:active:bg-[#BDC9B8] dark:text-[#1B2A20] font-medium border border-[#1B2A20] dark:border-white shadow-2xs",
    dark:
      "bg-[#1B2A20] hover:bg-black active:bg-[#314C3B] text-white dark:bg-[#F7F3EA] dark:hover:bg-[#E2DED2] dark:active:bg-[#BDC9B8] dark:text-[#1B2A20] font-medium border border-[#1B2A20] dark:border-white shadow-2xs",
    secondary:
      "bg-[#E2DED2] hover:bg-[#BDC9B8]/90 active:bg-[#BDC9B8] text-[#4C6B55] hover:text-[#314C3B] dark:bg-[#314C3B] dark:hover:bg-[#4C6B55] dark:active:bg-[#101020] dark:text-[#E2DED2] dark:hover:text-white border border-[#BDC9B8]/80 dark:border-[#6D8C73] shadow-2xs",
    outline:
      "bg-[#F7F3EA] hover:bg-[#E2DED2] active:bg-[#E2DED2] text-[#4C6B55] hover:text-[#314C3B] border border-[#BDC9B8]/90 hover:border-[#BDC9B8] dark:bg-[#1B2A20] dark:hover:bg-[#314C3B] dark:active:bg-[#101020] dark:text-[#F7F3EA] dark:hover:text-white dark:border-[#6D8C73] dark:hover:border-[#2c2d4c] shadow-2xs",
    frozen:
      "bg-[#92AA97]/15 hover:bg-[#92AA97]/25 text-[#92AA97] border border-[#92AA97]/30 font-medium",
    ghost:
      "text-[#4C6B55] hover:text-[#314C3B] hover:bg-[#E2DED2]/90 active:bg-[#BDC9B8]/70 dark:text-[#BDC9B8] dark:hover:text-[#F7F3EA] dark:hover:bg-[#314C3B]/80 dark:active:bg-[#314C3B]",
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
