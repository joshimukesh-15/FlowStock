import React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
}

export const Alert: React.FC<AlertProps> = ({ className, variant = "info", children, ...props }) => {
  const styles = {
    info: "bg-zinc-100 border-zinc-200 text-zinc-900",
    success: "bg-zinc-950 border-zinc-900 text-zinc-100 shadow-xs",
    warning: "bg-zinc-100 border-zinc-300 text-zinc-900",
    danger: "bg-zinc-200 border-zinc-400 text-zinc-950 font-medium",
  };

  return (
    <div
      role="alert"
      className={cn("p-3.5 rounded-lg border text-sm flex items-start space-x-2.5", styles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
