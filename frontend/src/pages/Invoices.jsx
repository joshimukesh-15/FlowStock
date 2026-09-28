"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReceiptText, Plus, Trash2, CheckCircle2, Ban, X, Eye, CreditCard, IndianRupee, FileText, ArrowDownLeft, } from "lucide-react";
import { fetchInvoices, fetchInvoiceById, fetchOrders, fetchCustomers, fetchProducts, createInvoiceApi, createInvoiceFromOrderApi, voidInvoiceApi, recordPaymentApi, } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { formatINR, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton, PageSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { Alert } from "@/components/ui/Alert";
import { KpiGrid } from "@/components/ui/KpiGrid";
import { motion } from "framer-motion";
import { pageEnterVariants, useReducedMotion } from "@/motion";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
const PAYMENT_METHODS = [
    { label: "Bank Transfer (NEFT / RTGS / IMPS)", value: "BANK_TRANSFER" },
    { label: "UPI (Unified Payments Interface)", value: "UPI" },
    { label: "Commercial Cheque / DD", value: "CHEQUE" },
    { label: "Net Banking", value: "NET_BANKING" },
    { label: "Cash / Cash Deposit", value: "CASH" },
];
export default function InvoicesPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const [invoices, setInvoices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [invoiceIdToVoid, setInvoiceIdToVoid] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    // Create Invoice Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createTab, setCreateTab] = useState("order");
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [orderTaxRate, setOrderTaxRate] = useState(18.0);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [customTaxRate, setCustomTaxRate] = useState(18.0);
    const [customNotes, setCustomNotes] = useState("");
    const [customItems, setCustomItems] = useState([]);
    const [createError, setCreateError] = useState("");
    const [creating, setCreating] = useState(false);
    // Record Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);
    const [payAmount, setPayAmount] = useState(0);
    const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
    const [payReference, setPayReference] = useState("");
    const [payNotes, setPayNotes] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [recordingPayment, setRecordingPayment] = useState(false);
    // Printable Tax Invoice Modal State
    const [viewInvoice, setViewInvoice] = useState(null);
    const [invoiceModalTab, setInvoiceModalTab] = useState("document");

    const handleViewInvoice = async (inv) => {
        setViewInvoice(inv);
        setInvoiceModalTab("document");
        try {
            const fresh = await fetchInvoiceById(inv.id);
            if (fresh) setViewInvoice(fresh);
        } catch {
            // retain inv
        }
    };
    const loadData = async () => {
        if (invoices.length === 0)
            setLoading(true);
        try {
            const [invList, ordList, custList, prodList] = await Promise.all([
                fetchInvoices(),
                fetchOrders(),
                fetchCustomers(),
                fetchProducts(),
            ]);
            setInvoices(invList);
            setOrders(ordList);
            setCustomers(custList);
            setProducts(prodList);
            const eligibleOrders = ordList.filter((o) => ["CONFIRMED", "FULFILLED"].includes(o.status));
            if (eligibleOrders.length > 0 && !selectedOrderId) {
                setSelectedOrderId(eligibleOrders[0].id);
            }
            if (custList.length > 0 && !selectedCustomerId) {
                setSelectedCustomerId(custList[0].id);
            }
        }
        catch (err) {
            console.error("Failed to load invoice data:", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, [currentOrg]);
    // Add line item to custom invoice builder
    const handleAddCustomItem = () => {
        if (products.length > 0) {
            const p = products[0];
            setCustomItems([
                ...customItems,
                {
                    description: p.name,
                    quantity: 1,
                    unit_price: p.price,
                    product_id: p.id,
                },
            ]);
        }
        else {
            setCustomItems([
                ...customItems,
                {
                    description: "Consulting & Logistical Services",
                    quantity: 1,
                    unit_price: 1000.0,
                },
            ]);
        }
    };
    const handleUpdateCustomItem = (index, field, value) => {
        const updated = [...customItems];
        if (field === "product_id") {
            const p = products.find((prod) => prod.id === value);
            if (p) {
                updated[index] = {
                    ...updated[index],
                    product_id: p.id,
                    description: p.name,
                    unit_price: p.price,
                };
            }
        }
        else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setCustomItems(updated);
    };
    const handleRemoveCustomItem = (index) => {
        setCustomItems(customItems.filter((_, i) => i !== index));
    };
    // Create Invoice Submission
    const handleCreateFromOrder = async (e) => {
        e.preventDefault();
        if (!selectedOrderId) {
            setCreateError("Please select a confirmed sales order.");
            return;
        }
        setCreating(true);
        setCreateError("");
        try {
            const newInv = await createInvoiceFromOrderApi(selectedOrderId, orderTaxRate);
            setCreateModalOpen(false);
            await loadData();
            setViewInvoice(newInv);
        }
        catch (err) {
            setCreateError(err.message || "Failed to generate invoice from order");
        }
        finally {
            setCreating(false);
        }
    };
    const handleCreateCustomInvoice = async (e) => {
        e.preventDefault();
        if (!selectedCustomerId) {
            setCreateError("Please select a customer.");
            return;
        }
        if (customItems.length === 0) {
            setCreateError("Please add at least one line item to the invoice.");
            return;
        }
        setCreating(true);
        setCreateError("");
        try {
            const newInv = await createInvoiceApi({
                customer_id: selectedCustomerId,
                tax_rate: Number(customTaxRate) || 0,
                notes: customNotes.trim() || undefined,
                items: customItems.map((it) => ({
                    description: it.description,
                    quantity: Number(it.quantity) || 1,
                    unit_price: Number(it.unit_price) || 0,
                    product_id: it.product_id,
                })),
            });
            setCreateModalOpen(false);
            setCustomItems([]);
            setCustomNotes("");
            toast.success("Invoice created", `Tax invoice ${newInv.invoice_number} generated.`);
            await loadData();
            setViewInvoice(newInv);
        }
        catch (err) {
            setCreateError(err.message || "Failed to create invoice");
        }
        finally {
            setCreating(false);
        }
    };
    // Open Payment Modal
    const openPaymentDialog = (invoice) => {
        setPaymentInvoice(invoice);
        setPayAmount(invoice.balance_due);
        setPayReference(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
        setPaymentError("");
        setPaymentModalOpen(true);
    };
    // Submit Payment
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!paymentInvoice)
            return;
        if (payAmount <= 0) {
            setPaymentError("Payment amount must be greater than zero.");
            return;
        }
        if (payAmount > paymentInvoice.balance_due) {
            setPaymentError(`Payment amount (₹${payAmount}) exceeds outstanding balance due (₹${paymentInvoice.balance_due}).`);
            return;
        }
        if (!payReference.trim()) {
            setPaymentError("Payment transaction reference (UTR / Cheque #) is required.");
            return;
        }
        setRecordingPayment(true);
        setPaymentError("");
        try {
            const updatedInv = await recordPaymentApi({
                invoice_id: paymentInvoice.id,
                amount: Number(payAmount),
                payment_method: payMethod,
                reference: payReference.trim(),
                notes: payNotes.trim() || undefined,
            });
            setPaymentModalOpen(false);
            toast.success("Payment recorded", `₹${payAmount} logged for ${paymentInvoice.invoice_number}.`);
            await loadData();
            if (viewInvoice && viewInvoice.id === updatedInv.id) {
                setViewInvoice(updatedInv);
            }
        }
        catch (err) {
            setPaymentError(err.message || "Failed to record payment");
        }
        finally {
            setRecordingPayment(false);
        }
    };
    const handleVoidInvoice = (invoiceId) => {
        setInvoiceIdToVoid(invoiceId);
    };

    // Filtered invoices
    const filteredInvoices = invoices.filter((inv) => {
        const matchesStatus = statusFilter === "ALL" ? true : inv.status === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            inv.invoice_number.toLowerCase().includes(q) ||
            (inv.customer?.name && inv.customer.name.toLowerCase().includes(q)) ||
            (inv.order?.order_number && inv.order.order_number.toLowerCase().includes(q)) ||
            inv.payments.some((p) => p.reference.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
    });
    // KPI Calculations
    const totalInvoiced = invoices
        .filter((i) => i.status !== "VOID")
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const totalCollected = invoices
        .filter((i) => i.status !== "VOID")
        .reduce((sum, i) => sum + (i.paid_amount || 0), 0);
    const totalOutstanding = invoices
        .filter((i) => i.status !== "VOID")
        .reduce((sum, i) => sum + (i.balance_due || 0), 0);
    const paidCount = invoices.filter((i) => i.status === "PAID").length;
    const eligibleOrdersForInvoice = orders.filter((o) => ["CONFIRMED", "FULFILLED"].includes(o.status));
    // Helper: subtotal / tax calculations for custom modal
    const customSubtotal = customItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
    const customTax = customSubtotal * ((Number(customTaxRate) || 0) / 100);
    const customTotal = customSubtotal + customTax;

    if (loading && invoices.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={6} />;
    }

    return (<motion.div className="space-y-6" variants={pageEnterVariants(prefersReducedMotion)} initial="hidden" animate="visible">
      {/* Top Header */}
      <PageHeader title={<span className="flex items-center gap-2.5">
            <ReceiptText className="w-7 h-7 text-slate-900 dark:text-[#F4F5F7]"/>
            Invoices & Accounts Receivable
          </span>} subtitle="B2B GST tax invoices, accounts receivable balances, and payment collections in INR (₹)." actions={<>
            <RefreshButton onClick={loadData} />
            <Button onClick={() => {
                if (eligibleOrdersForInvoice.length > 0 && !selectedOrderId) {
                    setSelectedOrderId(eligibleOrdersForInvoice[0].id);
                }
                setCreateModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2"/>
              Generate Invoice
            </Button>
          </>}/>

      {/* KPI Summary Cards */}
      <KpiGrid>
        <StatCard
          title="Total Invoiced"
          value={totalInvoiced}
          prefix="₹"
          decimals={2}
          formatINR={true}
          icon={FileText}
          subText="Gross billable revenue"
        />
        <StatCard
          title="Total Collected"
          value={totalCollected}
          prefix="₹"
          decimals={2}
          formatINR={true}
          icon={ArrowDownLeft}
          subText="Received in bank / UPI"
        />
        <StatCard
          title="Outstanding Receivables"
          value={totalOutstanding}
          prefix="₹"
          decimals={2}
          formatINR={true}
          icon={IndianRupee}
          subText="Balance awaiting payment"
        />
        <StatCard
          title="Fully Settled"
          value={paidCount}
          suffix={` / ${invoices.filter((i) => i.status !== "VOID").length}`}
          icon={CheckCircle2}
          subText="Invoices with 0 balance"
        />
      </KpiGrid>

        {/* Table & Controls Card */}
        <Card spotlight={true} className="shadow-2xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-[#2B2E25]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Status Filter Tabs with Sliding Indicator */}
              <Tabs tabs={[
            { label: "All Invoices", id: "ALL" },
            { label: "Issued (Unpaid)", id: "ISSUED" },
            { label: "Partially Paid", id: "PARTIALLY_PAID" },
            { label: "Paid in Full", id: "PAID" },
            { label: "Void", id: "VOID" },
        ]} activeTab={statusFilter} onChange={setStatusFilter} layoutId="invoices-status-tabs" variant="pill"/>

              {/* Search Bar */}
              <SearchBar placeholder="Search invoice #, customer, or UTR..." value={searchQuery} onChange={setSearchQuery} className="w-full md:w-72"/>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (<div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-28", "w-28", "w-28", "w-28", "w-24", "w-24", "w-20"]}/>
                <SkeletonAnnouncer label="Loading accounts receivable invoices"/>
              </div>) : filteredInvoices.length === 0 ? (<EmptyState compact icon={ReceiptText} title="No invoices found" description="Invoices matching the selected filter criteria will appear here. Bill a fulfilled order to issue an invoice." action={<Button size="sm" variant="primary" onClick={() => setCreateModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5"/>
                    Create Invoice
                  </Button>}/>) : (<div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-[#CBD5E1]">
                  <thead className="bg-slate-50 dark:bg-[#191B15] text-[11px] text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider border-b border-slate-100 dark:border-[#33372B]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Invoice #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Customer</th>
                      <th className="py-2.5 px-3.5 font-semibold">Order Ref</th>
                      <th className="py-2.5 px-3.5 font-semibold">Total Amount</th>
                      <th className="py-2.5 px-3.5 font-semibold">Paid Amount</th>
                      <th className="py-2.5 px-3.5 font-semibold">Balance Due</th>
                      <th className="py-2.5 px-3.5 font-semibold">Due Date</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2B2E25]">
                    {filteredInvoices.map((inv) => (<tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-[#191B15]/50 transition-colors group">
                        <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900 dark:text-[#F4F5F7] whitespace-nowrap">
                          {inv.invoice_number}
                          <div className="text-[10px] text-slate-400 dark:text-[#7C8189] font-sans mt-0.5">
                            {formatDate(inv.issue_date)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="font-semibold text-slate-900 dark:text-[#F4F5F7]">
                            {inv.customer?.name || "B2B Customer"}
                          </span>
                          <div className="text-[11px] text-slate-400 dark:text-[#7C8189]">
                            {inv.customer?.company || "Corporate Account"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {inv.order ? (<span className="font-mono text-[11px] bg-slate-100 dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] text-slate-800 dark:text-[#E2E8F0] px-2 py-0.5 rounded inline-block whitespace-nowrap font-medium">
                              {inv.order.order_number}
                            </span>) : (<span className="text-xs text-slate-400 dark:text-[#7C8189]">Direct Invoice</span>)}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-[#F4F5F7] font-mono whitespace-nowrap">
                          {formatINR(inv.total_amount)}
                          <div className="text-[10px] text-slate-400 dark:text-[#7C8189] font-normal">
                            incl. {inv.tax_rate}% GST
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-[#F4F5F7] font-mono whitespace-nowrap">
                          {formatINR(inv.paid_amount)}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">
                          <span className={`font-semibold ${inv.balance_due > 0 ? "text-slate-950 dark:text-white font-bold" : "text-slate-400 dark:text-[#7C8189]"}`}>
                            {formatINR(inv.balance_due)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-slate-600 dark:text-[#9BA3AF] whitespace-nowrap">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap"><StatusBadge status={inv.status} type="invoice" /></td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleViewInvoice(inv)}
                              title="View Invoice Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              View
                            </Button>

                            {inv.balance_due > 0 && inv.status !== "VOID" && (
                              <Button
                                size="xs"
                                variant="solid"
                                onClick={() => openPaymentDialog(inv)}
                                title="Record Remittance Payment"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pay
                              </Button>
                            )}

                            {inv.paid_amount === 0 && inv.status !== "VOID" && (
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => handleVoidInvoice(inv.id)}
                                disabled={actionLoading === inv.id}
                                title="Void Invoice"
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Ban className="w-3.5 h-3.5" />
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

        {/* Modal 1: Generate Invoice Modal */}
        <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="2xl">
          <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <div className="w-7 h-7 rounded-md bg-slate-950 text-white flex items-center justify-center shadow-xs">
                    <ReceiptText className="w-4 h-4"/>
                  </div>
                  Generate B2B GST Tax Invoice
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="px-6 pt-4 flex gap-2 border-b border-slate-100">
                <button onClick={() => setCreateTab("order")} className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${createTab === "order"
            ? "border-zinc-900 text-slate-900"
            : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                  From Confirmed Sales Order
                </button>
                <button onClick={() => {
            setCreateTab("custom");
            if (customItems.length === 0)
                handleAddCustomItem();
        }} className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${createTab === "custom"
            ? "border-zinc-900 text-slate-900"
            : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                  Custom Line Items Invoice
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {createError && (<Alert variant="danger" className="mb-4 text-xs">
                    {createError}
                  </Alert>)}

                {/* Tab 1: From Sales Order */}
                {createTab === "order" ? (<form onSubmit={handleCreateFromOrder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Select Confirmed Sales Order *
                      </label>
                      {eligibleOrdersForInvoice.length === 0 ? (<div className="p-4 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg">
                          No confirmed or fulfilled sales orders found to invoice. You can create a custom line item invoice using the tab above or confirm an order in Orders & Sales.
                        </div>) : (
                        <Select
                          value={selectedOrderId}
                          onChange={(e) => setSelectedOrderId(e.target.value)}
                          placeholder="Select sales order to invoice..."
                          options={eligibleOrdersForInvoice.map((o) => ({
                            value: o.id,
                            label: `${o.order_number} • ${o.customer?.name} (${formatINR(o.total_amount)}) [${o.status}]`,
                          }))}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        GST Tax Rate (%)
                      </label>
                      <Select
                        value={orderTaxRate}
                        onChange={(e) => setOrderTaxRate(parseFloat(e.target.value))}
                        options={[
                          { value: 18.0, label: "18% GST (Standard B2B Goods & Services)" },
                          { value: 12.0, label: "12% GST (Processed Industrial Goods)" },
                          { value: 5.0, label: "5% GST (Essential Commodities)" },
                          { value: 28.0, label: "28% GST (Luxury & Heavy Machinery)" },
                          { value: 0.0, label: "0% GST (Zero Rated / SEZ Supply)" },
                        ]}
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                      <div className="text-slate-400">
                        • Automatically copies customer billing and shipping address.
                      </div>
                      <div className="text-slate-400">
                        • Generates invoice line items matching order product specifications and rates.
                      </div>
                      <div className="text-slate-400">
                        • Defaults payment terms to Net 30 days.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={creating} disabled={eligibleOrdersForInvoice.length === 0} className="bg-slate-950 hover:bg-black text-white font-medium shadow-xs">
                        {creating ? "Generating..." : "Generate Tax Invoice"}
                      </Button>
                    </div>
                  </form>) : (
        /* Tab 2: Custom Line Items Invoice */
        <form onSubmit={handleCreateCustomInvoice} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          Select B2B Customer *
                        </label>
                        <Select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          placeholder="Choose B2B customer..."
                          options={customers.map((c) => ({
                            value: c.id,
                            label: `${c.name}${c.company ? ` (${c.company})` : ""}`,
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          GST Tax Rate (%)
                        </label>
                        <Select
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(parseFloat(e.target.value))}
                          options={[
                            { value: 18.0, label: "18% GST (Standard)" },
                            { value: 12.0, label: "12% GST" },
                            { value: 5.0, label: "5% GST" },
                            { value: 28.0, label: "28% GST" },
                            { value: 0.0, label: "0% GST (Exempt)" },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Dynamic Line Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Invoice Line Items ({customItems.length})
                        </label>
                        <Button type="button" size="sm" variant="outline" onClick={handleAddCustomItem} className="h-7 text-xs border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-medium">
                          <Plus className="w-3.5 h-3.5 mr-1"/> Add Line Item
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {customItems.map((item, idx) => (<div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                            <div className="col-span-5">
                              <Input placeholder="Description" value={item.description} onChange={(e) => handleUpdateCustomItem(idx, "description", e.target.value)} className="bg-white border-slate-300 text-xs h-8 text-slate-800" required/>
                            </div>
                            <div className="col-span-2">
                              <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => handleUpdateCustomItem(idx, "quantity", parseInt(e.target.value) || 1)} className="bg-white border-slate-300 text-xs h-8 text-slate-800" required/>
                            </div>
                            <div className="col-span-3">
                              <Input type="number" step="0.01" min="0" placeholder="Unit Rate (₹)" value={item.unit_price} onChange={(e) => handleUpdateCustomItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="bg-white border-slate-300 text-xs h-8 text-slate-800" required/>
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-2">
                              <span className="font-semibold text-slate-900">
                                {formatINR((item.quantity || 0) * (item.unit_price || 0))}
                              </span>
                              <button type="button" onClick={() => handleRemoveCustomItem(idx)} className="text-slate-400 hover:text-black">
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          </div>))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span className="font-medium text-slate-800">{formatINR(customSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>GST ({customTaxRate}%):</span>
                        <span className="font-medium text-slate-800">{formatINR(customTax)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                        <span>Total Invoice Amount:</span>
                        <span className="text-slate-950 font-bold">{formatINR(customTotal)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Invoice Remarks / Payment Terms
                      </label>
                      <Input placeholder="Payment due within 30 days via NEFT/RTGS" value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} className="bg-white border-slate-300 text-sm text-slate-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"/>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={creating} disabled={customItems.length === 0} className="bg-slate-950 hover:bg-black text-white font-medium shadow-xs">
                        {creating ? "Creating..." : "Create & Post Invoice"}
                      </Button>
                    </div>
                  </form>)}
              </div>
          </div>
        </Modal>

        {/* Modal 2: Record Payment Modal */}
        <Modal isOpen={paymentModalOpen && !!paymentInvoice} onClose={() => setPaymentModalOpen(false)} maxWidth="md">
          {paymentInvoice && (<div>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <div className="w-7 h-7 rounded-md bg-slate-950 text-white flex items-center justify-center shadow-xs">
                    <CreditCard className="w-4 h-4"/>
                  </div>
                  Record Payment Receipt
                </div>
                <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-5 space-y-3.5">
                {paymentError && (<Alert variant="danger" className="text-xs">
                    {paymentError}
                  </Alert>)}

                {/* Summary Banner */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Invoice:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {paymentInvoice.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Customer:</span>
                    <span className="text-slate-800 font-medium">{paymentInvoice.customer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Total Bill:</span>
                    <span className="text-slate-800 font-medium">{formatINR(paymentInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Outstanding Balance Due:
                    </span>
                    <span className="font-bold text-sm text-slate-950">
                      {formatINR(paymentInvoice.balance_due)}
                    </span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Payment Amount (₹) *
                    </label>
                    <button type="button" onClick={() => setPayAmount(paymentInvoice.balance_due)} className="text-[11px] font-medium text-slate-900 hover:underline cursor-pointer">
                      Pay Full ({formatINR(paymentInvoice.balance_due)})
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-sm font-semibold">
                      ₹
                    </span>
                    <Input type="number" step="0.01" min="0.01" max={paymentInvoice.balance_due} value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} className="pl-8 bg-white border-slate-300 text-sm text-slate-900 font-mono focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-9" required/>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Settlement Method *
                  </label>
                  <Select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    options={PAYMENT_METHODS}
                  />
                </div>

                {/* Transaction Reference (UTR / Cheque #) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Bank Reference / UTR / Cheque Number *
                  </label>
                  <Input placeholder="e.g. UTR-HDFC8823101" value={payReference} onChange={(e) => setPayReference(e.target.value)} className="bg-white border-slate-300 text-sm text-slate-900 font-mono focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-9" required/>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Receipt Notes (Optional)
                  </label>
                  <Input placeholder="Remittance received in corporate account" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="bg-white border-slate-300 text-sm text-slate-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-9"/>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-[#2B2E25]">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="solid" size="sm" isLoading={recordingPayment} disabled={payAmount <= 0}>
                    {recordingPayment ? "Recording..." : "Record & Apply Payment"}
                  </Button>
                </div>
              </form>
            </div>)}
        </Modal>

        {/* Modal 3: Printable Tax Invoice Viewer & Payment Ledger Drawer */}
        <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} maxWidth="3xl">
          {viewInvoice && (
            <div className="max-h-[88vh] overflow-y-auto bg-slate-50/30 dark:bg-[#191B15] text-slate-700 dark:text-slate-300 text-xs relative flex flex-col">
              {/* Sticky Header with Title, Tabs, Actions */}
              <div className="sticky top-0 z-20 border-b border-slate-200 dark:border-[#2B2E25] bg-white/95 dark:bg-[#191B15]/95 backdrop-blur-md shadow-2xs shrink-0">
                <div className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <ReceiptText className="w-5 h-5 text-slate-900 dark:text-slate-100"/>
                    <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {viewInvoice.invoice_number}
                    </span>
                    <StatusBadge status={viewInvoice.status} type="invoice" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      Print / Export
                    </Button>
                    {viewInvoice.balance_due > 0 && viewInvoice.status !== "VOID" && (
                      <Button size="sm" variant="solid" onClick={() => openPaymentDialog(viewInvoice)}>
                        <CreditCard className="w-3.5 h-3.5"/> Record Payment
                      </Button>
                    )}
                    <button onClick={() => setViewInvoice(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1">
                      <X className="w-5 h-5"/>
                    </button>
                  </div>
                </div>

                {/* Sub-header navigation tabs */}
                <div className="px-6 pb-2.5 flex items-center justify-between">
                  <Tabs
                    tabs={[
                      { id: "document", label: "Tax Invoice Document", icon: FileText },
                      { 
                        id: "payments", 
                        label: "Payment Remittance", 
                        icon: ArrowDownLeft, 
                        count: viewInvoice.payments?.length || 0 
                      },
                    ]}
                    activeTab={invoiceModalTab}
                    onChange={setInvoiceModalTab}
                    variant="pill"
                    layoutId="invoice-viewer-tab"
                  />
                  {invoiceModalTab === "payments" && viewInvoice.balance_due > 0 && viewInvoice.status !== "VOID" && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Balance Due: {formatINR(viewInvoice.balance_due)}
                    </span>
                  )}
                </div>
              </div>

              {/* TAB 1: TAX INVOICE DOCUMENT */}
              {invoiceModalTab === "document" && (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Invoice Meta Banner */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#2B2E25]">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                        TAX INVOICE
                      </h2>
                      <p className="text-slate-500 dark:text-[#9BA3AF] text-xs mt-0.5">
                        FlowStock B2B SaaS Enterprise Distribution
                      </p>
                      <p className="text-slate-500 dark:text-[#9BA3AF] mt-1">
                        GSTIN: <span className="font-mono text-slate-700 dark:text-slate-300">27AABCF1234F1Z8</span>
                      </p>
                    </div>
                    <div className="sm:text-right space-y-1">
                      <div>
                        <span className="text-slate-500 dark:text-[#9BA3AF]">Invoice Number: </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {viewInvoice.invoice_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-[#9BA3AF]">Issue Date: </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDate(viewInvoice.issue_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-[#9BA3AF]">Due Date: </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDate(viewInvoice.due_date)}
                        </span>
                      </div>
                      {viewInvoice.order && (
                        <div>
                          <span className="text-slate-500 dark:text-[#9BA3AF]">Order Ref: </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {viewInvoice.order.order_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Bill To & Ship To */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#9BA3AF] block mb-1">
                        Billed To (Consignee):
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {viewInvoice.customer?.name}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {viewInvoice.customer?.company || "Commercial Account"}
                      </p>
                      <p className="text-slate-500 dark:text-[#9BA3AF] mt-1">
                        {viewInvoice.customer?.billing_address || "Corporate Headquarters"}
                      </p>
                      <p className="text-slate-500 dark:text-[#9BA3AF] mt-1">
                        Email: {viewInvoice.customer?.email} &bull; Phone: {viewInvoice.customer?.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#9BA3AF] block mb-1">
                        Shipping / Delivery Destination:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {viewInvoice.customer?.shipping_address ||
                          viewInvoice.customer?.billing_address ||
                          "Site Receiving Facility"}
                      </p>
                      <p className="text-slate-500 dark:text-[#9BA3AF] mt-2">
                        Place of Supply: <span className="text-slate-700 dark:text-slate-300">Maharashtra (27)</span>
                      </p>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="rounded-lg border border-slate-200 dark:border-[#2B2E25] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#191B15] text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider border-b border-slate-100 dark:border-[#2B2E25]">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#2B2E25] bg-white dark:bg-[#191B15]">
                        {viewInvoice.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td className="py-2 px-3 text-slate-500 dark:text-[#9BA3AF]">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                              {it.description}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">{it.quantity}</td>
                            <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{formatINR(it.unit_price)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white font-mono">
                              {formatINR(it.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Tax Calculation Breakdown */}
                  <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                    <div className="text-slate-500 dark:text-[#9BA3AF] space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Payment Terms & Notes:</p>
                      <p className="text-slate-600 dark:text-slate-400">{viewInvoice.notes || "Standard B2B terms apply."}</p>
                      <p className="text-[11px] text-slate-500 dark:text-[#9BA3AF] pt-2">
                        Beneficiary: FlowStock Operations Pvt Ltd &bull; Bank: HDFC Bank
                      </p>
                    </div>
                    <div className="w-full sm:w-72 space-y-2 bg-slate-50 dark:bg-[#191B15] p-4 rounded-lg border border-slate-200 dark:border-[#2B2E25]">
                      <div className="flex justify-between text-slate-500 dark:text-[#9BA3AF]">
                        <span>Taxable Subtotal:</span>
                        <span>{formatINR(viewInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-[#9BA3AF]">
                        <span>CGST ({viewInvoice.tax_rate / 2}%):</span>
                        <span>{formatINR(viewInvoice.tax_amount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-[#9BA3AF]">
                        <span>SGST ({viewInvoice.tax_rate / 2}%):</span>
                        <span>{formatINR(viewInvoice.tax_amount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 dark:text-white font-bold text-sm pt-2 border-t border-slate-200 dark:border-[#2B2E25]">
                        <span>Grand Total:</span>
                        <span className="text-slate-950 dark:text-white">
                          {formatINR(viewInvoice.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700 dark:text-slate-300 pt-1">
                        <span>Amount Received:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatINR(viewInvoice.paid_amount)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-[#2B2E25]">
                        <span className="text-slate-700 dark:text-slate-300">Balance Payable:</span>
                        <span className={viewInvoice.balance_due > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-400 dark:text-slate-500"}>
                          {formatINR(viewInvoice.balance_due)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Audit Ledger Section */}
                  <div className="pt-4 border-t border-slate-200 dark:border-[#2B2E25]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <ArrowDownLeft className="w-4 h-4 text-slate-900 dark:text-white"/>
                        Payment Remittance History ({viewInvoice.payments?.length || 0} Transactions)
                      </h4>
                      {viewInvoice.payments?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setInvoiceModalTab("payments")}
                          className="text-xs text-[#565449] dark:text-[#D8CFBC] font-medium hover:underline flex items-center gap-1"
                        >
                          Open Ledger Tab &rarr;
                        </button>
                      )}
                    </div>
                    {(!viewInvoice.payments || viewInvoice.payments.length === 0) ? (
                      <EmptyState
                        compact
                        icon={ArrowDownLeft}
                        title="No payments recorded yet"
                        description="Record a payment remittance against this invoice to settle the balance due."
                      />
                    ) : (
                      <div className="rounded-lg border border-slate-200 dark:border-[#2B2E25] overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-[#191B15] text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider border-b border-slate-200 dark:border-[#2B2E25]">
                            <tr>
                              <th className="py-2.5 px-3">Receipt #</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Method</th>
                              <th className="py-2.5 px-3">Reference / UTR</th>
                              <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#2B2E25] bg-white dark:bg-[#191B15]">
                            {viewInvoice.payments.map((pay) => (
                              <tr key={pay.id}>
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white">
                                  {pay.payment_number}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-[#9BA3AF]">
                                  {formatDate(pay.payment_date)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{pay.payment_method}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-[#9BA3AF]">
                                  {pay.reference || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                  {formatINR(pay.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {/* Clean bottom spacer so content never gets cut off */}
                  <div className="h-10 shrink-0" />
                </div>
              )}

              {/* TAB 2: DEDICATED PAYMENT REMITTANCE LEDGER */}
              {invoiceModalTab === "payments" && (
                <div className="p-6 sm:p-8 space-y-5">
                  {/* Financial Summary KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25]">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider block">Total Billed</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                        {formatINR(viewInvoice.total_amount)}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Amount Received</span>
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                        {formatINR(viewInvoice.paid_amount)}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25]">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider block">Outstanding Balance</span>
                      <span className={`text-lg font-bold font-mono mt-0.5 block ${viewInvoice.balance_due > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                        {formatINR(viewInvoice.balance_due)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Table with Full Visibility */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <ArrowDownLeft className="w-4 h-4 text-slate-700 dark:text-slate-300"/>
                        Payment Remittance History ({viewInvoice.payments?.length || 0} Transactions)
                      </h4>
                      {viewInvoice.balance_due > 0 && viewInvoice.status !== "VOID" && (
                        <Button size="sm" variant="solid" onClick={() => openPaymentDialog(viewInvoice)}>
                          <CreditCard className="w-3.5 h-3.5" /> Add Payment
                        </Button>
                      )}
                    </div>

                    {(!viewInvoice.payments || viewInvoice.payments.length === 0) ? (
                      <EmptyState
                        icon={ArrowDownLeft}
                        title="No payment remittance recorded"
                        description="This invoice is currently pending payment. Record the transaction reference and payment method to reconcile the balance."
                        action={
                          viewInvoice.balance_due > 0 && viewInvoice.status !== "VOID" ? (
                            <Button size="sm" variant="solid" onClick={() => openPaymentDialog(viewInvoice)} className="mt-2">
                              <CreditCard className="w-3.5 h-3.5" /> Record Payment Remittance
                            </Button>
                          ) : null
                        }
                      />
                    ) : (
                      <div className="rounded-xl border border-slate-200 dark:border-[#2B2E25] overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-[#191B15] text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider border-b border-slate-200 dark:border-[#2B2E25]">
                            <tr>
                              <th className="py-3 px-3.5 font-semibold">Receipt #</th>
                              <th className="py-3 px-3.5 font-semibold">Date</th>
                              <th className="py-3 px-3.5 font-semibold">Method</th>
                              <th className="py-3 px-3.5 font-semibold">Reference / UTR</th>
                              <th className="py-3 px-3.5 text-right font-semibold">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#2B2E25] bg-white dark:bg-[#191B15]">
                            {viewInvoice.payments.map((pay) => (
                              <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1F232D] transition-colors">
                                <td className="py-3 px-3.5 font-mono font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>
                                  {pay.payment_number}
                                </td>
                                <td className="py-3 px-3.5 text-slate-500 dark:text-[#9BA3AF]">
                                  {formatDate(pay.payment_date)}
                                </td>
                                <td className="py-3 px-3.5 font-medium text-slate-700 dark:text-slate-300">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#2B2E25] text-[11px] font-mono">
                                    {pay.payment_method}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-[#9BA3AF]">
                                  {pay.reference || "—"}
                                </td>
                                <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white font-mono text-sm">
                                  {formatINR(pay.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {/* Clean bottom spacer */}
                  <div className="h-10 shrink-0" />
                </div>
              )}
            </div>
          )}
        </Modal>

        <ConfirmModal isOpen={!!invoiceIdToVoid} onClose={() => setInvoiceIdToVoid(null)} onConfirm={async () => {
            if (!invoiceIdToVoid)
                return;
            setActionLoading(invoiceIdToVoid);
            try {
                const updated = await voidInvoiceApi(invoiceIdToVoid);
                setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                if (viewInvoice && viewInvoice.id === updated.id) {
                    setViewInvoice(updated);
                }
                setInvoiceIdToVoid(null);
                toast.success("Invoice voided", `Invoice ${updated.invoice_number} has been voided.`);
            }
            catch (err) {
                toast.error("Void failed", err.message || "Unable to void invoice");
            }
            finally {
                setActionLoading(null);
            }
        }} title="Void Tax Invoice" description="Are you sure you want to void this invoice? Voided invoices cannot accept payments and are retained solely for audit compliance." confirmText="Void Invoice" variant="danger"/>
      </motion.div>);
}
