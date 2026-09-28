import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Logomark } from "@/components/ui/Logomark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/* ── High-Performance Responsive Feature Row ── */
function FeatureRow({
  tag,
  title,
  description,
  bullets,
  imgSrc,
  imgAlt,
  reverse = false,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center my-14 sm:my-20">
      {/* Media Column */}
      <div
        className={`rounded-2xl overflow-hidden border border-slate-200/90 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-md hover:shadow-xl transition-shadow p-1.5 sm:p-2 bg-gradient-to-b from-slate-100 to-white dark:from-[#33372B] dark:to-[#191B15] ${
          reverse ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#101020] relative aspect-[16/10]">
          <img
            src={imgSrc}
            alt={imgAlt}
            className="w-full h-full object-cover object-center hover:scale-[1.02] transition-transform duration-500 ease-out"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Text Column */}
      <div className={`space-y-4 text-left ${reverse ? "lg:order-1" : "lg:order-2"}`}>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#D8CFBC]/15 dark:bg-[#D8CFBC]/15 border border-[#D8CFBC]/40 dark:border-[#D8CFBC]/30 text-[#565449] dark:text-[#D8CFBC] text-[11px] font-mono font-medium tracking-tight">
          {tag}
        </div>

        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight [text-wrap:balance]">
          {title}
        </h3>

        <p className="text-base text-slate-600 dark:text-[#c2cbda] leading-relaxed [text-wrap:balance]">
          {description}
        </p>

        <ul className="space-y-3 pt-2">
          {bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-[#f0f3f8]">
              <span className="w-5 h-5 rounded-md bg-[#D8CFBC]/15 dark:bg-[#D8CFBC]/15 border border-[#D8CFBC]/30 dark:border-[#D8CFBC]/30 text-[#565449] dark:text-[#D8CFBC] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
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

export default function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -70;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFFBF4] dark:bg-[#11120D] text-[#11120D] dark:text-[#f0f3f8] font-sans selection:bg-[#D8CFBC] selection:text-[#11120D] relative transition-colors">
      
      {/* STATIC HIGH-PERFORMANCE BACKGROUND ACCENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px]" 
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(216,207,188,0.14), transparent 70%)',
          }} 
        />
        <div 
          className="absolute top-[35%] right-0 w-[500px] h-[500px]" 
          style={{
            background: 'radial-gradient(circle at 100% 50%, rgba(216,207,188,0.08), transparent 70%)',
          }} 
        />
        <div 
          className="absolute top-[65%] left-0 w-[500px] h-[500px]" 
          style={{
            background: 'radial-gradient(circle at 0% 50%, rgba(216,207,188,0.06), transparent 70%)',
          }} 
        />
      </div>

      {/* 1. FIXED TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#11120D]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#33372B] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-10 cursor-pointer">
            <img 
              src="/assets/flowstock-ambient.svg" 
              alt="FlowStock Logo" 
              className="w-10 h-10 hover:scale-105 transition-transform drop-shadow-md" 
            />
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
                FlowStock
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-widest text-slate-500 dark:text-[#D8CFBC] font-mono">
                Enterprise Core
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-600 dark:text-[#c2cbda] font-medium">
            <button
              type="button"
              onClick={() => scrollToSection("platform")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("capabilities")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("workflow")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Operational Flow
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("stats")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
                  variant="outline"
                  onClick={() => navigate("/login?mode=login")}
                  className="h-8 px-3 text-xs gap-1.5 border border-slate-200 dark:border-[#565449] hover:border-slate-300 dark:hover:border-[#B0B4BA] bg-white dark:bg-transparent text-slate-800 dark:text-white"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log In</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate("/login?mode=signup")}
                  className="h-8 px-3 text-xs gap-1.5 shadow-xs"
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
      <section id="hero" className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 bg-transparent">
        {/* Clean Ambient Atmosphere (No Image) */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] pointer-events-none opacity-80"
            style={{
              background: 'radial-gradient(ellipse 60% 45% at 50% 25%, rgba(216,207,188,0.18), rgba(216,207,188,0.06), transparent 70%)',
            }}
          />
        </div>

        {/* Hero Content Header */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-slate-300/80 dark:border-[#D8CFBC]/30 bg-white/70 dark:bg-[#191B15]/80 backdrop-blur-sm text-xs mb-6 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D8CFBC] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D8CFBC]" />
            </span>
            <span className="font-mono text-[11px] tracking-tight text-[#565449] dark:text-[#D8CFBC] font-semibold">HIGH-THROUGHPUT CORE</span>
            <span className="w-px h-3 bg-slate-300 dark:bg-[#33372B]" />
            <span className="text-[11px] text-slate-600 dark:text-[#c2cbda] font-mono hidden sm:inline">FINANCIAL-GRADE INVENTORY LEDGER</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-[-0.035em] leading-[1.06] mb-6 text-slate-950 dark:text-white [text-wrap:balance]">
            The financial-grade{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#11120D] via-[#565449] to-[#D8CFBC] dark:from-white dark:via-[#EBE5D8] dark:to-[#D8CFBC]">
              inventory ledger
            </span>{" "}
            for high-velocity warehouses
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-[#c2cbda] max-w-2xl leading-relaxed mb-10 font-normal [text-wrap:balance]">
            Zero-drift double-entry stock bookkeeping, real-time multi-carrier logistics orchestration, and automated GST tax invoices, engineered for physical supply chains.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate("/dashboard")}
                className="h-12 px-7 rounded-xl font-bold text-sm shadow-[0_2px_20px_rgba(216,207,188,0.35)]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => navigate("/login?mode=signup")}
                  className="h-12 px-7 rounded-xl font-bold text-sm shadow-[0_2px_20px_rgba(216,207,188,0.35)]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("platform")}
                  className="h-12 px-7 rounded-xl font-medium text-sm"
                >
                  <span>Explore Platform</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. LOGISTICS CARRIER LOGO STRIP (FULCRUM-STYLE) */}
      <section className="py-10 border-y border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] transition-colors relative z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-mono font-medium text-slate-500 dark:text-[#D8CFBC] mb-5 tracking-wider uppercase">
            Integrated Logistics Networks & Multi-Node Carrier Mesh
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-14 font-mono font-bold text-sm tracking-wider text-slate-600 dark:text-slate-300 opacity-75">
            <span className="hover:text-slate-950 dark:hover:text-[#D8CFBC] transition-colors">BLUE DART</span>
            <span className="hover:text-slate-950 dark:hover:text-[#D8CFBC] transition-colors">DELHIVERY</span>
            <span className="hover:text-slate-950 dark:hover:text-[#D8CFBC] transition-colors">DTDC</span>
            <span className="hover:text-slate-950 dark:hover:text-[#D8CFBC] transition-colors">FEDEX</span>
            <span className="hover:text-slate-950 dark:hover:text-[#D8CFBC] transition-colors">SHADOWFAX</span>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM FEATURES (FULCRUM ALTERNATING ROWS WITH PARALLAX ZOOM) */}
      <section id="platform" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16 text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight mb-4 [text-wrap:balance]">
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
          imgSrc="/assets/flowstock-inventory.jpeg"
          imgAlt="FlowStock Inventory Ledger and Real-Time Stock Valuation Console"
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
          imgSrc="/assets/flowstock-products.jpeg"
          imgAlt="FlowStock Products and SKU Variants Management Console"
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
          imgSrc="/assets/flowstock-operations.jpeg"
          imgAlt="FlowStock Executive Operations and Warehouse Management Dashboard"
          reverse={false}
        />
      </section>

      {/* 5. STATS BAND (FULCRUM-STYLE) */}
      <section id="stats" className="py-20 bg-slate-900 dark:bg-[#191B15] text-white border-y border-slate-800 dark:border-[#33372B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono tabular-nums">99.98%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">Ledger Reconciliation Rate</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#D8CFBC] tracking-tight font-mono tabular-nums">14ms</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">Scan Settlement Latency</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono tabular-nums">4.2M+</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">Stock Movements Verified</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#D8CFBC] tracking-tight font-mono tabular-nums">0.00%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">Phantom Stock Drift</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHO WE ARE & WHAT WE SERVE */}
      <section id="who-we-are" className="py-28 border-t border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#11120D] transition-colors relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white [text-wrap:balance]">
              Engineered for high-volume inventory operators and distributed warehouses
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#9BA3AF] mt-4 leading-relaxed max-w-2xl mx-auto [text-wrap:balance]">
              Traditional inventory systems rely on mutable table counts that lead to desyncs, phantom stock, and manual audit nightmares. FlowStock solves this with an immutable financial-grade ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="capabilities">
            {/* Card 1 */}
            <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-[#33372B] bg-slate-50/50 hover:bg-white dark:bg-[#191B15]/70 dark:hover:bg-[#23261E] shadow-xs hover:shadow-lg transition-all overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500 dark:via-[#D8CFBC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-900 dark:text-white mb-5 shadow-2xs">
                  <Boxes className="w-5 h-5 text-slate-800 dark:text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Append-Only Stock Ledger</h3>
                <p className="text-xs text-slate-600 dark:text-[#9BA3AF] leading-relaxed">
                  Every inbound delivery, outbound customer fulfillment, and warehouse transfer records an immutable transaction. Real-time on-hand stock is dynamically calculated with zero balance desyncs.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#33372B] text-[11px] text-slate-500 dark:text-[#D8CFBC] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#D8CFBC]" />
                <span>Mathematical Consistency & Zero Race Conditions</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-[#33372B] bg-slate-50/50 hover:bg-white dark:bg-[#191B15]/70 dark:hover:bg-[#23261E] shadow-xs hover:shadow-lg transition-all overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500 dark:via-[#D8CFBC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-900 dark:text-white mb-5 shadow-2xs">
                  <Truck className="w-5 h-5 text-slate-800 dark:text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Multi-Facility Logistics & Transfers</h3>
                <p className="text-xs text-slate-600 dark:text-[#9BA3AF] leading-relaxed">
                  Route stock between distribution centers, manage consignment dispatches with nationwide carriers (Blue Dart, Delhivery, DTDC), and record live checkpoint timelines with full transit custody.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#33372B] text-[11px] text-slate-500 dark:text-[#D8CFBC] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#D8CFBC]" />
                <span>Automated Manifests & Multi-Warehouse Routing</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-[#33372B] bg-slate-50/50 hover:bg-white dark:bg-[#191B15]/70 dark:hover:bg-[#23261E] shadow-xs hover:shadow-lg transition-all overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500 dark:via-[#D8CFBC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-900 dark:text-white mb-5 shadow-2xs">
                  <ReceiptText className="w-5 h-5 text-slate-800 dark:text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">B2B Sales & Automated Accounts</h3>
                <p className="text-xs text-slate-600 dark:text-[#9BA3AF] leading-relaxed">
                  Reserve stock on order confirmation, issue GST-compliant tax invoices, track supplier procurement PO cycles, and monitor receivables aging with real-time financial velocity analytics.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#33372B] text-[11px] text-slate-500 dark:text-[#D8CFBC] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#D8CFBC]" />
                <span>Direct Order-to-Cash & Automated GST Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT HELPS: END-TO-END OPERATIONAL WORKFLOW */}
      <section id="workflow" className="py-28 border-t border-slate-200 dark:border-[#33372B] bg-slate-50 dark:bg-[#11120D] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-slate-200/90 dark:border-[#33372B] bg-white dark:bg-[#191B15] text-[11px] font-mono font-medium tracking-tight text-slate-600 dark:text-[#D8CFBC] mb-4 shadow-2xs">
              <ArrowRight className="w-3 h-3 text-[#D8CFBC]" />
              <span>OPERATIONAL PIPELINE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white [text-wrap:balance]">
              From Customer PO to Ledger Settlement
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#9BA3AF] mt-3 [text-wrap:balance]">
              How FlowStock automates your entire supply chain without manual intervention or spreadsheets.
            </p>
          </div>

          <div className="relative">
            {/* Connector Line (hidden on mobile) */}
            <div className="hidden lg:block absolute top-8 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-gradient-to-r from-[#D8CFBC]/40 via-[#565449]/20 to-[#D8CFBC]/40 dark:from-[#D8CFBC]/40 dark:via-[#D8CFBC]/15 dark:to-[#D8CFBC]/40" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: "01", label: "Intake", title: "Sales Order Intake", desc: "Orders created with customer tax info and catalog line-items. Automatic validation of catalog prices and tax rates." },
                { step: "02", label: "Allocation", title: "Stock Reservation", desc: "Confirming an order locks physical units in the warehouse ledger, preventing over-commitment across channels." },
                { step: "03", label: "Dispatch", title: "Carrier Manifest & AWB", desc: "Consignments dispatched with tracking codes, waypoint timelines, and automated transit status updates." },
                { step: "04", label: "Settlement", title: "Invoice & Ledger Post", desc: "GST invoices issued, revenue velocity calculated, and ledger movements finalized with full audit integrity." },
              ].map((s, i) => (
                <div key={i} className="group relative p-5 rounded-xl border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15]/80 dark:hover:bg-[#23261E] shadow-xs hover:shadow-lg transition-all overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500 dark:via-[#D8CFBC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-[#D8CFBC]/15 dark:bg-[#D8CFBC]/15 border border-[#D8CFBC]/30 dark:border-[#D8CFBC]/30 flex items-center justify-center text-[11px] font-mono font-bold text-[#565449] dark:text-[#D8CFBC]">{s.step}</span>
                    <span className="text-[11px] font-mono font-semibold text-[#565449] dark:text-[#D8CFBC] uppercase tracking-wider">{s.label}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">{s.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-[#9BA3AF] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CALL TO ACTION BAND (FULCRUM-STYLE) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-4 [text-wrap:balance]">
          See your warehouse on one screen
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-[#9BA3AF] max-w-xl mx-auto mb-8 leading-relaxed [text-wrap:balance]">
          Experience financial-grade stock accounting and rapid multi-carrier dispatch tailored to your actual operational facilities.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate("/login?mode=signup")}
            className="h-12 px-8 rounded-xl font-bold text-sm shadow-[0_2px_20px_rgba(216,207,188,0.35)]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToSection("hero")}
            className="h-12 px-7 rounded-xl font-medium text-sm"
          >
            <span>Back to Top</span>
          </Button>
        </div>
      </section>

      {/* 6. PRODUCTION ENTERPRISE FOOTER */}
      <footer className="py-10 border-t border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#11120D] text-xs text-slate-500 dark:text-[#D8CFBC] font-mono transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] flex items-center justify-center p-1">
              <Logomark className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block font-sans text-sm leading-none">
                FlowStock
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#9BA3AF] font-mono mt-0.5 block">
                © 2026 FlowStock Core. Production Multi-Tenant Platform.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-[#9BA3AF]">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-[#D8CFBC] transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-300 dark:text-[#33372B]">•</span>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-[#D8CFBC] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-[#33372B]">•</span>
            <span className="text-slate-500 dark:text-[#D8CFBC]">Double-Entry Append Ledger</span>
          </div>
        </div>
      </footer>

      {/* TERMS AND CONDITIONS MODAL */}
      <Modal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        maxWidth="2xl"
        className="bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] text-slate-900 dark:text-white shadow-xl"
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-[#33372B] flex items-center justify-between bg-slate-50 dark:bg-[#11120D]/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-[#565449] dark:text-[#D8CFBC] shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Terms & Conditions of Service</h3>
                <p className="text-xs text-slate-500 dark:text-[#D8CFBC] font-mono mt-0.5">FlowStock Enterprise Master Services Agreement v1.1</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#33372B] hover:border-slate-300 dark:hover:border-[#D8CFBC] bg-white dark:bg-[#191B15] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#D8CFBC] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-[#9BA3AF] leading-relaxed font-sans">
            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#565449] dark:text-[#D8CFBC]">01.</span> Agreement & Platform Scope
              </h4>
              <p>
                By provisioning or accessing an organization workspace on the FlowStock platform, you agree to be bound by this Master Services Agreement. FlowStock provides multi-tenant warehouse management, stock reservation ledgers, and logistics dispatch orchestration APIs for commercial and enterprise entities.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[#565449] dark:text-[#D8CFBC]">02.</span> Immutable Double-Entry Ledger System
              </h4>
              <p>
                FlowStock operates on an append-only double-entry bookkeeping architecture. Every stock receipt, customer order allocation, inter-facility transfer, and carrier dispatch creates an immutable transaction entry. Entries cannot be retrospectively deleted or mutated; corrections must be posted as offsetting adjustment transactions to preserve audit integrity.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[#565449] dark:text-[#D8CFBC]">03.</span> Multi-Tenant Data Isolation & RLS Security
              </h4>
              <p>
                All workspace data is strictly segregated using PostgreSQL Row-Level Security (RLS) policies tied to unique tenant organization UUIDs. Under no circumstances can operators from one tenant access, inspect, or query database rows belonging to another organization.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[#565449] dark:text-[#D8CFBC]">04.</span> Carrier Dispatches & Third-Party Integrations
              </h4>
              <p>
                FlowStock facilitates automated dispatch tracking and Air Waybill (AWB) generation with third-party logistics carriers (including Blue Dart, Delhivery, and DTDC). Transit timelines and delivery checkpoint telemetry are synchronized directly from carrier APIs and represent real-time custody handoffs.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[#565449] dark:text-[#D8CFBC]">05.</span> Tax Compliance & Automated GST Invoicing
              </h4>
              <p>
                Invoices generated via the platform are structured according to Indian Goods and Services Tax (GST) statutes or regional value-added tax rules configured by your workspace administrators. Users are responsible for verifying accurate tax IDs and rate schedules.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[#565449] dark:text-[#D8CFBC]">06.</span> Service Level Agreement (SLA) & Data Backups
              </h4>
              <p>
                FlowStock targets a 99.95% monthly uptime SLA for core ledger calculation endpoints and WebSocket telemetry channels. Automated encrypted snapshots are executed daily with point-in-time recovery capabilities.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[#565449] dark:text-[#D8CFBC]">07.</span> Data Portability & Termination
              </h4>
              <p>
                You retain 100% ownership of your inventory data, SKU catalogs, and financial ledgers. Upon workspace termination, you have the right to execute a full export of all records in standard CSV and JSON formats prior to secure cryptographic sanitization.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-[#33372B] bg-slate-50 dark:bg-[#11120D]/50 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#D8CFBC]">Last updated: September 2026</span>
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
        className="bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] text-slate-900 dark:text-white shadow-xl"
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-[#33372B] flex items-center justify-between bg-slate-50 dark:bg-[#11120D]/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-teal-700 dark:text-[#D8CFBC] shadow-2xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Privacy Policy</h3>
                <p className="text-xs text-slate-500 dark:text-[#D8CFBC] font-mono mt-0.5">Data Protection & Privacy Architecture</p>
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.90 }}
              onClick={() => setPrivacyOpen(false)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#33372B] hover:border-slate-300 dark:hover:border-[#D8CFBC] bg-white dark:bg-[#191B15] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#D8CFBC] dark:hover:text-white transition-colors cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC]"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-[#9BA3AF] leading-relaxed font-sans">
            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-teal-700 dark:text-[#D8CFBC]">01.</span> Information We Collect
              </h4>
              <p>
                FlowStock collects enterprise operational information strictly necessary to provide inventory and logistics management: organization profile details, operator credentials (name, email, role permissions), product SKU catalogs, bin locations, purchase orders, sales transactions, recipient consignment addresses, and immutable system audit logs.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-teal-700 dark:text-[#D8CFBC]">02.</span> Zero Third-Party Data Selling Commitment
              </h4>
              <p className="font-medium text-slate-900 dark:text-white">
                FlowStock does not sell, rent, monetize, or broker enterprise customer data or inventory volumes to any third party, marketing network, or data aggregator. Your stock counts, pricing lists, supplier terms, and customer orders remain strictly confidential.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-teal-700 dark:text-[#D8CFBC]">03.</span> Encryption in Transit & at Rest
              </h4>
              <p>
                All data transmission between your browser and FlowStock application servers is encrypted using modern Transport Layer Security (TLS 1.3). Database volumes, storage buckets, and automated backups are encrypted at rest using AES-256 military-grade encryption standards.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-teal-700 dark:text-[#D8CFBC]">04.</span> Authorized Logistics Disclosures
              </h4>
              <p>
                When you initiate a dispatch consignment, recipient address details and package weight metrics are transmitted securely to your selected carrier partner (e.g., Blue Dart, Delhivery, DTDC) exclusively to fulfill physical shipping and generate tracking AWBs.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-teal-700 dark:text-[#D8CFBC]">05.</span> Statutory Accounting Retention
              </h4>
              <p>
                Because FlowStock functions as a financial-grade double-entry inventory ledger, tax and transaction records are retained in compliance with applicable commercial law and GST statutory audit mandates (typically 7 years), after which they are securely purged according to automated lifecycle rules.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="font-mono text-teal-700 dark:text-[#D8CFBC]">06.</span> Operator Privacy Controls & Export Rights
              </h4>
              <p>
                Organization administrators have the right to request comprehensive data archives, update operator profiles, revoke user credentials, and request tenant de-provisioning at any time through our verified security portal.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-[#33372B] bg-slate-50 dark:bg-[#11120D]/50 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#D8CFBC]">Compliance: SOC2 / ISO 27001 Ready</span>
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
    </div>
  );
}
