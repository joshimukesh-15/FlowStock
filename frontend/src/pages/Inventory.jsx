"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Boxes, Plus, History, AlertTriangle, RefreshCw, TrendingDown, TrendingUp, Sliders, DollarSign, Package, X, } from "lucide-react";
import { fetchInventorySummaries, recordMovementApi, fetchProductMovements, } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { motion } from "framer-motion";
import { getTransition, useReducedMotion, createStaggerContainer, slideUpVariants, pageEnterVariants } from "@/motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton, ListSkeleton, SkeletonAnnouncer, PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
export default function InventoryPage() {
    const { currentOrg } = useTenant();
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const filteredSummaries = summaries.filter((s) => {
        if (!searchQuery.trim())
            return true;
        const q = searchQuery.toLowerCase();
        const matchName = s.product.name.toLowerCase().includes(q);
        const matchSku = s.product.sku.toLowerCase().includes(q);
        const matchCat = (s.product.category?.name || "").toLowerCase().includes(q);
        return matchName || matchSku || matchCat;
    });
    // Record Movement Modal State
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [movementType, setMovementType] = useState("IN");
    const [quantity, setQuantity] = useState(10);
    const [reference, setReference] = useState("Supplier Receiving");
    const [notes, setNotes] = useState("");
    const [movementError, setMovementError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // History Drawer State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const loadInventory = async () => {
        if (summaries.length === 0)
            setLoading(true);
        try {
            const data = await fetchInventorySummaries();
            setSummaries(data);
        }
        catch (err) {
            console.error("Failed to load inventory:", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadInventory();
    }, [currentOrg?.id]);
    const handleOpenMovementModal = (item) => {
        const target = item || summaries[0] || null;
        setSelectedProduct(target);
        setMovementType("IN");
        setQuantity(10);
        setReference("Supplier Receiving");
        setNotes("");
        setMovementError("");
        setMovementModalOpen(true);
    };
    const handleMovementSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct)
            return;
        setSubmitting(true);
        setMovementError("");
        try {
            await recordMovementApi({
                product_id: selectedProduct.product.id,
                movement_type: movementType,
                quantity: Number(quantity),
                reference,
                notes,
            });
            setMovementModalOpen(false);
            await loadInventory();
        }
        catch (err) {
            setMovementError(err.message || "Failed to record movement");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleOpenHistory = async (item) => {
        setHistoryItem(item);
        setHistoryModalOpen(true);
        setLoadingMovements(true);
        try {
            const history = await fetchProductMovements(item.product.id);
            setMovements(history);
        }
        catch (err) {
            console.error("Failed to load history:", err);
        }
        finally {
            setLoadingMovements(false);
        }
    };
    // KPIs
    const totalSkus = summaries.length;
    const totalItems = summaries.reduce((acc, s) => acc + s.on_hand_quantity, 0);
    const lowStockCount = summaries.filter((s) => s.is_low_stock).length;
    const totalValuation = summaries.reduce((acc, s) => acc + s.total_cost_value, 0);
    // Live preview of calculation in modal
    const previewCurrent = selectedProduct ? selectedProduct.on_hand_quantity : 0;
    let previewNewStock = previewCurrent;
    if (movementType === "IN")
        previewNewStock = previewCurrent + Number(quantity || 0);
    else if (movementType === "OUT")
        previewNewStock = previewCurrent - Number(quantity || 0);
    else if (movementType === "ADJUSTMENT")
        previewNewStock = Number(quantity || 0);

    if (loading && summaries.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={6} />;
    }

    return (<motion.div className="max-w-7xl mx-auto space-y-6" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
      {/* Title Bar */}
      <PageHeader title="Inventory Movement Ledger" badge={<Badge variant="info" className="capitalize">{currentOrg?.name}</Badge>} subtitle="Append-only transaction ledger with automatic real-time stock computation" actions={<>
            <Button variant="outline" size="sm" onClick={loadInventory} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}/>
              Refresh
            </Button>
            <Button size="sm" onClick={() => handleOpenMovementModal()} disabled={summaries.length === 0} className="gap-1.5">
              <Plus className="w-4 h-4"/>
              Record Movement
            </Button>
          </>}/>

      {/* Top KPI Cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" variants={itemVariants}>
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
      </motion.div>

      {/* Inventory Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="py-2.5 px-3.5 bg-zinc-50/60 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Live On-Hand Stock Levels & Reorder Thresholds
            </CardTitle>
            <SearchBar placeholder="Search by SKU, product, category..." value={searchQuery} onChange={setSearchQuery} className="w-full sm:w-64"/>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider text-[11px]">
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
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (<tr>
                    <td colSpan={9} className="p-0">
                      <TableSkeleton rows={6} columns={["w-24", "w-44", "w-28", "w-16", "w-16", "w-20", "w-24", "w-24", "w-20"]}/>
                      <SkeletonAnnouncer label="Calculating current ledger balances"/>
                    </td>
                  </tr>) : filteredSummaries.length === 0 ? (<tr>
                    <td colSpan={9}>
                      <EmptyState compact icon={Boxes} title={searchQuery ? "No matching inventory records" : "No inventory data available"} description={searchQuery ? "Try refining your search keyword." : "Create products or record an incoming stock movement to begin tracking."}/>
                    </td>
                  </tr>) : (filteredSummaries.map((s) => (<tr key={s.product.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${s.is_low_stock ? "bg-amber-500/5 dark:bg-amber-500/5" : ""}`}>
                      <td className="py-2 px-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {s.product.sku}
                      </td>
                      <td className="py-2 px-3.5">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.product.name}</span>
                      </td>
                      <td className="py-2 px-3.5 text-zinc-500 dark:text-zinc-400">
                        {s.product.category?.name || "General"}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${s.is_low_stock
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"}`}>
                          {s.on_hand_quantity} {s.product.unit}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">
                        {s.reorder_point} {s.product.unit}
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        ₹{Number(s.product.cost_price).toFixed(2)}
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{Number(s.total_cost_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        {s.is_low_stock ? (<Badge variant="warning">
                            Reorder Required
                          </Badge>) : (<Badge variant="success">
                            Adequate
                          </Badge>)}
                      </td>
                      <td className="py-2 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleOpenMovementModal(s)} className="h-6.5 text-[11px] px-2 gap-1">
                            <Plus className="w-3 h-3"/>
                            Adjust
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenHistory(s)} className="h-6.5 text-[11px] px-2 gap-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                            <History className="w-3 h-3"/>
                            Ledger
                          </Button>
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Record Movement Modal */}
      <Modal isOpen={movementModalOpen && !!selectedProduct} onClose={() => setMovementModalOpen(false)} maxWidth="md" className="p-6">
        {selectedProduct && (<div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">
                  Record Stock Movement
                </h3>
                <p className="text-xs text-zinc-500">
                  Appends an immutable entry to the inventory movement ledger
                </p>
              </div>
              <button onClick={() => setMovementModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {movementError && (<Alert variant="danger" className="text-xs py-2">
                {movementError}
              </Alert>)}

            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Select Product
                </label>
                <select value={selectedProduct.product.id} onChange={(e) => {
                const found = summaries.find((s) => s.product.id === e.target.value);
                if (found)
                    setSelectedProduct(found);
            }} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none">
                  {summaries.map((s) => (<option key={s.product.id} value={s.product.id}>
                      {s.product.name} ({s.product.sku}) — Available: {s.on_hand_quantity}{" "}
                      {s.product.unit}
                    </option>))}
                </select>
              </div>

              {/* Movement Type Tabs with Fluid Indicator */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
                  {[
                { type: "IN", label: "Stock IN", icon: TrendingUp },
                { type: "OUT", label: "Stock OUT", icon: TrendingDown },
                { type: "ADJUSTMENT", label: "Set Count", icon: Sliders },
            ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = movementType === tab.type;
                return (<button key={tab.type} type="button" onClick={() => setMovementType(tab.type)} className={`relative text-xs py-2 px-2.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors z-10 ${isSelected ? "text-white font-semibold" : "text-zinc-600 hover:text-zinc-950"}`}>
                        {isSelected && (<motion.div layoutId={prefersReducedMotion ? undefined : "activeMovementTab"} className="absolute inset-0 bg-zinc-950 rounded-md shadow-xs -z-10" transition={getTransition("normal", prefersReducedMotion)}/>)}
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-500"}`}/>
                        <span>{tab.label}</span>
                      </button>);
            })}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="grid grid-cols-2 gap-3">
                <Input label={movementType === "ADJUSTMENT"
                ? "New Count Total *"
                : "Quantity Magnitude *"} type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} required/>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Resulting Stock
                  </label>
                  <div className={`px-3 py-2 text-sm font-mono font-bold rounded-md border ${previewNewStock < 0
                ? "bg-zinc-100 text-zinc-950 border-zinc-400 font-bold"
                : "bg-zinc-50 text-zinc-800 border-zinc-200"}`}>
                    {previewNewStock} {selectedProduct.product.unit}
                  </div>
                </div>
              </div>

              <Input label="Reference / Reason *" placeholder="e.g. PO-2024, Sales Dispatch #112, Audit recount" value={reference} onChange={(e) => setReference(e.target.value)} required/>

              <Input label="Notes (Optional)" placeholder="Additional context or batch info..." value={notes} onChange={(e) => setNotes(e.target.value)}/>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setMovementModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={submitting} disabled={previewNewStock < 0} className="bg-zinc-900 text-white">
                  {submitting ? "Writing Ledger..." : "Confirm & Post Ledger"}
                </Button>
              </div>
            </form>
          </div>)}
      </Modal>

      {/* Movement History Audit Drawer Modal */}
      <Modal isOpen={historyModalOpen && !!historyItem} onClose={() => setHistoryModalOpen(false)} maxWidth="2xl" className="p-6">
        {historyItem && (<div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">
                  Ledger Audit Trail: {historyItem.product.name}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  SKU: {historyItem.product.sku} — Current On-Hand:{" "}
                  <span className="font-bold text-zinc-800">
                    {historyItem.on_hand_quantity} {historyItem.product.unit}
                  </span>
                </p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {loadingMovements ? (<div className="p-4">
                <ListSkeleton rows={4}/>
                <SkeletonAnnouncer label="Loading movement transactions"/>
              </div>) : movements.length === 0 ? (<EmptyState compact icon={History} title="No movements recorded yet" description="Stock changes are recorded as append-only ledger movements. Record an IN or OUT movement to see the timeline."/>) : (<div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Quantity Change</th>
                      <th className="py-2.5 px-3">Reference / Reason</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {movements.map((m) => (<tr key={m.id} className="hover:bg-zinc-50">
                        <td className="py-2.5 px-3 text-zinc-500 font-mono">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.movement_type === "IN"
                        ? "bg-zinc-950 text-white font-semibold"
                        : m.movement_type === "OUT"
                            ? "bg-zinc-200 text-zinc-900 border border-zinc-300 font-semibold"
                            : "bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold"}`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${m.quantity_change > 0 ? "text-zinc-950 font-bold" : "text-zinc-600 font-bold"}`}>
                          {m.quantity_change > 0
                        ? `+${m.quantity_change}`
                        : m.quantity_change}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-800">
                          {m.reference}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs">
                          {m.notes || "—"}
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>)}

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>)}
      </Modal>
    </motion.div>);
}
