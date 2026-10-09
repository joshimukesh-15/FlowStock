import { useTenant } from "@/context/TenantContext";
import { useAuth } from "@/context/AuthContext";
import { isRouteAllowed, can, getRoleMeta, ROLES } from "@/lib/rbac";

export function usePermissions() {
  const { currentUser } = useTenant();
  const { user: authUser } = useAuth();

  const role = currentUser?.role || authUser?.role || ROLES.ADMIN;
  const meta = getRoleMeta(role);
  const isReadOnly = !meta.canMutate;
  const isAdmin = role.toLowerCase() === ROLES.ADMIN;
  const isWarehouseManager = role.toLowerCase() === ROLES.WAREHOUSE_MANAGER;
  const isSalesRep = role.toLowerCase() === ROLES.SALES_REP;
  const isViewer = role.toLowerCase() === ROLES.VIEWER;

  return {
    role,
    meta,
    isReadOnly,
    isAdmin,
    isWarehouseManager,
    isSalesRep,
    isViewer,
    can: (action) => can(role, action),
    isRouteAllowed: (path) => isRouteAllowed(role, path),
  };
}

export default usePermissions;
