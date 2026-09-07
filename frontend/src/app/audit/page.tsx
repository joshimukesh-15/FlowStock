"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  Filter,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Truck,
  Boxes,
  ShoppingCart,
  Building2,
  X,
} from "lucide-react";
import { fetchHealth, fetchAuditLogs } from "@/lib/api";
import { HealthResponse, AuditLog } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { TableSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { fadeInVariants, useReducedMotion } from "@/motion";

export default function AuditPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const { currentOrg } = useTenant();
  const prefersReducedMotion = useReducedMotion();

  const loadAudits = async () => {
    if (audits.length === 0) setLoading(true);
    try {
      const [healthData, auditData] = await Promise.all([
        fetchHealth(),
        fetchAuditLogs({
          entity_type: selectedEntity === "ALL" ? undefined : selectedEntity,
          search: searchTerm || undefined,
          limit: 100,
        }),
      ]);
      setHealth(healthData);
      setAudits(auditData);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAudits();
    }, 250);
    return () => clearTimeout(timer);
  }, [currentOrg?.id, selectedEntity, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAudits();
  };

  const isConnected = health?.status === "healthy" || health?.status === "degraded";

  const getActionBadge = (action: string) => {
    if (action.includes("CONFIRMED") || action.includes("DELIVERED") || action.includes("RECEIVED") || action.includes("PAID") || action.includes("RECORDED")) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes("CANCELLED") || action.includes("VOID")) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (action.includes("ADJUSTMENT") || action.includes("OUT")) {
      return <Badge variant="warning">{action}</Badge>;
    }
    if (action.includes("IN") || action.includes("DISPATCHED") || action.includes("ISSUED")) {
      return <Badge variant="info">{action}</Badge>;
    }
    return <Badge variant="default">{action}</Badge>;
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "Order":
        return <ShoppingCart className="w-3.5 h-3.5 text-zinc-900" />;
      case "Invoice":
        return <FileText className="w-3.5 h-3.5 text-zinc-900" />;
      case "Payment":
        return <CreditCard className="w-3.5 h-3.5 text-zinc-900" />;
      case "Shipment":
        return <Truck className="w-3.5 h-3.5 text-zinc-900" />;
      case "Inventory":
        return <Boxes className="w-3.5 h-3.5 text-zinc-900" />;
      case "PurchaseOrder":
        return <Building2 className="w-3.5 h-3.5 text-zinc-900" />;
      default:
        return <History className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  const entities = [
    { label: "All Modules", value: "ALL" },
    { label: "Sales Orders", value: "Order" },
    { label: "Tax Invoices", value: "Invoice" },
    { label: "Cash Payments", value: "Payment" },
    { label: "Shipments & Logistics", value: "Shipment" },
    { label: "Inventory Ledger", value: "Inventory" },
    { label: "Purchase Orders", value: "PurchaseOrder" },
  ];

  return (
    
      <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={fadeInVariants(prefersReducedMotion)} initial="hidden" animate="visible">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Audit Trails & Compliance Log</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Immutable chronological record of system transactions, operator modifications, and state transitions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadAudits} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Logs
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/60">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Total Audit Events</p>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">{audits.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/60">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Financial & Invoices</p>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">
                  {audits.filter((a) => a.entity_type === "Invoice" || a.entity_type === "Payment").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/60">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Inventory Movements</p>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">
                  {audits.filter((a) => a.entity_type === "Inventory").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Tenant Isolation</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-semibold text-zinc-900">Enforced</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Entity Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-100">
              {entities.map((ent) => (
                <button
                  key={ent.value}
                  onClick={() => setSelectedEntity(ent.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedEntity === ent.value
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  {ent.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <Input
                  placeholder="Search by action, entity name (e.g. SO-3F2383, INV-ACME-01), operator, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 text-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" variant="secondary" className="text-xs gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-zinc-900">Audit Trail Records</CardTitle>
              <p className="text-xs text-zinc-500">
                Sorted chronologically by event timestamp (UTC)
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Showing {audits.length} entries
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-semibold border-y border-zinc-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Target Entity</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Operational Details</th>
                    <th className="p-3 text-right">Host IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-4">
                        <TableSkeleton rows={5} columns={["w-36", "w-24", "w-24", "w-32", "w-28", "w-56", "w-24"]} />
                        <SkeletonAnnouncer label="Loading audit trails" />
                      </td>
                    </tr>
                  ) : audits.length > 0 ? (
                    audits.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-mono text-zinc-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {getActionBadge(item.action)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                            {getEntityIcon(item.entity_type)}
                            {item.entity_type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-zinc-900 whitespace-nowrap">
                          {item.entity_name || "—"}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-zinc-700 font-medium">
                            <User className="w-3 h-3 text-zinc-400" />
                            {item.user_name || "System"}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-600 max-w-md">
                          <p className="line-clamp-2 leading-relaxed">{item.details || "No details"}</p>
                        </td>
                        <td className="p-3 font-mono text-zinc-400 text-right whitespace-nowrap">
                          {item.ip_address || "127.0.0.1"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          compact
                          icon={History}
                          title="No audit records found"
                          description="Operational actions (confirming orders, recording payments, moving inventory) will automatically appear here."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    
  );
}
