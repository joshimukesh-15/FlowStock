"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Ban } from "lucide-react";
import { useReducedMotion, DURATION, EASING, SCALE, STAGGER } from "@/motion";

export interface LifecycleStepDef {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
}

export interface LifecycleStepperProps {
  title?: string;
  steps: LifecycleStepDef[];
  currentStepIndex: number;
  isCancelled?: boolean;
  cancelledMessage?: string;
  statusAnnouncement?: string;
  className?: string;
}

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
  title = "Lifecycle Status",
  steps,
  currentStepIndex,
  isCancelled = false,
  cancelledMessage,
  statusAnnouncement,
  className = "",
}) => {
  const prefersReducedMotion = useReducedMotion();

  const defaultStatusAnnouncement = isCancelled
    ? undefined
    : currentStepIndex >= steps.length - 1
    ? "Completed"
    : currentStepIndex >= 0
    ? steps[currentStepIndex]?.label
    : "Draft review";

  const announcement = statusAnnouncement || defaultStatusAnnouncement;

  return (
    <div className={`p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl ${className}`}>
      {/* Header & Status announcement */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {isCancelled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
            <Ban className="w-3 h-3" /> Cancelled
          </span>
        ) : (
          announcement && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {announcement}
            </span>
          )
        )}
      </div>

      {/* Stepper container */}
      <nav aria-label="Progress tracker">
        <ol className="relative flex items-center justify-between w-full">
          {steps.map((step, idx) => {
            const isCompleted = !isCancelled && currentStepIndex > idx;
            const isCurrent = !isCancelled && currentStepIndex === idx;
            const Icon = step.icon;

            return (
              <li
                key={step.key}
                className="relative flex-1 flex flex-col items-center group"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Connecting horizontal line to next step */}
                {idx < steps.length - 1 && (
                  <div
                    className="absolute top-4 left-1/2 w-full h-[2px] bg-zinc-200 dark:bg-zinc-800 -z-0"
                    aria-hidden="true"
                  >
                    <motion.div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 origin-left"
                      initial={{ scaleX: SCALE.progressStart }}
                      animate={{
                        scaleX: !isCancelled && currentStepIndex > idx ? SCALE.progressEnd : SCALE.progressStart,
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
                        ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                        : isCurrent
                        ? "bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"
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
                        ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                        : isCompleted
                        ? "text-zinc-800 dark:text-zinc-300"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.sublabel && (
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">
                      {step.sublabel}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Cancelled notice banner */}
      {isCancelled && cancelledMessage && (
        <div className="mt-3.5 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200">
          <Ban className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
          <span>{cancelledMessage}</span>
        </div>
      )}
    </div>
  );
};
