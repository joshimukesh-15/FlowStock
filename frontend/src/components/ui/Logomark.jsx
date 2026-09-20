import React from "react";
import { cn } from "@/lib/utils";

export const Logomark = ({ className = "w-6 h-6", ...props }) => (
  <>
    <img 
      src="/assets/flowstock-mark-reveal.svg" 
      alt="FlowStock Logo" 
      className={cn("select-none object-contain dark:hidden", className)}
      {...props}
    />
    <img 
      src="/assets/flowstock-mark-reveal-dark.svg" 
      alt="FlowStock Logo" 
      className={cn("select-none object-contain hidden dark:block", className)}
      {...props}
    />
  </>
);

export default Logomark;
