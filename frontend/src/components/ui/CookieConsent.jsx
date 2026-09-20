"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cookie, ChevronDown, Check, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/Button";

const CONSENT_STORAGE_KEY = "flowstock_cookie_consent";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // always locked true
    analytics: true,
    performance: true,
  });

  useEffect(() => {
    // Check if user already made a decision
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!saved) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
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
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)]"
        role="dialog"
        aria-label="Cookie consent banner"
      >
        <div className="bg-white/95 dark:bg-[#181A20]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#323744] shadow-2xl rounded-2xl p-4 sm:p-5 text-slate-800 dark:text-[#F4F5F7]">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Privacy & Cookie Choices
                </h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#262A34] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#3A404F]">
                  GDPR / CCPA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-1.5 leading-relaxed">
                FlowStock uses essential cookies to secure your tenant session and safeguard ledger integrity. Optional telemetry cookies assist in optimizing transit routing latency.
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
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-slate-100 dark:border-[#262A34] mt-3.5 pt-3.5 space-y-2.5 text-xs"
              >
                {/* Essential */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1E222B]">
                  <div className="pr-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Essential Ledger Cookies
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Strictly required for multi-tenant auth and state replication.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                    Always On
                  </span>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1E222B]">
                  <div className="pr-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Analytics & Telemetry
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Measures API latency and batch transaction speeds.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-950 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Performance */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1E222B]">
                  <div className="pr-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Edge Routing Preferences
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Remembers active depot nodes and inventory display filters.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.performance}
                    onChange={(e) => setPreferences({ ...preferences, performance: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-950 focus:ring-0 cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262A34] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium flex items-center gap-1 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showDetails ? "Hide Options" : "Customize"}</span>
            </button>

            <div className="flex items-center gap-2">
              {showDetails ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveCustom}
                  className="text-xs h-8 px-3"
                >
                  Save Choices
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRejectNonEssential}
                  className="text-xs h-8 px-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Decline
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs h-8 px-3.5 bg-slate-950 hover:bg-black dark:bg-[#B6FF2E] dark:hover:bg-[#a3f01b] text-white dark:text-[#14171F] font-semibold shadow-xs"
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
