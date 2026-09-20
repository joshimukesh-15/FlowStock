"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Cookie, 
  Sliders, 
  Activity, 
  Cpu, 
  Check, 
  Lock,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const CONSENT_STORAGE_KEY = "flowstock_cookie_consent";

// Custom animated toggle switch component
function ToggleSwitch({ checked, onChange, disabled = false, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white ${
        disabled
          ? "cursor-not-allowed opacity-80 bg-slate-200 dark:bg-[#282C37]"
          : checked
          ? "bg-slate-950 dark:bg-[#B6FF2E]"
          : "bg-slate-200 dark:bg-[#282C37]"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white dark:bg-[#12141A] shadow-md ring-0`}
      />
    </button>
  );
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // always locked true
    analytics: true,
    performance: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!saved) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        ...prefs,
        timestamp: new Date().toISOString(),
      })
    );
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const full = { essential: true, analytics: true, performance: true };
    setPreferences(full);
    saveConsent(full);
  };

  const handleRejectNonEssential = () => {
    const minimal = { essential: true, analytics: false, performance: false };
    setPreferences(minimal);
    saveConsent(minimal);
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 max-w-[420px] w-[calc(100vw-2rem)]"
        role="dialog"
        aria-label="Cookie consent banner"
      >
        <div className="bg-white/95 dark:bg-[#14171F]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-[#2C313C] shadow-2xl rounded-2xl p-5 text-slate-800 dark:text-[#F4F5F7] ring-1 ring-black/5 dark:ring-white/5">
          {/* Top Banner Header */}
          <div className="flex items-start gap-3.5">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/25 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Cookie className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#14171F]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Privacy & Cookie Preferences
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E222B] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-[#323846]">
                  Compliance
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-1 leading-relaxed">
                FlowStock requires essential cookies to manage your secure tenant session and safeguard ledger records.
              </p>
            </div>
          </div>

          {/* Granular Preference Drawer */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="overflow-hidden border-t border-slate-100 dark:border-[#232732] mt-4 pt-3.5 space-y-2.5"
              >
                {/* 1. Essential Cookies */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#272B36] transition-all">
                  <div className="flex items-start gap-2.5 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Essential Ledger & Auth
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Mandatory for multi-tenant auth, session tokens, and state integrity.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Active
                  </span>
                </div>

                {/* 2. Analytics Telemetry */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#272B36] hover:border-slate-300 dark:hover:border-[#383E4C] transition-all">
                  <div className="flex items-start gap-2.5 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Analytics & Performance
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Collects anonymous transit routing speeds and API latency.
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="toggle-analytics"
                    checked={preferences.analytics}
                    onChange={(val) => setPreferences({ ...preferences, analytics: val })}
                  />
                </div>

                {/* 3. Edge Routing Preferences */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#272B36] hover:border-slate-300 dark:hover:border-[#383E4C] transition-all">
                  <div className="flex items-start gap-2.5 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Edge Depot Caching
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Caches active warehouse filter states and rapid pagination tables.
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="toggle-performance"
                    checked={preferences.performance}
                    onChange={(val) => setPreferences({ ...preferences, performance: val })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#232732] flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium flex items-center gap-1.5 transition-colors group"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
              <span>{showDetails ? "Hide Details" : "Preferences"}</span>
            </button>

            <div className="flex items-center gap-2">
              {showDetails ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveCustom}
                  className="text-xs h-8 px-3 border-slate-300 dark:border-[#323846] text-slate-700 dark:text-slate-200"
                >
                  Save Selection
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRejectNonEssential}
                  className="text-xs h-8 px-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Reject Optional
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs h-8 px-4 bg-slate-950 hover:bg-black dark:bg-[#B6FF2E] dark:hover:bg-[#a3f01b] text-white dark:text-[#14171F] font-bold shadow-xs transition-transform active:scale-95"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CookieConsent;
