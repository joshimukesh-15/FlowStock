import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Building2, ChevronDown, Plus, User, Check, X, Bell, CheckCheck, ExternalLink, AlertTriangle, Info, CheckCircle2, AlertCircle, Trash2, LogOut, } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
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
                return <AlertTriangle className="w-3.5 h-3.5 text-slate-700 shrink-0"/>;
            case "SUCCESS":
                return <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0"/>;
            case "DANGER":
                return <AlertCircle className="w-3.5 h-3.5 text-slate-800 shrink-0"/>;
            default:
                return <Info className="w-3.5 h-3.5 text-slate-600 shrink-0"/>;
        }
    };
    return (<>
      <header className="h-12 glass-header px-4 md:px-6 flex items-center justify-between shrink-0 relative z-30">
        {/* Tenant Selector */}
        <div className="relative" ref={tenantMenuRef}>
          <button onClick={toggleDropdown} className="btn-tactile flex items-center gap-2.5 text-xs text-slate-700 dark:text-[#9BA3AF] bg-slate-50/90 dark:bg-[#23262F]/90 hover:bg-slate-100 dark:hover:bg-[#2C303B] border border-slate-200 dark:border-[#323744] border-t-white/80 dark:border-t-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-[#9BA3AF]"/>
            <div className="flex flex-col text-left">
              <span suppressHydrationWarning className="font-semibold text-slate-900 dark:text-[#F4F5F7] leading-tight">
                {currentOrg ? currentOrg.name : "Select Tenant..."}
              </span>
              <span suppressHydrationWarning className="text-[10px] text-slate-500 dark:text-[#9BA3AF] font-mono">
                {currentOrg ? `${currentOrg.slug} (${currentOrg.currency})` : "Loading"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1"/>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (<motion.div initial="hidden" animate="visible" exit="exit" variants={tenantMenuVariants} className="absolute top-full left-0 mt-1.5 w-72 bg-white/95 dark:bg-[#23262F]/95 backdrop-blur-md border border-slate-200 dark:border-[#323744] border-t-white/90 dark:border-t-white/15 rounded-xl shadow-2xl py-1 z-50 origin-top-left">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#323744] text-[11px] font-semibold text-slate-400 dark:text-[#7C8189] uppercase tracking-wider">
                Select Active Organization
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#262A34]">
                {organizations.map((org) => {
                const isActive = currentOrg?.id === org.id;
                const canDelete = organizations.length > 1;
                return (<div key={org.id} onClick={() => {
                        switchOrganization(org.id);
                        setDropdownOpen(false);
                    }} className={`group w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer ${isActive ? "bg-slate-50 dark:bg-[#23262F]/50 text-slate-900 dark:text-[#F4F5F7] font-semibold" : "text-slate-700 dark:text-[#CBD5E1]"}`}>
                      <div className="min-w-0 pr-2 flex-1">
                        <p className="truncate">{org.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-[#7C8189] font-mono">
                          {org.slug} ({org.currency})
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && <Check className="w-3.5 h-3.5 text-slate-950 dark:text-[#F4F5F7]"/>}
                        {canDelete && (<button type="button" title={`Delete ${org.name}`} onClick={(e) => {
                            e.stopPropagation();
                            setOrgToDelete(org);
                            setDeleteError("");
                            setDeleteModalOpen(true);
                            setDropdownOpen(false);
                        }} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>)}
                      </div>
                    </div>);
            })}
              </div>
              <div className="border-t border-slate-100 dark:border-[#323744] p-1.5 space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-xs gap-1 py-1 h-auto justify-center"
                >
                  <Plus className="w-3 h-3"/>
                  Add Organization
                </Button>
              </div>
              </motion.div>)}
          </AnimatePresence>
        </div>

        {/* System & User Controls */}
        <div className="flex items-center gap-3">
          <GlobalSearch onOpen={closeAllPopovers} />

          <div className="h-4 w-px bg-slate-200 dark:bg-[#23262F]"/>

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifDrawer}
              className={`btn-tactile relative p-2 rounded-xl text-slate-500 dark:text-[#9BA3AF] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#23262F] transition-all cursor-pointer ${
                notifOpen ? "bg-slate-100 dark:bg-[#23262F] text-slate-900 dark:text-white" : ""
              }`}
              title="Notifications (Esc to close)"
              aria-expanded={notifOpen}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4"/>
              {unreadCount > 0 && (<span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#B6FF2E] text-[10px] font-bold text-[#14171F] shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>)}
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
              {notifOpen && (<motion.div initial="hidden" animate="visible" exit="exit" variants={tenantMenuVariants} className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 dark:bg-[#181A20]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-[#323744] border-t-white/90 dark:border-t-white/15 shadow-2xl py-2 z-50 text-xs origin-top-right">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#323744] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-sm">Notifications</span>
                    {unreadCount > 0 && (<Badge variant="danger" className="text-[10px] py-0 px-1.5">
                        {unreadCount} unread
                      </Badge>)}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (<button onClick={handleMarkAllRead} className="text-[11px] text-slate-700 dark:text-[#CBD5E1] hover:text-black dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors">
                        <CheckCheck className="w-3 h-3"/>
                        Mark all read
                      </button>)}
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#23262F] transition-colors cursor-pointer"
                      title="Close notifications (Esc)"
                      aria-label="Close notifications"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#262A34]">
                  {loadingNotifs ? (<div className="p-4 text-center text-slate-400 dark:text-[#7C8189]">Loading notifications...</div>) : notifications.length > 0 ? (notifications.map((notif) => (<div key={notif.id} onClick={() => {
                    if (!notif.is_read)
                        handleMarkAsRead(notif.id);
                }} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-2.5 cursor-pointer ${!notif.is_read ? "bg-slate-100/70 dark:bg-[#23262F]/50" : ""}`}>
                        {getNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`font-semibold truncate ${!notif.is_read ? "text-slate-900 dark:text-[#F4F5F7]" : "text-slate-700 dark:text-[#CBD5E1]"}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (<span className="w-2 h-2 rounded-full bg-slate-950 dark:bg-slate-100 shrink-0"/>)}
                          </div>
                          <p className="text-slate-600 dark:text-[#9BA3AF] line-clamp-2 leading-relaxed text-[11px]">{notif.message}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 dark:text-[#7C8189]">
                            <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {notif.link && (<Link to={notif.link} onClick={() => setNotifOpen(false)} className="text-slate-950 dark:text-[#F4F5F7] hover:underline flex items-center gap-0.5 font-medium">
                                View Details <ExternalLink className="w-2.5 h-2.5"/>
                              </Link>)}
                          </div>
                        </div>
                      </div>))) : (<div className="p-6 text-center text-slate-500 dark:text-[#9BA3AF]">
                      <Bell className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-600"/>
                      <p className="font-medium text-slate-700 dark:text-[#CBD5E1]">No notifications</p>
                      <p className="text-[11px] text-slate-400 dark:text-[#7C8189] mt-0.5">You are all caught up!</p>
                    </div>)}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-[#323744] bg-slate-50 dark:bg-[#14171F]/60 text-center">
                  <Link to="/audit" onClick={() => setNotifOpen(false)} className="text-xs text-slate-600 dark:text-[#9BA3AF] hover:text-slate-900 dark:hover:text-slate-100 font-medium">
                    View Full Audit Trails & System Logs →
                  </Link>
                </div>
                </motion.div>)}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#23262F]"/>

          {/* Active Operator & Live Role Switcher */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={toggleUserMenu} className="btn-tactile flex items-center gap-2 text-sm text-slate-700 dark:text-[#F4F5F7] hover:bg-slate-100 dark:hover:bg-[#23262F] p-1.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-[#323744] transition-all cursor-pointer text-left" title="Click to switch active user / role">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#2C303B] border border-slate-300 dark:border-[#545963] flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600 dark:text-[#F4F5F7]"/>
              </div>
              <div>
                <p suppressHydrationWarning className="text-xs font-semibold leading-none text-slate-900 dark:text-white flex items-center gap-1">
                  {currentUser?.name || "Admin Operator"}
                  <ChevronDown className="w-3 h-3 text-slate-400"/>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#23262F] text-slate-800 dark:text-[#B6FF2E] border border-slate-200 dark:border-[#323744] uppercase tracking-wider">
                    {currentUser?.role?.replace("_", " ") || "Operator"}
                  </span>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (<motion.div initial="hidden" animate="visible" exit="exit" variants={tenantMenuVariants} className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#181A20]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-[#323744] border-t-white/90 dark:border-t-white/15 shadow-2xl py-2 z-50 origin-top-right">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#323744] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9BA3AF] uppercase tracking-wider">
                      Switch Active User (RBAC)
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-[#7C8189]">
                      {currentOrg?.slug}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {(currentOrg?.users || []).map((u) => {
                const isSelected = u.id === currentUser?.id;
                return (<button key={u.id} onClick={() => {
                        switchUser(u.id);
                        setUserMenuOpen(false);
                    }} className={`w-full px-3 py-2 text-left flex items-start justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isSelected ? "bg-slate-50/80 dark:bg-[#23262F]/50 font-medium" : ""}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-[#F4F5F7] truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-[#9BA3AF] truncate">{u.email}</p>
                          </div>
                          <span className={`text-[10px] shrink-0 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${u.role === "admin" ? "bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950" : "bg-slate-100 dark:bg-[#23262F] text-slate-800 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#3A404F]"}`}>
                            {u.role?.replace("_", " ") || u.role}
                          </span>
                        </button>);
            })}
                  </div>
                  <div className="border-t border-slate-100 dark:border-[#323744] p-1.5">
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        navigate("/");
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>)}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#23262F]"/>

          {/* Quick Sign Out Action */}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 dark:text-[#9BA3AF] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title="Sign Out & Return to Landing Page"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Add Organization Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#323744]">
              <h3 className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-sm">Create New Organization</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {createError && (<p className="text-xs text-slate-950 dark:text-[#F4F5F7] bg-slate-100 dark:bg-[#23262F] border border-slate-300 dark:border-[#3A404F] p-2.5 rounded font-medium">
                {createError}
              </p>)}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <Input label="Organization Name" placeholder="e.g. Apex Industrial Supplies" value={newOrgName} onChange={handleNameChange} required/>
              <Input label="Identifier Slug" placeholder="e.g. apex-industrial" value={newOrgSlug} onChange={(e) => setNewOrgSlug(e.target.value)} required/>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Default Currency
                </label>
                <select value={newOrgCurrency} onChange={(e) => setNewOrgCurrency(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-[#3A404F] bg-white dark:bg-[#23262F] text-slate-900 dark:text-[#F4F5F7] px-3 py-2 text-sm focus:border-zinc-900 dark:focus:border-slate-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100">
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
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#F4F5F7]">Delete Organization</h3>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] font-mono">{orgToDelete?.slug}</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-[#CBD5E1] mb-4 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong className="text-slate-900 dark:text-[#F4F5F7] font-semibold">{orgToDelete?.name}</strong>?
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
