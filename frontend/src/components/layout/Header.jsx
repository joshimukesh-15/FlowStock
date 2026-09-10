"use client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronDown, Plus, User, Check, X, Bell, CheckCheck, ExternalLink, AlertTriangle, Info, CheckCircle2, AlertCircle, Trash2, } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { useTenant } from "@/context/TenantContext";
import { fetchNotifications, fetchUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, } from "@/lib/api";
import { useRealtime } from "@/context/WebSocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { popoverVariants, useReducedMotion } from "@/motion";
export const Header = ({ isHealthy }) => {
    const { organizations, currentOrg, currentUser, switchOrganization, switchUser, createOrganization, deleteOrganization, } = useTenant();
    const prefersReducedMotion = useReducedMotion();
    const tenantMenuVariants = popoverVariants(prefersReducedMotion);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const { isConnected, subscribe } = useRealtime();
    // Delete Organization state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    // Notifications state
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgSlug, setNewOrgSlug] = useState("");
    const [newOrgCurrency, setNewOrgCurrency] = useState("INR");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const loadUnreadCount = async () => {
        if (!currentOrg?.id)
            return;
        try {
            const count = await fetchUnreadNotificationCount();
            setUnreadCount(count);
        }
        catch {
            // Ignore count fetch errors
        }
    };
    const loadNotifications = async () => {
        if (!currentOrg?.id)
            return;
        setLoadingNotifs(true);
        try {
            const list = await fetchNotifications({ limit: 15 });
            setNotifications(list);
            const count = list.filter((n) => !n.is_read).length;
            setUnreadCount(count);
        }
        catch {
            // Ignore
        }
        finally {
            setLoadingNotifs(false);
        }
    };
    useEffect(() => {
        loadUnreadCount();
    }, [currentOrg?.id]);
    useEffect(() => {
        const unsubscribe = subscribe("NOTIFICATION_CREATED", (data) => {
            setUnreadCount((c) => c + 1);
            setNotifications((prev) => [
                {
                    id: data.id || Math.random().toString(),
                    organization_id: currentOrg?.id || "",
                    title: data.title || "Notification",
                    message: data.message || "",
                    type: data.type || "INFO",
                    link: data.link,
                    is_read: false,
                    created_at: data.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                ...prev,
            ]);
        });
        return () => unsubscribe();
    }, [subscribe, currentOrg?.id]);
    const toggleNotifDrawer = () => {
        if (!notifOpen) {
            loadNotifications();
        }
        setNotifOpen(!notifOpen);
    };
    const handleMarkAsRead = async (id, e) => {
        if (e)
            e.stopPropagation();
        try {
            await markNotificationRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        }
        catch {
            // Ignore
        }
    };
    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
        catch {
            // Ignore
        }
    };
    const handleNameChange = (e) => {
        const name = e.target.value;
        setNewOrgName(name);
        setNewOrgSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    };
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!newOrgName || !newOrgSlug)
            return;
        setCreating(true);
        setCreateError("");
        try {
            await createOrganization(newOrgName, newOrgSlug, newOrgCurrency);
            setModalOpen(false);
            setNewOrgName("");
            setNewOrgSlug("");
            setDropdownOpen(false);
        }
        catch (err) {
            setCreateError(err.message || "Failed to create organization");
        }
        finally {
            setCreating(false);
        }
    };
    const handleConfirmDelete = async () => {
        if (!orgToDelete)
            return;
        setDeleting(true);
        setDeleteError("");
        try {
            await deleteOrganization(orgToDelete.id);
            setDeleteModalOpen(false);
            setOrgToDelete(null);
            setDropdownOpen(false);
        }
        catch (err) {
            setDeleteError(err.message || "Failed to delete organization");
        }
        finally {
            setDeleting(false);
        }
    };
    const getNotifIcon = (type) => {
        switch (type) {
            case "WARNING":
                return <AlertTriangle className="w-3.5 h-3.5 text-zinc-700 shrink-0"/>;
            case "SUCCESS":
                return <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 shrink-0"/>;
            case "DANGER":
                return <AlertCircle className="w-3.5 h-3.5 text-zinc-800 shrink-0"/>;
            default:
                return <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0"/>;
        }
    };
    return (<>
      <header className="h-12 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 px-4 md:px-6 flex items-center justify-between shrink-0 relative z-30">
        {/* Tenant Selector */}
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-md transition-colors">
            <Building2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400"/>
            <div className="flex flex-col text-left">
              <span suppressHydrationWarning className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {currentOrg ? currentOrg.name : "Select Tenant..."}
              </span>
              <span suppressHydrationWarning className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                {currentOrg ? `${currentOrg.slug} · ${currentOrg.currency}` : "Loading"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1"/>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (<motion.div initial="hidden" animate="visible" exit="exit" variants={tenantMenuVariants} className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 origin-top-left">
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Select Active Organization
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {organizations.map((org) => {
                const isActive = currentOrg?.id === org.id;
                const canDelete = organizations.length > 1;
                return (<div key={org.id} onClick={() => {
                        switchOrganization(org.id);
                        setDropdownOpen(false);
                    }} className={`group w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer ${isActive ? "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 font-semibold" : "text-zinc-700 dark:text-zinc-300"}`}>
                      <div className="min-w-0 pr-2 flex-1">
                        <p className="truncate">{org.name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {org.slug} ({org.currency})
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-100"/>}
                        {canDelete && (<button type="button" title={`Delete ${org.name}`} onClick={(e) => {
                            e.stopPropagation();
                            setOrgToDelete(org);
                            setDeleteError("");
                            setDeleteModalOpen(true);
                            setDropdownOpen(false);
                        }} className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>)}
                      </div>
                    </div>);
            })}
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 p-1.5">
                <Button variant="outline" size="sm" onClick={() => {
                setModalOpen(true);
                setDropdownOpen(false);
            }} className="w-full text-xs gap-1 py-1 h-auto">
                  <Plus className="w-3 h-3"/>
                  Add Organization
                </Button>
              </div>
              </motion.div>)}
          </AnimatePresence>
        </div>

        {/* System & User Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">System:</span>
            {isHealthy ? (<Badge variant="success">Operational</Badge>) : (<Badge variant="danger">Disconnected</Badge>)}
          </div>

          <GlobalSearch />

          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${isConnected
            ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800"
            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"}`} title={isConnected ? "Real-time WebSocket stream active" : "Attempting WebSocket connection..."}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-zinc-950 dark:bg-zinc-200" : "bg-zinc-400 dark:bg-zinc-600"}`}/>
            <span>{isConnected ? "Live Stream" : "Connecting..."}</span>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"/>

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button onClick={toggleNotifDrawer} className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Notifications">
              <Bell className="w-4 h-4"/>
              {unreadCount > 0 && (<span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-100 text-[10px] font-bold text-white dark:text-zinc-950 shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>)}
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
              {notifOpen && (<motion.div initial="hidden" animate="visible" exit="exit" variants={tenantMenuVariants} className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 text-xs origin-top-right">
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Notifications</span>
                    {unreadCount > 0 && (<Badge variant="danger" className="text-[10px] py-0 px-1.5">
                        {unreadCount} unread
                      </Badge>)}
                  </div>
                  {unreadCount > 0 && (<button onClick={handleMarkAllRead} className="text-[11px] text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white font-semibold flex items-center gap-1">
                      <CheckCheck className="w-3 h-3"/>
                      Mark all read
                    </button>)}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loadingNotifs ? (<div className="p-4 text-center text-zinc-400 dark:text-zinc-500">Loading notifications...</div>) : notifications.length > 0 ? (notifications.map((notif) => (<div key={notif.id} onClick={() => {
                    if (!notif.is_read)
                        handleMarkAsRead(notif.id);
                }} className={`p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors flex items-start gap-2.5 cursor-pointer ${!notif.is_read ? "bg-zinc-100/70 dark:bg-zinc-800/40" : ""}`}>
                        {getNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`font-semibold truncate ${!notif.is_read ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (<span className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-zinc-100 shrink-0"/>)}
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed text-[11px]">{notif.message}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                            <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {notif.link && (<Link to={notif.link} onClick={() => setNotifOpen(false)} className="text-zinc-950 dark:text-zinc-100 hover:underline flex items-center gap-0.5 font-medium">
                                View Details <ExternalLink className="w-2.5 h-2.5"/>
                              </Link>)}
                          </div>
                        </div>
                      </div>))) : (<div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                      <Bell className="w-6 h-6 mx-auto mb-1.5 text-zinc-300 dark:text-zinc-600"/>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">No notifications</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">You are all caught up!</p>
                    </div>)}
                </div>

                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-center">
                  <Link to="/audit" onClick={() => setNotifOpen(false)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium">
                    View Full Audit Trails & System Logs →
                  </Link>
                </div>
                </motion.div>)}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"/>

          {/* Active Operator & Live Role Switcher */}
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 p-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-[transform,opacity,background-color,border-color,color] cursor-pointer text-left" title="Click to switch active user / role">
              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-600 dark:text-zinc-300"/>
              </div>
              <div>
                <p suppressHydrationWarning className="text-xs font-semibold leading-none text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  {currentUser?.name || "Admin Operator"}
                  <ChevronDown className="w-3 h-3 text-zinc-400"/>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                    {currentUser?.role?.replace("_", " ") || "Operator"}
                  </span>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (<motion.div initial="hidden" animate="visible" exit="exit" variants={tenantMenuVariants} className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 origin-top-right">
                  <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Switch Active User (RBAC)
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {currentOrg?.slug}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {(currentOrg?.users || []).map((u) => {
                const isSelected = u.id === currentUser?.id;
                return (<button key={u.id} onClick={() => {
                        switchUser(u.id);
                        setUserMenuOpen(false);
                    }} className={`w-full px-3 py-2 text-left flex items-start justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${isSelected ? "bg-zinc-50/80 dark:bg-zinc-800/80 font-medium" : ""}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{u.email}</p>
                          </div>
                          <span className={`text-[10px] shrink-0 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${u.role === "admin" ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"}`}>
                            {u.role?.replace("_", " ") || u.role}
                          </span>
                        </button>);
            })}
                  </div>
                </motion.div>)}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Add Organization Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Create New Organization</h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {createError && (<p className="text-xs text-zinc-950 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-2.5 rounded font-medium">
                {createError}
              </p>)}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <Input label="Organization Name" placeholder="e.g. Apex Industrial Supplies" value={newOrgName} onChange={handleNameChange} required/>
              <Input label="Identifier Slug" placeholder="e.g. apex-industrial" value={newOrgSlug} onChange={(e) => setNewOrgSlug(e.target.value)} required/>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Default Currency
                </label>
                <select value={newOrgCurrency} onChange={(e) => setNewOrgCurrency(e.target.value)} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={creating}>
                  {creating ? "Creating..." : "Create Tenant"}
                </Button>
              </div>
            </form>
          </div>
      </Modal>

      {/* Delete Organization Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => {
            if (!deleting) {
                setDeleteModalOpen(false);
                setOrgToDelete(null);
                setDeleteError("");
            }
        }} maxWidth="sm">
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400"/>
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Delete Organization</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{orgToDelete?.slug}</p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{orgToDelete?.name}</strong>?
            This will permanently erase all associated products, warehouses, orders, invoices, payments, and data from the database.
          </p>

          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-300 mb-5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
            <span>This action is destructive and cannot be undone.</span>
          </div>

          {deleteError && (<div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg mb-4">
              {deleteError}
            </div>)}

          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => {
            setDeleteModalOpen(false);
            setOrgToDelete(null);
            setDeleteError("");
        }}>
              Cancel
            </Button>
            <Button type="button" size="sm" isLoading={deleting} onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500">
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </>);
};
