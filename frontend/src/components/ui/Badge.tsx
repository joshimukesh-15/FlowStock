import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-800 border-zinc-200/80",
    success: "bg-zinc-950 text-white border-zinc-950 font-semibold shadow-2xs",
    warning: "bg-zinc-100 text-zinc-900 border-zinc-300 font-medium",
    danger: "bg-zinc-200 text-zinc-900 border-zinc-300 font-medium",
    info: "bg-zinc-100 text-zinc-800 border-zinc-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
