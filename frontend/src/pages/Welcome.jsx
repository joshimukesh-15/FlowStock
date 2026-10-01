import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Truck,
  ReceiptText,
  ArrowRight,
  Check,
  X,
  FileText,
  Shield,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  KeyRound,
  Globe,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { Logomark } from "@/components/ui/Logomark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/* ── Inventory Ledger Panel ── */
function InventoryPanel() {
  const rows = [
    { name: "Raw Denim 32x30", sku: "RD-3230", qty: 148, status: "ok", value: "₹2,96,000" },
    { name: "Merino Tee M/White", sku: "MT-MWH", qty: 34, status: "low", value: "₹61,200" },
    { name: "Canvas Sneaker 42", sku: "CS-42BK", qty: 212, status: "ok", value: "₹5,30,000" },
    { name: "Linen Shirt XL/Blue", sku: "LS-XLBL", qty: 7, status: "critical", value: "₹21,000" },
    { name: "Oxford Chino 34x32", sku: "OC-3432", qty: 89, status: "ok", value: "₹2,22,500" },
  ];
  const badge = { ok: ["#166534", "#DCFCE7", "In Stock"], low: ["#92400E", "#FEF3C7", "Low"], critical: ["#991B1B", "#FEE2E2", "Critical"] };
  return (
    <div className="w-full h-full bg-[#090A0C] rounded-xl overflow-hidden flex flex-col select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#22242B]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#38BDF8]">Inventory Ledger</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">490 SKUs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-28 rounded bg-[#121316] border border-[#22242B]" />
          <div className="h-6 w-16 rounded bg-[#38BDF8] opacity-90" />
        </div>
      </div>
      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2 border-b border-[#22242B]">
          {["PRODUCT", "QTY", "STATUS", "VALUE"].map(h => (
            <span key={h} className="text-[9px] font-mono uppercase tracking-[0.14em] text-[#4B5563]">{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2.5 border-b border-[#22242B]/50 ${i % 2 === 0 ? "" : "bg-[#0D0E11]/50"}`}>
            <div>
              <div className="text-[11px] text-[#E5E7EB] font-medium leading-tight truncate">{r.name}</div>
              <div className="text-[9px] font-mono text-[#4B5563] mt-0.5">{r.sku}</div>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[#D1D5DB] self-center">{r.qty}</div>
            <div className="self-center">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: badge[r.status][1] + "22", color: badge[r.status][1], border: `1px solid ${badge[r.status][1]}33` }}>
                {badge[r.status][2]}
              </span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[#38BDF8] self-center text-right">{r.value}</div>
          </div>
        ))}
      </div>
      {/* Footer metric */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#22242B] bg-[#0D0E11]">
        <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-[#4B5563]">Total Portfolio Value</span>
        <span className="text-[13px] font-mono font-bold tabular-nums text-[#38BDF8]">₹24,68,450</span>
      </div>
    </div>
  );
}

/* ── Products / SKU Catalog Panel ── */
function ProductsPanel() {
  const products = [
    { name: "Raw Denim Jeans", cat: "Bottoms", sku: "RD-3230", stock: 148, price: "₹2,000" },
    { name: "Merino Wool Tee", cat: "Tops", sku: "MT-MWH", stock: 34, price: "₹1,800" },
    { name: "Canvas Sneakers", cat: "Footwear", sku: "CS-42BK", stock: 212, price: "₹2,500" },
    { name: "Linen Shirt", cat: "Tops", sku: "LS-XLBL", stock: 7, price: "₹3,000" },
    { name: "Oxford Chinos", cat: "Bottoms", sku: "OC-3432", stock: 89, price: "₹2,500" },
    { name: "Leather Wallet", cat: "Accessories", sku: "LW-BRN", stock: 55, price: "₹1,200" },
  ];
  return (
    <div className="w-full h-full bg-[#090A0C] rounded-xl overflow-hidden flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#22242B]">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#38BDF8]">SKU Catalog</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-[#4B5563]">6 of 490 shown</span>
          <div className="h-5 w-20 rounded bg-[#38BDF8] opacity-90" />
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1 p-3 grid grid-cols-3 gap-2 overflow-hidden">
        {products.map((p, i) => (
          <div key={i} className="rounded-lg border border-[#22242B] bg-[#121316] p-2.5 flex flex-col gap-1.5 hover:border-[#38BDF8]/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-[#38BDF8]">{p.cat}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${p.stock > 20 ? "bg-emerald-500" : "bg-amber-500"}`} />
            </div>
            <div className="text-[10px] font-semibold text-[#E5E7EB] leading-tight">{p.name}</div>
            <div className="text-[9px] font-mono text-[#4B5563]">{p.sku}</div>
            <div className="flex items-center justify-between mt-auto pt-1 border-t border-[#22242B]">
              <span className="text-[9px] font-mono tabular-nums text-[#9CA3AF]">{p.stock} units</span>
              <span className="text-[10px] font-mono font-bold tabular-nums text-[#38BDF8]">{p.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Operations & Financial Velocity Panel ── */
function OperationsPanel() {
  const kpis = [
    { label: "Invoiced Revenue", value: "₹18.4L", delta: "+12.3%", up: true },
    { label: "Active Orders", value: "247", delta: "+8", up: true },
    { label: "Receivables", value: "₹4.2L", delta: "-2.1%", up: false },
  ];
  const orders = [
    { id: "ORD-8821", customer: "Nexus Retail Ltd", items: 14, status: "Dispatched", amount: "₹84,200" },
    { id: "ORD-8820", customer: "Apex Stores", items: 6, status: "Confirmed", amount: "₹31,500" },
    { id: "ORD-8819", customer: "Meridian Corp", items: 22, status: "Fulfilled", amount: "₹1,12,000" },
  ];
  const bars = [40, 65, 52, 80, 70, 88, 60, 95, 72, 85, 68, 90];
  const statusColor = { Dispatched: "#38BDF8", Confirmed: "#A78BFA", Fulfilled: "#34D399" };
  return (
    <div className="w-full h-full bg-[#090A0C] rounded-xl overflow-hidden flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#22242B]">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#38BDF8]">Executive Cockpit</span>
        <span className="text-[9px] font-mono text-[#4B5563] border border-[#22242B] px-2 py-0.5 rounded">Live · Oct 2026</span>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-3 divide-x divide-[#22242B] border-b border-[#22242B]">
        {kpis.map((k, i) => (
          <div key={i} className="px-3 py-3">
            <div className="text-[8px] font-mono uppercase tracking-[0.12em] text-[#4B5563] mb-1">{k.label}</div>
            <div className="text-[15px] font-mono font-bold tabular-nums text-[#F4F5F7]">{k.value}</div>
            <div className={`text-[9px] font-mono mt-0.5 ${k.up ? "text-emerald-400" : "text-red-400"}`}>{k.delta}</div>
          </div>
        ))}
      </div>
      {/* Mini bar chart */}
      <div className="px-4 py-2.5 border-b border-[#22242B]">
        <div className="text-[8px] font-mono uppercase tracking-[0.12em] text-[#4B5563] mb-2">Order Velocity — Last 12 Days</div>
        <div className="flex items-end gap-1 h-10">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === bars.length - 1 ? "#38BDF8" : "#38BDF8" + "40" }} />
          ))}
        </div>
      </div>
      {/* Recent orders */}
      <div className="flex-1 overflow-hidden">
        {orders.map((o, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2 ${i < orders.length - 1 ? "border-b border-[#22242B]/60" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-[#4B5563]">{o.id}</span>
                <span className="text-[9px] font-mono" style={{ color: statusColor[o.status] }}>· {o.status}</span>
              </div>
              <div className="text-[10px] text-[#D1D5DB] font-medium truncate">{o.customer}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-mono font-bold tabular-nums text-[#38BDF8]">{o.amount}</div>
              <div className="text-[9px] font-mono text-[#4B5563]">{o.items} items</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── High-Performance Responsive Feature Row ── */
function FeatureRow({
  tag,
  title,
  description,
  bullets,
  panel,
  reverse = false,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center my-14 sm:my-20">
      {/* Panel Column */}
      <div
        className={`rounded-2xl overflow-hidden border border-slate-200/90 dark:border-[#22242B] bg-white dark:bg-[#0D0E11] shadow-sm hover:shadow-[0_0_40px_rgba(56,189,248,0.06)] transition-all duration-500 p-1.5 sm:p-2 ${
          reverse ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-[#22242B] relative aspect-[16/10]">
          {panel}
        </div>
      </div>

      {/* Text Column */}
      <div className={`space-y-4 text-left ${reverse ? "lg:order-1" : "lg:order-2"}`}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 dark:border-[#38BDF8]/30 text-sky-700 dark:text-[#38BDF8] text-[10px] font-mono font-bold tracking-[0.16em] uppercase">
          {tag}
        </div>

        <h3 className="font-display text-2xl sm:text-3xl lg:text-[2.2rem] font-bold tracking-[-0.03em] text-slate-950 dark:text-[#F4F5F7] leading-[1.15] [text-wrap:balance]">
          {title}
        </h3>

        <p className="text-base text-slate-600 dark:text-[#A0A5B2] leading-relaxed [text-wrap:balance]">
          {description}
        </p>

        <ul className="space-y-3 pt-2">
          {bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-[#D1D5DF] leading-snug">
              <span className="w-5 h-5 rounded-md bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 dark:border-[#38BDF8]/30 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Inline Auth Drawer ── */
function AuthDrawer({ mode, onModeChange, onClose, onSuccess }) {
  const { login, signup } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [orgName, setOrgName]   = useState("");
  const [orgSlug, setOrgSlug]   = useState("");
  const [currency, setCurrency] = useState("INR");

  const inputBase = "w-full rounded-lg border bg-white dark:bg-[#18191E] pl-9 pr-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2";
  const inputColors = "border-slate-200 dark:border-[#22242B] text-slate-900 dark:text-[#F4F5F7] placeholder-slate-400 dark:placeholder-[#808594] focus:border-sky-500 dark:focus:border-[#38BDF8] focus:ring-sky-500/20 dark:focus:ring-[#38BDF8]/20";
  const inputClass = `${inputBase} ${inputColors}`;
  const labelClass = "block text-xs font-medium text-slate-600 dark:text-[#A0A5B2] mb-1";
  const iconClass  = "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#808594]";

  const switchMode = (m) => { onModeChange(m); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({ name, email, password, org_name: orgName, org_slug: orgSlug, currency });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-[#22242B] shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-[#18191E] border border-slate-800 dark:border-[#22242B] flex items-center justify-center p-1">
              <Logomark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-[#F4F5F7] leading-tight">
                {mode === "login" ? "Welcome back" : "Get started with FlowStock"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#808594] mt-0.5">
                {mode === "login" ? "Sign in to your workspace" : "Create your organization in under a minute"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-[#808594] hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#22242B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-6 pt-4 shrink-0">
        <div className="max-w-md mx-auto">
          <div className="flex bg-slate-100 dark:bg-[#090A0C] rounded-lg p-0.5 border border-slate-200/60 dark:border-[#22242B]">
            {["login","signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`relative flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer ${
                  mode === m
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-[#A0A5B2] hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="auth-drawer-tab"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute inset-0 bg-white dark:bg-[#18191E] dark:border dark:border-[#22242B] rounded-md shadow-sm -z-10"
                  />
                )}
                {m === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-md mx-auto">
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
                <input type="text" placeholder="Alex Morgan" value={name}
                  onChange={e => setName(e.target.value)} required className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className={iconClass} />
              <input type="email" placeholder="name@company.com" value={email}
                onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6}
                className={`${inputClass} pr-9`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#808594] hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer p-0.5">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-slate-200 dark:bg-[#22242B]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-[#808594]">Organization</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-[#22242B]" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Company Name</label>
                  <div className="relative">
                    <Building2 className={iconClass} />
                    <input type="text" placeholder="Acme Ltd" value={orgName}
                      onChange={e => {
                        setOrgName(e.target.value);
                        const auto = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                        if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
                          setOrgSlug(auto);
                      }}
                      required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Workspace ID</label>
                  <div className="relative">
                    <KeyRound className={iconClass} />
                    <input type="text" placeholder="acme-ltd" value={orgSlug}
                      onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      required className={inputClass} />
                  </div>
                </div>
              </div>

              {orgSlug && (
                <p className="text-[10px] text-slate-400 dark:text-[#808594] font-mono -mt-1">
                  flowstock.app/<span className="text-sky-600 dark:text-[#38BDF8]">{orgSlug}</span>
                </p>
              )}

              <div>
                <label className={labelClass}>Currency</label>
                <div className="relative">
                  <Globe className={iconClass} />
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className={`${inputClass} pl-9 appearance-none`}>
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Demo quick-fill */}
          {mode === "login" && (
            <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-[#22242B] bg-slate-50/50 dark:bg-[#090A0C]/70 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">Demo</span>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block truncate">alice@acme.local</span>
                <span className="text-[10px] text-slate-400 dark:text-[#808594]">Pass: <code className="font-mono">admin123</code></span>
              </div>
              <button type="button"
                onClick={() => { setEmail("alice@acme.local"); setPassword("admin123"); setError(""); }}
                className="shrink-0 px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold transition-colors cursor-pointer">
                Auto Fill
              </button>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" isLoading={loading}
            className="w-full h-10 font-bold text-sm rounded-lg mt-1">
            <span>{mode === "login" ? "Log In" : "Create Account"}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
          </Button>
        </form>
        </div>{/* end max-w-md */}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-[#22242B] shrink-0">
        <div className="max-w-md mx-auto space-y-3">
          <p className="text-xs text-center text-slate-500 dark:text-[#808594]">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="text-sky-600 dark:text-[#38BDF8] font-semibold hover:underline cursor-pointer">
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-[#808594]">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8]" />
            <span>Encrypted · SOC 2 Ready · Your data stays yours</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const authPanelWidth = windowWidth < 640
    ? windowWidth
    : windowWidth < 1024
      ? 460
      : Math.min(560, Math.max(480, Math.floor(windowWidth * 0.48)));

  const openAuth = (mode = "login") => { setAuthMode(mode); setAuthOpen(true); };
  const closeAuth = () => setAuthOpen(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -70;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#FFFBF4] dark:bg-[#090A0C] text-slate-900 dark:text-[#F4F5F7] font-sans selection:bg-[#38BDF8]/20 selection:text-sky-900 dark:selection:text-[#38BDF8] transition-colors">

      {/* ── LEFT: scrollable welcome content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative">
      
      {/* STATIC HIGH-PERFORMANCE BACKGROUND ACCENTS */}
      <div className="absolute inset-x-0 top-0 h-[450px] overflow-hidden pointer-events-none -z-10">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px]" 
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(56,189,248,0.06), rgba(30,41,59,0.04), transparent 70%)',
          }} 
        />
        <div 
          className="absolute top-[35%] right-0 w-[500px] h-[500px]" 
          style={{
            background: 'radial-gradient(circle at 100% 50%, rgba(56,189,248,0.04), transparent 70%)',
          }} 
        />
        <div 
          className="absolute top-[65%] left-0 w-[500px] h-[500px]" 
          style={{
            background: 'radial-gradient(circle at 0% 50%, rgba(56,189,248,0.03), transparent 70%)',
          }} 
        />
      </div>

      {/* 1. STICKY TOP NAVBAR */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#22242B] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-10 cursor-pointer">
            <Logomark className="w-8 h-8 hover:scale-105 transition-transform drop-shadow-md" />
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
                FlowStock
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-500 dark:text-[#38BDF8] font-mono">
                Enterprise Core
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs text-slate-600 dark:text-[#A0A5B2] font-medium tracking-tight">
            <button
              type="button"
              onClick={() => scrollToSection("platform")}
              className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("capabilities")}
              className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("workflow")}
              className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Operational Flow
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("stats")}
              className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Performance
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate("/dashboard")}
                className="h-8 px-3 text-xs gap-1.5 shadow-xs"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => (authOpen && authMode === "login" ? closeAuth() : openAuth("login"))}
                  className={cn(
                    "h-8 px-3 text-xs gap-1.5 shadow-xs font-semibold",
                    authOpen && authMode === "login" && "ring-2 ring-[#11120D]/25 dark:ring-white/35"
                  )}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log In</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => (authOpen && authMode === "signup" ? closeAuth() : openAuth("signup"))}
                  className={cn(
                    "h-8 px-3 text-xs gap-1.5 shadow-xs font-semibold",
                    authOpen && authMode === "signup" && "ring-2 ring-[#11120D]/25 dark:ring-white/35"
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative pt-14 sm:pt-20 pb-20 sm:pb-28 bg-transparent">
        {/* Clean Ambient Atmosphere (No Image) */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] pointer-events-none opacity-80"
            style={{
              background: 'radial-gradient(ellipse 60% 45% at 50% 25%, rgba(56,189,248,0.07), rgba(30,41,59,0.05), transparent 70%)',
            }}
          />
        </div>

        {/* Hero Content Header */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-200/90 dark:border-[#22242B] bg-white/80 dark:bg-[#121316]/80 backdrop-blur-md text-xs mb-8 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-sky-700 dark:text-[#38BDF8] font-bold">
              FINANCIAL-GRADE LEDGER
            </span>
            <span className="w-px h-3 bg-slate-200 dark:bg-[#22242B]" />
            <span className="text-[11px] text-slate-600 dark:text-[#A0A5B2] font-mono tracking-tight hidden sm:inline">
              ZERO-DRIFT PHYSICAL INVENTORY
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-[-0.04em] leading-[1.05] mb-6 text-slate-950 dark:text-[#F4F5F7] [text-wrap:balance]">
            The financial-grade{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-800 to-sky-600 dark:from-white dark:via-[#F4F5F7] dark:to-[#38BDF8]">
              inventory ledger
            </span>{" "}
            for high-velocity warehouses
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-[#A0A5B2] max-w-2xl leading-relaxed mb-10 font-normal [text-wrap:balance]">
            Zero-drift double-entry stock bookkeeping, real-time multi-carrier logistics orchestration, and automated GST tax invoices, engineered for physical supply chains.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate("/dashboard")}
                className="h-12 px-7 rounded-xl font-bold text-sm shadow-[0_2px_14px_rgba(56,189,248,0.25)]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => openAuth("signup")}
                  className="h-12 px-7 rounded-xl font-bold text-sm shadow-[0_2px_14px_rgba(56,189,248,0.25)]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("platform")}
                  className="h-12 px-7 rounded-xl font-medium text-sm border-slate-200 dark:border-[#22242B] dark:bg-[#121316] dark:hover:bg-[#18191E]"
                >
                  <span>Explore Platform</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. LOGISTICS CARRIER LOGO STRIP (FULCRUM-STYLE) */}
      <section className="py-8 border-y border-slate-200/80 dark:border-[#22242B] bg-white/70 dark:bg-[#090A0C] transition-colors relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-[#808594] mb-4 tracking-[0.2em] uppercase">
            Integrated Logistics Networks & Multi-Node Carrier Mesh
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 font-mono font-bold text-xs tracking-wider">
            {["BLUE DART", "DELHIVERY", "DTDC", "FEDEX", "SHADOWFAX"].map((carrier) => (
              <span
                key={carrier}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-[#22242B] bg-slate-50/70 dark:bg-[#121316] text-[11px] font-mono font-semibold tracking-[0.14em] text-slate-700 dark:text-[#A0A5B2] hover:border-slate-300 dark:hover:border-[#38BDF8]/40 hover:text-slate-950 dark:hover:text-[#F4F5F7] transition-all shadow-2xs"
              >
                {carrier}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PLATFORM FEATURES (FULCRUM ALTERNATING ROWS WITH PARALLAX ZOOM) */}
      <section id="platform" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16 text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-sky-700 dark:text-[#38BDF8] bg-sky-500/10 border border-sky-500/20 dark:border-[#38BDF8]/30 mb-4">
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-[#F4F5F7] leading-[1.1] mb-4 [text-wrap:balance]">
            Built around how warehouses actually run
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-[#9BA3AF] leading-relaxed [text-wrap:balance]">
            Not a generic inventory spreadsheet with a new coat of paint: FlowStock is built for the floor, from receiving dock to outbound truck.
          </p>
        </div>

        {/* Feature Row 1: Inventory Ledger & Stock Levels */}
        <FeatureRow
          tag="Immutable Stock Ledger"
          title="Real-time stock valuation and automatic reorder thresholds"
          description="Every unit of inventory is tracked through an immutable financial-grade ledger. Gain instant visibility into days-on-hand, total valuation, and automated reorder points before shortages occur."
          bullets={[
            "Live inventory valuation and automated safety buffer calculations",
            "Itemized SKU tracking with instant ledger reconciliation",
            "Reorder-required alerts synchronized across warehouse depots"
          ]}
          panel={<InventoryPanel />}
          reverse={false}
        />

        {/* Feature Row 2: Products & SKU Catalog (Reversed) */}
        <FeatureRow
          tag="Catalog & SKU Master"
          title="Centralized product registry across all SKU variants"
          description="Manage tens of thousands of active SKUs with complete category breakdowns, unit pricing, and lifecycle tracking from introduction to clearance."
          bullets={[
            "Detailed product hierarchy with parent categories and SKU variants",
            "Real-time stock level monitoring with Active and Clearance states",
            "Rapid SKU lookup and bulk catalog management for high-volume catalogs"
          ]}
          panel={<ProductsPanel />}
          reverse={true}
        />

        {/* Feature Row 3: Executive Operations & Financial Velocity */}
        <FeatureRow
          tag="Operations & Financial Velocity"
          title="Live executive cockpit for revenue and order fulfillment"
          description="Bridge warehouse logistics with financial realization. Monitor invoiced revenue, receivables aging, total inventory capitalization, and active order books from a single unified pane."
          bullets={[
            "Real-time tracking of invoiced revenue and accounts receivable",
            "Interactive fulfillment curves and order velocity intelligence",
            "Integrated multi-tenant warehouse overview with double-entry precision"
          ]}
          panel={<OperationsPanel />}
          reverse={false}
        />
      </section>

      {/* 5. STATS BAND (LUXURY COCKPIT TELEMETRY) */}
      <section id="stats" className="py-16 sm:py-20 bg-[#090A0C] text-[#FFFBF4] border-y border-[#22242B] relative overflow-hidden">
        {/* Subtle Ambient Atmosphere */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/30 to-transparent" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[260px] pointer-events-none opacity-25"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.12), transparent 75%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#22242B]">
            <div className="py-4 sm:py-2 px-3 sm:px-6 text-center">
              <div className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F4F5F7] tracking-[-0.04em] font-mono tabular-nums">99.98%</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 font-mono uppercase tracking-[0.18em] font-semibold">Ledger Reconciliation Rate</div>
            </div>
            <div className="py-4 sm:py-2 px-3 sm:px-6 text-center">
              <div className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#38BDF8] tracking-[-0.04em] font-mono tabular-nums">14ms</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 font-mono uppercase tracking-[0.18em] font-semibold">Scan Settlement Latency</div>
            </div>
            <div className="py-4 sm:py-2 px-3 sm:px-6 text-center">
              <div className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F4F5F7] tracking-[-0.04em] font-mono tabular-nums">4.2M+</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 font-mono uppercase tracking-[0.18em] font-semibold">Stock Movements Verified</div>
            </div>
            <div className="py-4 sm:py-2 px-3 sm:px-6 text-center">
              <div className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#38BDF8] tracking-[-0.04em] font-mono tabular-nums">0.00%</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 font-mono uppercase tracking-[0.18em] font-semibold">Phantom Stock Drift</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHO WE ARE & WHAT WE SERVE */}
      <section id="who-we-are" className="py-28 border-t border-slate-200/80 dark:border-[#22242B] bg-white dark:bg-[#090A0C] transition-colors relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-sky-700 dark:text-[#38BDF8] bg-sky-500/10 border border-sky-500/20 dark:border-[#38BDF8]/30 mb-4">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-[#F4F5F7] leading-[1.1] [text-wrap:balance]">
              Engineered for high-volume inventory operators and distributed warehouses
            </h2>
            <p className="text-base text-slate-600 dark:text-[#A0A5B2] mt-4 leading-relaxed max-w-2xl mx-auto [text-wrap:balance]">
              Traditional inventory systems rely on mutable table counts that lead to desyncs, phantom stock, and manual audit nightmares. FlowStock solves this with an immutable financial-grade ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="capabilities">
            {/* Card 1 */}
            <div className="group relative p-6 rounded-2xl border border-slate-200/90 dark:border-[#22242B] bg-slate-50/50 hover:bg-white dark:bg-[#121316] dark:hover:bg-[#18191E] shadow-2xs hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] flex items-center justify-center text-slate-900 dark:text-white mb-5 shadow-2xs group-hover:border-[#38BDF8]/40 transition-colors">
                  <Boxes className="w-5 h-5 text-slate-800 dark:text-[#38BDF8]" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-950 dark:text-[#F4F5F7] mb-2 tracking-tight">Append-Only Stock Ledger</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0A5B2] leading-relaxed">
                  Every inbound delivery, outbound customer fulfillment, and warehouse transfer records an immutable transaction. Real-time on-hand stock is dynamically calculated with zero balance desyncs.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#22242B] text-[11px] text-slate-500 dark:text-[#808594] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8]" />
                <span>Mathematical Consistency & Zero Race Conditions</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-6 rounded-2xl border border-slate-200/90 dark:border-[#22242B] bg-slate-50/50 hover:bg-white dark:bg-[#121316] dark:hover:bg-[#18191E] shadow-2xs hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] flex items-center justify-center text-slate-900 dark:text-white mb-5 shadow-2xs group-hover:border-[#38BDF8]/40 transition-colors">
                  <Truck className="w-5 h-5 text-slate-800 dark:text-[#38BDF8]" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-950 dark:text-[#F4F5F7] mb-2 tracking-tight">Multi-Facility Logistics & Transfers</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0A5B2] leading-relaxed">
                  Route stock between distribution centers, manage consignment dispatches with nationwide carriers (Blue Dart, Delhivery, DTDC), and record live checkpoint timelines with full transit custody.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#22242B] text-[11px] text-slate-500 dark:text-[#808594] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8]" />
                <span>Automated Manifests & Multi-Warehouse Routing</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-6 rounded-2xl border border-slate-200/90 dark:border-[#22242B] bg-slate-50/50 hover:bg-white dark:bg-[#121316] dark:hover:bg-[#18191E] shadow-2xs hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] flex items-center justify-center text-slate-900 dark:text-white mb-5 shadow-2xs group-hover:border-[#38BDF8]/40 transition-colors">
                  <ReceiptText className="w-5 h-5 text-slate-800 dark:text-[#38BDF8]" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-950 dark:text-[#F4F5F7] mb-2 tracking-tight">B2B Sales & Automated Accounts</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0A5B2] leading-relaxed">
                  Reserve stock on order confirmation, issue GST-compliant tax invoices, track supplier procurement PO cycles, and monitor receivables aging with real-time financial velocity analytics.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#22242B] text-[11px] text-slate-500 dark:text-[#808594] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8]" />
                <span>Direct Order-to-Cash & Automated GST Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT HELPS: END-TO-END OPERATIONAL WORKFLOW */}
      <section id="workflow" className="py-28 border-t border-slate-200/80 dark:border-[#22242B] bg-slate-50/60 dark:bg-[#090A0C] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/90 dark:border-[#22242B] bg-white dark:bg-[#121316] text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-[#38BDF8] mb-4 shadow-2xs">
              <ArrowRight className="w-3 h-3 text-sky-600 dark:text-[#38BDF8]" />
              <span>OPERATIONAL PIPELINE</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-[#F4F5F7] leading-[1.1] [text-wrap:balance]">
              From Customer PO to Ledger Settlement
            </h2>
            <p className="text-base text-slate-600 dark:text-[#A0A5B2] mt-3 leading-relaxed [text-wrap:balance]">
              How FlowStock automates your entire supply chain without manual intervention or spreadsheets.
            </p>
          </div>

          <div className="relative">
            {/* Connector Line (hidden on mobile) */}
            <div className="hidden lg:block absolute top-8 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-gradient-to-r from-[#38BDF8]/40 via-slate-300/40 to-[#38BDF8]/40 dark:from-[#38BDF8]/30 dark:via-[#22242B] dark:to-[#38BDF8]/30" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: "01", label: "Intake", title: "Sales Order Intake", desc: "Orders created with customer tax info and catalog line-items. Automatic validation of catalog prices and tax rates." },
                { step: "02", label: "Allocation", title: "Stock Reservation", desc: "Confirming an order locks physical units in the warehouse ledger, preventing over-commitment across channels." },
                { step: "03", label: "Dispatch", title: "Carrier Manifest & AWB", desc: "Consignments dispatched with tracking codes, waypoint timelines, and automated transit status updates." },
                { step: "04", label: "Settlement", title: "Invoice & Ledger Post", desc: "GST invoices issued, revenue velocity calculated, and ledger movements finalized with full audit integrity." },
              ].map((s, i) => (
                <div key={i} className="group relative p-5 rounded-2xl border border-slate-200/90 dark:border-[#22242B] bg-white dark:bg-[#121316] dark:hover:bg-[#18191E] shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 dark:border-[#38BDF8]/30 flex items-center justify-center text-[11px] font-mono font-bold text-sky-600 dark:text-[#38BDF8]">{s.step}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-[#808594] uppercase tracking-[0.16em]">{s.label}</span>
                  </div>
                  <h4 className="font-display text-sm sm:text-base font-bold text-slate-950 dark:text-[#F4F5F7] mb-1.5 tracking-tight">{s.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-[#A0A5B2] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CALL TO ACTION BAND (FULCRUM-STYLE) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-sky-700 dark:text-[#38BDF8] bg-sky-500/10 border border-sky-500/20 dark:border-[#38BDF8]/30 mb-4">
          DEPLOYMENT READY
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-[#F4F5F7] mb-4 [text-wrap:balance]">
          See your warehouse on one screen
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-[#A0A5B2] max-w-xl mx-auto mb-8 leading-relaxed [text-wrap:balance]">
          Experience financial-grade stock accounting and rapid multi-carrier dispatch tailored to your actual operational facilities.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => openAuth("signup")}
            className="h-12 px-8 rounded-xl font-bold text-sm shadow-[0_2px_14px_rgba(56,189,248,0.25)]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToSection("hero")}
            className="h-12 px-7 rounded-xl font-medium text-sm border-slate-200 dark:border-[#22242B] dark:bg-[#121316] dark:hover:bg-[#18191E]"
          >
            <span>Back to Top</span>
          </Button>
        </div>
      </section>

      {/* 6. PRODUCTION ENTERPRISE FOOTER */}
      <footer className="py-10 border-t border-slate-200/80 dark:border-[#22242B] bg-white dark:bg-[#090A0C] text-xs text-slate-500 dark:text-[#808594] font-mono transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#121316] border border-slate-200/90 dark:border-[#22242B] shadow-2xs flex items-center justify-center p-1">
              <Logomark className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 dark:text-[#F4F5F7] block text-sm leading-none">
                FlowStock
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#808594] font-mono mt-0.5 block">
                © 2026 FlowStock Core. Production Multi-Tenant Platform.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-[#808594]">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="hover:text-slate-950 dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-300 dark:text-[#22242B]">•</span>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-slate-950 dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-[#22242B]">•</span>
            <span className="text-slate-500 dark:text-[#808594]">Double-Entry Append Ledger</span>
          </div>
        </div>
      </footer>

      {/* TERMS AND CONDITIONS MODAL */}
      <Modal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        maxWidth="2xl"
        className="bg-white dark:bg-[#121316] border border-slate-200 dark:border-[#22242B] text-slate-900 dark:text-[#F4F5F7] shadow-2xl"
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-[#22242B] flex items-center justify-between bg-slate-50 dark:bg-[#090A0C]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] flex items-center justify-center text-sky-600 dark:text-[#38BDF8] shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">Terms & Conditions of Service</h3>
                <p className="text-xs text-slate-500 dark:text-[#808594] font-mono mt-0.5">FlowStock Enterprise Master Services Agreement v1.1</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#22242B] hover:border-slate-300 dark:hover:border-[#38BDF8]/40 bg-white dark:bg-[#121316] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#808594] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-[#A0A5B2] leading-relaxed font-sans">
            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-sky-600 dark:text-[#38BDF8]">01.</span> Agreement & Platform Scope
              </h4>
              <p>
                By provisioning or accessing an organization workspace on the FlowStock platform, you agree to be bound by this Master Services Agreement. FlowStock provides multi-tenant warehouse management, stock reservation ledgers, and logistics dispatch orchestration APIs for commercial and enterprise entities.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">02.</span> Immutable Double-Entry Ledger System
              </h4>
              <p>
                FlowStock operates on an append-only double-entry bookkeeping architecture. Every stock receipt, customer order allocation, inter-facility transfer, and carrier dispatch creates an immutable transaction entry. Entries cannot be retrospectively deleted or mutated; corrections must be posted as offsetting adjustment transactions to preserve audit integrity.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">03.</span> Multi-Tenant Data Isolation & RLS Security
              </h4>
              <p>
                All workspace data is strictly segregated using PostgreSQL Row-Level Security (RLS) policies tied to unique tenant organization UUIDs. Under no circumstances can operators from one tenant access, inspect, or query database rows belonging to another organization.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">04.</span> Carrier Dispatches & Third-Party Integrations
              </h4>
              <p>
                FlowStock facilitates automated dispatch tracking and Air Waybill (AWB) generation with third-party logistics carriers (including Blue Dart, Delhivery, and DTDC). Transit timelines and delivery checkpoint telemetry are synchronized directly from carrier APIs and represent real-time custody handoffs.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">05.</span> Tax Compliance & Automated GST Invoicing
              </h4>
              <p>
                Invoices generated via the platform are structured according to Indian Goods and Services Tax (GST) statutes or regional value-added tax rules configured by your workspace administrators. Users are responsible for verifying accurate tax IDs and rate schedules.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">06.</span> Service Level Agreement (SLA) & Data Backups
              </h4>
              <p>
                FlowStock targets a 99.95% monthly uptime SLA for core ledger calculation endpoints and WebSocket telemetry channels. Automated encrypted snapshots are executed daily with point-in-time recovery capabilities.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">07.</span> Data Portability & Termination
              </h4>
              <p>
                You retain 100% ownership of your inventory data, SKU catalogs, and financial ledgers. Upon workspace termination, you have the right to execute a full export of all records in standard CSV and JSON formats prior to secure cryptographic sanitization.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-[#22242B] bg-slate-50 dark:bg-[#090A0C]/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#808594]">Last updated: September 2026</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setTermsOpen(false)}
              className="px-4 font-bold text-xs uppercase tracking-wider shadow-xs"
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        maxWidth="2xl"
        className="bg-white dark:bg-[#121316] border border-slate-200 dark:border-[#22242B] text-slate-900 dark:text-[#F4F5F7] shadow-2xl"
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-[#22242B] flex items-center justify-between bg-slate-50 dark:bg-[#090A0C]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] flex items-center justify-center text-sky-600 dark:text-[#38BDF8] shadow-2xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">Enterprise Privacy Policy</h3>
                <p className="text-xs text-slate-500 dark:text-[#808594] font-mono mt-0.5">Data Protection & Privacy Architecture</p>
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.90 }}
              onClick={() => setPrivacyOpen(false)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#22242B] hover:border-slate-300 dark:hover:border-[#38BDF8]/40 bg-white dark:bg-[#121316] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#808594] dark:hover:text-white transition-colors cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-[#A0A5B2] leading-relaxed font-sans">
            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-sky-600 dark:text-[#38BDF8]">01.</span> Information We Collect
              </h4>
              <p>
                FlowStock collects enterprise operational information strictly necessary to provide inventory and logistics management: organization profile details, operator credentials (name, email, role permissions), product SKU catalogs, bin locations, purchase orders, sales transactions, recipient consignment addresses, and immutable system audit logs.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">02.</span> Zero Third-Party Data Selling Commitment
              </h4>
              <p className="font-medium text-slate-950 dark:text-white">
                FlowStock does not sell, rent, monetize, or broker enterprise customer data or inventory volumes to any third party, marketing network, or data aggregator. Your stock counts, pricing lists, supplier terms, and customer orders remain strictly confidential.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">03.</span> Encryption in Transit & at Rest
              </h4>
              <p>
                All data transmission between your browser and FlowStock application servers is encrypted using modern Transport Layer Security (TLS 1.3). Database volumes, storage buckets, and automated backups are encrypted at rest using AES-256 military-grade encryption standards.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">04.</span> Authorized Logistics Disclosures
              </h4>
              <p>
                When you initiate a dispatch consignment, recipient address details and package weight metrics are transmitted securely to your selected carrier partner (e.g., Blue Dart, Delhivery, DTDC) exclusively to fulfill physical shipping and generate tracking AWBs.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">05.</span> Statutory Accounting Retention
              </h4>
              <p>
                Because FlowStock functions as a financial-grade double-entry inventory ledger, tax and transaction records are retained in compliance with applicable commercial law and GST statutory audit mandates (typically 7 years), after which they are securely purged according to automated lifecycle rules.
              </p>
            </section>

            <section>
              <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">06.</span> Operator Privacy Controls & Export Rights
              </h4>
              <p>
                Organization administrators have the right to request comprehensive data archives, update operator profiles, revoke user credentials, and request tenant de-provisioning at any time through our verified security portal.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-[#22242B] bg-slate-50 dark:bg-[#090A0C]/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#808594]">Compliance: SOC2 / ISO 27001 Ready</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setPrivacyOpen(false)}
              className="px-4 font-bold text-xs uppercase tracking-wider shadow-xs"
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      </Modal>

      </div>{/* end left scroll panel */}

      {/* ── RIGHT: Auth panel — true flex sibling, pushes content left ── */}
      <AnimatePresence>
        {authOpen && (
          <motion.div
            key="auth-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: authPanelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 36, mass: 0.85 }}
            className="shrink-0 h-full overflow-hidden border-l border-slate-200/80 dark:border-[#22242B] bg-white dark:bg-[#121316] shadow-[-16px_0_48px_rgba(0,0,0,0.14)] z-30"
          >
            {/* Inner container with dynamic width prevents content from squishing during animation */}
            <div
              className="h-full flex flex-col overflow-y-auto"
              style={{ width: authPanelWidth }}
            >
              <AuthDrawer
                mode={authMode}
                onModeChange={setAuthMode}
                onClose={closeAuth}
                onSuccess={() => { closeAuth(); navigate("/dashboard"); }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
