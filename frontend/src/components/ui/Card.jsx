import { cn } from "@/lib/utils";

export const Card = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-[#10606F] bg-white dark:bg-[#04222B] shadow-xs hover:border-slate-300 dark:hover:border-[#424857] transition-colors duration-150 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4 border-b border-slate-100 dark:border-[#10606F]", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5", className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#10606F] flex items-center justify-between", className)} {...props}>
    {children}
  </div>
);

export default Card;
