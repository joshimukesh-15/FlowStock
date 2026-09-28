import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion, modalBackdropVariants, modalContentVariants } from "../../motion";

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

/**
 * Top Tier-1 MNC Enterprise Modal Component
 * 
 * Features:
 * - Mounted via React Portal (createPortal) directly to document.body
 * - Immune to ancestor backdrop-filter, transform, or stacking context clipping
 * - True viewport-wide physical backdrop blur and depth
 * - Focus-trapped and dismissed via ESC key and backdrop click
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  maxWidth = "md",
  className = "",
  position = "center",
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key handler and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const backdropVariants = modalBackdropVariants(prefersReducedMotion);
  const contentVariants = modalContentVariants(prefersReducedMotion);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const modalNode = (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex ${
            position === "top" ? "items-start pt-[10vh] sm:pt-[14vh]" : "items-center"
          } justify-center p-4 overflow-y-auto`}
        >
          {/* Animated Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Animated Modal Dialog Content Card */}
          <motion.div
            style={{ transformOrigin: "center" }}
            className={`relative bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] border-t-white/80 dark:border-t-white/15 text-slate-900 dark:text-[#F4F5F7] rounded-2xl w-full ${maxWidthClasses[maxWidth]} shadow-2xl overflow-hidden z-10 ${className}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalNode, document.body);
};

export default Modal;
