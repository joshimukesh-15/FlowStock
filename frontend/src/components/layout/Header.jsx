import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Building2, ChevronDown, Plus, User, Check, X, Bell, CheckCheck, ExternalLink, AlertTriangle, Info, CheckCircle2, AlertCircle, Trash2, LogOut, } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { useTenant } from "@/context/TenantContext";
import { useAuth } from "@/context/AuthContext";
import { fetchNotifications, fetchUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, } from "@/lib/api";
import { useRealtime } from "@/context/WebSocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { popoverVariants, useReducedMotion } from "@/motion";
export const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const { organizations, currentOrg, currentUser, switchOrganization, switchUser, createOrganization, deleteOrganization, } = useTenant();
    const prefersReducedMotion = useReducedMotion();
    const tenantMenuVariants = popoverVariants(prefersReducedMotion);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const notifRef = useRef(null);
    const userMenuRef = useRef(null);
    const tenantMenuRef = useRef(null);
    const { subscribe } = useRealtime();
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
    const closeAllPopovers = () => {
        setNotifOpen(false);
        setUserMenuOpen(false);
        setDropdownOpen(false);
    };

    // Auto-close all popovers on route / URL changes
    useEffect(() => {
        closeAllPopovers();
    }, [location.pathname]);

    // Click outside listener and Escape key dismissal (Tier-1 MNC Standard)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
            if (tenantMenuRef.current && !tenantMenuRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeAllPopovers();
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const toggleNotifDrawer = () => {
        if (!notifOpen) {
            loadNotifications();
            setUserMenuOpen(false);
            setDropdownOpen(false);
        }
        setNotifOpen((prev) => !prev);
    };

    const toggleUserMenu = () => {
        if (!userMenuOpen) {
            setNotifOpen(false);
            setDropdownOpen(false);
        }
        setUserMenuOpen((prev) => !prev);
    };

    const toggleDropdown = () => {
        if (!dropdownOpen) {
            setNotifOpen(false);
            setUserMenuOpen(false);
        }
        setDropdownOpen((prev) => !prev);
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
                return (
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                );
            case "SUCCESS":
                return (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                );
            case "DANGER":
                return (
                  <div className="w-6 h-6 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                );
            default:
                return (
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#1E2026] border border-slate-200 dark:border-[#2D3039] flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-slate-700 dark:text-[#D8CFBC]" />
                  </div>
                );
        }
    };
    return (<>
      <header className="h-14 glass-header px-4 md:px-6 flex items-center justify-between shrink-0 relative z-30">
        {/* Tenant Selector */}
        <div className="relative" ref={tenantMenuRef}>
          <button
            onClick={toggleDropdown}
            className="group flex items-center gap-2 text-xs text-slate-800 dark:text-[#F4F5F7] bg-slate-100/70 dark:bg-[#16171C] hover:bg-slate-100 dark:hover:bg-[#1E2026] border border-slate-200/80 dark:border-[#262833] h-9 px-2.5 rounded-lg transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[#D8CFBC]"
            aria-expanded={dropdownOpen}
            aria-label="Select organization"
          >
            <div className="w-5 h-5 rounded-md bg-white dark:bg-[#22242B] border border-slate-200/80 dark:border-[#2D3039] flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-3 h-3 text-slate-600 dark:text-[#D8CFBC]"/>
            </div>
            <span suppressHydrationWarning className="font-semibold text-slate-900 dark:text-[#FFFBF4] leading-tight truncate max-w-[130px] sm:max-w-[180px]">
              {currentOrg ? currentOrg.name : "Select Tenant..."}
            </span>
            {currentOrg?.currency && (
              <span suppressHydrationWarning className="text-[10px] text-slate-500 dark:text-[#9BA3AF] font-mono leading-none px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-[#22242B] border border-slate-300/40 dark:border-[#2D3039] shrink-0">
                {currentOrg.currency}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-[#808594] ml-0.5 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-slate-700 dark:text-[#D8CFBC]" : ""}`}/>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tenantMenuVariants}
                className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-[#121316] border border-slate-200 dark:border-[#22242B] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 p-2 z-50 origin-top-left"
              >
                <div className="px-3 py-2 text-[11px] font-mono font-semibold tracking-wider text-slate-500 dark:text-[#9BA3AF] uppercase flex items-center justify-between border-b border-slate-100 dark:border-[#22242B] mb-1.5">
                  <span>Select Active Organization</span>
                  <span className="text-[10px] font-normal text-slate-400 dark:text-[#7C8189] lowercase font-sans">
                    {organizations.length} {organizations.length === 1 ? "organization" : "organizations"}
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 p-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#22242B]">
                  {organizations.map((org) => {
                    const isActive = currentOrg?.id === org.id;
                    const canDelete = organizations.length > 1;
                    return (
                      <div
                        key={org.id}
                        onClick={() => {
                          switchOrganization(org.id);
                          setDropdownOpen(false);
                        }}
                        className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-[#D8CFBC]/25 dark:bg-[#D8CFBC]/15 text-slate-950 dark:text-[#FFFBF4] border border-[#D8CFBC]/40 dark:border-[#D8CFBC]/25 shadow-2xs"
                            : "text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#18191E] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isActive
                                ? "bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C]"
                                : "bg-slate-100 dark:bg-[#18191E] text-slate-500 dark:text-[#9BA3AF] group-hover:bg-slate-200 dark:group-hover:bg-[#1E2026]"
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs ${isActive ? "font-bold text-slate-950 dark:text-white" : "font-medium text-slate-800 dark:text-[#F4F5F7]"}`}>
                              {org.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 dark:text-[#9BA3AF] truncate mt-0.5">
                              {org.slug} <span className="text-slate-300 dark:text-[#565449]">•</span> <span className="font-semibold">{org.currency}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive && (
                            <span className="w-5 h-5 rounded-full bg-[#090A0C]/10 dark:bg-[#D8CFBC]/20 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-slate-950 dark:text-[#D8CFBC]" />
                            </span>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              title={`Delete ${org.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrgToDelete(org);
                                setDeleteError("");
                                setDeleteModalOpen(true);
                                setDropdownOpen(false);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-[#22242B]">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#D8CFBC] hover:text-slate-950 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-[#18191E] dark:hover:bg-[#1E2026] border border-slate-200 dark:border-[#22242B] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#565449] dark:text-[#D8CFBC]" />
                    <span>Add Organization</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center: Global Search Command Bar (Top MNC Standard) */}
        <div className="flex-1 max-w-xs sm:max-w-md md:max-w-lg mx-2 sm:mx-6 min-w-0">
          <GlobalSearch onOpen={closeAllPopovers} />
        </div>

        {/* System & User Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifDrawer}
              className={`relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200/80 dark:border-[#262833] bg-slate-100/70 dark:bg-[#16171C] hover:bg-slate-100 dark:hover:bg-[#1E2026] text-slate-600 dark:text-[#9BA3AF] hover:text-slate-900 dark:hover:text-[#FFFBF4] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[#D8CFBC] ${
                notifOpen ? "bg-slate-200/70 dark:bg-[#22242B] text-slate-900 dark:text-white" : ""
              }`}
              title="Notifications (Esc to close)"
              aria-expanded={notifOpen}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4"/>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-white font-mono font-bold text-[10px] shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={tenantMenuVariants}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#121316] rounded-2xl border border-slate-200 dark:border-[#22242B] shadow-2xl shadow-black/10 dark:shadow-black/50 py-2 z-50 text-xs origin-top-right"
                >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-[#22242B] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#11120D]/5 text-[#565449] border border-[#565449]/20 dark:bg-[#D8CFBC]/10 dark:text-[#D8CFBC] dark:border-[#D8CFBC]/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[11px] text-[#565449] dark:text-[#D8CFBC] hover:text-black dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors">
                        <CheckCheck className="w-3 h-3"/>
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-[#D8CFBC] p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#18191E] transition-colors cursor-pointer"
                      title="Close notifications (Esc)"
                      aria-label="Close notifications"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#22242B]">
                  {loadingNotifs ? (
                    <div className="p-4 text-center text-slate-400 dark:text-[#7C8189]">Loading notifications...</div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read) handleMarkAsRead(notif.id);
                        }}
                        className={`p-3.5 hover:bg-[#D8CFBC]/15 dark:hover:bg-[#18191E] transition-colors flex items-start gap-3 cursor-pointer ${
                          !notif.is_read ? "bg-[#D8CFBC]/10 dark:bg-[#D8CFBC]/[0.05]" : ""
                        }`}
                      >
                        {getNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className={`font-semibold truncate text-xs ${!notif.is_read ? "text-slate-900 dark:text-[#F4F5F7]" : "text-slate-700 dark:text-[#CBD5E1]"}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#565449] dark:bg-[#D8CFBC] shadow-[0_0_6px_rgba(86,84,73,0.4)] dark:shadow-[0_0_6px_rgba(216,207,188,0.5)] shrink-0"/>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-[#9BA3AF] line-clamp-2 leading-relaxed text-[11px]">{notif.message}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 dark:text-[#7C8189]">
                            <span className="font-mono">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {notif.link && (
                              <Link to={notif.link} onClick={() => setNotifOpen(false)} className="text-[#565449] dark:text-[#D8CFBC] hover:underline flex items-center gap-1 font-medium transition-colors">
                                View Details <ExternalLink className="w-2.5 h-2.5"/>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 dark:text-[#9BA3AF]">
                      <Bell className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-600"/>
                      <p className="font-medium text-slate-700 dark:text-[#CBD5E1]">No notifications</p>
                      <p className="text-[11px] text-slate-400 dark:text-[#7C8189] mt-0.5">You are all caught up!</p>
                    </div>
                  )}
                </div>

                <div className="p-2.5 border-t border-slate-100 dark:border-[#22242B] bg-slate-50/80 dark:bg-[#090A0C] text-center">
                  <Link to="/audit" onClick={() => setNotifOpen(false)} className="text-xs text-[#565449] dark:text-[#D8CFBC] hover:text-black dark:hover:text-white font-medium inline-flex items-center gap-1 transition-colors">
                    <span>View Full Audit Trails & System Logs</span>
                    <span>→</span>
                  </Link>
                </div>
                </motion.div>)}
            </AnimatePresence>
          </div>

          {/* Single Clean Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-[#22242B] mx-0.5 sm:mx-1"/>

          {/* Active Operator & Live Role Switcher */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              className="group flex items-center gap-2 text-xs text-slate-800 dark:text-[#F4F5F7] bg-slate-100/70 dark:bg-[#16171C] hover:bg-slate-100 dark:hover:bg-[#1E2026] border border-slate-200/80 dark:border-[#262833] h-9 px-2 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[#D8CFBC] text-left outline-none"
              title="Active operator & role (Esc to close)"
              aria-expanded={userMenuOpen}
              aria-label="User menu"
            >
              <div className="w-6 h-6 rounded-md bg-slate-900 text-white dark:bg-[#D8CFBC] dark:text-[#090A0C] flex items-center justify-center shrink-0 font-mono font-bold text-[11px] shadow-2xs">
                {currentUser?.name ? (
                  currentUser.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1 leading-none">
                  <span suppressHydrationWarning className="font-semibold text-slate-900 dark:text-[#FFFBF4] truncate max-w-[110px] sm:max-w-[140px]">
                    {currentUser?.name || "Admin Operator"}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-[#808594] shrink-0 transition-transform duration-200 ${userMenuOpen ? "rotate-180 text-slate-700 dark:text-[#D8CFBC]" : ""}`}/>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[9px] font-mono font-medium text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider truncate max-w-[110px]">
                    {currentUser?.role?.replace("_", " ") || "Operator"}
                  </span>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={tenantMenuVariants}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#121316] rounded-2xl border border-slate-200 dark:border-[#22242B] shadow-2xl shadow-black/10 dark:shadow-black/50 p-2 z-50 origin-top-right"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-[#22242B] flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider">
                      Switch Operator (RBAC)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-[#7C8189]">
                      {currentOrg?.slug}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 p-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#22242B]">
                    {(currentOrg?.users || []).map((u) => {
                      const isSelected = u.id === currentUser?.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setUserMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#D8CFBC]/25 dark:bg-[#D8CFBC]/15 text-slate-950 dark:text-[#FFFBF4] border border-[#D8CFBC]/40 dark:border-[#D8CFBC]/25 shadow-2xs font-semibold"
                              : "text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#18191E] border border-transparent"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-[#F4F5F7] truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-[#9BA3AF] truncate mt-0.5">{u.email}</p>
                          </div>
                          <span className={`text-[10px] shrink-0 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C]"
                              : "bg-slate-100 dark:bg-[#18191E] text-slate-800 dark:text-[#D8CFBC] border border-slate-200 dark:border-[#22242B]"
                          }`}>
                            {u.role?.replace("_", " ") || u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 dark:border-[#22242B] pt-2 mt-1.5">
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        navigate("/");
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Sign Out Action (sleek ghost icon) */}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:text-[#808594] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Add Organization Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#22242B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-slate-700 dark:text-[#D8CFBC]" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-[#F4F5F7] text-base tracking-tight">Create New Organization</h3>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#22242B] hover:border-slate-300 dark:hover:border-[#D8CFBC]/40 bg-slate-50 dark:bg-[#18191E] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-3.5 h-3.5"/>
            </button>
          </div>

          {createError && (
            <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-2.5 rounded-xl font-medium">
              {createError}
            </p>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <Input label="Organization Name" placeholder="e.g. Samsung Semiconductor Ltd" value={newOrgName} onChange={handleNameChange} required/>
            <Input label="Identifier Slug" placeholder="e.g. samsung-semi" value={newOrgSlug} onChange={(e) => setNewOrgSlug(e.target.value)} required/>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#CBD5E1] mb-1">
                Default Currency
              </label>
              <Select
                value={newOrgCurrency}
                onChange={(val) => setNewOrgCurrency(val)}
                options={[
                  { value: "INR", label: "INR (₹) - Indian Rupee" },
                  { value: "USD", label: "USD ($) - US Dollar" },
                  { value: "EUR", label: "EUR (€) - Euro" },
                  { value: "GBP", label: "GBP (£) - British Pound" },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#22242B]">
              <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={creating} className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
                {creating ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Organization Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setOrgToDelete(null);
            setDeleteError("");
          }
        }}
        maxWidth="sm"
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#22242B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
                    Delete Organization
                  </h3>
                  {orgToDelete?.slug && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] text-[11px] font-mono text-slate-600 dark:text-[#D8CFBC]">
                      {orgToDelete.slug}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                  Permanent tenant ledger purge
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setDeleteModalOpen(false);
                setOrgToDelete(null);
                setDeleteError("");
              }}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#22242B] hover:border-slate-300 dark:hover:border-[#D8CFBC]/40 bg-slate-50 dark:bg-[#18191E] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-3.5">
            <p className="text-sm text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-950 dark:text-white font-semibold">
                {orgToDelete?.name}
              </strong>
              ? This will permanently erase all associated products, warehouses, orders, invoices, payments, and data from the database.
            </p>

            <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-snug">
                This action is destructive and cannot be undone. All database records will be erased.
              </span>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#22242B]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={deleting}
              onClick={() => {
                setDeleteModalOpen(false);
                setOrgToDelete(null);
                setDeleteError("");
              }}
              className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={deleting}
              onClick={handleConfirmDelete}
              className="rounded-xl px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </>);
};
