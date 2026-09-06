"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ShieldCheck,
  Building2,
  Users,
  User as UserIcon,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Globe,
  RefreshCw,
  Database,
  Zap,
  Gauge,
  Bell,
  Rows3,
  BadgeCheck,
} from "lucide-react";
import { fetchHealth, createOrgUserApi } from "@/lib/api";
import { HealthResponse } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { motion } from "framer-motion";
import { createStaggerContainer, slideUpVariants, useReducedMotion } from "@/motion";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", description: "Full administrative access, provisioning & settlement" },
  { value: "warehouse_manager", label: "Warehouse Manager", description: "Ledger adjustments, transfers, receiving, fulfillment" },
  { value: "sales_rep", label: "Sales Rep", description: "Customers, order drafting, confirmation & invoicing" },
  { value: "viewer", label: "Viewer", description: "Read-only inspection across all cockpit views" },
];

const roleBadgeClass = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-zinc-950 text-white border-zinc-950 font-semibold";
    case "warehouse_manager":
      return "bg-zinc-100 text-zinc-900 border-zinc-300 font-medium";
    case "sales_rep":
      return "bg-zinc-100 text-zinc-800 border-zinc-200 font-medium";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200 font-medium";
  }
};

export default function SettingsPage() {
  const { currentOrg, currentUser, refreshOrganizations } = useTenant();
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.06, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);

  const isAdmin = currentUser?.role === "admin";

  const [provisionOpen, setProvisionOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("warehouse_manager");
  const [provisionError, setProvisionError] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  const [denseTables, setDenseTables] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("flowstock_dense_tables") === "on" : false
  );
  const [liveToasts, setLiveToasts] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("flowstock_live_toasts") !== "off" : true
  );

  const [health, setHealth] = useState<HealthResponse | null>(null);
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

  const handleProvision = async (e: React.FormEvent) => {
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
    } catch (err: any) {
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

  const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-zinc-950" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-6 pb-12"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-zinc-900" />
            Settings & Administration
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Tenant profile, team access roles, workspace preferences, and system diagnostics.
          </p>
        </div>
        <Badge variant="default" className="w-fit px-2.5 py-1">
          <Globe className="w-3 h-3 mr-1" />
          {currentOrg?.slug || "tenant"} · {currentOrg?.currency || "INR"}
        </Badge>
      </motion.div>

      {/* ORGANIZATION PROFILE */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-zinc-600" />
              Organization Profile
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Identity of the active workspace tenant. Cross-tenant isolation is enforced row-level by the backend.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Name</p>
              <p className="text-sm font-semibold text-zinc-900 mt-1 truncate" title={currentOrg?.name}>
                {currentOrg?.name || "—"}
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Slug</p>
              <p className="text-sm font-mono font-semibold text-zinc-900 mt-1">{currentOrg?.slug || "—"}</p>
            </div>
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Base Currency</p>
              <p className="text-sm font-semibold text-zinc-900 mt-1">
                {currentOrg?.currency || "INR"} <span className="text-zinc-400 font-normal">(₹ INR native)</span>
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Team Members</p>
              <p className="text-sm font-semibold text-zinc-900 mt-1">{currentOrg?.users?.length || 0} active</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* TEAM & ROLES (RBAC) */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-zinc-600" />
                Team & Role-Based Access
              </CardTitle>
              <p className="text-xs text-zinc-500">
                Members of {currentOrg?.name || "this tenant"} and their permission level.
              </p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="primary" onClick={() => setProvisionOpen(true)} className="gap-1.5 text-xs">
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
              <ul className="divide-y divide-zinc-100">
                {currentOrg.users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                          {u.role === "admin" ? (
                            <ShieldCheck className="w-4 h-4 text-zinc-900" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-900 truncate">{u.name}</p>
                            {isSelf && (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-zinc-950 text-white border-zinc-950">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border tracking-wide capitalize ${roleBadgeClass(u.role)}`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={Users}
                  title="No team members"
                  description="Provision users to this tenant to start managing access control."
                />
              </div>
            )}
          </CardContent>
          <div className="px-5 py-3 border-t border-zinc-100">
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {isAdmin
                ? "You have administrative authority for this tenant and can provision team members."
                : `Only admins can provision new team members. You are signed in as ${currentUser?.role?.replace("_", " ") || "viewer"}.`}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* PREFERENCES */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Rows3 className="w-4 h-4 text-zinc-600" />
              Workspace Preferences
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Presentation & notification preferences stored locally for this browser.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200 shrink-0">
                  <Rows3 className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Compact tables</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">
                    Reduce row padding across all operational tables for denser data views.
                  </span>
                </span>
              </div>
              <Switch checked={denseTables} onChange={() => setDenseTables(!denseTables)} label="Compact tables" />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200 shrink-0">
                  <Bell className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Live real-time toasts</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">
                    Show floating notifications when real-time events arrive over the WebSocket stream.
                  </span>
                </span>
              </div>
              <Switch checked={liveToasts} onChange={toggleLiveToasts} label="Live real-time toasts" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SYSTEM DIAGNOSTICS */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="w-4 h-4 text-zinc-600" />
                System Diagnostics
              </CardTitle>
              <p className="text-xs text-zinc-500">
                Live health check of the FlowStock API, database engine, and in-memory cache.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadHealth} disabled={checkingHealth} className="gap-1.5 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
              Re-check
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">API</span>
                <Badge variant={healthStatus.cls as any} className="text-[10px] py-0 px-1.5">
                  {healthStatus.label}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {health?.app || "FlowStock"} <span className="text-zinc-400 font-normal">v{health?.version || "0.1.0"}</span>
              </p>
              <p className="text-xs text-zinc-500 font-mono">{health?.environment || "unknown"}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> Database
                </span>
                <span className={`w-2 h-2 rounded-full ${health?.database?.connected ? "bg-zinc-950" : "bg-zinc-400"}`} />
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {health?.database?.connected ? "Connected" : health?.database?.error ? "Failed" : "Unknown"}
              </p>
              <p className="text-xs text-zinc-500 font-mono truncate" title={health?.database?.engine}>
                {health?.database?.engine || "not detected"} · {health?.database?.status || "idle"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Cache
                </span>
                <span className={`w-2 h-2 rounded-full ${health?.cache?.status === "healthy" ? "bg-zinc-950" : "bg-zinc-400"}`} />
              </div>
              <p className="text-sm font-semibold text-zinc-900">{health?.cache?.status || "unknown"}</p>
              <p className="text-xs text-zinc-500 font-mono">{health?.cache?.provider || "in_memory"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PROVISION USER MODAL */}
      <Modal isOpen={provisionOpen} onClose={() => setProvisionOpen(false)} maxWidth="lg">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-zinc-900" />
              Provision New Team Member
            </h3>
            <button onClick={() => setProvisionOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {provisionError && (
            <div className="text-xs text-zinc-900 bg-zinc-100 border border-zinc-300 p-2.5 rounded flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {provisionError}
            </div>
          )}

          {provisionSuccess && (
            <div className="text-xs text-white bg-zinc-950 border border-zinc-900 p-2.5 rounded flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              User provisioned successfully
            </div>
          )}

          <form onSubmit={handleProvision} className="space-y-3">
            <Input
              label="Full Name *"
              placeholder="e.g. Priya Desai"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <Input
              label="Work E-mail *"
              type="email"
              placeholder="name@company.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Role & Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                      userRole === r.value
                        ? "border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950"
                        : "border-zinc-200 hover:bg-zinc-50/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value={r.value}
                      checked={userRole === r.value}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="mt-0.5 accent-zinc-950"
                    />
                    <span>
                      <span className="block text-xs font-semibold text-zinc-900">{r.label}</span>
                      <span className="block text-[10px] text-zinc-500 mt-0.5">{r.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setProvisionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={provisioning || provisionSuccess}>
                {provisioning ? "Provisioning..." : provisionSuccess ? "Provisioned" : "Provision User"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </motion.div>
  );
}