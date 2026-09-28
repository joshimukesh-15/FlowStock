"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Boxes, Plus, History, AlertTriangle, RefreshCw, TrendingDown, TrendingUp, Sliders, DollarSign, Package, X } from "lucide-react";
import { fetchProductMovements } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { useInventoryData } from "@/hooks/useFlowStockData";
import { motion } from "framer-motion";
import { getTransition, useReducedMotion, createStaggerContainer, slideUpVariants, pageEnterVariants } from "@/motion";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton, ListSkeleton, SkeletonAnnouncer, PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
import { FormField } from "@/components/ui/FormField";
import { KpiGrid } from "@/components/ui/KpiGrid";
import { formatDate, selectClass } from "@/lib/utils";

export default function InventoryPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const [searchQuery, setSearchQuery] = useState("");

    // SWR & Optimistic UI for Inventory Ledger (0ms Page Loading + Instant Stock Updates)
    const {
        summaries,
        isLoading: loading,
        recordMovement,
        mutate,
    } = useInventoryData({
        search: searchQuery || undefined,
    });
  
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [movementType, setMovementType] = useState("IN");
    const [quantity, setQuantity] = useState(1);
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [movementError, setMovementError] = useState("");

    // Safe fallbacks
    const safeSummaries = Array.isArray(summaries) ? summaries : [];

    const handleOpenMovementModal = (summary = null) => {
        const target = summary || safeSummaries[0];
        if (!target)
            return;
        setSelectedProduct(target);
        setMovementType("IN");
        setQuantity(1);
        setReference("");
        setNotes("");
        setMovementError("");
        setMovementModalOpen(true);
    };

    const handleOpenHistoryModal = async (summary) => {
        if (!summary?.product?.id)
            return;
        setHistoryItem(summary);
        setHistoryModalOpen(true);
        setLoadingMovements(true);
        try {
            const data = await fetchProductMovements(summary.product.id);
            setMovements(data);
        }
        catch (err) {
            console.error("Failed to fetch movements:", err);
            toast.error("Failed to load audit history", err.message);
        }
        finally {
            setLoadingMovements(false);
        }
    };

    const handleMovementSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct?.product?.id)
            return;
        if (quantity <= 0) {
            setMovementError("Quantity must be greater than zero.");
            return;
        }
        setSubmitting(true);
        setMovementError("");
        try {
            await recordMovement({
                product_id: selectedProduct.product.id,
                movement_type: movementType,
                quantity: parseInt(quantity),
                reference,
                notes,
            });
            toast.success("Stock ledger updated", `${movementType} of ${quantity} units committed.`);
            setMovementModalOpen(false);
        }
        catch (err) {
            setMovementError(err.message || "Failed to post stock transaction");
        }
        finally {
            setSubmitting(false);
        }
    };

    // Derived Metrics
    const totalSkus = safeSummaries.length;
    const totalItems = safeSummaries.reduce((sum, s) => sum + (s?.on_hand_quantity || 0), 0);
    const lowStockCount = safeSummaries.filter((s) => s && s.on_hand_quantity <= s.reorder_point).length;
    const totalValuation = safeSummaries.reduce((sum, s) => {
        const qty = s?.on_hand_quantity || 0;
        const cost = s?.product?.cost_price || 0;
        return sum + qty * cost;
    }, 0);

    const previewNewStock = selectedProduct
        ? movementType === "IN"
            ? selectedProduct.on_hand_quantity + quantity
            : movementType === "OUT"
                ? selectedProduct.on_hand_quantity - quantity
                : quantity
        : 0;

    if (loading && safeSummaries.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={6} />;
    }

    return (<motion.div className="space-y-4" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
      {/* Header */}
      <PageHeader title={<span className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-slate-900 dark:text-[#F4F5F7]"/>
            Inventory Ledger & Valuations
          </span>} subtitle="Perpetual FIFO stock counts, reorder thresholds, and transactional audit trails." actions={<>
            <RefreshButton onClick={() => mutate()} label="Sync Ledger" />
            <Button size="sm" onClick={() => handleOpenMovementModal()} disabled={safeSummaries.length === 0} className="gap-1.5">
              <Plus className="w-4 h-4"/>
              Record Movement
            </Button>
          </>}/>

      {/* Top KPI Cards */}
      <KpiGrid>
        <StatCard
          title="Tracked SKUs"
          value={totalSkus}
          icon={Boxes}
          badge={<Badge variant="default">Active</Badge>}
          subText="Active catalog items"
        />
        <StatCard
          title="Total Units in Stock"
          value={totalItems}
          suffix=" units"
          icon={Package}
          subText="On-hand warehouse balance"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={AlertTriangle}
          badge={<Badge variant={lowStockCount > 0 ? "warning" : "success"}>{lowStockCount > 0 ? "Needs Reorder" : "Healthy"}</Badge>}
          subText={lowStockCount > 0 ? "Items below reorder point" : "All SKUs well stocked"}
        />
        <StatCard
          title="Total Stock Value"
          value={totalValuation}
          prefix="₹"
          formatINR
          decimals={2}
          icon={DollarSign}
          subText="Current inventory valuation"
        />
      </KpiGrid>

      {/* Inventory Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="py-2.5 px-3.5 bg-slate-50/60 dark:bg-[#14171F]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9BA3AF]">
              Live On-Hand Stock Levels & Reorder Thresholds
            </CardTitle>
            <SearchBar placeholder="Search by SKU, product, category..." value={searchQuery} onChange={setSearchQuery} className="w-full sm:w-64"/>
          </CardHeader>

          <div className="overflow-auto max-h-[60vh] relative custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-[#14171F] border-b border-slate-200 dark:border-[#323744] text-slate-500 dark:text-[#9BA3AF] font-medium uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-2 px-3.5">SKU</th>
                  <th className="py-2 px-3.5">Product Name</th>
                  <th className="py-2 px-3.5">Category</th>
                  <th className="py-2 px-3.5 text-center">On-Hand Stock</th>
                  <th className="py-2 px-3.5 text-center">Reorder Level</th>
                  <th className="py-2 px-3.5 text-right">Avg Cost</th>
                  <th className="py-2 px-3.5 text-right">Total Valuation</th>
                  <th className="py-2 px-3.5 text-center">Status</th>
                  <th className="py-2 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#262A34]">
                {loading ? (<tr>
                    <td colSpan={9} className="p-0">
                      <TableSkeleton rows={6} columns={["w-24", "w-44", "w-28", "w-16", "w-16", "w-20", "w-24", "w-24", "w-20"]}/>
                      <SkeletonAnnouncer label="Calculating current ledger balances"/>
                    </td>
                  </tr>) : safeSummaries.length === 0 ? (<tr>
                    <td colSpan={9}>
                      <EmptyState compact icon={Boxes} title={searchQuery ? "No matching inventory records" : "No inventory data available"} description={searchQuery ? "Try refining your search keyword." : "Create products or record an incoming stock movement to begin tracking."}/>
                    </td>
                  </tr>) : (
                    safeSummaries.map((s) => {
                      if (!s || !s.product) return null;
                      return (
                    <tr key={s.product.id} className={`hover:bg-slate-50 dark:bg-[#14171F] dark:hover:bg-slate-800/40 transition-colors ${s.is_low_stock ? "bg-amber-500/5 dark:bg-amber-500/5" : ""}`}>
                      <td className="py-2 px-3.5 font-mono font-bold text-slate-900 dark:text-[#F4F5F7]">
                        {s.product.sku}
                      </td>
                      <td className="py-2 px-3.5">
                        <span className="font-medium text-slate-900 dark:text-[#F4F5F7]">{s.product.name}</span>
                      </td>
                      <td className="py-2 px-3.5 text-slate-500 dark:text-[#9BA3AF]">
                        {s.product.category?.name || "General"}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${s.is_low_stock
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "bg-slate-100 dark:bg-[#23262F] text-slate-800 dark:text-[#E2E8F0]"}`}>
                          {s.on_hand_quantity} {s.product.unit}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-center font-mono text-slate-500 dark:text-[#9BA3AF]">
                        {s.reorder_point} {s.product.unit}
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono text-slate-600 dark:text-[#9BA3AF]">
                        ₹{Number(s.product.cost_price).toFixed(2)}
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-[#F4F5F7]">
                        ₹{Number(s.total_cost_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        {s.is_low_stock ? (<Badge variant="warning">
                            Reorder Required
                          </Badge>) : (<Badge variant="success">
                            Adequate
                          </Badge>)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleOpenMovementModal(s)}
                            title="Adjust Stock Quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Adjust
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleOpenHistoryModal(s)}
                            title="View Audit Ledger History"
                          >
                            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            Ledger
                          </Button>
                        </div>
                      </td>
                    </tr>
                      );
                    })
                  )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Record Movement Modal */}
      <Modal isOpen={movementModalOpen && !!selectedProduct} onClose={() => setMovementModalOpen(false)} maxWidth="md" className="p-6">
        {selectedProduct && (<div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262A34]">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Record Stock Movement
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                  Appends an immutable entry to the inventory movement ledger
                </p>
              </div>
              <button onClick={() => setMovementModalOpen(false)} className="text-slate-400 dark:text-[#7C8189] hover:text-slate-600">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {movementError && (<Alert variant="danger" className="text-xs py-2">
                {movementError}
              </Alert>)}

            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <FormField label="Select Product">
                <select
                  value={selectedProduct?.product?.id || ""}
                  onChange={(e) => {
                    const found = safeSummaries.find((s) => s?.product?.id === e.target.value);
                    if (found) setSelectedProduct(found);
                  }}
                  className={selectClass}
                >
                  {safeSummaries.map((s) => s?.product ? (
                    <option key={s.product.id} value={s.product.id}>
                      {s.product.name} ({s.product.sku}) — Available: {s.on_hand_quantity}{" "}
                      {s.product.unit}
                    </option>
                  ) : null)}
                </select>
              </FormField>

              {/* Movement Type Tabs with Fluid Indicator */}
              <FormField label="Movement Type">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#23262F] rounded-lg border border-slate-200 dark:border-[#323744]">
                  {[
                    { type: "IN", label: "Stock IN", icon: TrendingUp },
                    { type: "OUT", label: "Stock OUT", icon: TrendingDown },
                    { type: "ADJUSTMENT", label: "Set Count", icon: Sliders },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = movementType === tab.type;
                    return (
                      <button
                        key={tab.type}
                        type="button"
                        onClick={() => setMovementType(tab.type)}
                        className={`relative text-xs py-2 px-2.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors z-10 ${
                          isSelected ? "text-white font-semibold" : "text-slate-600 hover:text-slate-950 dark:text-[#9BA3AF] dark:hover:text-white"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId={prefersReducedMotion ? undefined : "activeMovementTab"}
                            className="absolute inset-0 bg-slate-950 rounded-md shadow-xs -z-10"
                            transition={getTransition("normal", prefersReducedMotion)}
                          />
                        )}
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500 dark:text-[#9BA3AF]"}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {/* Quantity Input */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={movementType === "ADJUSTMENT" ? "New Count Total *" : "Quantity Magnitude *"}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  required
                />

                <FormField label="Resulting Stock">
                  <div
                    className={`px-3 py-2 text-sm font-mono font-bold rounded-md border ${
                      previewNewStock < 0
                        ? "bg-slate-100 dark:bg-[#23262F] text-slate-950 border-zinc-400 font-bold"
                        : "bg-slate-50 dark:bg-[#14171F] text-slate-800 dark:text-[#F4F5F7] border-slate-200 dark:border-[#323744]"
                    }`}
                  >
                    {previewNewStock} {selectedProduct?.product?.unit || "units"}
                  </div>
                </FormField>
              </div>

              <Input label="Reference / Reason *" placeholder="e.g. PO-2024, Sales Dispatch #112, Audit recount" value={reference} onChange={(e) => setReference(e.target.value)} required/>

              <Input label="Notes (Optional)" placeholder="Additional context or batch info..." value={notes} onChange={(e) => setNotes(e.target.value)}/>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#262A34]">
                <Button type="button" variant="outline" size="sm" onClick={() => setMovementModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={submitting} disabled={previewNewStock < 0} className="bg-[#D8CFBC] hover:bg-[#FFFBF4] text-[#11120D] font-bold">
                  {submitting ? "Writing Ledger..." : "Confirm & Post Ledger"}
                </Button>
              </div>
            </form>
          </div>)}
      </Modal>

      {/* Movement History Audit Drawer Modal */}
      <Modal isOpen={historyModalOpen && !!historyItem} onClose={() => setHistoryModalOpen(false)} maxWidth="2xl" className="p-6">
        {historyItem && (<div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262A34]">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Ledger Audit Trail: {historyItem.product.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono">
                  SKU: {historyItem.product.sku} — Current On-Hand:{" "}
                  <span className="font-bold text-slate-800 dark:text-[#F4F5F7]">
                    {historyItem.on_hand_quantity} {historyItem.product.unit}
                  </span>
                </p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 dark:text-[#7C8189] hover:text-slate-600">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {loadingMovements ? (<div className="p-4">
                <ListSkeleton rows={4}/>
                <SkeletonAnnouncer label="Loading movement transactions"/>
              </div>) : movements.length === 0 ? (<EmptyState compact icon={History} title="No movements recorded yet" description="Stock changes are recorded as append-only ledger movements. Record an IN or OUT movement to see the timeline."/>) : (<div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#14171F] border-b border-slate-200 dark:border-[#323744] text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Quantity Change</th>
                      <th className="py-2.5 px-3">Reference / Reason</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#262A34]">
                    {movements.map((m) => (<tr key={m.id} className="hover:bg-slate-50 dark:bg-[#14171F]">
                        <td className="py-2.5 px-3 text-slate-500 dark:text-[#9BA3AF] font-mono">
                          {formatDate(m.created_at, true)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.movement_type === "IN"
                        ? "bg-emerald-500 text-white dark:bg-[#D8CFBC] dark:text-[#11120D] font-bold font-semibold"
                        : m.movement_type === "OUT"
                            ? "bg-slate-200 text-slate-900 dark:text-white border border-slate-300 dark:border-[#545963] font-semibold"
                            : "bg-slate-100 dark:bg-[#23262F] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#323744] font-semibold"}`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${m.quantity_change > 0 ? "text-slate-950 font-bold" : "text-slate-600 font-bold"}`}>
                          {m.quantity_change > 0
                        ? `+${m.quantity_change}`
                        : m.quantity_change}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-[#F4F5F7]">
                          {m.reference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 dark:text-[#7C8189] truncate max-w-xs">
                          {m.notes || "—"}
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>)}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#262A34]">
              <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>)}
      </Modal>
    </motion.div>);
}
