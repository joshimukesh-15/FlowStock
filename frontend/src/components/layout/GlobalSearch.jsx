import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Package, Search, ShoppingCart, Truck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { fetchInvoices, fetchOrders, fetchProducts, fetchPurchaseOrders, fetchShipments } from "@/lib/api";
import { createStaggerContainer, slideUpVariants, useReducedMotion } from "@/motion";
const TYPE_ICONS = {
    Product: Package,
    Order: ShoppingCart,
    "Purchase order": FileText,
    Shipment: Truck,
    Invoice: FileText,
    Navigation: Sparkles,
};
let cachedSearchData = null;
let lastCacheTime = 0;

/** Searches existing API data with 60s cache; it does not create a separate search index or demo data. */
export const GlobalSearch = ({ onOpen }) => {
    const prefersReducedMotion = useReducedMotion();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const openSearch = () => {
        setIsOpen(true);
        onOpen?.();
    };

    useEffect(() => {
        const handleShortcut = (event) => {
            const target = event.target;
            const isTyping = target?.matches("input, textarea, select, [contenteditable='true']");
            const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
            const isSlash = event.key === "/" && !isTyping;
            if (isCmdK || isSlash) {
                event.preventDefault();
                openSearch();
            }
        };
        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [onOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        // Use 60s cache if valid
        if (cachedSearchData && Date.now() - lastCacheTime < 60000) {
            setResults(cachedSearchData);
            return;
        }
        let active = true;
        setLoading(true);
        Promise.all([fetchProducts(), fetchOrders(), fetchPurchaseOrders(), fetchShipments(), fetchInvoices()])
            .then(([products, orders, purchaseOrders, shipments, invoices]) => {
            if (!active)
                return;
            const mapped = [
                ...products.map((item) => ({ id: item.id, title: item.name, detail: item.sku, to: "/products", type: "Product" })),
                ...orders.map((item) => ({ id: item.id, title: item.order_number, detail: item.customer?.name || item.status, to: "/orders", type: "Order" })),
                ...purchaseOrders.map((item) => ({ id: item.id, title: item.po_number, detail: item.supplier?.name || item.status, to: "/purchasing", type: "Purchase order" })),
                ...shipments.map((item) => ({ id: item.id, title: item.tracking_number || item.shipment_number, detail: `${item.carrier} · ${item.status}`, to: "/shipments", type: "Shipment" })),
                ...invoices.map((item) => ({ id: item.id, title: item.invoice_number, detail: item.customer?.name || item.status, to: "/invoices", type: "Invoice" })),
            ];
            cachedSearchData = mapped;
            lastCacheTime = Date.now();
            setResults(mapped);
        })
            .catch(() => {
            if (active)
                setResults([]);
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [isOpen]);
    const filteredResults = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery)
            return [];
        return results
            .filter((item) => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(normalizedQuery))
            .slice(0, 8);
    }, [query, results]);
    const close = () => {
        setIsOpen(false);
        setQuery("");
    };
    return (<>
      <button
        type="button"
        onClick={openSearch}
        className="w-full flex items-center justify-between gap-2.5 h-8.5 px-3 rounded-xl border border-slate-200/90 dark:border-[#33372B] bg-slate-100/70 hover:bg-slate-100 dark:bg-[#191B15] dark:hover:bg-[#191B15] text-xs text-slate-500 dark:text-[#9BA3AF] transition-all cursor-pointer shadow-2xs hover:border-slate-300 dark:hover:border-[#454C5E] group"
        aria-label="Search FlowStock records (Ctrl+K or /)"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#7C8189] shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors"/>
          <span className="truncate text-slate-400 dark:text-[#7C8189] group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors font-medium">
            Search products, orders, invoices...
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#3A404F] bg-white dark:bg-[#23261E] font-mono text-[10px] text-slate-400 dark:text-[#7C8189] shadow-2xs">
            Ctrl K
          </kbd>
          <kbd className="sm:hidden inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#3A404F] bg-white dark:bg-[#23261E] font-mono text-[10px] text-slate-400 dark:text-[#7C8189]">
            /
          </kbd>
        </div>
      </button>

      <Modal isOpen={isOpen} onClose={close} maxWidth="xl" position="top">
        <div className="border-b border-slate-100 dark:border-[#33372B] p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#191B15]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Search className="h-5 w-5 text-slate-400 dark:text-[#7C8189] shrink-0" />
            <input
              id="global-search-input"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, orders, shipments, invoices..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 dark:text-[#F4F5F7] outline-none placeholder:text-slate-400 dark:placeholder:text-[#7C8189]"
            />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#3A404F] bg-white dark:bg-[#23261E] font-mono text-[10px] text-slate-400 dark:text-[#7C8189] shadow-2xs">
            ESC
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-[#9BA3AF]">
              Loading organization records…
            </p>
          ) : !query.trim() ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-[#7C8189] space-y-1">
              <p className="font-medium text-slate-600 dark:text-[#CBD5E1]">Quick Organization Search</p>
              <p>Search across products, purchase orders, shipments, and customer invoices</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-[#9BA3AF]">
              No matching records found for "{query}".
            </p>
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
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-[#23261E] group"
                    >
                      <span className="rounded-lg border border-slate-200 dark:border-[#3A404F] bg-white dark:bg-[#1E222B] p-2 text-slate-600 dark:text-[#CBD5E1] shrink-0 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-[#9BA3AF]">
                          {result.detail}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-[#7C8189] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#191B15] border border-slate-200/80 dark:border-[#33372B]">
                        {result.type}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-[#33372B] bg-slate-50 dark:bg-[#11120D] flex items-center justify-between text-[11px] text-slate-400 dark:text-[#7C8189]">
          <span className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#23261E] border border-slate-200 dark:border-[#3A404F] font-mono text-[10px]">↑</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#23261E] border border-slate-200 dark:border-[#3A404F] font-mono text-[10px]">↓</kbd>
            <span>to select</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#23261E] border border-slate-200 dark:border-[#3A404F] font-mono text-[10px]">ESC</kbd>
            <span>to close</span>
          </span>
        </div>
      </Modal>
    </>);
};
