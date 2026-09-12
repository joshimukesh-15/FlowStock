"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  Building2,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Zap,
  ChevronRight,
  Plus,
  Boxes,
  Truck,
  ReceiptText,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowDown,
  Clock,
  History,
  Check,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useReducedMotion, DURATION, EASING } from "@/motion";

const ROUTE_LABELS = {
  "/dashboard": "Overview Cockpit",
  "/products": "Products & SKUs",
  "/inventory": "Inventory Ledger",
  "/warehouses": "Warehouses & Transfers",
  "/orders": "Sales Orders",
  "/purchasing": "Suppliers & Purchasing",
  "/shipments": "Shipments & Logistics",
  "/invoices": "Invoices & Accounts",
  "/audit": "Audit Trails",
  "/settings": "Settings",
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { organizations, currentOrg, currentUser, switchOrganization, createOrganization } = useTenant();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgCurrency, setNewOrgCurrency] = useState("INR");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const storedRoute = typeof window !== "undefined" ? sessionStorage.getItem("flowstock_last_route") : null;
  const returnRoute = location.state?.from || (storedRoute && storedRoute !== "/" && storedRoute !== "/welcome" ? storedRoute : "/dashboard");
  const isFromTask = returnRoute && returnRoute !== "/dashboard" && returnRoute !== "/" && returnRoute !== "/welcome";
  const returnLabel = ROUTE_LABELS[returnRoute] || "Workspace";

  // ESC returns immediately to current active task if coming from inside the app
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !createModalOpen && returnRoute) {
        navigate(returnRoute);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createModalOpen, returnRoute, navigate]);

  const handleSelectOrg = (orgId) => {
    switchOrganization(orgId);
    navigate(returnRoute);
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName || !newOrgSlug) return;
    setCreating(true);
    setCreateError("");
    try {
      await createOrganization(newOrgName, newOrgSlug, newOrgCurrency);
      setCreateModalOpen(false);
      navigate(returnRoute);
    } catch (err) {
      setCreateError(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: EASING.standard },
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white relative overflow-x-hidden">
      {/* AMBIENT RADIAL BACKGROUND ACCENTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-zinc-800/25 via-zinc-900/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[1200px] left-1/4 -translate-x-1/2 w-[600px] h-[400px] bg-zinc-800/15 blur-3xl pointer-events-none -z-10" />

      {/* 1. STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
              <Package className="w-4 h-4 text-black" strokeWidth={2.4} />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-none">
                FlowStock
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-widest text-zinc-400 font-mono">
                Enterprise Core
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <button
              onClick={() => scrollToSection("who-we-are")}
              className="hover:text-white transition-colors"
            >
              Who We Are
            </button>
            <button
              onClick={() => scrollToSection("capabilities")}
              className="hover:text-white transition-colors"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection("workflow")}
              className="hover:text-white transition-colors"
            >
              Operational Flow
            </button>
            <button
              onClick={() => scrollToSection("workspaces")}
              className="hover:text-white transition-colors"
            >
              Workspaces ({organizations.length})
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            {isFromTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(returnRoute)}
                className="h-8 text-xs gap-1.5 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Return to Task</span>
                <kbd className="text-[10px] bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-400 border border-zinc-700">
                  ESC
                </kbd>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => navigate(returnRoute)}
              className="h-8 text-xs gap-1.5 bg-white hover:bg-zinc-200 text-black font-semibold shadow-sm"
            >
              <span>{isFromTask ? "Resume Cockpit" : "Launch Cockpit"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariant}
          className="flex flex-col items-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-400">FlowStock Platform v1.1.0</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-300 font-medium">Enterprise Core Edition</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            High-velocity inventory & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">
              operations ledger.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed mb-8 font-normal">
            Zero-latency double-entry stock bookkeeping, automated procurement lifecycles, and logistics orchestration engineered for mission-critical B2B supply chains.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Button
              size="lg"
              onClick={() => scrollToSection("workspaces")}
              className="h-11 px-6 bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wide shadow-lg gap-2"
            >
              <span>Get Started</span>
              <ArrowDown className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(returnRoute)}
              className="h-11 px-6 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs font-medium tracking-wide gap-2"
            >
              <span>{isFromTask ? `Resume ${returnLabel}` : "Enter Live Cockpit"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* TELEMETRY MOCK PREVIEW CARD */}
          <div className="w-full max-w-5xl rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6 backdrop-blur-xl shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 text-left">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs text-zinc-500 font-mono ml-2">flowstock://cockpit-telemetry</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>LEDGER_SYNCHRONIZED</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 text-left">
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Bookkeeping Mode</p>
                <p className="text-base font-bold text-white mt-1">Double-Entry Append</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Strict Audit Preservation</p>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Multi-Tenant Boundary</p>
                <p className="text-base font-bold text-white mt-1">RLS Isolated Schema</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{organizations.length} Active Organizations</p>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Dispatch Logistics</p>
                <p className="text-base font-bold text-white mt-1">Multi-Carrier Live</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">AWB Manifest Tracking</p>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">WebSocket Engine</p>
                <p className="text-base font-bold text-white mt-1">Sub-15ms Real-Time</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Active Channel Connected</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. WHO WE ARE & WHAT WE SERVE */}
      <section id="who-we-are" className="py-24 border-t border-zinc-900 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 font-mono mb-2">
              Who We Are & What We Serve
            </h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Engineered for high-volume inventory operators and distributed warehouses.
            </p>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
              Traditional inventory systems rely on mutable table counts that lead to desyncs, phantom stock, and manual audit nightmares. FlowStock solves this with an immutable financial-grade ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="capabilities">
            {/* Card 1 */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-5 shadow-xs">
                  <Boxes className="w-5 h-5 text-zinc-200" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Append-Only Stock Ledger</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every inbound delivery, outbound customer fulfillment, and warehouse transfer records an immutable transaction. Real-time on-hand stock is dynamically calculated with zero balance desyncs.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-zinc-800/70 text-[11px] text-zinc-500 font-mono">
                ✓ Mathematical Consistency & Zero Race Conditions
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-5 shadow-xs">
                  <Truck className="w-5 h-5 text-zinc-200" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Multi-Facility Logistics & Transfers</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Route stock between distribution centers, manage consignment dispatches with nationwide carriers (Blue Dart, Delhivery, DTDC), and record live checkpoint timelines with full transit custody.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-zinc-800/70 text-[11px] text-zinc-500 font-mono">
                ✓ Automated Manifests & Multi-Warehouse Routing
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-5 shadow-xs">
                  <ReceiptText className="w-5 h-5 text-zinc-200" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">B2B Sales & Automated Accounts</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Reserve stock on order confirmation, issue GST-compliant tax invoices, track supplier procurement PO cycles, and monitor receivables aging with real-time financial velocity analytics.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-zinc-800/70 text-[11px] text-zinc-500 font-mono">
                ✓ Seamless Order-to-Cash & Automated GST Invoicing
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT HELPS: END-TO-END OPERATIONAL WORKFLOW */}
      <section id="workflow" className="py-24 border-t border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 font-mono mb-2">
              The Operational Pipeline
            </h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              From Customer PO to Ledger Settlement
            </p>
            <p className="text-sm text-zinc-400 mt-3">
              How FlowStock automates your entire supply chain without manual intervention or spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 relative">
              <div className="text-xs font-mono font-bold text-zinc-500 mb-2">01 / CAPTURE</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Sales Order Intake</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Orders created with customer tax info and catalog line-items. Automatic validation of catalog prices and tax rates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 relative">
              <div className="text-xs font-mono font-bold text-zinc-500 mb-2">02 / ALLOCATION</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Stock Reservation</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Confirming an order locks physical units in the warehouse ledger, preventing over-commitment across channels.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 relative">
              <div className="text-xs font-mono font-bold text-zinc-500 mb-2">03 / DISPATCH</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Carrier Manifest & AWB</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Consignments dispatched with tracking codes, waypoint timelines, and automated transit status updates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 relative">
              <div className="text-xs font-mono font-bold text-zinc-500 mb-2">04 / SETTLEMENT</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Invoice & Ledger Post</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                GST invoices issued, revenue velocity calculated, and ledger movements finalized with full audit integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WORKSPACE SELECTOR SECTION */}
      <section id="workspaces" className="py-24 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 font-mono mb-2">
              Select Your Environment
            </h2>
            <p className="text-3xl font-bold tracking-tight text-white">
              Choose Workspace or Provision Ledger
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              Each workspace operates with its own isolated ledger, multi-currency settings, and warehouse nodes.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
            {/* Operator Identifier */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser?.name?.slice(0, 2).toUpperCase() || "AD"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {currentUser?.name || "Enterprise Operator"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono capitalize">
                    Role: {currentUser?.role?.replace("_", " ") || "Administrator"} · Verified Session
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Session
              </span>
            </div>

            {/* Organizations Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  Available Tenants ({organizations.length})
                </p>
                <span className="text-[11px] text-zinc-500 font-mono">1-Click Launch</span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {organizations.map((org) => {
                  const isSelected = org.id === currentOrg?.id;
                  return (
                    <div
                      key={org.id}
                      onClick={() => handleSelectOrg(org.id)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? "border-white/60 bg-zinc-900/80 shadow-sm"
                          : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-white text-black border-transparent"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800"
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-white truncate">
                              {org.name}
                            </p>
                            {isSelected && (
                              <Badge variant="success" className="text-[9px] py-0 px-1.5">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {org.slug} · Currency: {org.currency}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-white font-medium shrink-0">
                        <span>Launch</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Provisioning Button */}
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(true)}
              className="w-full h-10 gap-2 font-medium text-xs justify-center border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300"
            >
              <Plus className="w-4 h-4" />
              Provision New Organization
            </Button>
          </div>
        </div>
      </section>

      {/* 6. FINAL HIGH-IMPACT "GET STARTED" CTA */}
      <section id="get-started" className="py-24 border-t border-zinc-900 bg-gradient-to-b from-zinc-950 to-zinc-900/60 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl mb-6">
            <Sparkles className="w-6 h-6 text-black" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Ready to orchestrate your enterprise inventory?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed mb-8">
            Launch into the live operations cockpit now. Full multi-tenant isolation, real-time WebSocket telemetry, and automated GST ledger accounting are ready.
          </p>

          <Button
            size="lg"
            onClick={() => navigate(returnRoute)}
            className="h-12 px-8 bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-wide shadow-xl gap-2.5 rounded-xl transition-all"
          >
            <span>{isFromTask ? `Get Started & Resume ${returnLabel}` : "Get Started & Enter Operations Cockpit"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* 7. MINIMALIST FOOTER */}
      <footer className="py-8 border-t border-zinc-900 text-center text-xs text-zinc-400 font-mono flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-zinc-400" />
          <span>FlowStock Enterprise Core · Production Multi-Tenant Platform</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Double-Entry Bookkeeping</span>
          <span>FastAPI + Pure React</span>
        </div>
      </footer>

      {/* PROVISION NEW ORGANIZATION MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New Organization"
        description="Initialize an isolated enterprise ledger and facility workspace."
      >
        <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs pt-1">
          {createError && (
            <p className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2 rounded text-xs">
              {createError}
            </p>
          )}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Organization Name</label>
            <Input
              placeholder="e.g. Apex Global Logistics Pvt Ltd"
              value={newOrgName}
              onChange={(e) => {
                setNewOrgName(e.target.value);
                if (!newOrgSlug) {
                  setNewOrgSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                  );
                }
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Identifier Slug</label>
            <Input
              placeholder="e.g. apex-global"
              value={newOrgSlug}
              onChange={(e) => setNewOrgSlug(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Base Currency</label>
            <select
              value={newOrgCurrency}
              onChange={(e) => setNewOrgCurrency(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={creating}
            >
              {creating ? "Provisioning..." : "Provision Organization"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
