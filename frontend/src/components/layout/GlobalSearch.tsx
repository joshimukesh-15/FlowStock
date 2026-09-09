import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Package, Search, ShoppingCart, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { fetchInvoices, fetchOrders, fetchProducts, fetchPurchaseOrders, fetchShipments } from "@/lib/api";
import { createStaggerContainer, slideUpVariants, useReducedMotion } from "@/motion";

type SearchResult = {
  id: string;
  title: string;
  detail: string;
  to: string;
  type: "Product" | "Order" | "Purchase order" | "Shipment" | "Invoice";
};

const TYPE_ICONS = {
  Product: Package,
  Order: ShoppingCart,
  "Purchase order": FileText,
  Shipment: Truck,
  Invoice: FileText,
};

/** Searches existing API data only; it does not create a separate search index or demo data. */
export const GlobalSearch: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !target?.matches("input, textarea, select, [contenteditable='true']")) {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);
    Promise.all([fetchProducts(), fetchOrders(), fetchPurchaseOrders(), fetchShipments(), fetchInvoices()])
      .then(([products, orders, purchaseOrders, shipments, invoices]) => {
        if (!active) return;
        setResults([
          ...products.map((item) => ({ id: item.id, title: item.name, detail: item.sku, to: "/products", type: "Product" as const })),
          ...orders.map((item) => ({ id: item.id, title: item.order_number, detail: item.customer?.name || item.status, to: "/orders", type: "Order" as const })),
          ...purchaseOrders.map((item) => ({ id: item.id, title: item.po_number, detail: item.supplier?.name || item.status, to: "/purchasing", type: "Purchase order" as const })),
          ...shipments.map((item) => ({ id: item.id, title: item.tracking_number || item.shipment_number, detail: `${item.carrier} · ${item.status}`, to: "/shipments", type: "Shipment" as const })),
          ...invoices.map((item) => ({ id: item.id, title: item.invoice_number, detail: item.customer?.name || item.status, to: "/invoices", type: "Invoice" as const })),
        ]);
      })
      .catch(() => {
        if (active) setResults([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return results
      .filter((item) => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [query, results]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
        aria-label="Search FlowStock records"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <kbd className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1 font-mono text-[10px] text-zinc-400">/</kbd>
      </button>

      <Modal isOpen={isOpen} onClose={close} maxWidth="xl">
        <div className="border-b border-zinc-100 dark:border-zinc-800 p-4">
          <label className="sr-only" htmlFor="global-search-input">Search products, orders, shipments, and invoices</label>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            <input
              id="global-search-input"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, orders, shipments, invoices..."
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading current organization records…</p>
          ) : !query.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Start typing to search the current organization.</p>
          ) : filteredResults.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No matching records.</p>
          ) : (
            <motion.div
              variants={createStaggerContainer(undefined, undefined, prefersReducedMotion)}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {filteredResults.map((result) => {
                const Icon = TYPE_ICONS[result.type];
                return (
                  <motion.div key={`${result.type}-${result.id}`} variants={slideUpVariants(prefersReducedMotion)}>
                    <Link
                      to={result.to}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    >
                      <span className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300"><Icon className="h-3.5 w-3.5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{result.title}</span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{result.detail}</span>
                      </span>
                      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{result.type}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </Modal>
    </>
  );
};
