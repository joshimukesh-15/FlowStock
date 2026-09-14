"use client";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Building2, User, Mail, Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logomark } from "@/components/ui/Logomark";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-slate-300 dark:border-[#545963] bg-white dark:bg-[#181A20] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#7C8189] focus:outline-none focus:border-emerald-500 dark:focus:border-[#B6FF2E] focus:ring-1 focus:ring-emerald-500 dark:focus:ring-[#B6FF2E] transition-colors";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#14171F] flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none -z-10" style={{
        background: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(182,255,46,0.06), transparent 70%)',
      }} />

      <div className="w-full max-w-md">
        {/* Logo header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-[#3A3E47] border border-slate-800 dark:border-[#545963] flex items-center justify-center p-1">
              <Logomark className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">FlowStock</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#9BA3AF]">
            {mode === "login"
              ? "Log in to your operations cockpit"
              : "Set up your organization and start managing inventory"}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#323744] bg-white dark:bg-[#181A20] shadow-lg p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#7C8189]" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#7C8189]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#7C8189]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#7C8189] hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === "signup" && (
              <>
                {/* Separator */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-[#323744]" />
                  <span className="text-[11px] font-mono text-slate-400 dark:text-[#7C8189] uppercase tracking-wider">Organization</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-[#323744]" />
                </div>

                {/* Org Name */}
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#7C8189]" />
                  <input
                    type="text"
                    placeholder="Organization name"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) {
                        setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                      }
                    }}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Org Slug */}
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#7C8189]" />
                  <input
                    type="text"
                    placeholder="org-slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Currency */}
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-[#545963] bg-white dark:bg-[#181A20] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#B6FF2E] focus:ring-1 focus:ring-emerald-500 dark:focus:ring-[#B6FF2E] transition-colors"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full h-11 bg-[#B6FF2E] hover:bg-[#a3f01b] text-[#14171F] font-bold text-sm rounded-xl inline-flex items-center justify-center gap-2 transition-all shadow-[0_2px_12px_rgba(182,255,46,0.25)] hover:shadow-[0_4px_20px_rgba(182,255,46,0.4)] disabled:opacity-50 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{loading ? (mode === "login" ? "Logging in..." : "Creating account...") : (mode === "login" ? "Log In" : "Create Account")}</span>
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>

            {mode === "login" && (
              <div className="pt-2">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50 dark:bg-[#23262F]/50 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#7C8189] block">Demo Administrator</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold truncate block">alice@acme.local</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("alice@acme.local");
                      setPassword("admin123");
                      setError("");
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-[#B6FF2E] dark:hover:bg-[#a3f01b] dark:text-[#14171F] text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Auto Fill
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Mode toggle */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#323744] text-center">
            <p className="text-sm text-slate-500 dark:text-[#9BA3AF]">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="text-emerald-600 dark:text-[#B6FF2E] font-semibold hover:underline cursor-pointer"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-400 dark:text-[#7C8189] hover:text-slate-600 dark:hover:text-white transition-colors">
            ← Back to FlowStock
          </Link>
        </div>
      </div>
    </div>
  );
}
