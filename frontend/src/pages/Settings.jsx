"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ShieldCheck, Building2, Users, User as UserIcon, Plus, X, AlertCircle, Globe, RefreshCw, Database, Zap, Gauge, Bell, Rows3, BadgeCheck, Sun, Moon, Monitor, } from "lucide-react";
import { fetchHealth, createOrgUserApi } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { createStaggerContainer, slideUpVariants, useReducedMotion } from "@/motion";
const ROLE_OPTIONS = [
    { value: "admin", label: "Admin", description: "Full administrative access, provisioning & settlement" },
    { value: "warehouse_manager", label: "Warehouse Manager", description: "Ledger adjustments, transfers, receiving, fulfillment" },
    { value: "sales_rep", label: "Sales Rep", description: "Customers, order drafting, confirmation & invoicing" },
    { value: "viewer", label: "Viewer", description: "Read-only inspection across all cockpit views" },
];
const roleBadgeClass = (role) => {
    switch (role) {
        case "admin":
            return "bg-[#D8CFBC]/15 text-slate-800 dark:text-[#D8CFBC] border-slate-300 dark:border-[#D8CFBC]/30 font-semibold";
        case "warehouse_manager":
            return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40 font-medium";
        case "sales_rep":
            return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 font-medium";
        default:
            return "bg-slate-50 dark:bg-[#14171F] text-slate-600 dark:text-[#9BA3AF] border-slate-200 dark:border-[#323744] font-medium";
    }
};
export default function SettingsPage() {
    const { currentOrg, currentUser, loading, refreshOrganizations } = useTenant();
    const { theme, setTheme } = useTheme();
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = createStaggerContainer(0.06, 0, prefersReducedMotion);
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const isAdmin = currentUser?.role === "admin";
    const [activeTab, setActiveTab] = useState("workspace");
    const SETTINGS_TABS = [
        { id: "workspace", label: "Workspace & Team", icon: Building2 },
        { id: "preferences", label: "Preferences", icon: Rows3 },
        { id: "system", label: "System Diagnostics", icon: Gauge },
    ];
    const [provisionOpen, setProvisionOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("warehouse_manager");
    const [provisionError, setProvisionError] = useState("");
    const [provisioning, setProvisioning] = useState(false);
    const [provisionSuccess, setProvisionSuccess] = useState(false);
    const [denseTables, setDenseTables] = useState(() => typeof window !== "undefined" ? localStorage.getItem("flowstock_dense_tables") === "on" : false);
    const [liveToasts, setLiveToasts] = useState(() => typeof window !== "undefined" ? localStorage.getItem("flowstock_live_toasts") !== "off" : true);
    const [health, setHealth] = useState(null);
    const [checkingHealth, setCheckingHealth] = useState(false);
    const loadHealth = async () => {
        setCheckingHealth(true);
        try {
            const res = await fetchHealth();
            setHealth(res);
        }
        finally {
            setCheckingHealth(false);
        }
    };
    useEffect(() => {
        loadHealth();
    }, []);
    useEffect(() => {
        document.documentElement.classList.toggle("tables-dense", denseTables);
        localStorage.setItem("flowstock_dense_tables", denseTables ? "on" : "off");
    }, [denseTables]);
    const toggleLiveToasts = () => {
        const next = !liveToasts;
        setLiveToasts(next);
        localStorage.setItem("flowstock_live_toasts", next ? "on" : "off");
    };
    const handleProvision = async (e) => {
        e.preventDefault();
        if (!currentOrg)
            return;
        setProvisionError("");
        setProvisionSuccess(false);
        setProvisioning(true);
        try {
            await createOrgUserApi(currentOrg.id, {
                name: userName.trim(),
                email: userEmail.trim().toLowerCase(),
                role: userRole,
            });
            await refreshOrganizations();
            setProvisionSuccess(true);
            setUserName("");
            setUserEmail("");
            setUserRole("warehouse_manager");
            setTimeout(() => setProvisionOpen(false), 1200);
        }
        catch (err) {
            setProvisionError(err.message || "Failed to provision user");
            setProvisionSuccess(false);
        }
        finally {
            setProvisioning(false);
        }
    };
    const healthStatus = health?.status === "healthy"
        ? { label: "Operational", cls: "success" }
        : health?.status === "degraded"
            ? { label: "Degraded", cls: "warning" }
            : { label: "Unreachable", cls: "danger" };
    const Switch = ({ checked, onChange, label }) => (<button role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer active:scale-95 ${checked ? "bg-[#D8CFBC]" : "bg-slate-200 dark:bg-[#323744]"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${checked ? "translate-x-[22px] bg-[#11120D]" : "translate-x-[3px] bg-white dark:bg-zinc-400"}`}/>
    </button>);

    if (loading && !currentOrg) {
      return <PageSkeleton hasKpis={false} tableRows={5} />;
    }

    return (<motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page header */}
      <PageHeader title={<span className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-slate-900 dark:text-[#F4F5F7]"/>
            Settings & Administration
          </span>} subtitle="Tenant profile, team access roles, workspace preferences, and system diagnostics." actions={<Badge variant="default" className="w-fit px-2.5 py-1">
            <Globe className="w-3 h-3 mr-1"/>
            {currentOrg?.slug || "tenant"} · {currentOrg?.currency || "INR"}
          </Badge>}/>

      {/* Settings Navigation Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* WORKSPACE & TEAM TAB */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* ORGANIZATION PROFILE */}
          <motion.div variants={itemVariants}>
        <Card spotlight={true}>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="w-4 h-4 text-slate-600 dark:text-[#9BA3AF]"/>
              Organization Profile
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
              Active workspace tenant identity with row-level backend isolation.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/70 dark:bg-[#14171F]/70">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold">Name</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] mt-1 truncate" title={currentOrg?.name}>
                {currentOrg?.name || "—"}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/70 dark:bg-[#14171F]/70">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold">Slug</p>
              <p className="text-sm font-mono font-semibold text-slate-900 dark:text-[#D8CFBC] mt-1">{currentOrg?.slug || "—"}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/70 dark:bg-[#14171F]/70">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold">Base Currency</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] mt-1">
                {currentOrg?.currency || "INR"} <span className="text-slate-400 dark:text-[#7C8189] font-normal">(Native)</span>
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/70 dark:bg-[#14171F]/70">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold">Team Members</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] mt-1">{currentOrg?.users?.length || 0} active</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* TEAM & ROLES (RBAC) */}
      <motion.div variants={itemVariants}>
        <Card spotlight={true}>
          <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 text-slate-600 dark:text-[#9BA3AF]"/>
                Team & Role-Based Access
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                Members of {currentOrg?.name || "this tenant"} and assigned permission levels.
              </p>
            </div>
            {isAdmin && (<Button size="sm" variant="primary" onClick={() => setProvisionOpen(true)} className="gap-1.5 text-xs bg-[#D8CFBC] hover:bg-[#FFFBF4] text-[#11120D] font-semibold">
                <Plus className="w-3.5 h-3.5"/>
                Provision User
              </Button>)}
          </CardHeader>
          <CardContent className="p-0">
            {!currentOrg ? (<div className="p-8">
                <EmptyState icon={Users} title="No active tenant" description="Select a tenant to manage its team."/>
              </div>) : currentOrg.users && currentOrg.users.length > 0 ? (<ul className="divide-y divide-slate-100 dark:divide-[#323744]">
                {currentOrg.users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (<li key={u.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 hover:bg-slate-50/70 dark:hover:bg-[#20242D]/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#14171F] border border-slate-200 dark:border-[#323744] flex items-center justify-center shrink-0">
                          {u.role === "admin" ? (<ShieldCheck className="w-4 h-4 text-[#D8CFBC]"/>) : (<UserIcon className="w-4 h-4 text-slate-600 dark:text-[#9BA3AF]"/>)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] truncate">{u.name}</p>
                            {isSelf && (<Badge variant="default" className="text-[10px] py-0 px-1.5 bg-[#D8CFBC]/15 text-slate-800 dark:text-[#D8CFBC] border-slate-300 dark:border-[#D8CFBC]/30">
                                You
                              </Badge>)}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-[#9BA3AF] truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border tracking-wide capitalize ${roleBadgeClass(u.role)}`}>
                          {u.role.replace("_", " ")}
                        </span>
                      </div>
                    </li>);
            })}
              </ul>) : (<div className="p-8">
                <EmptyState icon={Users} title="No team members" description="Provision users to this tenant to start managing access control."/>
              </div>)}
          </CardContent>
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/40">
            <p className="text-[11px] text-slate-400 dark:text-[#7C8189] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
              {isAdmin
            ? "You have administrative authority for this tenant and can provision team members."
            : `Only admins can provision new team members. Signed in as ${currentUser?.role?.replace("_", " ") || "viewer"}.`}
            </p>
          </div>
        </Card>
      </motion.div>
      </div>
      )}

      {/* PREFERENCES TAB */}
      {activeTab === "preferences" && (
      <motion.div variants={itemVariants}>
        <Card spotlight={true}>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Rows3 className="w-4 h-4 text-slate-600 dark:text-[#9BA3AF]"/>
              Workspace Preferences
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
              Presentation & notification preferences stored locally for this browser.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
            {/* Theme Preference */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/60 p-3.5 hover:bg-slate-50/80 dark:hover:bg-[#14171F] transition-colors">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg bg-slate-100 dark:bg-[#181A20] text-slate-800 dark:text-[#F4F5F7] border border-slate-200 dark:border-[#323744] shrink-0">
                  {theme === "dark" ? (<Moon className="w-4 h-4 text-[#D8CFBC]"/>) : theme === "light" ? (<Sun className="w-4 h-4 text-amber-500"/>) : (<Monitor className="w-4 h-4 text-blue-400"/>)}
                </span>
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">Interface Theme</span>
                  <span className="block text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                    Select Light, Obsidian Dark, or automatically match system preference.
                  </span>
                </div>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#323744] bg-slate-100 dark:bg-[#181A20] p-0.5 text-xs">
                {[
            { key: "light", label: "Light", icon: Sun },
            { key: "dark", label: "Dark", icon: Moon },
            { key: "system", label: "System", icon: Monitor },
        ].map((item) => {
            const Icon = item.icon;
            const isActive = theme === item.key;
            return (<button key={item.key} type="button" onClick={() => setTheme(item.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${isActive
                    ? "bg-white dark:bg-[#20242D] text-slate-900 dark:text-[#D8CFBC] shadow-sm"
                    : "text-slate-600 dark:text-[#9BA3AF] hover:text-slate-900 dark:hover:text-[#F4F5F7]"}`}>
                      <Icon className="w-3.5 h-3.5"/>
                      <span>{item.label}</span>
                    </button>);
        })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/60 p-3.5 hover:bg-slate-50/80 dark:hover:bg-[#14171F] transition-colors">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg bg-slate-100 dark:bg-[#181A20] text-slate-800 dark:text-[#F4F5F7] border border-slate-200 dark:border-[#323744] shrink-0">
                  <Rows3 className="w-4 h-4"/>
                </span>
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">Compact tables</span>
                  <span className="block text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                    Reduce row padding across all operational tables for denser data views.
                  </span>
                </div>
              </div>
              <Switch checked={denseTables} onChange={() => setDenseTables(!denseTables)} label="Compact tables"/>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/60 p-3.5 hover:bg-slate-50/80 dark:hover:bg-[#14171F] transition-colors">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg bg-slate-100 dark:bg-[#181A20] text-slate-800 dark:text-[#F4F5F7] border border-slate-200 dark:border-[#323744] shrink-0">
                  <Bell className="w-4 h-4"/>
                </span>
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">Live real-time toasts</span>
                  <span className="block text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                    Show notifications when inventory or order events arrive over WebSocket.
                  </span>
                </div>
              </div>
              <Switch checked={liveToasts} onChange={toggleLiveToasts} label="Live real-time toasts"/>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {/* SYSTEM DIAGNOSTICS TAB */}
      {activeTab === "system" && (
      <motion.div variants={itemVariants}>
        <Card spotlight={true}>
          <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Gauge className="w-4 h-4 text-slate-600 dark:text-[#9BA3AF]"/>
                System Diagnostics
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                Live health check of the FlowStock API, SQLite/Postgres database engine, and cache.
              </p>
            </div>
            <RefreshButton onClick={loadHealth} isRefreshing={checkingHealth} label="Re-check" className="h-8 text-xs" />
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold">API</span>
                <Badge variant={healthStatus.cls} className="text-[10px] py-0 px-1.5">
                  {healthStatus.label}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">
                {health?.app || "FlowStock"} <span className="text-slate-400 dark:text-[#7C8189] font-normal">v{health?.version || "0.1.0"}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono">{health?.environment || "unknown"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-[#D8CFBC]"/> Database
                </span>
                <span className={`w-2 h-2 rounded-full ${health?.database?.connected ? "bg-[#D8CFBC] shadow-[0_0_8px_rgba(216,207,188,0.6)]" : "bg-zinc-400 dark:bg-zinc-600"}`}/>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">
                {health?.database?.connected ? "Connected" : health?.database?.error ? "Failed" : "Unknown"}
              </p>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono truncate" title={health?.database?.engine}>
                {health?.database?.engine || "not detected"} · {health?.database?.status || "idle"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#323744] bg-slate-50/50 dark:bg-[#14171F]/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] font-semibold flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[#D8CFBC]"/> Cache
                </span>
                <span className={`w-2 h-2 rounded-full ${health?.cache?.status === "healthy" ? "bg-[#D8CFBC] shadow-[0_0_8px_rgba(216,207,188,0.6)]" : "bg-zinc-400 dark:bg-zinc-600"}`}/>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">{health?.cache?.status || "unknown"}</p>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono">{health?.cache?.provider || "in_memory"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {/* PROVISION USER MODAL */}
      <Modal isOpen={provisionOpen} onClose={() => setProvisionOpen(false)} maxWidth="lg">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#323744]">
            <h3 className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-sm flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-slate-900 dark:text-[#F4F5F7]"/>
              Provision New Team Member
            </h3>
            <button onClick={() => setProvisionOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <X className="w-4 h-4"/>
            </button>
          </div>

          {provisionError && (<Alert variant="danger" className="text-xs">
              {provisionError}
            </Alert>)}

          {provisionSuccess && (<Alert variant="success" className="text-xs">
              User provisioned successfully
            </Alert>)}

          <form onSubmit={handleProvision} className="space-y-3">
            <Input label="Full Name *" placeholder="e.g. Priya Desai" value={userName} onChange={(e) => setUserName(e.target.value)} required/>
            <Input label="Work E-mail *" type="email" placeholder="name@company.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required/>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">Role & Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (<label key={r.value} className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${userRole === r.value
                ? "border-zinc-950 dark:border-slate-300 bg-slate-50 dark:bg-[#23262F]/50 ring-1 ring-zinc-950 dark:ring-zinc-300"
                : "border-slate-200 dark:border-[#323744] hover:bg-slate-50/60 dark:hover:bg-slate-800/40"}`}>
                    <input type="radio" name="userRole" value={r.value} checked={userRole === r.value} onChange={(e) => setUserRole(e.target.value)} className="mt-0.5 accent-zinc-950 dark:accent-zinc-100"/>
                    <span>
                      <span className="block text-xs font-semibold text-slate-900 dark:text-[#F4F5F7]">{r.label}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-[#9BA3AF] mt-0.5">{r.description}</span>
                    </span>
                  </label>))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#323744]">
              <Button type="button" variant="outline" size="sm" onClick={() => setProvisionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={provisioning} disabled={provisionSuccess}>
                {provisionSuccess ? "Provisioned" : "Provision User"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </motion.div>);
}
