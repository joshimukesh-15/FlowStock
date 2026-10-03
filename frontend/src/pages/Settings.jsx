"use client";
import { useEffect, useState } from "react";
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
import {
  ShieldCheck,
  Building2,
  Users,
  User as UserIcon,
  Plus,
  X,
  AlertCircle,
  Globe,
  Database,
  Zap,
  Gauge,
  Bell,
  Rows3,
  BadgeCheck,
  Sun,
  Moon,
  Monitor,
  KeyRound,
  Coins,
  CheckCircle2,
} from "lucide-react";
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
      return "bg-[#11120D] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#11120D] border border-[#D8CFBC]/40 font-bold shadow-2xs";
    case "warehouse_manager":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold";
    case "sales_rep":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold";
    default:
      return "bg-slate-100 dark:bg-[#23261E] text-slate-600 dark:text-[#9BA3AF] border border-slate-200 dark:border-[#33372B] font-semibold";
  }
};

const roleLabel = (role) => {
  switch (role) {
    case "warehouse_manager":
      return "Warehouse Manager";
    case "sales_rep":
      return "Sales Representative";
    case "admin":
      return "Administrator";
    default:
      return role.replace(/_/g, " ");
  }
};

const Switch = ({ checked, onChange, label }) => (
  <button
    role="switch"
    type="button"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] ${
      checked ? "bg-[#11120D] dark:bg-[#D8CFBC]" : "bg-slate-200 dark:bg-[#33372B]"
    }`}
  >
    <span
      className={`inline-block h-4.5 w-4.5 transform rounded-full shadow-sm transition-transform duration-200 ${
        checked
          ? "translate-x-5.5 bg-[#D8CFBC] dark:bg-[#11120D]"
          : "translate-x-1 bg-white dark:bg-slate-400"
      }`}
    />
  </button>
);

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

  const [denseTables, setDenseTables] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("flowstock_dense_tables") === "on" : false
  );
  const [liveToasts, setLiveToasts] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("flowstock_live_toasts") !== "off" : true
  );

  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const loadHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetchHealth();
      setHealth(res);
    } finally {
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
    if (!currentOrg) return;
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
    } catch (err) {
      setProvisionError(err.message || "Failed to provision user");
      setProvisionSuccess(false);
    } finally {
      setProvisioning(false);
    }
  };

  const healthStatus =
    health?.status === "healthy"
      ? { label: "Operational", cls: "success" }
      : health?.status === "degraded"
      ? { label: "Degraded", cls: "warning" }
      : { label: "Unreachable", cls: "danger" };

  if (loading && !currentOrg) {
    return <PageSkeleton hasKpis={false} tableRows={5} />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-slate-900 dark:text-[#FFFBF4]" />
            Settings & Administration
          </span>
        }
        subtitle="Tenant profile, team access roles, workspace preferences, and system diagnostics."
        actions={
          <Badge variant="default" className="w-fit px-2.5 py-1 bg-slate-100 dark:bg-[#181A20] text-slate-700 dark:text-[#D8CFBC] border border-slate-200 dark:border-[#33372B]">
            <Globe className="w-3 h-3 mr-1 text-[#565449] dark:text-[#D8CFBC]" />
            {currentOrg?.slug || "tenant"} · {currentOrg?.currency || "INR"}
          </Badge>
        }
      />

      {/* Settings Navigation Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* WORKSPACE & TEAM TAB */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Organization Profile */}
          <motion.div variants={itemVariants}>
            <Card spotlight={true} className="overflow-hidden border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-xs">
              <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-[#33372B]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-700 dark:text-[#D8CFBC] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
                      Organization Profile
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                      Active workspace tenant identity with row-level backend isolation.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Name */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 dark:text-[#7C8189]">
                        Organization Name
                      </span>
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#9BA3AF]" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#FFFBF4] truncate" title={currentOrg?.name}>
                      {currentOrg?.name || "—"}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-[#7C8189] mt-0.5">Primary Ledger Entity</p>
                  </div>

                  {/* Slug */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 dark:text-[#7C8189]">
                        Identifier Slug
                      </span>
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 dark:text-[#9BA3AF]" />
                    </div>
                    <div className="mt-0.5">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D8CFBC]/25 dark:bg-[#D8CFBC]/15 text-[#565449] dark:text-[#D8CFBC] border border-[#D8CFBC]/40 inline-block">
                        {currentOrg?.slug || "—"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-[#7C8189] mt-1.5">Tenant routing key</p>
                  </div>

                  {/* Base Currency */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 dark:text-[#7C8189]">
                        Base Currency
                      </span>
                      <Coins className="w-3.5 h-3.5 text-slate-400 dark:text-[#9BA3AF]" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-[#FFFBF4]">
                        {currentOrg?.currency || "INR"}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-[#7C8189] font-normal">
                        ({currentOrg?.currency === "INR" ? "Native" : "Base"})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-[#7C8189] mt-0.5">Statutory ledger base</p>
                  </div>

                  {/* Team Members */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 dark:text-[#7C8189]">
                        Team Capacity
                      </span>
                      <Users className="w-3.5 h-3.5 text-slate-400 dark:text-[#9BA3AF]" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#FFFBF4]">
                        {currentOrg?.users?.length || 0}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-[#9BA3AF]">active operators</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-[#7C8189] mt-0.5">Provisioned team members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Team & Roles (RBAC) */}
          <motion.div variants={itemVariants}>
            <Card spotlight={true} className="overflow-hidden border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-xs">
              <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-[#33372B]/60 flex flex-row items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-700 dark:text-[#D8CFBC] shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
                      Team & Role-Based Access
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                      Members of {currentOrg?.name || "this tenant"} and assigned permission levels.
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setProvisionOpen(true)}
                    className="gap-1.5 text-xs rounded-xl px-3.5 py-2 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Provision User
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {!currentOrg ? (
                  <div className="p-8">
                    <EmptyState icon={Users} title="No active tenant" description="Select a tenant to manage its team." />
                  </div>
                ) : currentOrg.users && currentOrg.users.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-[#33372B]">
                    {currentOrg.users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const initials = u.name
                        ? u.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "OP";

                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-[#1E2019] transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#D8CFBC]/25 dark:bg-[#D8CFBC]/15 border border-[#D8CFBC]/40 dark:border-[#D8CFBC]/25 flex items-center justify-center font-mono font-bold text-xs text-[#565449] dark:text-[#D8CFBC] shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 dark:text-[#FFFBF4] truncate">{u.name}</p>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D8CFBC]/25 dark:bg-[#D8CFBC]/20 text-[#565449] dark:text-[#D8CFBC] border border-[#D8CFBC]/40 shadow-2xs">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-slate-400 dark:text-[#9BA3AF] truncate mt-0.5">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wider uppercase ${roleBadgeClass(u.role)}`}>
                              {roleLabel(u.role)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8">
                    <EmptyState icon={Users} title="No team members" description="Provision users to this tenant to start managing access control." />
                  </div>
                )}
              </CardContent>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-[#33372B]/60 bg-slate-50/50 dark:bg-[#11120D]/40">
                <p className="text-[11px] text-slate-400 dark:text-[#7C8189] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#565449] dark:text-[#D8CFBC]" />
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
          <Card spotlight={true} className="overflow-hidden border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-xs">
            <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-[#33372B]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-700 dark:text-[#D8CFBC] shrink-0">
                  <Rows3 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
                    Workspace Preferences
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                    Presentation & notification preferences stored locally for this browser.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-[#33372B]">
                {/* Theme Preference */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#1E2019]/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#23261E] text-slate-700 dark:text-[#D8CFBC] border border-slate-200 dark:border-[#33372B] flex items-center justify-center shrink-0 shadow-2xs">
                      {theme === "dark" ? (
                        <Moon className="w-4 h-4 text-[#D8CFBC]" />
                      ) : theme === "light" ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Monitor className="w-4 h-4 text-[#565449] dark:text-[#D8CFBC]" />
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-[#FFFBF4]">Interface Theme</span>
                      <span className="block text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                        Select Light, Obsidian Dark, or automatically match system preference.
                      </span>
                    </div>
                  </div>
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-100/90 dark:bg-[#11120D] p-1 text-xs shadow-2xs shrink-0 self-start sm:self-auto">
                    {[
                      { key: "light", label: "Light", icon: Sun },
                      { key: "dark", label: "Dark", icon: Moon },
                      { key: "system", label: "System", icon: Monitor },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = theme === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTheme(item.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? "bg-white dark:bg-[#23261E] text-slate-950 dark:text-[#D8CFBC] shadow-xs border border-slate-200/80 dark:border-[#33372B]"
                              : "text-slate-500 hover:text-slate-900 dark:text-[#9BA3AF] dark:hover:text-white"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#565449] dark:text-[#D8CFBC]" : ""}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Compact Tables */}
                <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#1E2019]/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#23261E] text-slate-700 dark:text-[#D8CFBC] border border-slate-200 dark:border-[#33372B] flex items-center justify-center shrink-0 shadow-2xs">
                      <Rows3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-[#FFFBF4]">Compact operational tables</span>
                      <span className="block text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                        Reduce row padding across all operational tables for denser data inspection.
                      </span>
                    </div>
                  </div>
                  <Switch checked={denseTables} onChange={() => setDenseTables(!denseTables)} label="Compact tables" />
                </div>

                {/* Live Real-Time Toasts */}
                <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#1E2019]/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#23261E] text-slate-700 dark:text-[#D8CFBC] border border-slate-200 dark:border-[#33372B] flex items-center justify-center shrink-0 shadow-2xs">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-[#FFFBF4]">Live real-time toast alerts</span>
                      <span className="block text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                        Show instant notification banners when inventory or order events arrive via WebSocket.
                      </span>
                    </div>
                  </div>
                  <Switch checked={liveToasts} onChange={toggleLiveToasts} label="Live real-time toasts" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* SYSTEM DIAGNOSTICS TAB */}
      {activeTab === "system" && (
        <motion.div variants={itemVariants}>
          <Card spotlight={true} className="overflow-hidden border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-xs">
            <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-[#33372B]/60 flex flex-row items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-700 dark:text-[#D8CFBC] shrink-0">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
                    System Diagnostics & Health
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                    Live health check of the FlowStock API, SQLite/Postgres database engine, and memory cache.
                  </p>
                </div>
              </div>
              <RefreshButton onClick={loadHealth} isRefreshing={checkingHealth} label="Re-check" className="h-8.5 text-xs rounded-xl shadow-2xs" />
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* API Diagnostic */}
                <div className="rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-[#7C8189] font-mono font-semibold flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-500 dark:text-[#D8CFBC]" /> API Engine
                    </span>
                    <Badge variant={healthStatus.cls} className="text-[10px] py-0.5 px-2 font-mono">
                      {healthStatus.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-[#FFFBF4]">
                      {health?.app || "FlowStock Engine"}{" "}
                      <span className="text-xs font-mono font-normal text-slate-400 dark:text-[#7C8189]">
                        v{health?.version || "0.1.0"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono mt-0.5">
                      environment: {health?.environment || "development"}
                    </p>
                  </div>
                </div>

                {/* Database Diagnostic */}
                <div className="rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-[#7C8189] font-mono font-semibold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-500 dark:text-[#D8CFBC]" /> Database Engine
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          health?.database?.connected
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#9BA3AF]">
                        {health?.database?.connected ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-[#FFFBF4]">
                      {health?.database?.connected ? "Connected" : health?.database?.error ? "Failed" : "Checking"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono mt-0.5 truncate" title={health?.database?.engine}>
                      engine: {health?.database?.engine || "sqlite"} · status: {health?.database?.status || "healthy"}
                    </p>
                  </div>
                </div>

                {/* Cache Diagnostic */}
                <div className="rounded-xl border border-slate-200 dark:border-[#33372B] bg-slate-50/70 dark:bg-[#11120D]/60 p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-[#151711] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-[#7C8189] font-mono font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-slate-500 dark:text-[#D8CFBC]" /> Memory Cache
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          health?.cache?.status === "healthy"
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#9BA3AF]">
                        {health?.cache?.status || "READY"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-[#FFFBF4]">
                      {health?.cache?.status === "healthy" ? "Healthy (Active)" : health?.cache?.status || "Ready"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono mt-0.5">
                      provider: {health?.cache?.provider || "in_memory"} · sub-ms access
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* PROVISION USER MODAL */}
      <Modal isOpen={provisionOpen} onClose={() => setProvisionOpen(false)} maxWidth="lg">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#33372B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#23261E] border border-slate-200 dark:border-[#33372B] flex items-center justify-center text-slate-700 dark:text-[#D8CFBC] shrink-0">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-[#FFFBF4] text-base tracking-tight">
                Provision New Team Member
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setProvisionOpen(false)}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#33372B] hover:border-slate-300 dark:hover:border-[#D8CFBC] bg-slate-50 dark:bg-[#23261E] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {provisionError && (
            <Alert variant="danger" className="text-xs rounded-xl">
              {provisionError}
            </Alert>
          )}

          {provisionSuccess && (
            <Alert variant="success" className="text-xs rounded-xl">
              User provisioned successfully
            </Alert>
          )}

          <form onSubmit={handleProvision} className="space-y-3.5">
            <Input label="Full Name *" placeholder="e.g. Priya Desai" value={userName} onChange={(e) => setUserName(e.target.value)} required />
            <Input label="Work E-mail *" type="email" placeholder="name@company.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Role & Permissions (RBAC)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((r) => {
                  const isChecked = userRole === r.value;
                  return (
                    <label
                      key={r.value}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all duration-150 ${
                        isChecked
                          ? "border-[#D8CFBC] dark:border-[#D8CFBC] bg-[#D8CFBC]/10 dark:bg-[#D8CFBC]/10 ring-1 ring-[#D8CFBC]"
                          : "border-slate-200 dark:border-[#33372B] hover:bg-slate-50/80 dark:hover:bg-[#1E2019]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={r.value}
                        checked={isChecked}
                        onChange={(e) => setUserRole(e.target.value)}
                        className="mt-0.5 accent-[#565449] dark:accent-[#D8CFBC]"
                      />
                      <span>
                        <span className="block text-xs font-bold text-slate-900 dark:text-[#FFFBF4]">{r.label}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-[#9BA3AF] mt-0.5 leading-relaxed">{r.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#33372B]">
              <Button type="button" variant="secondary" size="sm" onClick={() => setProvisionOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={provisioning} disabled={provisionSuccess} className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
                {provisionSuccess ? "Provisioned" : "Provision User"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </motion.div>
  );
}
