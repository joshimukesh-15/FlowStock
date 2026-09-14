"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ExternalLink, } from "lucide-react";
import { useReducedMotion, toastVariants } from "@/motion";
const ToastCard = ({ toast, onDismiss, reducedMotion }) => {
    const [isPaused, setIsPaused] = useState(false);
    const remainingTimeRef = useRef(toast.duration);
    const startTimeRef = useRef(Date.now());
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
                return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>;
            case "error":
                return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"/>;
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>;
            case "info":
            default:
                return <Info className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5"/>;
        }
    };
    const getProgressBarColor = () => {
        switch (toast.type) {
            case "success":
                return "bg-emerald-500/80";
            case "error":
                return "bg-rose-500/80";
            case "warning":
                return "bg-amber-500/80";
            case "info":
            default:
                return "bg-zinc-400/80";
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
      className="pointer-events-auto relative overflow-hidden bg-slate-950/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 border-t-white/20 backdrop-blur-md flex items-start gap-3 w-full group transition-colors hover:border-slate-700 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="shrink-0">{getIcon()}</div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-white tracking-tight truncate">
            {toast.title}
          </span>
          <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
            {toast.timestamp}
          </span>
        </div>

        {toast.description && (<p className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
            {toast.description}
          </p>)}

        {toast.action && (<button onClick={toast.action.onClick} className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
            {toast.action.label}
          </button>)}

        {toast.link && (<a href={toast.link} className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 hover:text-white underline transition-colors">
            <span>View details</span>
            <ExternalLink className="w-2.5 h-2.5"/>
          </a>)}
      </div>

      <button onClick={() => onDismiss(toast.id)} className="text-zinc-400 hover:text-white p-1 -mr-1.5 -mt-1.5 rounded hover:bg-zinc-800/80 transition-colors" aria-label="Dismiss notification">
        <X className="w-3.5 h-3.5"/>
      </button>

      {/* Shrinking progress bar */}
      {toast.duration > 0 && (<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800/60 overflow-hidden">
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
