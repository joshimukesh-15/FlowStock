"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Truck, Plus, CheckCircle2, Ban, X, Eye, Send, MapPin, IndianRupee, Navigation, PackageCheck, Building, } from "lucide-react";
import { fetchShipments, fetchOrders, createShipmentApi, dispatchShipmentApi, outForDeliveryShipmentApi, deliverShipmentApi, cancelShipmentApi, addShipmentEventApi, } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { formatINR, formatDate, selectClass } from "@/lib/utils";
import { ShipmentLifecycleStepper } from "@/components/ui/ShipmentLifecycleStepper";
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
import { motion } from "framer-motion";
import { useReducedMotion, pageEnterVariants } from "@/motion";
const CARRIERS = [
    "Blue Dart",
    "Delhivery",
    "DTDC",
    "Gati KWE",
    "India Post",
    "Safechem Logistics",
    "TCI Freight",
    "Other Carrier",
];
export default function ShipmentsPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const [shipments, setShipments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [shipmentIdToCancel, setShipmentIdToCancel] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    // Create Shipment Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [carrier, setCarrier] = useState(CARRIERS[0]);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shippingCost, setShippingCost] = useState(850);
    const [originAddress, setOriginAddress] = useState("");
    const [destinationAddress, setDestinationAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // Timeline / Tracking Detail Modal State
    const [detailShipment, setDetailShipment] = useState(null);
    const [newCheckpointLocation, setNewCheckpointLocation] = useState("");
    const [newCheckpointDesc, setNewCheckpointDesc] = useState("");
    const selectOrderForCreation = (order, orderId) => {
        setSelectedOrderId(orderId);
        if (order) {
            setDestinationAddress(order.customer?.shipping_address ||
                order.customer?.billing_address ||
                `Consignee ${order.customer?.name || "Client"}`);
            setOriginAddress(order.warehouse
                ? `${order.warehouse.name} (${order.warehouse.location || "Central Depot"})`
                : "Central Logistics Facility");
        }
    };
    const loadData = async () => {
        if (shipments.length === 0)
            setLoading(true);
        try {
            const [shipmentsList, ordersList] = await Promise.all([
                fetchShipments(),
                fetchOrders(),
            ]);
            setShipments(shipmentsList);
            setOrders(ordersList);
            // Pre-select first eligible order if none selected
            const eligible = ordersList.filter((o) => ["CONFIRMED", "FULFILLED"].includes(o.status));
            if (eligible.length > 0 && !selectedOrderId) {
                selectOrderForCreation(eligible[0], eligible[0].id);
            }
        }
        catch (err) {
            console.error("Failed to load shipments data:", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, [currentOrg?.id]);
    const handleOrderChange = (orderId) => {
        const found = orders.find((o) => o.id === orderId);
        if (found) {
            selectOrderForCreation(found, orderId);
        }
        else {
            setSelectedOrderId(orderId);
        }
    };
    const handleGenerateTracking = () => {
        const prefix = carrier === "Blue Dart"
            ? "BD"
            : carrier === "Delhivery"
                ? "DLH"
                : carrier === "DTDC"
                    ? "DTDC"
                    : carrier === "Gati KWE"
                        ? "GATI"
                        : "TRK";
        const rand = Math.floor(10000000 + Math.random() * 90000000);
        setTrackingNumber(`${prefix}-${rand}`);
    };
    const handleCreateShipment = async (e) => {
        e.preventDefault();
        if (!selectedOrderId) {
            setFormError("Please select a sales order to fulfill and ship.");
            return;
        }
        if (!destinationAddress.trim()) {
            setFormError("Destination shipping address is required.");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            await createShipmentApi({
                order_id: selectedOrderId,
                carrier,
                tracking_number: trackingNumber.trim() || undefined,
                shipping_cost: Number(shippingCost) || 0,
                origin_address: originAddress.trim() || undefined,
                destination_address: destinationAddress.trim(),
                notes: notes.trim() || undefined,
            });
            setCreateModalOpen(false);
            setNotes("");
            setTrackingNumber("");
            toast.success("Shipment created", "Consignment generated and ready for pickup.");
            await loadData();
        }
        catch (err) {
            setFormError(err.message || "Failed to create shipment");
        }
        finally {
            setSubmitting(false);
        }
    };
    // State Transition Actions
    const handleDispatch = async (shipmentId) => {
        setActionLoading(shipmentId);
        try {
            const updated = await dispatchShipmentApi(shipmentId, {
                location: "Central Sorting Hub",
                description: "Handed over to carrier linehaul vehicle",
            });
            updateLocalShipment(updated);
            toast.success("Shipment dispatched", `Shipment ${updated.tracking_number} is in transit.`);
        }
        catch (err) {
            toast.error("Dispatch failed", err.message || "Unable to dispatch");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleOutForDelivery = async (shipmentId) => {
        setActionLoading(shipmentId);
        try {
            const updated = await outForDeliveryShipmentApi(shipmentId, {
                location: "Local Delivery Center",
                description: "Dispatched with local delivery agent for doorstep handover",
            });
            updateLocalShipment(updated);
            toast.success("Out for delivery", `Shipment ${updated.tracking_number} is out with local agent.`);
        }
        catch (err) {
            toast.error("Out for delivery failed", err.message || "Unable to update status");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleDeliver = async (shipmentId) => {
        setActionLoading(shipmentId);
        try {
            const updated = await deliverShipmentApi(shipmentId, {
                location: "Consignee Address",
                description: "Package delivered and electronic proof of delivery signed",
            });
            updateLocalShipment(updated);
            toast.success("Shipment delivered", `Proof of delivery confirmed for ${updated.tracking_number}.`);
        }
        catch (err) {
            toast.error("Delivery confirmation failed", err.message || "Unable to confirm delivery");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleCancel = (shipmentId) => {
        setShipmentIdToCancel(shipmentId);
    };
    const handleAddCheckpoint = async (e) => {
        e.preventDefault();
        if (!detailShipment || !newCheckpointLocation.trim() || !newCheckpointDesc.trim())
            return;
        setLoggingCheckpoint(true);
        try {
            const event = await addShipmentEventApi(detailShipment.id, {
                status: detailShipment.status,
                location: newCheckpointLocation.trim(),
                description: newCheckpointDesc.trim(),
            });
            const updatedEvents = [...(detailShipment.events || []), event];
            const updatedShipment = { ...detailShipment, events: updatedEvents };
            setDetailShipment(updatedShipment);
            setShipments((prev) => prev.map((s) => (s.id === updatedShipment.id ? updatedShipment : s)));
            setNewCheckpointLocation("");
            setNewCheckpointDesc("");
            toast.success("Checkpoint logged", "Milestone recorded to tracking timeline.");
        }
        catch (err) {
            toast.error("Failed to add checkpoint", err.message || "Unable to record event");
        }
        finally {
            setLoggingCheckpoint(false);
        }
    };
    const updateLocalShipment = (updated) => {
        setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        if (detailShipment && detailShipment.id === updated.id) {
            setDetailShipment(updated);
        }
    };
    // Filtered shipments
    const filteredShipments = shipments.filter((s) => {
        const matchesStatus = statusFilter === "ALL" ? true : s.status === statusFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
            s.shipment_number.toLowerCase().includes(query) ||
            s.tracking_number.toLowerCase().includes(query) ||
            s.carrier.toLowerCase().includes(query) ||
            s.destination_address.toLowerCase().includes(query) ||
            (s.order?.order_number && s.order.order_number.toLowerCase().includes(query)) ||
            (s.order?.customer?.name &&
                s.order.customer.name.toLowerCase().includes(query));
        return matchesStatus && matchesSearch;
    });
    // KPI calculations
    const inTransitCount = shipments.filter((s) => ["PENDING", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)).length;
    const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;
    const totalFreightSpend = shipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);
    const eligibleOrdersForShipping = orders.filter((o) => ["CONFIRMED", "FULFILLED"].includes(o.status));

    if (loading && shipments.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={6} />;
    }

    return (<motion.div className="space-y-6" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
      {/* Top Header */}
      <PageHeader title={<span className="flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-slate-900 dark:text-[#F4F5F7]"/>
            Shipments & Logistics Tracking
          </span>} subtitle="Consignment dispatch, carrier manifests, real-time AWB tracking, and checkpoint timelines." actions={<>
            <RefreshButton onClick={loadData} />
            <Button onClick={() => {
                if (eligibleOrdersForShipping.length > 0 && !selectedOrderId) {
                    selectOrderForCreation(eligibleOrdersForShipping[0], eligibleOrdersForShipping[0].id);
                }
                setCreateModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2"/>
              Create Shipment
            </Button>
          </>}/>

      {/* KPI Summary Cards */}
      <KpiGrid>
        <StatCard
          title="Active Consignments"
          value={inTransitCount}
          icon={Navigation}
          subText="En route or pending pickup"
        />
        <StatCard
          title="Delivered Consignments"
          value={deliveredCount}
          icon={PackageCheck}
          subText="Proof of delivery verified"
        />
        <StatCard
          title="Total Freight Spend"
          value={totalFreightSpend}
          prefix="₹"
          formatINR
          decimals={2}
          icon={IndianRupee}
          subText="Logistics expenditure"
        />
        <StatCard
          title="Ready to Dispatch"
          value={eligibleOrdersForShipping.length}
          icon={Building}
          subText="Confirmed sales orders"
        />
      </KpiGrid>

        {/* Table & Controls Card */}
        <Card spotlight={true} className="shadow-2xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-[#2B2E25]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Status Filter Tabs with Sliding Indicator */}
              <Tabs tabs={[
            { label: "All Consignments", id: "ALL" },
            { label: "Pending", id: "PENDING" },
            { label: "In Transit", id: "IN_TRANSIT" },
            { label: "Out for Delivery", id: "OUT_FOR_DELIVERY" },
            { label: "Delivered", id: "DELIVERED" },
            { label: "Cancelled", id: "CANCELLED" },
        ]} activeTab={statusFilter} onChange={setStatusFilter} layoutId="shipments-status-tabs" variant="pill"/>

              {/* Search Bar */}
              <SearchBar placeholder="Search AWB, carrier, order, or city..." value={searchQuery} onChange={setSearchQuery} className="w-full md:w-72"/>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (<div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-48", "w-36", "w-20", "w-24", "w-24"]}/>
                <SkeletonAnnouncer label="Loading logistics manifests"/>
              </div>) : filteredShipments.length === 0 ? (<EmptyState compact icon={Truck} title="No shipments found" description="Shipments matching the selected filters will appear here. Dispatch fulfilled orders to create one." action={<Button size="sm" variant="primary" onClick={() => setCreateModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5"/>
                    Create Shipment
                  </Button>}/>) : (<div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-[#CBD5E1]">
                  <thead className="bg-slate-50 dark:bg-[#191B15] text-[11px] text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider border-b border-slate-100 dark:border-[#33372B]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Shipment #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Order / Customer</th>
                      <th className="py-2.5 px-3.5 font-semibold">Carrier & Tracking AWB</th>
                      <th className="py-2.5 px-3.5 font-semibold">Route</th>
                      <th className="py-2.5 px-3.5 font-semibold">Freight</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2B2E25]">
                    {filteredShipments.map((s) => (<tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-[#191B15]/50 transition-colors group">
                        <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900 dark:text-[#F4F5F7]">
                          {s.shipment_number}
                          <div className="text-[10px] text-slate-400 dark:text-[#7C8189] font-sans mt-0.5">
                            {formatDate(s.created_at)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="font-semibold text-slate-900 dark:text-[#F4F5F7]">
                            {s.order?.order_number || "Order"}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                            {s.order?.customer?.name || "B2B Consignee"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-medium text-slate-800 dark:text-[#E2E8F0]">
                            {s.carrier}
                          </div>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-[#191B15] px-1.5 py-0.5 rounded text-slate-600 dark:text-[#9BA3AF] border border-slate-200 dark:border-[#33372B] mt-0.5">
                            {s.tracking_number}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 max-w-[220px]">
                          <div className="text-xs truncate text-slate-700 dark:text-[#CBD5E1] font-medium">
                            {s.destination_address}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-[#7C8189] truncate mt-0.5">
                            From: {s.origin_address || "Fulfillment Center"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-[#F4F5F7] font-mono">
                          {formatINR(s.shipping_cost || 0)}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <StatusBadge status={s.status} type="shipment" />
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setDetailShipment(s)}
                              title="Track Shipment Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              Track
                            </Button>
                            {s.status === "PENDING" && (
                              <Button
                                size="xs"
                                variant="solid"
                                onClick={() => handleDispatch(s.id)}
                                disabled={actionLoading === s.id}
                                title="Dispatch Shipment"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Dispatch
                              </Button>
                            )}
                            {s.status === "IN_TRANSIT" && (
                              <Button
                                size="xs"
                                variant="solid"
                                onClick={() => handleOutForDelivery(s.id)}
                                disabled={actionLoading === s.id}
                                title="Mark Out for Delivery"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                Out
                              </Button>
                            )}
                            {s.status === "OUT_FOR_DELIVERY" && (
                              <Button
                                size="xs"
                                variant="solid"
                                onClick={() => handleDeliver(s.id)}
                                disabled={actionLoading === s.id}
                                title="Confirm Delivery"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Deliver
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>)}
          </CardContent>
        </Card>

        {/* Modal 1: Create Shipment Modal */}
        <FormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Outbound Shipment"
          icon={Truck}
          onSubmit={handleCreateShipment}
          isSubmitting={submitting}
          submitText="Create & Manifest Consignment"
          submitDisabled={eligibleOrdersForShipping.length === 0}
          error={formError}
          maxWidth="xl"
          bodyClassName="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Select Sales Order */}
          <FormField label="Sales Order to Ship *">
            {eligibleOrdersForShipping.length === 0 ? (
              <div className="p-3 text-xs bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25] text-slate-700 dark:text-[#CBD5E1] rounded-lg">
                No confirmed or fulfilled sales orders available to ship. Please confirm a draft sales order first in Orders & Sales.
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                className={selectClass}
              >
                {eligibleOrdersForShipping.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} — {o.customer?.name} ({formatINR(o.total_amount)}) [{o.status}]
                  </option>
                ))}
              </select>
            )}
          </FormField>

          {/* Carrier & Tracking Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Carrier Partner *">
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className={selectClass}
              >
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Airway Bill (AWB) / Tracking #</span>
                  <button
                    type="button"
                    onClick={handleGenerateTracking}
                    className="text-[11px] text-slate-900 dark:text-[#F4F5F7] hover:underline font-normal"
                  >
                    Auto-generate
                  </button>
                </span>
              }
            >
              <Input
                placeholder="e.g. BD-882310"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="font-mono text-sm"
              />
            </FormField>
          </div>

          {/* Origin & Destination Addresses */}
          <div className="space-y-3">
            <FormField label="Origin Dispatch Hub">
              <Input
                placeholder="Central Distribution Center, Bhiwandi"
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                className="text-sm"
              />
            </FormField>

            <FormField label="Consignee Destination Address *">
              <Input
                placeholder="Plot 45, Hinjewadi Phase 1, Pune, MH"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="text-sm"
                required
              />
            </FormField>
          </div>

          {/* Freight Cost */}
          <FormField label="Shipping & Logistics Cost (₹)">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm">₹</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="pl-8 text-sm font-mono"
              />
            </div>
          </FormField>

          {/* Notes */}
          <FormField label="Logistics / Handling Notes">
            <Input
              placeholder="Fragile contents, tailgate required, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
            />
          </FormField>
        </FormModal>

        {/* Modal 2: Tracking Journey & Checkpoint Timeline Modal */}
        <Modal isOpen={!!detailShipment} onClose={() => setDetailShipment(null)} maxWidth="2xl" className="flex flex-col max-h-[90vh] overflow-hidden">
          {detailShipment && (<>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900 font-mono">
                      {detailShipment.shipment_number}
                    </h2>
                    <StatusBadge status={detailShipment.status} type="shipment" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Carrier: <span className="text-slate-900 font-medium">{detailShipment.carrier}</span> &bull; AWB:{" "}
                    <span className="font-mono text-slate-900">{detailShipment.tracking_number}</span>
                  </p>
                </div>
                <button onClick={() => setDetailShipment(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Consignment Lifecycle Stepper (Real backend status) */}
                <ShipmentLifecycleStepper status={detailShipment.status} carrier={detailShipment.carrier} trackingNumber={detailShipment.tracking_number}/>
                {/* Route & Consignment Info Banner */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[10px]">
                      Origin Dispatch Hub
                    </span>
                    <span className="text-slate-900 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
                      {detailShipment.origin_address || "Central DC"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[10px]">
                      Destination Consignee
                    </span>
                    <span className="text-slate-900 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-900 shrink-0"/>
                      {detailShipment.destination_address}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[10px]">
                      Sales Order Reference
                    </span>
                    <span className="text-slate-900 font-medium mt-0.5 block">
                      {detailShipment.order?.order_number} &bull; {detailShipment.order?.customer?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[10px]">
                      Freight Cost (₹)
                    </span>
                    <span className="text-slate-900 font-bold mt-0.5 block">
                      {formatINR(detailShipment.shipping_cost || 0)}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Actions */}
                <div className="p-3.5 bg-slate-50 dark:bg-[#191B15] rounded-lg border border-slate-200 dark:border-[#33372B] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C8189]">
                    Workflow Actions:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {detailShipment.status === "PENDING" && (
                      <Button size="sm" variant="solid" onClick={() => handleDispatch(detailShipment.id)}>
                        <Send className="w-3.5 h-3.5" /> Mark Dispatched
                      </Button>
                    )}
                    {["PENDING", "IN_TRANSIT"].includes(detailShipment.status) && (
                      <Button size="sm" variant="solid" onClick={() => handleOutForDelivery(detailShipment.id)}>
                        <Truck className="w-3.5 h-3.5" /> Out for Delivery
                      </Button>
                    )}
                    {detailShipment.status !== "DELIVERED" && detailShipment.status !== "CANCELLED" && (
                      <Button size="sm" variant="solid" onClick={() => handleDeliver(detailShipment.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery
                      </Button>
                    )}
                    {detailShipment.status !== "DELIVERED" && detailShipment.status !== "CANCELLED" && (
                      <Button size="sm" variant="outline" onClick={() => handleCancel(detailShipment.id)}>
                        <Ban className="w-3.5 h-3.5" /> Cancel Consignment
                      </Button>
                    )}
                  </div>
                </div>

                {/* Visual Timeline Section */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-slate-900"/>
                    Tracking Journey Timeline ({detailShipment.events?.length || 0} Checkpoints)
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {(detailShipment.events || []).map((ev, idx) => (<motion.div key={ev.id || idx} className="relative group" initial={{ opacity: 0, y: prefersReducedMotion ? 0 : DISTANCE.normal }} animate={{ opacity: 1, y: 0 }} transition={{
                    duration: prefersReducedMotion ? 0 : DURATION.normal,
                    delay: prefersReducedMotion ? 0 : idx * STAGGER.timeline,
                }}>
                        {/* Timeline Node */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${ev.status === "DELIVERED"
                    ? "bg-slate-950 border-zinc-950 text-white"
                    : ev.status === "CANCELLED"
                        ? "bg-slate-200 border-zinc-400 text-slate-700"
                        : ev.status === "OUT_FOR_DELIVERY"
                            ? "bg-slate-800 border-zinc-800 text-white"
                            : ev.status === "IN_TRANSIT"
                                ? "bg-zinc-600 border-zinc-600 text-white"
                                : "bg-slate-100 border-slate-300 text-slate-500"}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current"/>
                        </div>

                        {/* Timeline Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                              {ev.location}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {new Date(ev.created_at).toLocaleString("en-IN", {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                            </span>
                          </div>
                          <p className="text-slate-700">{ev.description}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <StatusBadge status={ev.status} type="shipment" />
                          </div>
                        </div>
                      </motion.div>))}
                  </div>
                </div>

                {/* Add Custom Transit Checkpoint Form */}
                {detailShipment.status !== "DELIVERED" &&
                detailShipment.status !== "CANCELLED" && (<form onSubmit={handleAddCheckpoint} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        + Log Real-Time Checkpoint Scan
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input placeholder="Location (e.g. Pune Gateway Hub)" value={newCheckpointLocation} onChange={(e) => setNewCheckpointLocation(e.target.value)} className="bg-white border-slate-300 text-xs h-8 text-slate-800" required/>
                        <Input placeholder="Checkpoint scan details..." value={newCheckpointDesc} onChange={(e) => setNewCheckpointDesc(e.target.value)} className="bg-white border-slate-300 text-xs h-8 text-slate-800" required/>
                      </div>
                      <div className="text-right">
                        <Button type="submit" size="sm" variant="solid" isLoading={loggingCheckpoint}>
                          {loggingCheckpoint ? "Logging..." : "Log Checkpoint Scan"}
                        </Button>
                      </div>
                    </form>)}
              </div>
            </>)}
        </Modal>

        <ConfirmModal isOpen={!!shipmentIdToCancel} onClose={() => setShipmentIdToCancel(null)} onConfirm={async () => {
            if (!shipmentIdToCancel)
                return;
            setActionLoading(shipmentIdToCancel);
            try {
                const updated = await cancelShipmentApi(shipmentIdToCancel, {
                    location: "Logistics Operations Desk",
                    description: "Shipment cancelled by system operator",
                });
                updateLocalShipment(updated);
                setShipmentIdToCancel(null);
                toast.success("Shipment cancelled", `Consignment ${updated.tracking_number} was cancelled.`);
            }
            catch (err) {
                toast.error("Cancellation failed", err.message || "Unable to cancel shipment");
            }
            finally {
                setActionLoading(null);
            }
        }} title="Cancel Consignment" description="Are you sure you want to cancel this consignment? The shipment status will be set to CANCELLED and logged in the tracking checkpoint timeline." confirmText="Cancel Consignment" variant="danger"/>
      </motion.div>);
}
