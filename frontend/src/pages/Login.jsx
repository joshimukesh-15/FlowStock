"use client";
import { useState, useEffect } from "react";
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
import { Select } from "@/components/ui/Select";

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
    "w-full rounded-lg border bg-white dark:bg-[#18191E] pl-9 pr-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2";
  const inputColors =
    "border-slate-200 dark:border-[#22242B] text-slate-900 dark:text-[#F4F5F7] placeholder-slate-400 dark:placeholder-[#808594] focus:border-sky-500 dark:focus:border-[#38BDF8] focus:ring-sky-500/20 dark:focus:ring-[#38BDF8]/20";
  const inputClass = `${inputBase} ${inputColors}`;

  const labelClass =
    "block text-xs font-medium text-slate-700 dark:text-[#A0A5B2] mb-1";

  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#808594]";

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC] dark:bg-[#090A0C] flex items-center justify-center px-4 py-8 relative overflow-hidden font-sans selection:bg-[#38BDF8]/20 selection:text-sky-900 dark:selection:text-[#38BDF8]">
      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2.5 mb-8 group outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200/90 dark:border-[#22242B] shadow-xs flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform duration-200">
            <img
              src="/assets/flowstock-reveal.svg"
              alt="FlowStock"
              className="w-7 h-7 dark:hidden"
            />
            <img
              src="/assets/flowstock-reveal-dark.svg"
              alt="FlowStock"
              className="w-7 h-7 hidden dark:block"
            />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-950 dark:text-white">
            FlowStock
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#22242B] bg-white dark:bg-[#121316] shadow-sm dark:shadow-none dark:ring-1 dark:ring-[#22242B] overflow-hidden">
          {/* Tab switcher — always visible at top of card */}
          <div className="px-6 pt-5 pb-0">
            <div className="flex bg-slate-100 dark:bg-[#18191E] rounded-lg p-1 border border-slate-200/80 dark:border-[#262833] relative">
              {["login", "signup"].map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`relative flex-1 py-1.5 text-xs font-bold rounded-md transition-colors duration-150 cursor-pointer select-none text-center ${
                      active
                        ? "text-slate-950 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-[#808594] dark:hover:text-[#D8CFBC]"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-login-tab-pill"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 bg-white dark:bg-[#262833] rounded-md shadow-xs border border-slate-200/90 dark:border-[#383B47]"
                      />
                    )}
                    <span className="relative z-10 block">
                      {m === "login" ? "Log In" : "Create Account"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header text */}
          <div className="px-6 pt-4 pb-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <h1 className="font-display text-lg font-bold text-slate-950 dark:text-[#F4F5F7] leading-tight">
                  {mode === "login"
                    ? "Welcome back"
                    : "Get started with FlowStock"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-[#808594] mt-0.5">
                  {mode === "login"
                    ? "Sign in to your workspace"
                    : "Create your organization in under a minute"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form */}
          <div className="px-6 pt-3 pb-5">
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* 1. Full Name (expands smoothly when in signup mode) */}
              <AnimatePresence initial={false}>
                {mode === "signup" && (
                  <motion.div
                    key="login-page-fullname"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-3">
                      <label className={labelClass}>Full Name</label>
                      <div className="relative">
                        <User className={iconClass} />
                        <input
                          type="text"
                          placeholder="Alex Morgan"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={mode === "signup"}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 2. Shared Email Field */}
              <div className="pb-3">
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

              {/* 3. Shared Password Field */}
              <div className="pb-3">
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#808594] hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer p-0.5"
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

              {/* 4. Organization Details (expands smoothly when in signup mode) */}
              <AnimatePresence initial={false}>
                {mode === "signup" && (
                  <motion.div
                    key="login-page-org-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-3">
                      {/* Org section divider */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-[#22242B]" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-[#808594]">
                          Organization
                        </span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-[#22242B]" />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Org Name */}
                        <div>
                          <label className={labelClass}>Company Name</label>
                          <div className="relative">
                            <Building2 className={iconClass} />
                            <input
                              type="text"
                              placeholder="Samsung Electronics Ltd"
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
                              required={mode === "signup"}
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
                              placeholder="samsung-electronics"
                              value={orgSlug}
                              onChange={(e) =>
                                setOrgSlug(
                                  e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, "")
                                )
                              }
                              required={mode === "signup"}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>

                      {orgSlug && (
                        <p className="text-[10px] text-slate-400 dark:text-[#808594] font-mono -mt-1 pl-0.5">
                          flowstock.app/
                          <span className="text-sky-600 dark:text-[#38BDF8]">
                            {orgSlug}
                          </span>
                        </p>
                      )}

                      {/* Currency */}
                      <div>
                        <label className={labelClass}>Currency</label>
                        <Select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          icon={Globe}
                          buttonClassName="rounded-lg h-10 border-slate-200 dark:border-[#22242B]"
                          options={[
                            { value: "INR", label: "INR — Indian Rupee" },
                            { value: "USD", label: "USD — US Dollar" },
                            { value: "EUR", label: "EUR — Euro" },
                            { value: "GBP", label: "GBP — British Pound" },
                          ]}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 5. Submit Button */}
              <div className="pt-0.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  className="w-full h-10 font-bold text-sm rounded-lg"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center justify-center gap-1.5"
                    >
                      <span>
                        {mode === "login" ? "Log In" : "Create Account"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </div>
            </form>

            {/* 6. Demo quick-fill — login mode only */}
            <AnimatePresence initial={false}>
              {mode === "login" && (
                <motion.div
                  key="login-page-demo-tile"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-[#22242B] bg-slate-50/50 dark:bg-[#090A0C]/70 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                            Demo
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block truncate">
                          alice@samsung.com
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#808594]">
                          Pass: <code className="font-mono">admin123</code>
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          setEmail("alice@samsung.com");
                          setPassword("admin123");
                          setError("");
                          setAutoFilled(true);
                          setTimeout(() => setAutoFilled(false), 1400);
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-md bg-[#D8CFBC] hover:bg-[#FFFBF4] text-[#11120D] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs border border-[#FFFBF4] outline-none"
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
                              <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer toggle */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-[#22242B] text-center">
            <p className="text-xs text-slate-500 dark:text-[#808594]">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() =>
                  switchMode(mode === "login" ? "signup" : "login")
                }
                className="text-sky-600 dark:text-[#38BDF8] font-semibold hover:underline cursor-pointer"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-slate-400 dark:text-[#808594]">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8]" />
          <span>Encrypted · SOC 2 Ready · Your data stays yours</span>
        </div>

        {/* Back link */}
        <div className="mt-3 text-center">
          <Link
            to="/"
            className="text-[11px] text-slate-400 dark:text-[#808594] hover:text-slate-600 dark:hover:text-[#38BDF8] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
