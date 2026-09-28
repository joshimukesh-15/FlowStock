"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Truck, Plus, Trash2, CheckCircle2, Clock, Ban, Building2, RefreshCw, X, Eye, Send, PackagePlus, Boxes, IndianRupee } from "lucide-react";
import { fetchPurchaseOrders, createPurchaseOrderApi, issuePurchaseOrderApi, receivePurchaseOrderApi, cancelPurchaseOrderApi, fetchSuppliers, createSupplierApi, fetchProducts, fetchWarehouses, } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { POLifecycleStepper } from "@/components/ui/POLifecycleStepper";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";
import { KpiGrid } from "@/components/ui/KpiGrid";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCard } from "@/components/ui/StatCard";
import { TableSkeleton, PageSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { Alert } from "@/components/ui/Alert";
import { formatDate, selectClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotion, createStaggerContainer, slideUpVariants, pageEnterVariants } from "@/motion";
export default function PurchasingPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [poIdToCancel, setPoIdToCancel] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    // Create PO Modal State
    const [poModalOpen, setPoModalOpen] = useState(false);
    const [poSupplierId, setPoSupplierId] = useState("");
    const [poWarehouseId, setPoWarehouseId] = useState("");
    const [poNotes, setPoNotes] = useState("");
    const [poItems, setPoItems] = useState([]);
    const [poError, setPoError] = useState("");
    const [poSubmitting, setPoSubmitting] = useState(false);
    // New Supplier Modal State
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [supName, setSupName] = useState("");
    const [supEmail, setSupEmail] = useState("");
    const [supPhone, setSupPhone] = useState("");
    const [supCompany, setSupCompany] = useState("");
    const [supAddress, setSupAddress] = useState("");
    const [supTerms, setSupTerms] = useState("Net 30");
    const [supError, setSupError] = useState("");
    const [supSubmitting, setSupSubmitting] = useState(false);
    // PO Detail Modal State
    const [detailPO, setDetailPO] = useState(null);
    const loadData = async () => {
        if (purchaseOrders.length === 0)
            setLoading(true);
        try {
            const [posList, supList, prodList, whList] = await Promise.all([
                fetchPurchaseOrders(),
                fetchSuppliers(),
                fetchProducts(),
                fetchWarehouses(),
            ]);
            setPurchaseOrders(posList);
            setSuppliers(supList);
            setProducts(prodList);
            setWarehouses(whList);
            if (supList.length > 0 && !poSupplierId) {
                setPoSupplierId(supList[0].id);
            }
            if (whList.length > 0 && !poWarehouseId) {
                setPoWarehouseId(whList[0].id);
            }
        }
        catch (err) {
            console.error("Failed to load purchasing data:", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, [currentOrg?.id]);
    const handleOpenCreatePO = () => {
        if (products.length === 0) {
            toast.warning("Catalog empty", "Please add products to catalog first before creating purchase orders.");
            return;
        }
        if (warehouses.length === 0) {
            toast.warning("No warehouse found", "Please add at least one warehouse before creating purchase orders.");
            return;
        }
        if (suppliers.length === 0) {
            setSupplierModalOpen(true);
            return;
        }
        setPoSupplierId(suppliers[0].id);
        setPoWarehouseId(warehouses[0].id);
        setPoNotes("");
        setPoItems([
            {
                product_id: products[0].id,
                quantity: 10,
                unit_cost: products[0].cost_price,
            },
        ]);
        setPoError("");
        setPoModalOpen(true);
    };
    const handleAddItemRow = () => {
        if (products.length === 0)
            return;
        setPoItems([
            ...poItems,
            {
                product_id: products[0].id,
                quantity: 10,
                unit_cost: products[0].cost_price,
            },
        ]);
    };
    const handleRemoveItemRow = (index) => {
        if (poItems.length <= 1)
            return;
        setPoItems(poItems.filter((_, i) => i !== index));
    };
    const handleItemChange = (index, field, value) => {
        const updated = [...poItems];
        if (field === "product_id") {
            const prod = products.find((p) => p.id === value);
            updated[index].product_id = value;
            if (prod)
                updated[index].unit_cost = prod.cost_price;
        }
        else if (field === "quantity") {
            updated[index].quantity = Math.max(1, parseInt(value) || 1);
        }
        else if (field === "unit_cost") {
            updated[index].unit_cost = Math.max(0, parseFloat(value) || 0);
        }
        setPoItems(updated);
    };
    const poCalculatedTotal = poItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    const handleCreatePOSubmit = async (e) => {
        e.preventDefault();
        if (!poSupplierId || !poWarehouseId) {
            setPoError("Please select both a supplier and a receiving warehouse.");
            return;
        }
        if (poItems.length === 0) {
            setPoError("Please add at least one line item.");
            return;
        }
        setPoSubmitting(true);
        setPoError("");
        try {
            await createPurchaseOrderApi({
                supplier_id: poSupplierId,
                destination_warehouse_id: poWarehouseId,
                notes: poNotes.trim() || undefined,
                items: poItems.map((it) => ({
                    product_id: it.product_id,
                    quantity: Number(it.quantity),
                    unit_cost: Number(it.unit_cost),
                })),
            });
            setPoModalOpen(false);
            toast.success("Purchase order created", "PO registered in draft state.");
            await loadData();
        }
        catch (err) {
            setPoError(err.message || "Failed to create purchase order");
        }
        finally {
            setPoSubmitting(false);
        }
    };
    const handleCreateSupplierSubmit = async (e) => {
        e.preventDefault();
        if (!supName.trim() || !supEmail.trim()) {
            setSupError("Supplier name and email are required.");
            return;
        }
        setSupSubmitting(true);
        setSupError("");
        try {
            const newSup = await createSupplierApi({
                name: supName.trim(),
                email: supEmail.trim().toLowerCase(),
                phone: supPhone.trim() || undefined,
                company: supCompany.trim() || undefined,
                address: supAddress.trim() || undefined,
                payment_terms: supTerms || "Net 30",
            });
            toast.success("Supplier created", `${newSup.name} added to vendor directory.`);
            setSupplierModalOpen(false);
            setSupName("");
            setSupEmail("");
            setSupPhone("");
            setSupCompany("");
            setSupAddress("");
            setSupTerms("Net 30");
            await loadData();
            setPoSupplierId(newSup.id);
        }
        catch (err) {
            setSupError(err.message || "Failed to create supplier");
        }
        finally {
            setSupSubmitting(false);
        }
    };
    const handleIssuePO = async (poId) => {
        setActionLoading(poId);
        try {
            const updated = await issuePurchaseOrderApi(poId);
            if (detailPO?.id === poId)
                setDetailPO(updated);
            toast.success("PO issued", `Purchase order ${updated.po_number} issued to supplier.`);
            await loadData();
        }
        catch (err) {
            toast.error("Issue PO error", err.message || "Unable to issue PO");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleReceivePO = async (poId) => {
        setActionLoading(poId);
        try {
            const updated = await receivePurchaseOrderApi(poId);
            if (detailPO?.id === poId)
                setDetailPO(updated);
            toast.success("Goods received", `Inventory updated for PO ${updated.po_number}.`);
            await loadData();
        }
        catch (err) {
            toast.error("Receiving error", err.message || "Unable to receive goods");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleCancelPO = (poId) => {
        setPoIdToCancel(poId);
    };
    // KPIs
    const receivedPOs = purchaseOrders.filter((p) => p.status === "RECEIVED");
    const totalProcuredAmount = receivedPOs.reduce((sum, p) => sum + p.total_amount, 0);
    const activePOCount = purchaseOrders.filter((p) => p.status === "DRAFT" || p.status === "ISSUED").length;
    const issuedPOs = purchaseOrders.filter((p) => p.status === "ISSUED");
    const inboundUnits = issuedPOs.reduce((sum, p) => sum + p.items.reduce((iSum, it) => iSum + it.quantity, 0), 0);
    const filteredPOs = purchaseOrders.filter((p) => {
        if (statusFilter !== "ALL" && p.status !== statusFilter)
            return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchNum = p.po_number.toLowerCase().includes(q);
            const matchSup = p.supplier?.name.toLowerCase().includes(q) || false;
            const matchCompany = p.supplier?.company?.toLowerCase().includes(q) || false;
            return matchNum || matchSup || matchCompany;
        }
        return true;
    });
    if (loading && purchaseOrders.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={6} />;
    }

    return (<motion.div className="space-y-6" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
      {/* Top Header */}
      <PageHeader title={<span className="flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-slate-900 dark:text-[#F4F5F7]"/>
            Suppliers & Purchasing
          </span>} subtitle="Vendor purchase orders, inbound goods receiving, and warehouse restocking." actions={<>
            <RefreshButton onClick={loadData} />
            <Button variant="outline" size="sm" onClick={() => setSupplierModalOpen(true)}>
              <Building2 className="w-4 h-4 mr-1.5"/>
              New Supplier
            </Button>
            <Button size="sm" onClick={handleOpenCreatePO}>
              <Plus className="w-4 h-4 mr-1.5"/>
              Create Purchase Order
            </Button>
          </>}/>

      {/* KPI Metrics Cards */}
      <KpiGrid>
        <StatCard
          title="Total Goods Procured"
          value={totalProcuredAmount}
          prefix="₹"
          formatINR
          decimals={2}
          icon={IndianRupee}
          subText="Fulfilled purchase expenditures"
        />
        <StatCard
          title="Active Purchase Orders"
          value={activePOCount}
          icon={Clock}
          subText="Draft + Issued to vendor"
        />
        <StatCard
          title="Incoming Units"
          value={inboundUnits}
          icon={PackagePlus}
          subText="Awaiting warehouse intake"
        />
        <StatCard
          title="Active Suppliers"
          value={suppliers.length}
          icon={Building2}
          subText="Registered vendor partners"
        />
      </KpiGrid>

        {/* Purchase Orders Table Container */}
        <Card className="">
          <CardHeader className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by PO # or vendor..." className="w-64"/>

              {/* Status Filter Tabs with Sliding Indicator */}
              <Tabs tabs={["ALL", "DRAFT", "ISSUED", "RECEIVED", "CANCELLED"]} activeTab={statusFilter} onChange={setStatusFilter} layoutId="purchasing-status-tabs" variant="pill"/>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-900">{filteredPOs.length}</span> purchase orders
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (<div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-32", "w-14", "w-28", "w-24", "w-24"]}/>
                <SkeletonAnnouncer label="Loading purchase orders"/>
              </div>) : filteredPOs.length === 0 ? (<EmptyState compact icon={Truck} title="No purchase orders found" description="Create a purchase order to procure goods and replenish warehouse inventory." action={<Button size="sm" variant="primary" onClick={() => setPoModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5"/>
                    Create Purchase Order
                  </Button>}/>) : (<div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">PO Number</th>
                      <th className="py-3.5 px-4">Vendor / Supplier</th>
                      <th className="py-3.5 px-4">Receiving Warehouse</th>
                      <th className="py-3.5 px-4 text-center">Items</th>
                      <th className="py-3.5 px-4 text-right">PO Total</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPOs.map((po) => {
                const isActing = actionLoading === po.id;
                const itemCount = po.items.reduce((acc, it) => acc + it.quantity, 0);
                return (<tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">
                            {po.po_number}
                            <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                              {formatDate(po.created_at)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900">{po.supplier?.name || "Supplier"}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              {po.supplier?.company && (<span className="font-medium text-slate-600">
                                  {po.supplier.company}
                                </span>)}
                              <span className="text-slate-400 font-mono text-[11px]">
                                {po.supplier?.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            <div>
                              <span className="text-slate-700 font-medium">
                                {po.destination_warehouse?.name || "Acme Central DC"}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 block">
                                {po.destination_warehouse?.code || "WH-MAIN"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                            {po.items.length} lines ({itemCount} units)
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{po.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StatusBadge status={po.status} type="po" />
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setDetailPO(po)}
                                title="View Purchase Order"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                Details
                              </Button>

                              {po.status === "DRAFT" && (
                                <>
                                  <Button
                                    variant="solid"
                                    size="xs"
                                    onClick={() => handleIssuePO(po.id)}
                                    disabled={isActing}
                                    title="Issue Purchase Order"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Issue PO
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleCancelPO(po.id)}
                                    disabled={isActing}
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    title="Cancel PO"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {po.status === "ISSUED" && (
                                <>
                                  <Button
                                    variant="solid"
                                    size="xs"
                                    onClick={() => handleReceivePO(po.id)}
                                    disabled={isActing}
                                    title="Receive Goods & Restock"
                                  >
                                    <PackagePlus className="w-3.5 h-3.5" />
                                    Receive Goods
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleCancelPO(po.id)}
                                    disabled={isActing}
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    title="Cancel PO"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>);
            })}
                  </tbody>
                </table>
              </div>)}
          </CardContent>
        </Card>

        {/* Modal: Create Purchase Order */}
        <FormModal
          isOpen={poModalOpen}
          onClose={() => setPoModalOpen(false)}
          title="Create Purchase Order (PO)"
          icon={Truck}
          onSubmit={handleCreatePOSubmit}
          isSubmitting={poSubmitting}
          submitText="Save Draft Purchase Order"
          error={poError}
          maxWidth="2xl"
          bodyClassName="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Vendor / Supplier *">
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                className={selectClass}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.company ? `(${s.company})` : ""}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Destination Warehouse *">
              <select
                value={poWarehouseId}
                onChange={(e) => setPoWarehouseId(e.target.value)}
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

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF]">
                Procurement Items
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemRow}
                className="text-xs h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {poItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25] text-xs"
                >
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                      className={selectClass}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.sku}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="w-24">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-500 text-xs">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(idx, "unit_cost", e.target.value)}
                        placeholder="Cost"
                        className="h-9 text-xs pl-6 font-mono"
                      />
                    </div>
                  </div>

                  <div className="w-24 text-right font-mono font-semibold text-slate-900 dark:text-[#F4F5F7]">
                    ₹{(item.quantity * item.unit_cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={poItems.length <= 1}
                    className={`p-1.5 rounded transition-colors ${
                      poItems.length <= 1
                        ? "text-slate-400 cursor-not-allowed"
                        : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* PO Total Preview */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-[#9BA3AF] font-medium">Estimated PO Cost:</span>
              <span className="text-base font-bold text-slate-900 dark:text-[#F4F5F7] font-mono">
                ₹{poCalculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <FormField label="Procurement Notes / Terms">
            <Input
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              placeholder="e.g. Standard 30-day billing invoice"
            />
          </FormField>
        </FormModal>

        {/* Modal: New Supplier */}
        <FormModal
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
          title="Register Vendor / Supplier"
          icon={Building2}
          onSubmit={handleCreateSupplierSubmit}
          isSubmitting={supSubmitting}
          submitText="Save Supplier"
          error={supError}
          maxWidth="md"
        >
          <FormField label="Vendor Contact Name *">
            <Input
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="e.g. Anand Mahindra"
              required
            />
          </FormField>

          <FormField label="Vendor Email *">
            <Input
              type="email"
              value={supEmail}
              onChange={(e) => setSupEmail(e.target.value)}
              placeholder="e.g. sales@vendor.in"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Company Name">
              <Input
                value={supCompany}
                onChange={(e) => setSupCompany(e.target.value)}
                placeholder="e.g. Mahindra Heavy Parts"
              />
            </FormField>
            <FormField label="Phone Number">
              <Input
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                placeholder="e.g. +91 98200 55443"
              />
            </FormField>
          </div>

          <FormField label="Registered Office / Plant Address">
            <Input
              value={supAddress}
              onChange={(e) => setSupAddress(e.target.value)}
              placeholder="e.g. Plant 4, MIDC Industrial Area, Pune"
            />
          </FormField>

          <FormField label="Payment Terms">
            <select
              value={supTerms}
              onChange={(e) => setSupTerms(e.target.value)}
              className={selectClass}
            >
              <option value="Immediate">Immediate / Advance</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 60">Net 60 Days</option>
            </select>
          </FormField>
        </FormModal>

        {/* Modal: PO Details & Inbound Receiving */}
        <Modal isOpen={!!detailPO} onClose={() => setDetailPO(null)} maxWidth="2xl" className="p-6 max-h-[90vh] flex flex-col">
          {detailPO && (<>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900/10 text-slate-900 flex items-center justify-center border border-zinc-900/20">
                    <Truck className="w-5 h-5"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg font-mono">
                      {detailPO.po_number}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Created on {formatDate(detailPO.created_at, true)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detailPO.status} type="po" />
                  <button onClick={() => setDetailPO(null)} className="text-slate-400 hover:text-slate-700 ml-2">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
                {/* PO Lifecycle Stepper (Real backend state) */}
                <POLifecycleStepper status={detailPO.status} createdAt={detailPO.created_at} updatedAt={detailPO.updated_at}/>

                {/* Supplier & Receiving Warehouse Cards */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Vendor / Supplier</span>
                    <span className="font-semibold text-slate-900">{detailPO.supplier?.name}</span>
                    {detailPO.supplier?.company && (<span className="text-slate-400 block">{detailPO.supplier.company}</span>)}
                    <span className="text-slate-400 font-mono block mt-0.5">
                      {detailPO.supplier?.email}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-1">
                      Terms: {detailPO.supplier?.payment_terms || "Net 30"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Receiving Destination Depot</span>
                    <span className="font-semibold text-slate-900">
                      {detailPO.destination_warehouse?.name || "Acme Central DC"}
                    </span>
                    <span className="text-slate-500 font-mono block">
                      {detailPO.destination_warehouse?.code || "WH-MAIN"}
                    </span>
                    {detailPO.destination_warehouse?.location && (<span className="text-slate-400 block mt-1 truncate">
                        Location: {detailPO.destination_warehouse.location}
                      </span>)}
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Procured Goods Breakdown ({detailPO.items.length})
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-medium border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Cost (₹)</th>
                          <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detailPO.items.map((it) => (<tr key={it.id}>
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-900 block">
                                {it.product?.name || "Product"}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {it.product?.sku || "SKU"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {it.quantity} {it.product?.unit || "units"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              ₹{it.unit_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                              ₹{it.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold border-t border-slate-100">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right text-slate-400">
                            Total Procurement Value:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900">
                            ₹{detailPO.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* State Machine Status Card */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-slate-900"/>
                    Inventory Restocking Impact:
                  </div>
                  {detailPO.status === "DRAFT" && (<p className="text-slate-400 text-[11px]">
                      This PO is currently in <strong>DRAFT</strong>. Click &quot;Issue PO&quot; to send it to the supplier.
                    </p>)}
                  {detailPO.status === "ISSUED" && (<p className="text-slate-700 text-[11px]">
                      This PO has been <strong>ISSUED</strong> to the vendor. Awaiting shipment arrival at destination facility.
                      Click &quot;Receive Goods&quot; upon delivery to automatically append IN movements to the warehouse ledger.
                    </p>)}
                  {detailPO.status === "RECEIVED" && (<p className="text-slate-900 text-[11px]">
                      Goods have been <strong>RECEIVED</strong>! Inventory records have been appended with positive IN changes.
                    </p>)}
                  {detailPO.status === "CANCELLED" && (<p className="text-slate-400 text-[11px]">
                      This purchase order was <strong>CANCELLED</strong>. No inventory was touched.
                    </p>)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2B2E25] mt-4">
                <Button variant="ghost" size="sm" onClick={() => setDetailPO(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {detailPO.status === "DRAFT" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelPO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                        className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs"
                      >
                        Cancel PO
                      </Button>
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={() => handleIssuePO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Issue PO to Vendor
                      </Button>
                    </>
                  )}

                  {detailPO.status === "ISSUED" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelPO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                        className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs"
                      >
                        Cancel PO
                      </Button>
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={() => handleReceivePO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Receive Goods & Restock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>)}
        </Modal>

        <ConfirmModal isOpen={!!poIdToCancel} onClose={() => setPoIdToCancel(null)} onConfirm={async () => {
            if (!poIdToCancel)
                return;
            setActionLoading(poIdToCancel);
            try {
                const updated = await cancelPurchaseOrderApi(poIdToCancel);
                if (detailPO?.id === poIdToCancel)
                    setDetailPO(updated);
                setPoIdToCancel(null);
                toast.success("PO cancelled", `Purchase order ${updated.po_number} was cancelled.`);
                await loadData();
            }
            catch (err) {
                toast.error("Cancellation error", err.message || "Unable to cancel PO");
            }
            finally {
                setActionLoading(null);
            }
        }} title="Cancel Purchase Order" description="Are you sure you want to cancel this purchase order? This inbound procurement request will be marked cancelled." confirmText="Cancel PO" variant="danger"/>
      </motion.div>);
}
