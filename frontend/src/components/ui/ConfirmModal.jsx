import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";

/**
 * HoldToConfirmButton implementation adapted for FlowStock design tokens.
 * Borrowed from PremiumMotion.jsx pattern 1c.
 */
function HoldToConfirmDangerButton({
  children,
  onConfirm,
  isLoading,
  disabled,
  duration = 1.1,
  className = "",
}) {
  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const clip = useTransform(progress, [0, 1], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const [isHolding, setIsHolding] = useState(false);
  const controlsRef = useRef(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    // Reset if loading finishes or modal re-opens
    if (!isLoading) {
      triggeredRef.current = false;
      progress.set(0);
      setIsHolding(false);
    }
  }, [isLoading, progress]);

  const start = () => {
    if (disabled || isLoading || triggeredRef.current) return;
    setIsHolding(true);
    controlsRef.current?.stop();
    controlsRef.current = animate(progress, 1, {
      type: "tween",
      ease: "linear",
      duration: duration * (1 - progress.get()),
      onComplete: () => {
        triggeredRef.current = true;
        setIsHolding(false);
        onConfirm?.();
      },
    });
  };

  const cancel = () => {
    if (triggeredRef.current || isLoading) return;
    setIsHolding(false);
    controlsRef.current?.stop();
    controlsRef.current = animate(progress, 0, {
      type: "spring",
      stiffness: 350,
      damping: 28,
    });
  };

  const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#04222B]";

  return (
    <motion.button
      type="button"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={`${children} (Hold to confirm)`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") cancel();
      }}
      whileTap={!disabled && !isLoading && !prefersReducedMotion ? { scale: 0.97 } : undefined}
      className={`relative touch-none select-none overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold h-9 min-h-[36px] inline-flex items-center justify-center cursor-pointer transition-colors duration-200 border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100/70 dark:bg-red-950/40 text-red-700 dark:text-red-300 disabled:opacity-50 disabled:pointer-events-none ${focusRing} ${className}`}
    >
      {/* Base Idle Label */}
      <span className="relative z-10 flex items-center gap-1.5">
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing…</span>
          </>
        ) : (
          <>
            <span>Hold to {children}</span>
          </>
        )}
      </span>

      {/* Filling Progress Clip-Path Layer */}
      {!isLoading && (
        <motion.span
          aria-hidden="true"
          style={{ clipPath: clip }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center font-bold bg-red-600 text-white"
        >
          <span>Confirming…</span>
        </motion.span>
      )}
    </motion.button>
  );
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading: propLoading,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      maxWidth="sm"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                : isWarning
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-[#0A3D4A] text-slate-700 dark:text-[#9BA3AF]"
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isWarning ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F4F5F7]">{title}</h3>
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-[#9BA3AF] mb-5 leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            {cancelText}
          </Button>

          {isDanger ? (
            <HoldToConfirmDangerButton
              isLoading={loading}
              onConfirm={handleConfirm}
              duration={1.1}
            >
              {confirmText}
            </HoldToConfirmDangerButton>
          ) : (
            <Button
              type="button"
              size="sm"
              variant={isWarning ? "primary" : "primary"}
              isLoading={loading}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
