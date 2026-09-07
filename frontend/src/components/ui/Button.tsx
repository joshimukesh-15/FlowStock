import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-[transform,opacity,background-color,border-color,color] rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.98] motion-reduce:transform-none";

    const variants = {
      primary:
        "bg-zinc-950 text-white hover:bg-black active:bg-zinc-900 shadow-xs border border-zinc-900",
      secondary:
        "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200",
      outline:
        "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xs",
      danger: "bg-zinc-900 text-white hover:bg-black border border-zinc-800",
      ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
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

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <Loader2 className={cn("animate-spin shrink-0", spinnerSizes[size])} />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

