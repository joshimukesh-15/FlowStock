import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion, modalBackdropVariants, modalContentVariants, } from "../../motion";
const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
};
/**
 * Reusable animated Modal component.
 * Governed by FLOWSTOCK_MOTION_SPEC.md (Sections 4, 5, 6).
 */
export const Modal = ({ isOpen, onClose, children, maxWidth = "md", className = "", }) => {
    const prefersReducedMotion = useReducedMotion();
    // Escape key handler
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
    return (<AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Animated Backdrop */}
          <motion.div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm" initial="hidden" animate="visible" exit="exit" variants={backdropVariants} onClick={onClose} aria-hidden="true"/>

          {/* Animated Modal Dialog Content Card */}
          <motion.div className={`relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl w-full ${maxWidthClasses[maxWidth]} shadow-2xl overflow-hidden z-10 ${className}`} initial="hidden" animate="visible" exit="exit" variants={contentVariants} role="dialog" aria-modal="true">
            {children}
          </motion.div>
        </div>)}
    </AnimatePresence>);
};
