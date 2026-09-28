import { cn } from "@/lib/utils";

export const Card = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#BDC9B8] dark:border-[#4C6B55] bg-[#F7F3EA] dark:bg-[#1B2A20] shadow-xs hover:border-[#BDC9B8] dark:hover:border-[#424857] transition-colors duration-150 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4 border-b border-[#E2DED2] dark:border-[#4C6B55]", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-sm font-semibold text-[#314C3B] dark:text-[#F4F5F7] tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-xs text-[#6D8C73] dark:text-[#9BA3AF] mt-0.5", className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn("p-3.5 sm:p-4 border-t border-[#E2DED2] dark:border-[#4C6B55] flex items-center justify-between", className)} {...props}>
    {children}
  </div>
);

export default Card;
