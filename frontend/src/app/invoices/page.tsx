"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ReceiptText,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  Building2,
  RefreshCw,
  X,
  Eye,
  CreditCard,
  IndianRupee,
  FileText,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  Percent,
} from "lucide-react";
import {
  fetchInvoices,
  fetchOrders,
  fetchCustomers,
  fetchProducts,
  createInvoiceApi,
  createInvoiceFromOrderApi,
  issueInvoiceApi,
  voidInvoiceApi,
  recordPaymentApi,
} from "@/lib/api";
import { Invoice, SalesOrder, Customer, Product } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { formatINR } from "@/lib/utils";
import { TableSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { createStaggerContainer, slideUpVariants, useReducedMotion } from "@/motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Modal } from "@/components/ui/Modal";

const PAYMENT_METHODS = [
  { label: "Bank Transfer (NEFT / RTGS / IMPS)", value: "BANK_TRANSFER" },
  { label: "UPI (Unified Payments Interface)", value: "UPI" },
  { label: "Commercial Cheque / DD", value: "CHEQUE" },
  { label: "Net Banking", value: "NET_BANKING" },
  { label: "Cash / Cash Deposit", value: "CASH" },
];

export default function InvoicesPage() {
  const { currentOrg } = useTenant();
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<"order" | "custom">("order");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderTaxRate, setOrderTaxRate] = useState<number>(18.0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customTaxRate, setCustomTaxRate] = useState<number>(18.0);
  const [customNotes, setCustomNotes] = useState("");
  const [customItems, setCustomItems] = useState<
    { description: string; quantity: number; unit_price: number; product_id?: string }[]
  >([]);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Record Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Printable Tax Invoice Modal State
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    if (invoices.length === 0) setLoading(true);
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

      const eligibleOrders = ordList.filter((o) =>
        ["CONFIRMED", "FULFILLED"].includes(o.status)
      );
      if (eligibleOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(eligibleOrders[0].id);
      }
      if (custList.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custList[0].id);
      }
    } catch (err) {
      console.error("Failed to load invoice data:", err);
    } finally {
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
    } else {
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

  const handleUpdateCustomItem = (
    index: number,
    field: "description" | "quantity" | "unit_price" | "product_id",
    value: any
  ) => {
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
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCustomItems(updated);
  };

  const handleRemoveCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  // Create Invoice Submission
  const handleCreateFromOrder = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setCreateError(err.message || "Failed to generate invoice from order");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCustomInvoice = async (e: React.FormEvent) => {
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
      await loadData();
      setViewInvoice(newInv);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  // Open Payment Modal
  const openPaymentDialog = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPayAmount(invoice.balance_due);
    setPayReference(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setPaymentError("");
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    if (payAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }
    if (payAmount > paymentInvoice.balance_due) {
      setPaymentError(
        `Payment amount (₹${payAmount}) exceeds outstanding balance due (₹${paymentInvoice.balance_due}).`
      );
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
      await loadData();
      if (viewInvoice && viewInvoice.id === updatedInv.id) {
        setViewInvoice(updatedInv);
      }
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleVoidInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to void this invoice?")) return;
    setActionLoading(invoiceId);
    try {
      const updated = await voidInvoiceApi(invoiceId);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (viewInvoice && viewInvoice.id === updated.id) {
        setViewInvoice(updated);
      }
    } catch (err: any) {
      alert(`Void failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Status Badge UI
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Draft
          </Badge>
        );
      case "ISSUED":
        return (
          <Badge className="bg-zinc-100 text-zinc-900 border border-zinc-300 font-medium">
            <FileText className="w-3 h-3 mr-1" /> Issued (Unpaid)
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge className="bg-zinc-100 text-zinc-900 border border-zinc-300 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Partially Paid
          </Badge>
        );
      case "PAID":
        return (
          <Badge className="bg-zinc-900/10 text-zinc-900 border border-zinc-900/20 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Paid in Full
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-zinc-200 text-zinc-700 border border-zinc-300 font-medium">
            <AlertCircle className="w-3 h-3 mr-1" /> Overdue
          </Badge>
        );
      case "VOID":
        return (
          <Badge className="bg-zinc-500/10 text-zinc-500 border border-zinc-600/30 font-medium">
            <Ban className="w-3 h-3 mr-1" /> Void
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : inv.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
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

  const eligibleOrdersForInvoice = orders.filter((o) =>
    ["CONFIRMED", "FULFILLED"].includes(o.status)
  );

  // Helper: subtotal / tax calculations for custom modal
  const customSubtotal = customItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const customTax = customSubtotal * ((Number(customTaxRate) || 0) / 100);
  const customTotal = customSubtotal + customTax;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <ReceiptText className="w-7 h-7 text-zinc-900" />
            Invoices & Accounts Receivable
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            B2B GST tax invoices, accounts receivable balances, and payment collections in INR (₹).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className=""
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              if (eligibleOrdersForInvoice.length > 0 && !selectedOrderId) {
                setSelectedOrderId(eligibleOrdersForInvoice[0].id);
              }
              setCreateModalOpen(true);
            }}
            className="bg-zinc-950 hover:bg-black text-white font-medium shadow-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            + Generate Invoice
          </Button>
        </div>
      </motion.div>

      {/* KPI Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Invoiced
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                <AnimatedCounter
                  value={totalInvoiced}
                  prefix="₹"
                  decimals={2}
                  formatINR={true}
                />
              </h3>
              <p className="text-xs text-zinc-700 mt-0.5">Gross billable revenue</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Collected
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                <AnimatedCounter
                  value={totalCollected}
                  prefix="₹"
                  decimals={2}
                  formatINR={true}
                />
              </h3>
              <p className="text-xs text-zinc-900 mt-0.5">Received in bank / UPI</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-zinc-900/10 border border-zinc-900/20 flex items-center justify-center text-zinc-900">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Outstanding Receivables
              </p>
              <h3 className="text-2xl font-bold text-zinc-700 mt-1">
                <AnimatedCounter
                  value={totalOutstanding}
                  prefix="₹"
                  decimals={2}
                  formatINR={true}
                />
              </h3>
              <p className="text-xs text-zinc-800/80 mt-0.5">Balance awaiting payment</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Fully Settled
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                <AnimatedCounter
                  value={paidCount}
                  suffix={` / ${invoices.filter((i) => i.status !== "VOID").length}`}
                />
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Invoices with 0 balance</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

        {/* Table & Controls Card */}
        <Card className="">
          <CardHeader className="p-5 pb-3 border-b border-zinc-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "All Invoices", value: "ALL" },
                  { label: "Issued (Unpaid)", value: "ISSUED" },
                  { label: "Partially Paid", value: "PARTIALLY_PAID" },
                  { label: "Paid in Full", value: "PAID" },
                  { label: "Void", value: "VOID" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === tab.value
                        ? "bg-white text-zinc-900 shadow-sm shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-72">
                <Input
                  placeholder="Search invoice #, customer, or UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-50 border-zinc-800 text-xs h-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-28", "w-28", "w-28", "w-28", "w-24", "w-24", "w-20"]} />
                <SkeletonAnnouncer label="Loading accounts receivable invoices" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                compact
                icon={ReceiptText}
                title="No invoices found"
                description="Invoices matching the selected filter criteria will appear here. Bill a fulfilled order to issue an invoice."
                action={
                  <Button size="sm" variant="primary" onClick={() => setCreateModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Create Invoice
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-700">
                  <thead className="bg-zinc-50 text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Invoice #</th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Order Ref</th>
                      <th className="py-3 px-4 font-semibold">Total Amount (₹)</th>
                      <th className="py-3 px-4 font-semibold">Paid Amount (₹)</th>
                      <th className="py-3 px-4 font-semibold">Balance Due (₹)</th>
                      <th className="py-3 px-4 font-semibold">Due Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-zinc-50 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-zinc-900 whitespace-nowrap">
                          {inv.invoice_number}
                          <div className="text-[11px] text-zinc-500 font-sans">
                            {new Date(inv.issue_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-zinc-900">
                            {inv.customer?.name || "B2B Customer"}
                          </span>
                          <div className="text-xs text-zinc-500">
                            {inv.customer?.company || "Corporate Account"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv.order ? (
                            <span className="font-mono text-xs bg-zinc-100 border border-zinc-200 text-zinc-900 px-2.5 py-1 rounded inline-block whitespace-nowrap font-medium">
                              {inv.order.order_number}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">Direct Invoice</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                          {formatINR(inv.total_amount)}
                          <div className="text-[11px] text-zinc-500 font-normal">
                            incl. {inv.tax_rate}% GST
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-900 whitespace-nowrap">
                          {formatINR(inv.paid_amount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              inv.balance_due > 0 ? "text-zinc-950 font-bold" : "text-zinc-400"
                            }`}
                          >
                            {formatINR(inv.balance_due)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-700 whitespace-nowrap">
                          {new Date(inv.due_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewInvoice(inv)}
                            className="h-7 px-2.5 text-xs border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Invoice
                          </Button>
                          {inv.balance_due > 0 && inv.status !== "VOID" && (
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(inv)}
                              className="h-7 px-2.5 text-xs bg-zinc-950 hover:bg-black text-white font-medium shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                            </Button>
                          )}
                          {inv.paid_amount === 0 && inv.status !== "VOID" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVoidInvoice(inv.id)}
                              disabled={actionLoading === inv.id}
                              className="h-7 px-2 text-xs border border-zinc-300 text-zinc-500 hover:bg-zinc-100 hover:text-black"
                            >
                              <Ban className="w-3 h-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal 1: Generate Invoice Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          maxWidth="2xl"
        >
          <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/60">
                <div className="flex items-center gap-2 text-zinc-900 font-bold">
                  <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                    <ReceiptText className="w-4 h-4" />
                  </div>
                  Generate B2B GST Tax Invoice
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="px-6 pt-4 flex gap-2 border-b border-zinc-100">
                <button
                  onClick={() => setCreateTab("order")}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                    createTab === "order"
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  From Confirmed Sales Order
                </button>
                <button
                  onClick={() => {
                    setCreateTab("custom");
                    if (customItems.length === 0) handleAddCustomItem();
                  }}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                    createTab === "custom"
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Custom Line Items Invoice
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {createError && (
                  <div className="mb-4 p-3 text-xs bg-zinc-100 border border-zinc-300 text-zinc-950 rounded-lg font-medium">
                    {createError}
                  </div>
                )}

                {/* Tab 1: From Sales Order */}
                {createTab === "order" ? (
                  <form onSubmit={handleCreateFromOrder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                        Select Confirmed Sales Order *
                      </label>
                      {eligibleOrdersForInvoice.length === 0 ? (
                        <div className="p-4 text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg">
                          No confirmed or fulfilled sales orders found to invoice. You can create a custom line item invoice using the tab above or confirm an order in Orders & Sales.
                        </div>
                      ) : (
                        <select
                          value={selectedOrderId}
                          onChange={(e) => setSelectedOrderId(e.target.value)}
                          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
                        >
                          {eligibleOrdersForInvoice.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.order_number} &bull; {o.customer?.name} ({formatINR(o.total_amount)}) [{o.status}]
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                        GST Tax Rate (%)
                      </label>
                      <select
                        value={orderTaxRate}
                        onChange={(e) => setOrderTaxRate(parseFloat(e.target.value))}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
                      >
                        <option value={18.0}>18% GST (Standard B2B Goods & Services)</option>
                        <option value={12.0}>12% GST (Processed Industrial Goods)</option>
                        <option value={5.0}>5% GST (Essential Commodities)</option>
                        <option value={28.0}>28% GST (Luxury & Heavy Machinery)</option>
                        <option value={0.0}>0% GST (Zero Rated / SEZ Supply)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1.5">
                      <div className="text-zinc-400">
                        • Automatically copies customer billing and shipping address.
                      </div>
                      <div className="text-zinc-400">
                        • Generates invoice line items matching order product specifications and rates.
                      </div>
                      <div className="text-zinc-400">
                        • Defaults payment terms to Net 30 days.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateModalOpen(false)}
                        className="border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating || eligibleOrdersForInvoice.length === 0}
                        className="bg-zinc-950 hover:bg-black text-white font-medium shadow-xs"
                      >
                        {creating ? "Generating..." : "Generate Tax Invoice"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Tab 2: Custom Line Items Invoice */
                  <form onSubmit={handleCreateCustomInvoice} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                          Select B2B Customer *
                        </label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.company || "Client"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                          GST Tax Rate (%)
                        </label>
                        <select
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(parseFloat(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
                        >
                          <option value={18.0}>18% GST (Standard)</option>
                          <option value={12.0}>12% GST</option>
                          <option value={5.0}>5% GST</option>
                          <option value={28.0}>28% GST</option>
                          <option value={0.0}>0% GST (Exempt)</option>
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Line Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
                          Invoice Line Items ({customItems.length})
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAddCustomItem}
                          className="h-7 text-xs border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {customItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 grid grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="col-span-5">
                              <Input
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateCustomItem(idx, "description", e.target.value)
                                }
                                className="bg-white border-zinc-300 text-xs h-8 text-zinc-800"
                                required
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateCustomItem(
                                    idx,
                                    "quantity",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="bg-white border-zinc-300 text-xs h-8 text-zinc-800"
                                required
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Unit Rate (₹)"
                                value={item.unit_price}
                                onChange={(e) =>
                                  handleUpdateCustomItem(
                                    idx,
                                    "unit_price",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="bg-white border-zinc-300 text-xs h-8 text-zinc-800"
                                required
                              />
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-2">
                              <span className="font-semibold text-zinc-900">
                                {formatINR((item.quantity || 0) * (item.unit_price || 0))}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomItem(idx)}
                                className="text-zinc-400 hover:text-black"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal:</span>
                        <span className="font-medium text-zinc-800">{formatINR(customSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>GST ({customTaxRate}%):</span>
                        <span className="font-medium text-zinc-800">{formatINR(customTax)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-900 font-bold text-sm pt-2 border-t border-zinc-200">
                        <span>Total Invoice Amount:</span>
                        <span className="text-zinc-950 font-bold">{formatINR(customTotal)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                        Invoice Remarks / Payment Terms
                      </label>
                      <Input
                        placeholder="Payment due within 30 days via NEFT/RTGS"
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="bg-white border-zinc-300 text-sm text-zinc-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateModalOpen(false)}
                        className="border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating || customItems.length === 0}
                        className="bg-zinc-950 hover:bg-black text-white font-medium shadow-xs"
                      >
                        {creating ? "Creating..." : "Create & Post Invoice"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
          </div>
        </Modal>

        {/* Modal 2: Record Payment Modal */}
        <Modal
          isOpen={paymentModalOpen && !!paymentInvoice}
          onClose={() => setPaymentModalOpen(false)}
          maxWidth="md"
        >
          {paymentInvoice && (
            <div>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
                <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                  <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  Record Payment Receipt
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-5 space-y-3.5">
                {paymentError && (
                  <div className="p-3 text-xs bg-zinc-100 border border-zinc-300 text-zinc-950 rounded-lg font-medium">
                    {paymentError}
                  </div>
                )}

                {/* Summary Banner */}
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Invoice:</span>
                    <span className="font-mono text-zinc-900 font-semibold">
                      {paymentInvoice.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Customer:</span>
                    <span className="text-zinc-800 font-medium">{paymentInvoice.customer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Total Bill:</span>
                    <span className="text-zinc-800 font-medium">{formatINR(paymentInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                    <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">
                      Outstanding Balance Due:
                    </span>
                    <span className="font-bold text-sm text-zinc-950">
                      {formatINR(paymentInvoice.balance_due)}
                    </span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Payment Amount (₹) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setPayAmount(paymentInvoice.balance_due)}
                      className="text-[11px] font-medium text-zinc-900 hover:underline cursor-pointer"
                    >
                      Pay Full ({formatINR(paymentInvoice.balance_due)})
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-500 text-sm font-semibold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={paymentInvoice.balance_due}
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                      className="pl-8 bg-white border-zinc-300 text-sm text-zinc-900 font-mono focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-9"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Settlement Method *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 h-9"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Reference (UTR / Cheque #) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Bank Reference / UTR / Cheque Number *
                  </label>
                  <Input
                    placeholder="e.g. UTR-HDFC8823101"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="bg-white border-zinc-300 text-sm text-zinc-900 font-mono focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Receipt Notes (Optional)
                  </label>
                  <Input
                    placeholder="Remittance received in corporate account"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="bg-white border-zinc-300 text-sm text-zinc-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-9"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaymentModalOpen(false)}
                    className="border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 text-xs h-8 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={recordingPayment || payAmount <= 0}
                    className="bg-zinc-950 hover:bg-black text-white font-medium text-xs h-8 px-4 shadow-xs"
                  >
                    {recordingPayment ? "Recording..." : "Record & Apply Payment"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>

        {/* Modal 3: Printable Tax Invoice Viewer & Payment Ledger Drawer */}
        <Modal
          isOpen={!!viewInvoice}
          onClose={() => setViewInvoice(null)}
          maxWidth="3xl"
        >
          {viewInvoice && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Header with Print / Close Buttons */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center gap-2.5">
                  <ReceiptText className="w-5 h-5 text-zinc-900" />
                  <span className="font-mono text-lg font-bold text-zinc-900">
                    {viewInvoice.invoice_number}
                  </span>
                  {getStatusBadge(viewInvoice.status)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-xs border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    Print / Export
                  </Button>
                  {viewInvoice.balance_due > 0 && viewInvoice.status !== "VOID" && (
                    <Button
                      size="sm"
                      onClick={() => openPaymentDialog(viewInvoice)}
                      className="text-xs bg-zinc-950 hover:bg-black text-white font-medium shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Record Payment
                    </Button>
                  )}
                  <button
                    onClick={() => setViewInvoice(null)}
                    className="text-zinc-400 hover:text-zinc-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable B2B Tax Invoice Body */}
              <div className="p-8 overflow-y-auto flex-1 space-y-6 bg-zinc-50/30 text-zinc-700 text-xs">
                {/* Invoice Meta Banner */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 pb-6 border-b border-zinc-100">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 tracking-wide">
                      TAX INVOICE
                    </h2>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      FlowStock B2B SaaS Enterprise Distribution
                    </p>
                    <p className="text-zinc-500 mt-1">
                      GSTIN: <span className="font-mono text-zinc-700">27AABCF1234F1Z8</span>
                    </p>
                  </div>
                  <div className="sm:text-right space-y-1">
                    <div>
                      <span className="text-zinc-500">Invoice Number: </span>
                      <span className="font-mono font-bold text-zinc-900">
                        {viewInvoice.invoice_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Issue Date: </span>
                      <span className="text-zinc-700">
                        {new Date(viewInvoice.issue_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Due Date: </span>
                      <span className="text-zinc-700">
                        {new Date(viewInvoice.due_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {viewInvoice.order && (
                      <div>
                        <span className="text-zinc-500">Order Ref: </span>
                        <span className="font-mono text-zinc-700">
                          {viewInvoice.order.order_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Bill To & Ship To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                      Billed To (Consignee):
                    </span>
                    <p className="font-bold text-zinc-900 text-sm">
                      {viewInvoice.customer?.name}
                    </p>
                    <p className="text-zinc-600">
                      {viewInvoice.customer?.company || "Commercial Account"}
                    </p>
                    <p className="text-zinc-500 mt-1">
                      {viewInvoice.customer?.billing_address || "Corporate Headquarters"}
                    </p>
                    <p className="text-zinc-500 mt-1">
                      Email: {viewInvoice.customer?.email} &bull; Phone: {viewInvoice.customer?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                      Shipping / Delivery Destination:
                    </span>
                    <p className="text-zinc-700">
                      {viewInvoice.customer?.shipping_address ||
                        viewInvoice.customer?.billing_address ||
                        "Site Receiving Facility"}
                    </p>
                    <p className="text-zinc-500 mt-2">
                      Place of Supply: <span className="text-zinc-700">Maharashtra (27)</span>
                    </p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="rounded-lg border border-zinc-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {viewInvoice.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="py-2 px-3 text-zinc-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-zinc-900">
                            {it.description}
                          </td>
                          <td className="py-2 px-3 text-center">{it.quantity}</td>
                          <td className="py-2 px-3 text-right">{formatINR(it.unit_price)}</td>
                          <td className="py-2 px-3 text-right font-semibold text-zinc-900">
                            {formatINR(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Tax Calculation Breakdown */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                  <div className="text-zinc-500 space-y-1">
                    <p className="font-semibold text-zinc-700">Payment Terms & Notes:</p>
                    <p className="text-zinc-600">{viewInvoice.notes || "Standard B2B terms apply."}</p>
                    <p className="text-[11px] text-zinc-500 pt-2">
                      Beneficiary: FlowStock Operations Pvt Ltd &bull; Bank: HDFC Bank
                    </p>
                  </div>
                  <div className="w-full sm:w-72 space-y-2 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex justify-between text-zinc-500">
                      <span>Taxable Subtotal:</span>
                      <span>{formatINR(viewInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>CGST ({viewInvoice.tax_rate / 2}%):</span>
                      <span>{formatINR(viewInvoice.tax_amount / 2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>SGST ({viewInvoice.tax_rate / 2}%):</span>
                      <span>{formatINR(viewInvoice.tax_amount / 2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-900 font-bold text-sm pt-2 border-t border-zinc-200">
                      <span>Grand Total:</span>
                      <span className="text-zinc-950">
                        {formatINR(viewInvoice.total_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-700 pt-1">
                      <span>Amount Received:</span>
                      <span>{formatINR(viewInvoice.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-zinc-200">
                      <span className="text-zinc-700">Balance Payable:</span>
                      <span
                        className={
                          viewInvoice.balance_due > 0 ? "text-zinc-950 font-bold" : "text-zinc-400"
                        }
                      >
                        {formatINR(viewInvoice.balance_due)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment History Audit Ledger */}
                <div className="pt-4 border-t border-zinc-100">
                  <h4 className="font-semibold text-zinc-900 uppercase tracking-wider text-xs mb-3 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-zinc-900" />
                    Payment Remittance History ({viewInvoice.payments?.length || 0} Transactions)
                  </h4>
                  {(!viewInvoice.payments || viewInvoice.payments.length === 0) ? (
                    <EmptyState
                      compact
                      icon={ArrowDownLeft}
                      title="No payments recorded yet"
                      description="Record a payment remittance against this invoice to settle the balance due."
                    />
                  ) : (
                    <div className="rounded-lg border border-zinc-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                          <tr>
                            <th className="py-2 px-3">Receipt #</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Method</th>
                            <th className="py-2 px-3">Reference / UTR</th>
                            <th className="py-2 px-3 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {viewInvoice.payments.map((pay) => (
                            <tr key={pay.id}>
                              <td className="py-2 px-3 font-mono text-zinc-900">
                                {pay.payment_number}
                              </td>
                              <td className="py-2 px-3 text-zinc-400">
                                {new Date(pay.payment_date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="py-2 px-3">{pay.payment_method}</td>
                              <td className="py-2 px-3 font-mono text-zinc-700">
                                {pay.reference}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-zinc-900">
                                {formatINR(pay.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    
  );
}
