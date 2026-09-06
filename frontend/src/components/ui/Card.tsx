import React from "react";
import { cn } from "@/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("group bg-white border border-zinc-200/90 rounded-xl shadow-xs transition-[transform,opacity,background-color,border-color,color] hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-subtle motion-reduce:transform-none", className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("p-5 border-b border-zinc-100", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn("text-base font-semibold text-zinc-950 tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("p-5", className)} {...props}>
    {children}
  </div>
);
