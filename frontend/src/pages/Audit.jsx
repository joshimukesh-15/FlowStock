import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { History, ShieldCheck, Filter, User, FileText, CreditCard, Truck, Boxes, ShoppingCart, Building2, } from "lucide-react";
import { fetchAuditLogs } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { TableSkeleton, SkeletonAnnouncer, PageSkeleton } from "@/components/ui/Skeleton";

import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { AnimatedBadge } from "@/components/ui/AnimatedBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { KpiGrid } from "@/components/ui/KpiGrid";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotion, pageEnterVariants } from "@/motion";
export default function AuditPage() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEntity, setSelectedEntity] = useState("ALL");
    const { currentOrg } = useTenant();
    const prefersReducedMotion = useReducedMotion();
    const loadAudits = async () => {
        if (audits.length === 0)
            setLoading(true);
        try {
            const auditData = await fetchAuditLogs({
                entity_type: selectedEntity === "ALL" ? undefined : selectedEntity,
                search: searchTerm || undefined,
                limit: 100,
            });
            setAudits(auditData);
        }
        catch {
            // Ignore
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const timer = setTimeout(() => {
            loadAudits();
        }, 250);
        return () => clearTimeout(timer);
    }, [currentOrg?.id, selectedEntity, searchTerm]);
    const handleSearch = (e) => {
        e.preventDefault();
        loadAudits();
    };
    const getActionBadge = (action) => {
        let variant = "default";
        if (action.includes("CONFIRMED") || action.includes("DELIVERED") || action.includes("RECEIVED") || action.includes("PAID") || action.includes("RECORDED")) {
            variant = "success";
        }
        else if (action.includes("CANCELLED") || action.includes("VOID")) {
            variant = "danger";
        }
        else if (action.includes("ADJUSTMENT") || action.includes("OUT")) {
            variant = "warning";
        }
        else if (action.includes("IN") || action.includes("DISPATCHED") || action.includes("ISSUED")) {
            variant = "info";
        }
        return (<AnimatedBadge statusKey={action} variant={variant}>
        {action}
      </AnimatedBadge>);
    };
    const getEntityIcon = (entity) => {
        switch (entity) {
            case "Order":
                return <ShoppingCart className="w-3.5 h-3.5 text-[#314C3B]"/>;
            case "Invoice":
                return <FileText className="w-3.5 h-3.5 text-[#314C3B]"/>;
            case "Payment":
                return <CreditCard className="w-3.5 h-3.5 text-[#314C3B]"/>;
            case "Shipment":
                return <Truck className="w-3.5 h-3.5 text-[#314C3B]"/>;
            case "Inventory":
                return <Boxes className="w-3.5 h-3.5 text-[#314C3B]"/>;
            case "PurchaseOrder":
                return <Building2 className="w-3.5 h-3.5 text-[#314C3B]"/>;
            default:
                return <History className="w-3.5 h-3.5 text-[#6D8C73]"/>;
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

    if (loading && audits.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={8} />;
    }

    return (<motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={pageEnterVariants(prefersReducedMotion)} initial="hidden" animate="visible">
        {/* Header Title */}
        <PageHeader title="Audit Trails & Compliance Log" subtitle="Immutable chronological record of system transactions, operator modifications, and state transitions." actions={<RefreshButton onClick={loadAudits} label="Refresh Logs" />}/>

        {/* Metric Summary Cards */}
        <KpiGrid>
          <Card className="p-3.5 sm:p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E2DED2] dark:bg-[#314C3B] text-[#4C6B55] dark:text-[#CBD5E1] border border-[#BDC9B8] dark:border-[#4C6B55] flex items-center justify-center shrink-0">
              <History className="w-4 h-4"/>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#6D8C73] dark:text-[#9BA3AF] truncate">Total Audit Events</p>
              <p className="text-lg font-bold text-[#314C3B] dark:text-[#F4F5F7] font-mono mt-0.5">{audits.length}</p>
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E2DED2] dark:bg-[#314C3B] text-[#4C6B55] dark:text-[#CBD5E1] border border-[#BDC9B8] dark:border-[#4C6B55] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4"/>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#6D8C73] dark:text-[#9BA3AF] truncate">Financial & Invoices</p>
              <p className="text-lg font-bold text-[#314C3B] dark:text-[#F4F5F7] font-mono mt-0.5">
                {audits.filter((a) => a.entity_type === "Invoice" || a.entity_type === "Payment").length}
              </p>
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E2DED2] dark:bg-[#314C3B] text-[#4C6B55] dark:text-[#CBD5E1] border border-[#BDC9B8] dark:border-[#4C6B55] flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4"/>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#6D8C73] dark:text-[#9BA3AF] truncate">Inventory Movements</p>
              <p className="text-lg font-bold text-[#314C3B] dark:text-[#F4F5F7] font-mono mt-0.5">
                {audits.filter((a) => a.entity_type === "Inventory").length}
              </p>
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#92AA97]/10 text-[#314C3B] dark:text-[#92AA97] border border-[#92AA97]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4"/>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#6D8C73] dark:text-[#9BA3AF] truncate">Tenant Isolation</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-semibold text-[#314C3B] dark:text-[#F4F5F7]">Enforced</span>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </Card>
        </KpiGrid>

        {/* Filter & Search Bar */}
        <Card>
          <CardContent className="p-3.5 sm:p-4 space-y-3">
            {/* Entity Filter Tabs with Sliding Underline */}
            <Tabs tabs={entities.map((ent) => ({
            id: ent.value,
            label: ent.label,
        }))} activeTab={selectedEntity} onChange={setSelectedEntity} layoutId="audit-entity-tabs" variant="underline"/>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <SearchBar placeholder="Search by action, entity name (e.g. SO-3F2383, INV-ACME-01), operator, or details..." value={searchTerm} onChange={setSearchTerm} className="flex-1"/>
              <Button type="submit" size="sm" variant="secondary" className="text-xs gap-1.5">
                <Filter className="w-3.5 h-3.5"/>
                Filter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card spotlight={true} className="shadow-2xs">
          <CardHeader className="py-3 px-4 border-b border-[#E2DED2] dark:border-[#4C6B55] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#314C3B] dark:text-[#F4F5F7]">Audit Trail Records</CardTitle>
              <p className="text-xs text-[#6D8C73] dark:text-[#9BA3AF] mt-0.5">
                Sorted chronologically by event timestamp (UTC)
              </p>
            </div>
            <span className="text-xs font-mono text-[#6D8C73] dark:text-[#7C8189]">
              Showing {audits.length} entries
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#4C6B55] dark:text-[#CBD5E1]">
                <thead className="bg-[#E2DED2] dark:bg-[#1C1F27] text-[#6D8C73] dark:text-[#9BA3AF] font-semibold border-b border-[#E2DED2] dark:border-[#2A2E39] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Timestamp</th>
                    <th className="py-2.5 px-3.5">Action</th>
                    <th className="py-2.5 px-3.5">Module</th>
                    <th className="py-2.5 px-3.5">Target Entity</th>
                    <th className="py-2.5 px-3.5">Operator</th>
                    <th className="py-2.5 px-3.5">Operational Details</th>
                    <th className="py-2.5 px-3.5 text-right">Host IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#4C6B55]">
                  {loading ? (<tr>
                      <td colSpan={7} className="p-4">
                        <TableSkeleton rows={5} columns={["w-36", "w-24", "w-24", "w-32", "w-28", "w-56", "w-24"]}/>
                        <SkeletonAnnouncer label="Loading audit trails"/>
                      </td>
                    </tr>) : audits.length > 0 ? (audits.map((item) => (<tr key={item.id} className="hover:bg-[#E2DED2]/70 dark:hover:bg-[#314C3B]/50 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-[#6D8C73] dark:text-[#9BA3AF] whitespace-nowrap">
                          {formatDate(item.created_at, true)}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {getActionBadge(item.action)}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#4C6B55] dark:text-[#CBD5E1]">
                            {getEntityIcon(item.entity_type)}
                            {item.entity_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-[#314C3B] dark:text-[#F4F5F7] whitespace-nowrap">
                          {item.entity_name || "—"}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[#4C6B55] dark:text-[#CBD5E1] font-medium">
                            <User className="w-3 h-3 text-[#6D8C73]"/>
                            {item.user_name || "System"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-[#4C6B55] dark:text-[#9BA3AF] max-w-md">
                          <p className="line-clamp-2 leading-relaxed text-[11px]">{item.details || "No details"}</p>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-[#6D8C73] dark:text-[#7C8189] text-right whitespace-nowrap">
                          {item.ip_address || "127.0.0.1"}
                        </td>
                      </tr>))) : (<tr>
                      <td colSpan={7}>
                        <EmptyState compact icon={History} title="No audit records found" description="Operational actions (confirming orders, recording payments, moving inventory) will automatically appear here."/>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>);
}
