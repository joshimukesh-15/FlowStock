import React from "react";
import { cn } from "@/lib/utils";
export const Card = ({ className, children, ...props }) => (<div className={cn("group bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl shadow-xs transition-[transform,opacity,background-color,border-color,color] hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-subtle motion-reduce:transform-none", className)} {...props}>
    {children}
  </div>);
export const CardHeader = ({ className, children, ...props }) => (<div className={cn("p-5 border-b border-zinc-100 dark:border-zinc-800/80", className)} {...props}>
    {children}
  </div>);
export const CardTitle = ({ className, children, ...props }) => (<h3 className={cn("text-base font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight", className)} {...props}>
    {children}
  </h3>);
export const CardContent = ({ className, children, ...props }) => (<div className={cn("p-5", className)} {...props}>
    {children}
  </div>);
