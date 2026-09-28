"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { fetchOrganizations, createOrganizationApi, deleteOrganizationApi, clearApiCache } from "@/lib/api";
const TenantContext = createContext(undefined);
export const TenantProvider = ({ children }) => {
    const [organizations, setOrganizations] = useState([]);
    const [currentOrg, setCurrentOrg] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const loadOrganizations = async () => {
        try {
            const orgs = await fetchOrganizations();
            setOrganizations(orgs);
            const savedOrgId = typeof window !== "undefined" ? localStorage.getItem("flowstock_org_id") : null;
            let active = orgs.find((o) => o.id === savedOrgId) || orgs[0] || null;
            setCurrentOrg(active);
            if (active && active.users && active.users.length > 0) {
                const savedUserId = typeof window !== "undefined" ? localStorage.getItem("flowstock_user_id") : null;
                const matchedUser = active.users.find((u) => u.id === savedUserId) || active.users[0];
                setCurrentUser(matchedUser);
                if (typeof window !== "undefined") {
                    localStorage.setItem("flowstock_user_id", matchedUser.id);
                    localStorage.setItem("flowstock_user_name", matchedUser.name);
                    localStorage.setItem("flowstock_user_role", matchedUser.role);
                }
            }
            // Persist resolved org info for instant next load
            if (active && typeof window !== "undefined") {
                localStorage.setItem("flowstock_org_id", active.id);
                localStorage.setItem("flowstock_org_slug", active.slug);
                localStorage.setItem("flowstock_org_name", active.name);
            }
        }
        catch (err) {
            console.error("Failed to load organizations:", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Immediately read localStorage on client mount without causing SSR mismatch
        if (typeof window !== "undefined") {
            const savedId = localStorage.getItem("flowstock_org_id");
            const savedSlug = localStorage.getItem("flowstock_org_slug");
            const savedName = localStorage.getItem("flowstock_org_name");
            if (savedId && savedName) {
                setCurrentOrg({ id: savedId, name: savedName, slug: savedSlug || "", currency: "INR", users: [] });
            }
            const savedUserId = localStorage.getItem("flowstock_user_id");
            const savedUserName = localStorage.getItem("flowstock_user_name");
            const savedUserRole = localStorage.getItem("flowstock_user_role") || "admin";
            if (savedUserId && savedUserName) {
                setCurrentUser({ id: savedUserId, name: savedUserName, email: "", role: savedUserRole });
            }
        }
        loadOrganizations();
    }, []);
    const switchOrganization = (orgId) => {
        const found = organizations.find((o) => o.id === orgId);
        if (found) {
            setCurrentOrg(found);
            const defaultUser = found.users?.[0] || null;
            setCurrentUser(defaultUser);
            if (typeof window !== "undefined") {
                localStorage.setItem("flowstock_org_id", found.id);
                localStorage.setItem("flowstock_org_slug", found.slug);
                localStorage.setItem("flowstock_org_name", found.name);
                if (defaultUser) {
                    localStorage.setItem("flowstock_user_id", defaultUser.id);
                    localStorage.setItem("flowstock_user_name", defaultUser.name);
                    localStorage.setItem("flowstock_user_role", defaultUser.role);
                }
            }
        }
    };
    const switchUser = (userId) => {
        if (!currentOrg || !currentOrg.users)
            return;
        const found = currentOrg.users.find((u) => u.id === userId);
        if (found) {
            setCurrentUser(found);
            if (typeof window !== "undefined") {
                localStorage.setItem("flowstock_user_id", found.id);
            }
        }
    };
    const createOrganization = async (name, slug, currency) => {
        const newOrg = await createOrganizationApi({ name, slug, currency });
        await loadOrganizations();
        switchOrganization(newOrg.id);
        return newOrg;
    };
    const deleteOrganization = async (orgId) => {
        await deleteOrganizationApi(orgId);
        clearApiCache();
        // Check if the active organization was deleted
        const remaining = organizations.filter((o) => o.id !== orgId);
        setOrganizations(remaining);
        if (currentOrg?.id === orgId) {
            const nextOrg = remaining[0] || null;
            setCurrentOrg(nextOrg);
            const nextUser = nextOrg?.users?.[0] || null;
            setCurrentUser(nextUser);
            if (typeof window !== "undefined") {
                if (nextOrg) {
                    localStorage.setItem("flowstock_org_id", nextOrg.id);
                    localStorage.setItem("flowstock_org_slug", nextOrg.slug);
                    localStorage.setItem("flowstock_org_name", nextOrg.name);
                }
                else {
                    localStorage.removeItem("flowstock_org_id");
                    localStorage.removeItem("flowstock_org_slug");
                    localStorage.removeItem("flowstock_org_name");
                }
                if (nextUser) {
                    localStorage.setItem("flowstock_user_id", nextUser.id);
                    localStorage.setItem("flowstock_user_name", nextUser.name);
                    localStorage.setItem("flowstock_user_role", nextUser.role);
                }
                else {
                    localStorage.removeItem("flowstock_user_id");
                    localStorage.removeItem("flowstock_user_name");
                    localStorage.removeItem("flowstock_user_role");
                }
            }
        }
        await loadOrganizations();
    };
    return (<TenantContext.Provider value={{
            organizations,
            currentOrg,
            currentUser,
            loading,
            switchOrganization,
            switchUser,
            createOrganization,
            deleteOrganization,
            refreshOrganizations: loadOrganizations,
        }}>
      {children}
    </TenantContext.Provider>);
};
export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
};
