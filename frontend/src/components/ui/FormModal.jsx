"use client";
import React from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable FormModal that standardizes modal headers, close buttons,
 * error alerts, scrollable body layouts, and submit/cancel footers.
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  onSubmit,
  isSubmitting = false,
  submitText = "Save",
  cancelText = "Cancel",
  error = "",
  maxWidth = "md",
  className = "",
  bodyClassName = "p-5 sm:p-6 space-y-4",
  footer,
  footerExtra,
  showFooter = true,
  submitDisabled = false,
  children,
}) {
  const content = (
    <>
      {error && (
        <Alert variant="danger" className="text-xs">
          {error}
        </Alert>
      )}
      {children}
      {showFooter && !footer && (
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-[#262A34]">
          <div>{footerExtra}</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={submitDisabled || isSubmitting}
              className="shadow-xs font-semibold"
            >
              {isSubmitting ? "Saving..." : submitText}
            </Button>
          </div>
        </div>
      )}
      {footer}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      className={cn("overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#262A34] bg-slate-50/60 dark:bg-[#181A20]">
        <h3 className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-base sm:text-lg flex items-center gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-[#262A34] flex items-center justify-center text-slate-800 dark:text-[#F4F5F7] shrink-0 shadow-2xs">
              <Icon className="w-4 h-4" />
            </div>
          )}
          {title}
        </h3>
        <motion.button
          type="button"
          whileTap={{ scale: 0.90 }}
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md p-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#8EB69B]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Body / Form */}
      {onSubmit ? (
        <form onSubmit={onSubmit} className={bodyClassName}>
          {content}
        </form>
      ) : (
        <div className={bodyClassName}>{content}</div>
      )}
    </Modal>
  );
}

export default FormModal;
