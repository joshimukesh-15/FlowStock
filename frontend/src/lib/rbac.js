/**
 * Enterprise Role-Based Access Control (RBAC) System
 * FlowStock Multi-Tenant B2B SaaS
 *
 * Supported Roles:
 * - admin: Full organization owner & operator (all 10 modules + settings + user provisioning)
 * - warehouse_manager: Supply chain & physical inventory (overview, products, inventory, warehouses, purchasing, shipments)
 * - sales_rep: Commercial customer & revenue pipeline (overview, products catalog, orders, invoices)
 * - viewer: Compliance & financial auditor (read-only inspection across data modules, no settings)
 */

export const ROLES = {
  ADMIN: "admin",
  WAREHOUSE_MANAGER: "warehouse_manager",
  SALES_REP: "sales_rep",
  VIEWER: "viewer",
};

export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: "Administrator",
    shortLabel: "Admin",
    badgeLabel: "👑 Organization Admin",
    description: "Full administrative access, user provisioning, financials & governance",
    badgeCls: "bg-slate-900 text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] border-slate-800 dark:border-[#D8CFBC]",
    allowedRoutes: [
      "/dashboard",
      "/products",
      "/inventory",
      "/warehouses",
      "/orders",
      "/purchasing",
      "/shipments",
      "/invoices",
      "/audit",
      "/settings",
    ],
    canMutate: true,
  },
  [ROLES.WAREHOUSE_MANAGER]: {
    label: "Warehouse Manager",
    shortLabel: "Warehouse",
    badgeLabel: "📦 Logistics & Stock",
    description: "Ledger adjustments, facility transfers, stock receiving & shipment fulfillment",
    badgeCls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    allowedRoutes: [
      "/dashboard",
      "/products",
      "/inventory",
      "/warehouses",
      "/purchasing",
      "/shipments",
    ],
    canMutate: true,
  },
  [ROLES.SALES_REP]: {
    label: "Sales Representative",
    shortLabel: "Sales",
    badgeLabel: "💼 Commercial Pipeline",
    description: "Customer accounts, sales order reservation, confirmation & invoicing",
    badgeCls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    allowedRoutes: [
      "/dashboard",
      "/products",
      "/orders",
      "/invoices",
    ],
    canMutate: true,
  },
  [ROLES.VIEWER]: {
    label: "Auditor / Viewer",
    shortLabel: "Auditor",
    badgeLabel: "🔍 Compliance Inspection",
    description: "Read-only audit inspection across ledgers, transactions and system logs",
    badgeCls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    allowedRoutes: [
      "/dashboard",
      "/products",
      "/inventory",
      "/warehouses",
      "/orders",
      "/purchasing",
      "/shipments",
      "/invoices",
      "/audit",
    ],
    canMutate: false,
  },
};

/**
 * Check if a given route path is permitted for the user's role.
 * Fallback to admin access if role is not recognized.
 */
export function isRouteAllowed(role, path) {
  if (!path) return true;
  // Normalize path (strip query params / hashes)
  const cleanPath = path.split("?")[0].split("#")[0];
  
  // Public routes always allowed
  if (cleanPath === "/" || cleanPath === "/welcome" || cleanPath === "/login") {
    return true;
  }

  const roleKey = (role || ROLES.ADMIN).toLowerCase();
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG[ROLES.ADMIN];
  
  return config.allowedRoutes.some((allowed) => {
    if (allowed === cleanPath) return true;
    // Allow nested sub-paths, e.g. /products/new matches /products
    return cleanPath.startsWith(allowed + "/");
  });
}

/**
 * Check if the user role has permission to perform a specific action capability.
 */
export function can(role, action) {
  const roleKey = (role || ROLES.ADMIN).toLowerCase();

  // Admin can do everything
  if (roleKey === ROLES.ADMIN) return true;

  // Viewers/Auditors can never mutate anything
  if (roleKey === ROLES.VIEWER) {
    return action.startsWith("read:") || action.startsWith("view:");
  }

  // Warehouse Manager capabilities (physical supply chain & inventory)
  if (roleKey === ROLES.WAREHOUSE_MANAGER) {
    if (action.startsWith("settings:") || action.startsWith("user:")) return false;
    if (action.startsWith("order:") && !action.includes("read") && !action.includes("view")) return false;
    if (action.startsWith("invoice:") && !action.includes("read") && !action.includes("view")) return false;
    if (action.startsWith("audit:export")) return false;
    return true;
  }

  // Sales Rep capabilities (commercial pipeline & billing only)
  if (roleKey === ROLES.SALES_REP) {
    if (action.startsWith("settings:") || action.startsWith("user:")) return false;
    if (action.startsWith("product:create") || action.startsWith("product:edit") || action.startsWith("product:delete")) return false;
    if (action.startsWith("category:create")) return false;
    if (action.startsWith("inventory:adjust")) return false;
    if (action.startsWith("warehouse:manage") || action.startsWith("warehouse:transfer")) return false;
    if (action.startsWith("purchasing:")) return false;
    if (action.startsWith("shipment:")) return false;
    if (action.startsWith("audit:")) return false;
    return true;
  }

  return true;

  return true;
}

/**
 * Get display metadata for a user role.
 */
export function getRoleMeta(role) {
  const roleKey = (role || ROLES.ADMIN).toLowerCase();
  return ROLE_CONFIG[roleKey] || ROLE_CONFIG[ROLES.ADMIN];
}
