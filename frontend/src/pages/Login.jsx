"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  User,
  Mail,
  Lock,
  KeyRound,
  Globe,
  Zap,
  ShieldCheck,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, signup } = useAuth();

  const queryMode = searchParams.get("mode");
  const [mode, setMode] = useState(
    queryMode === "signup" ? "signup" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (queryMode === "signup" || queryMode === "login") {
      setMode(queryMode);
    }
  }, [queryMode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSearchParams({ mode: newMode });
  };

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [currency, setCurrency] = useState("INR");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({
          name,
          email,
          password,
          org_name: orgName,
          org_slug: orgSlug,
          currency,
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-lg border bg-white dark:bg-[#11120D] pl-9 pr-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2";
  const inputColors =
    "border-slate-200 dark:border-[#33372B] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#9BA3AF] focus:border-[#D8CFBC] dark:focus:border-[#D8CFBC] focus:ring-[#D8CFBC]/20 dark:focus:ring-[#D8CFBC]/15";
  const inputClass = `${inputBase} ${inputColors}`;

  const labelClass =
    "block text-xs font-medium text-slate-600 dark:text-[#D8CFBC] mb-1";

  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#D8CFBC]";

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC] dark:bg-[#11120D] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(216,207,188,0.12), transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(216,207,188,0.18), transparent)",
        }}
      />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2.5 mb-8 group outline-none"
        >
          <img
            src="/assets/flowstock-reveal.svg"
            alt="FlowStock"
            className="w-9 h-9 group-hover:scale-105 transition-transform duration-200"
          />
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
            FlowStock
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {/* Tab switcher — always visible at top of card */}
          <div className="px-6 pt-5 pb-0">
            <div className="flex bg-slate-100 dark:bg-[#11120D] rounded-lg p-0.5 border border-slate-200/60 dark:border-[#33372B] relative">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer ${
                  mode === "login"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-[#9BA3AF] hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                {mode === "login" && (
                  <motion.div
                    layoutId="active-login-tab"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute inset-0 bg-white dark:bg-[#23261E] dark:border dark:border-[#33372B] rounded-md shadow-sm -z-10"
                  />
                )}
                Log In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer ${
                  mode === "signup"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-[#9BA3AF] hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                {mode === "signup" && (
                  <motion.div
                    layoutId="active-login-tab"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute inset-0 bg-white dark:bg-[#23261E] dark:border dark:border-[#33372B] rounded-md shadow-sm -z-10"
                  />
                )}
                Create Account
              </button>
            </div>
          </div>

          {/* Header text */}
          <div className="px-6 pt-4 pb-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {mode === "login"
                ? "Welcome back"
                : "Get started with FlowStock"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
              {mode === "login"
                ? "Sign in to your workspace"
                : "Create your organization in under a minute"}
            </p>
          </div>

          {/* Form */}
          <div className="px-6 pt-3 pb-5">
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <User className={iconClass} />
                    <input
                      type="text"
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className={iconClass} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className={iconClass} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#D8CFBC] hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer p-0.5"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <>
                  {/* Org section divider */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-px bg-slate-150 dark:bg-[#33372B]" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-[#D8CFBC]">
                      Organization
                    </span>
                    <div className="flex-1 h-px bg-slate-150 dark:bg-[#33372B]" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Org Name */}
                    <div>
                      <label className={labelClass}>Company Name</label>
                      <div className="relative">
                        <Building2 className={iconClass} />
                        <input
                          type="text"
                          placeholder="Acme Ltd"
                          value={orgName}
                          onChange={(e) => {
                            setOrgName(e.target.value);
                            const auto = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "");
                            if (
                              !orgSlug ||
                              orgSlug ===
                                orgName
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/^-|-$/g, "")
                            ) {
                              setOrgSlug(auto);
                            }
                          }}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Workspace Slug */}
                    <div>
                      <label className={labelClass}>Workspace ID</label>
                      <div className="relative">
                        <KeyRound className={iconClass} />
                        <input
                          type="text"
                          placeholder="acme-ltd"
                          value={orgSlug}
                          onChange={(e) =>
                            setOrgSlug(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, "")
                            )
                          }
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {orgSlug && (
                    <p className="text-[10px] text-slate-400 dark:text-[#9BA3AF] font-mono -mt-1 pl-0.5">
                      flowstock.app/
                      <span className="text-[#565449] dark:text-[#D8CFBC]">
                        {orgSlug}
                      </span>
                    </p>
                  )}

                  {/* Currency */}
                  <div>
                    <label className={labelClass}>Currency</label>
                    <div className="relative">
                      <Globe className={iconClass} />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={`${inputBase} border-slate-200 dark:border-[#33372B] text-slate-900 dark:text-white focus:border-[#D8CFBC] dark:focus:border-[#D8CFBC] focus:ring-[#D8CFBC]/20 dark:focus:ring-[#D8CFBC]/15 appearance-none cursor-pointer`}
                      >
                        <option value="INR">INR — Indian Rupee</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — British Pound</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full h-10 font-bold text-sm rounded-lg mt-1"
              >
                <span>
                  {mode === "login" ? "Log In" : "Create Account"}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
              </Button>
            </form>

            {/* Demo quick-fill — login mode only */}
            {mode === "login" && (
              <div className="mt-3 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-[#33372B] bg-slate-50/50 dark:bg-[#11120D]/60 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Demo
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block truncate">
                    alice@acme.local
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#D8CFBC]">
                    Pass: <code className="font-mono">admin123</code>
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setEmail("alice@acme.local");
                    setPassword("admin123");
                    setError("");
                    setAutoFilled(true);
                    setTimeout(() => setAutoFilled(false), 1400);
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-md bg-[#D8CFBC] hover:bg-[#FFFBF4] text-[#11120D] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-[0_2px_10px_rgba(216,207,188,0.25)] outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC]"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {autoFilled ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-[#11120D]" strokeWidth={2.5} />
                        <span>Filled</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Auto Fill
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            )}
          </div>

          {/* Footer toggle */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-[#33372B] text-center">
            <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() =>
                  switchMode(mode === "login" ? "signup" : "login")
                }
                className="text-[#565449] dark:text-[#D8CFBC] font-semibold hover:underline cursor-pointer"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-slate-400 dark:text-[#D8CFBC]/70">
          <ShieldCheck className="w-3 h-3" />
          <span>Encrypted · SOC 2 Ready · Your data stays yours</span>
        </div>

        {/* Back link */}
        <div className="mt-3 text-center">
          <Link
            to="/"
            className="text-[11px] text-slate-400 dark:text-[#D8CFBC]/70 hover:text-slate-600 dark:hover:text-[#D8CFBC] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
