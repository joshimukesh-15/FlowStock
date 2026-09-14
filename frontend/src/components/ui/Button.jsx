import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
export const Button = React.forwardRef(({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-[transform,opacity,background-color,border-color,color] duration-150 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B6FF2E] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.97] hover:scale-[1.01] motion-reduce:transform-none motion-reduce:transition-none";
    const variants = {
        primary: "bg-[#B6FF2E] hover:bg-[#a3f01b] active:bg-[#92dc12] text-[#14171F] font-semibold border border-[#B6FF2E] shadow-sm",
        secondary: "bg-slate-100 dark:bg-[#23262F] text-slate-900 dark:text-[#F4F5F7] hover:bg-slate-200 dark:hover:bg-[#2C303B] border border-slate-200 dark:border-[#323744]",
        outline: "border border-slate-300 dark:border-[#323744] bg-white dark:bg-[#23262F] text-slate-900 dark:text-[#F4F5F7] hover:bg-slate-50 dark:hover:bg-[#2C303B] shadow-2xs",
        danger: "bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white border border-[#dc2626]",
        ghost: "text-slate-600 dark:text-[#9BA3AF] hover:bg-slate-100 dark:hover:bg-[#23262F] hover:text-slate-950 dark:hover:text-[#F4F5F7]",
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
    return (<button ref={ref} disabled={disabled || isLoading} aria-busy={isLoading} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
        {isLoading && (<Loader2 className={cn("animate-spin shrink-0", spinnerSizes[size])}/>)}
        {children}
      </button>);
});
Button.displayName = "Button";
