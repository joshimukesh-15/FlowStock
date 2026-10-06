"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ExternalLink, } from "lucide-react";
import { useReducedMotion, toastVariants } from "@/motion";
const ToastCard = ({ toast, onDismiss, reducedMotion }) => {
    const [isPaused, setIsPaused] = useState(false);
    const remainingTimeRef = useRef(toast.duration);
    const startTimeRef = useRef(null);
    const timerRef = useRef(null);
    useEffect(() => {
        if (toast.duration <= 0)
            return;
        if (!isPaused) {
            startTimeRef.current = Date.now();
            timerRef.current = setTimeout(() => {
                onDismiss(toast.id);
            }, remainingTimeRef.current);
        }
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isPaused, toast.duration, toast.id, onDismiss]);
    const handleMouseEnter = () => {
        if (toast.duration <= 0)
            return;
        setIsPaused(true);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    };
    const handleMouseLeave = () => {
        if (toast.duration <= 0)
            return;
        setIsPaused(false);
    };
    const getIcon = () => {
        switch (toast.type) {
            case "success":
                return <CheckCircle2 className="w-4 h-4 text-[#11120D] dark:text-[#D8CFBC] shrink-0 mt-0.5"/>;
            case "error":
                return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"/>;
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"/>;
            case "info":
            default:
                return <Info className="w-4 h-4 text-[#565449] dark:text-[#D8CFBC] shrink-0 mt-0.5"/>;
        }
    };
    const getProgressBarColor = () => {
        switch (toast.type) {
            case "success":
                return "bg-[#11120D] dark:bg-[#D8CFBC]";
            case "error":
                return "bg-rose-600/90 dark:bg-rose-400/90";
            case "warning":
                return "bg-amber-600/90 dark:bg-amber-400/90";
            case "info":
            default:
                return "bg-[#565449] dark:bg-[#D8CFBC]";
        }
    };
    const variants = toastVariants(reducedMotion);
    return (<motion.div
      layout
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      drag={reducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.05, right: 0.7 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 80 || velocity.x > 400) {
          onDismiss(toast.id);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="pointer-events-auto relative overflow-hidden bg-white/95 dark:bg-[#121316]/95 text-[#11120D] dark:text-[#F4F5F7] p-3.5 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] border border-slate-200/90 dark:border-[#22242B] border-t-slate-100 dark:border-t-white/10 backdrop-blur-md flex items-start gap-3 w-full group transition-colors hover:border-slate-300 dark:hover:border-[#343742] cursor-grab active:cursor-grabbing select-none"
    >
      <div className="shrink-0">{getIcon()}</div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#11120D] dark:text-[#F4F5F7] tracking-tight truncate">
            {toast.title}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-[#808594] shrink-0 font-mono">
            {toast.timestamp}
          </span>
        </div>

        {toast.description && (<p className="text-[11px] text-slate-600 dark:text-[#9BA3AF] mt-0.5 line-clamp-2 leading-relaxed">
            {toast.description}
          </p>)}

        {toast.action && (<button onClick={toast.action.onClick} className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#18191E] dark:hover:bg-[#22242B] text-[#11120D] dark:text-[#F4F5F7] border border-slate-200 dark:border-[#2E313C] transition-colors cursor-pointer">
            {toast.action.label}
          </button>)}

        {toast.link && (<a href={toast.link} className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-[#565449] dark:text-[#D8CFBC] hover:underline transition-colors">
            <span>View details</span>
            <ExternalLink className="w-2.5 h-2.5"/>
          </a>)}
      </div>

      <button onClick={() => onDismiss(toast.id)} className="text-slate-400 hover:text-[#11120D] dark:hover:text-[#F4F5F7] p-1 -mr-1.5 -mt-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#18191E] transition-colors cursor-pointer" aria-label="Dismiss notification">
        <X className="w-3.5 h-3.5"/>
      </button>

      {/* Shrinking progress bar */}
      {toast.duration > 0 && (<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 dark:bg-[#18191E] overflow-hidden">
          <div className={`h-full origin-left ${getProgressBarColor()}`} style={{
                animation: reducedMotion
                    ? "none"
                    : `toast-progress ${toast.duration}ms linear forwards`,
                animationPlayState: isPaused ? "paused" : "running",
            }}/>
        </div>)}
    </motion.div>);
};
export const ToastContainer = ({ toasts, onDismiss }) => {
    const prefersReducedMotion = useReducedMotion();
    return (<div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0" role="region" aria-label="Notifications" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (<ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} reducedMotion={prefersReducedMotion}/>))}
      </AnimatePresence>
    </div>);
};
