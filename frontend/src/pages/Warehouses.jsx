"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Warehouse as WarehouseIcon, Plus, ArrowRight, Truck, CheckCircle2, Clock, Ban, MapPin, RefreshCw, X, Package, AlertCircle, } from "lucide-react";
import { fetchWarehouses, createWarehouseApi, fetchTransfers, createTransferApi, dispatchTransferApi, receiveTransferApi, cancelTransferApi, fetchProducts, } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { WarehouseTransferVisualizer } from "@/components/ui/WarehouseTransferVisualizer";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { TableSkeleton, SkeletonAnnouncer, PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { AnimatedBadge } from "@/components/ui/AnimatedBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { formatDate, selectClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotion, createStaggerContainer, slideUpVariants, pageEnterVariants } from "@/motion";
export default function WarehousesPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const [warehouses, setWarehouses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedVisualizerTransfer, setSelectedVisualizerTransfer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [transferIdToCancel, setTransferIdToCancel] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");
    // New Warehouse Modal State
    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [warehouseName, setWarehouseName] = useState("");
    const [warehouseCode, setWarehouseCode] = useState("");
    const [warehouseLocation, setWarehouseLocation] = useState("");
    const [warehouseIsDefault, setWarehouseIsDefault] = useState(false);
    const [warehouseError, setWarehouseError] = useState("");
    const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);
    // New Transfer Modal State
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [sourceWarehouseId, setSourceWarehouseId] = useState("");
    const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [transferQuantity, setTransferQuantity] = useState(5);
    const [transferNotes, setTransferNotes] = useState("");
    const [transferError, setTransferError] = useState("");
    const [transferSubmitting, setTransferSubmitting] = useState(false);
    const loadData = async () => {
        if (warehouses.length === 0)
            setLoading(true);
        try {
            const [whList, trList, prList] = await Promise.all([
                fetchWarehouses(),
                fetchTransfers(),
                fetchProducts(),
            ]);
            setWarehouses(whList);
            setTransfers(trList);
            setProducts(prList);
            if (whList.length >= 2) {
                setSourceWarehouseId(whList[0].id);
                setDestinationWarehouseId(whList[1].id);
            }
            else if (whList.length === 1) {
                setSourceWarehouseId(whList[0].id);
            }
            if (prList.length > 0) {
                setSelectedProductId(prList[0].id);
            }
        }
        catch (err) {
            console.error("Failed to load warehouse data:", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, [currentOrg?.id]);
    const handleCreateWarehouse = async (e) => {
        e.preventDefault();
        if (!warehouseName.trim() || !warehouseCode.trim()) {
            setWarehouseError("Warehouse name and code are required.");
            return;
        }
        setWarehouseSubmitting(true);
        setWarehouseError("");
        try {
            await createWarehouseApi({
                name: warehouseName.trim(),
                code: warehouseCode.trim(),
                location: warehouseLocation.trim() || undefined,
                is_default: warehouseIsDefault,
            });
            setWarehouseModalOpen(false);
            setWarehouseName("");
            setWarehouseCode("");
            setWarehouseLocation("");
            setWarehouseIsDefault(false);
            toast.success("Warehouse added", "Facility successfully registered.");
            await loadData();
        }
        catch (err) {
            setWarehouseError(err.message || "Failed to create warehouse");
        }
        finally {
            setWarehouseSubmitting(false);
        }
    };
    const handleCreateTransfer = async (e) => {
        e.preventDefault();
        if (!sourceWarehouseId || !destinationWarehouseId || !selectedProductId) {
            setTransferError("Please fill out all required transfer fields.");
            return;
        }
        if (sourceWarehouseId === destinationWarehouseId) {
            setTransferError("Source and Destination warehouses must be different.");
            return;
        }
        if (transferQuantity <= 0) {
            setTransferError("Quantity must be greater than 0.");
            return;
        }
        setTransferSubmitting(true);
        setTransferError("");
        try {
            await createTransferApi({
                source_warehouse_id: sourceWarehouseId,
                destination_warehouse_id: destinationWarehouseId,
                product_id: selectedProductId,
                quantity: Number(transferQuantity),
                notes: transferNotes.trim() || undefined,
            });
            setTransferModalOpen(false);
            setTransferNotes("");
            setTransferQuantity(5);
            toast.success("Transfer initiated", "Stock transfer logged.");
            await loadData();
        }
        catch (err) {
            setTransferError(err.message || "Failed to create transfer");
        }
        finally {
            setTransferSubmitting(false);
        }
    };
    const handleDispatch = async (transferId) => {
        setActionLoading(transferId);
        try {
            await dispatchTransferApi(transferId);
            toast.success("Transfer dispatched", "Transit movement initiated.");
            await loadData();
        }
        catch (err) {
            toast.error("Dispatch failed", err.message || "Unknown error");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleReceive = async (transferId) => {
        setActionLoading(transferId);
        try {
            await receiveTransferApi(transferId);
            toast.success("Transfer received", "Destination facility stock replenished.");
            await loadData();
        }
        catch (err) {
            toast.error("Receive failed", err.message || "Unknown error");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleCancel = (transferId) => {
        setTransferIdToCancel(transferId);
    };
    const filteredTransfers = transfers.filter((t) => {
        if (filterStatus === "ALL")
            return true;
        return t.status === filterStatus;
    });
    const getStatusBadge = (status) => {
        switch (status) {
            case "REQUESTED":
                return (<AnimatedBadge statusKey={status} variant="default" icon={Clock}>
            REQUESTED
          </AnimatedBadge>);
            case "IN_TRANSIT":
                return (<AnimatedBadge statusKey={status} variant="warning" icon={Truck} pulse>
            IN TRANSIT
          </AnimatedBadge>);
            case "RECEIVED":
                return (<AnimatedBadge statusKey={status} variant="success" icon={CheckCircle2}>
            RECEIVED
          </AnimatedBadge>);
            case "CANCELLED":
                return (<AnimatedBadge statusKey={status} variant="danger" icon={Ban}>
            CANCELLED
          </AnimatedBadge>);
        }
    };

    if (loading && warehouses.length === 0) {
      return <PageSkeleton hasKpis={false} tableRows={5} />;
    }

    return (<motion.div className="space-y-6" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
      {/* Top Header */}
      <PageHeader title={<span className="flex items-center gap-2.5">
            <WarehouseIcon className="w-6 h-6 text-slate-900 dark:text-[#F4F5F7]"/>
            Warehouses & Stock Transfers
          </span>} subtitle="Multi-facility inventory nodes, physical stock routing, and inter-depot logistics." actions={<>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}/>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWarehouseModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5"/>
              New Warehouse
            </Button>
            <Button size="sm" onClick={() => setTransferModalOpen(true)} disabled={warehouses.length < 2}>
              <Truck className="w-4 h-4 mr-1.5"/>
              Transfer Stock
            </Button>
          </>}/>

      {/* Warehouses Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Storage Facilities ({warehouses.length})
          </h2>
          {warehouses.length < 2 && (<span className="text-xs text-slate-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5"/>
              Add at least 2 warehouses to initiate inter-depot transfers.
            </span>)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {warehouses.map((wh) => (<SpotlightCard key={wh.id} className="p-4 shadow-2xs hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-sm">{wh.name}</h3>
                      {wh.is_default && (<Badge variant="success" className="text-[10px] uppercase tracking-wide">
                          Default
                        </Badge>)}
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-[#9BA3AF] mt-0.5">{wh.code}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#20242D] flex items-center justify-center text-slate-600 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#323744]">
                    <WarehouseIcon className="w-4 h-4"/>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#9BA3AF] mb-1">
                    <span>Capacity</span>
                    <span className="font-mono text-slate-400 dark:text-[#7C8189]">Uncapped</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full border border-dashed border-slate-200 dark:border-[#3A404F] bg-slate-50 dark:bg-[#23262F]"/>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-[#262A34] flex items-center justify-between text-xs text-slate-400 dark:text-[#7C8189]">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#7C8189] shrink-0"/>
                    {wh.location || "General Logistics Zone"}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-[#7C8189] shrink-0">
                    {formatDate(wh.created_at)}
                  </span>
                </div>
            </SpotlightCard>))}
        </div>
      </motion.div>

        {/* Stock Transfers Table */}
        <motion.div variants={itemVariants}>
          <Card spotlight={true} className="shadow-2xs">
            <CardHeader className="border-b border-slate-100 dark:border-[#262A34] py-3 px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-900 dark:text-[#F4F5F7]"/>
                  Inter-Warehouse Stock Transfers
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                  Lifecycle audit: REQUESTED → IN_TRANSIT → RECEIVED.
                </p>
              </div>

              {/* Filter Tabs with Sliding Indicator */}
              <Tabs tabs={["ALL", "REQUESTED", "IN_TRANSIT", "RECEIVED", "CANCELLED"]} activeTab={filterStatus} onChange={setFilterStatus} layoutId="warehouses-filter-tabs" variant="pill"/>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (<div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-48", "w-16", "w-24", "w-32", "w-24"]}/>
                <SkeletonAnnouncer label="Loading stock transfers"/>
              </div>) : filteredTransfers.length === 0 ? (<EmptyState compact icon={Package} title="No transfers found" description={filterStatus !== "ALL"
                ? `No transfers with status ${filterStatus.replace("_", " ")}.`
                : "Create an inter-warehouse transfer to balance facility stock."}/>) : (<div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-[#CBD5E1]">
                    <thead className="bg-slate-50 dark:bg-[#1C1F27] text-[11px] uppercase font-medium text-slate-500 dark:text-[#9BA3AF] border-b border-slate-100 dark:border-[#2A2E39]">
                      <tr>
                        <th className="py-2.5 px-3.5">Transfer #</th>
                        <th className="py-2.5 px-3.5">Product</th>
                        <th className="py-2.5 px-3.5">Routing Path</th>
                        <th className="py-2.5 px-3.5 text-right">Quantity</th>
                        <th className="py-2.5 px-3.5 text-center">Status</th>
                        <th className="py-2.5 px-3.5">Notes</th>
                        <th className="py-2.5 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#262A34]">
                      {filteredTransfers.map((tr) => {
                const isActing = actionLoading === tr.id;
                return (<tr key={tr.id} className="hover:bg-slate-50/70 dark:hover:bg-[#20242D]/50 transition-colors">
                            <td className="py-2.5 px-3.5 font-mono text-xs font-semibold text-slate-900 dark:text-[#F4F5F7]">
                              {tr.transfer_number}
                              <div className="text-[10px] font-normal text-slate-400 dark:text-[#7C8189] mt-0.5">
                                {formatDate(tr.created_at)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-medium text-slate-900 dark:text-[#F4F5F7]">
                                {tr.product?.name || "Product"}
                              </div>
                              <span className="font-mono text-[11px] text-slate-400 dark:text-[#7C8189]">
                                {tr.product?.sku || "SKU-UNKNOWN"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <button type="button" onClick={() => setSelectedVisualizerTransfer(tr)} className="group flex items-center gap-1.5 text-xs text-left hover:text-black dark:hover:text-white transition-colors" title="Click to view transit visualizer">
                                <span className="font-medium text-slate-700 dark:text-[#CBD5E1] group-hover:text-slate-950 dark:group-hover:text-white underline decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-zinc-900 dark:group-hover:decoration-white underline-offset-2">
                                  {tr.source_warehouse?.name || "Source WH"}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5"/>
                                <span className="font-medium text-slate-700 dark:text-[#CBD5E1] group-hover:text-slate-950 dark:group-hover:text-white underline decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-zinc-900 dark:group-hover:decoration-white underline-offset-2">
                                  {tr.destination_warehouse?.name || "Dest WH"}
                                </span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 dark:text-[#F4F5F7]">
                              {tr.quantity}{" "}
                              <span className="text-[11px] text-slate-400 dark:text-[#7C8189] font-normal">
                                {tr.product?.unit || "units"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              {getStatusBadge(tr.status)}
                            </td>
                            <td className="py-2.5 px-3.5 text-xs text-slate-400 dark:text-[#7C8189] max-w-xs truncate">
                              {tr.notes || "—"}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedVisualizerTransfer(tr)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs h-7 px-2" title="View Transfer Route Visualizer">
                                  Visualizer
                                </Button>

                                {tr.status === "REQUESTED" && (<>
                                    <Button size="sm" onClick={() => handleDispatch(tr.id)} disabled={isActing} className="bg-slate-950 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 shadow-xs text-xs h-7 px-2.5">
                                      <Truck className="w-3 h-3 mr-1"/>
                                      Dispatch
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancel(tr.id)} disabled={isActing} className="text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs h-7 px-2">
                                      Cancel
                                    </Button>
                                  </>)}

                                {tr.status === "IN_TRANSIT" && (<>
                                    <Button size="sm" onClick={() => handleReceive(tr.id)} disabled={isActing} className="bg-slate-950 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 shadow-xs text-xs h-7 px-2.5">
                                      <CheckCircle2 className="w-3 h-3 mr-1"/>
                                      Receive
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancel(tr.id)} disabled={isActing} className="text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs h-7 px-2">
                                      Cancel
                                    </Button>
                                  </>)}

                                {(tr.status === "RECEIVED" || tr.status === "CANCELLED") && (<span className="text-xs text-slate-400 dark:text-[#7C8189] font-medium italic">
                                    Archived
                                  </span>)}
                              </div>
                            </td>
                          </tr>);
                      })}
                    </tbody>
                  </table>
                </div>)}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal: New Warehouse */}
        <FormModal
          isOpen={warehouseModalOpen}
          onClose={() => setWarehouseModalOpen(false)}
          title="Add Storage Facility"
          icon={WarehouseIcon}
          onSubmit={handleCreateWarehouse}
          isSubmitting={warehouseSubmitting}
          submitText="Create Facility"
          error={warehouseError}
          maxWidth="md"
        >
          <FormField label="Warehouse Name *">
            <Input
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              placeholder="e.g. West Coast Distribution Hub"
              required
            />
          </FormField>

          <FormField label="Facility Code (Unique) *">
            <Input
              value={warehouseCode}
              onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-WEST-01"
              required
            />
          </FormField>

          <FormField label="Location / Address">
            <Input
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="e.g. Port of Oakland, CA"
            />
          </FormField>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="whDefault"
              checked={warehouseIsDefault}
              onChange={(e) => setWarehouseIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-[#20242D] text-slate-900 focus:ring-zinc-950"
            />
            <label htmlFor="whDefault" className="text-xs text-slate-700 dark:text-[#CBD5E1] cursor-pointer">
              Set as default receiving facility for new inventory
            </label>
          </div>
        </FormModal>

        {/* Modal: New Transfer */}
        <FormModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          title="Initiate Stock Transfer"
          icon={Truck}
          onSubmit={handleCreateTransfer}
          isSubmitting={transferSubmitting}
          submitText="Create Transfer Request"
          error={transferError}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Source Warehouse *">
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className={selectClass}
                required
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Destination Warehouse *">
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
                className={selectClass}
                required
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Select Product *">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={selectClass}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}]
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Quantity to Transfer *"
            hint="Stock will be held and deducted from source warehouse upon Dispatch."
          >
            <Input
              type="number"
              min="1"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </FormField>

          <FormField label="Routing Notes / Manifest">
            <Input
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="e.g. Urgent regional rebalancing"
            />
          </FormField>
        </FormModal>

        {/* Modal: Transfer Visualizer */}
        <Modal isOpen={!!selectedVisualizerTransfer} onClose={() => setSelectedVisualizerTransfer(null)} maxWidth="lg" className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-900"/>
              Stock Transit Route Visualizer
            </h3>
            <button onClick={() => setSelectedVisualizerTransfer(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5"/>
            </button>
          </div>

          {selectedVisualizerTransfer && (<div className="space-y-4 mt-4">
              <WarehouseTransferVisualizer transfer={selectedVisualizerTransfer}/>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedVisualizerTransfer(null)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  Close
                </Button>
              </div>
            </div>)}
        </Modal>

        <ConfirmModal isOpen={!!transferIdToCancel} onClose={() => setTransferIdToCancel(null)} onConfirm={async () => {
            if (!transferIdToCancel)
                return;
            setActionLoading(transferIdToCancel);
            try {
                await cancelTransferApi(transferIdToCancel);
                setTransferIdToCancel(null);
                toast.success("Transfer cancelled", "Stock transfer marked as cancelled.");
                await loadData();
            }
            catch (err) {
                toast.error("Cancel failed", err.message || "Unknown error");
            }
            finally {
                setActionLoading(null);
            }
        }} title="Cancel Stock Transfer" description="Are you sure you want to cancel this stock transfer? The transfer between facilities will be terminated and marked cancelled." confirmText="Cancel Transfer" variant="danger"/>
      </motion.div>);
}
