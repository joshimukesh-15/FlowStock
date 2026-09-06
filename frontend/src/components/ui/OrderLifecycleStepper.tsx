import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, PackageCheck, FileText, Ban } from "lucide-react";
import { useReducedMotion, DURATION, EASING, SCALE, STAGGER } from "@/motion";

export type OrderStatus = "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";

interface OrderLifecycleStepperProps {
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  className?: string;
}

interface StepDef {
  key: "DRAFT" | "CONFIRMED" | "FULFILLED";
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const STEPS: StepDef[] = [
  {
    key: "DRAFT",
    label: "Draft",
    sublabel: "Stock unreserved",
    icon: FileText,
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    sublabel: "Stock reserved in facility",
    icon: Clock,
  },
  {
    key: "FULFILLED",
    label: "Fulfilled",
    sublabel: "Dispatched & inventory deducted",
    icon: PackageCheck,
  },
];

export const OrderLifecycleStepper: React.FC<OrderLifecycleStepperProps> = ({
  status,
  createdAt,
  updatedAt,
  className = "",
}) => {
  const prefersReducedMotion = useReducedMotion();

  const isCancelled = status === "CANCELLED";

  // Calculate current active index based strictly on real backend enum value
  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case "DRAFT":
        return 0;
      case "CONFIRMED":
        return 1;
      case "FULFILLED":
        return 2;
      case "CANCELLED":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className={`p-4 bg-zinc-50 border border-zinc-200 rounded-xl ${className}`}>
      {/* Header & Status announcement */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Order Lifecycle Status
        </span>
        {isCancelled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <Ban className="w-3 h-3" /> Cancelled
          </span>
        ) : (
          <span className="text-xs text-zinc-500">
            {currentIndex === 2
              ? "Completed"
              : currentIndex === 1
              ? "Awaiting fulfillment"
              : "Draft review"}
          </span>
        )}
      </div>

      {/* Stepper container */}
      <nav aria-label="Order progress">
        <ol className="relative flex items-center justify-between w-full">
          {STEPS.map((step, idx) => {
            const isCompleted = !isCancelled && currentIndex > idx;
            const isCurrent = !isCancelled && currentIndex === idx;
            const isUpcoming = isCancelled || currentIndex < idx;
            const Icon = step.icon;

            return (
              <li
                key={step.key}
                className="relative flex-1 flex flex-col items-center group"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Connecting horizontal line to next step (for all except last) */}
                {idx < STEPS.length - 1 && (
                  <div
                    className="absolute top-4 left-1/2 w-full h-[2px] bg-zinc-200 -z-0"
                    aria-hidden="true"
                  >
                    <motion.div
                      className="h-full bg-zinc-900 origin-left"
                      initial={{ scaleX: SCALE.progressStart }}
                      animate={{
                        scaleX: !isCancelled && currentIndex > idx ? SCALE.progressEnd : SCALE.progressStart,
                      }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : DURATION.complex,
                        ease: EASING.standard,
                      }}
                    />
                  </div>
                )}

                {/* Step Node Icon Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                      isCompleted
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : isCurrent
                        ? "bg-white border-zinc-900 text-zinc-900 shadow-sm"
                        : "bg-white border-zinc-300 text-zinc-400"
                    }`}
                    initial={{ scale: prefersReducedMotion ? SCALE.resting : SCALE.hidden, opacity: 0 }}
                    animate={{ scale: SCALE.resting, opacity: 1 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : DURATION.normal,
                      ease: EASING.standard,
                      delay: prefersReducedMotion ? 0 : idx * STAGGER.steps,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </motion.div>

                </div>

                {/* Step text labels */}
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-medium transition-colors ${
                      isCurrent
                        ? "text-zinc-900 font-semibold"
                        : isCompleted
                        ? "text-zinc-800"
                        : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 hidden sm:block">
                    {step.sublabel}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Cancelled notice banner */}
      {isCancelled && (
        <div className="mt-3.5 p-2.5 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center gap-2 text-xs text-zinc-800">
          <Ban className="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <span>
            This order was cancelled. Reserved inventory was released back into available stock.
          </span>
        </div>
      )}
    </div>
  );
};
