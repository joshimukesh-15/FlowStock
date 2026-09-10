"use client";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, } from "react";
import { useTenant } from "./TenantContext";
import { useToast } from "./ToastContext";
const WebSocketContext = createContext({
    isConnected: false,
    lastEvent: null,
    subscribe: () => () => { },
    toasts: [],
    dismissToast: () => { },
});
export const WebSocketProvider = ({ children, }) => {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const wsRef = useRef(null);
    const listenersRef = useRef(new Map());
    const reconnectTimeoutRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const addToast = useCallback((item) => {
        // Respect the live-toast preference stored from Settings (off = no floating toasts)
        if (typeof window !== "undefined" && localStorage.getItem("flowstock_live_toasts") === "off") {
            return;
        }
        const typeMap = {
            SUCCESS: "success",
            DANGER: "error",
            WARNING: "warning",
            INFO: "info",
        };
        const toastType = typeMap[item.type] || "info";
        toast[toastType](item.title, item.message, { link: item.link });
    }, [toast]);
    const subscribe = useCallback((event, callback) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event).add(callback);
        return () => {
            const listeners = listenersRef.current.get(event);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }, []);
    useEffect(() => {
        if (!currentOrg?.id) {
            setIsConnected(false);
            return;
        }
        const orgId = currentOrg.id;
        let isCleanedUp = false;
        const connect = () => {
            if (isCleanedUp)
                return;
            const apiUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:8000/api/v1";
            const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
            const host = apiUrl.replace(/^https?:\/\//, "");
            const wsUrl = `${wsProtocol}://${host}/ws/${orgId}`;
            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;
                ws.onopen = () => {
                    if (isCleanedUp) {
                        ws.close();
                        return;
                    }
                    setIsConnected(true);
                    // Start 25-second heartbeat ping
                    if (pingIntervalRef.current)
                        clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send("ping");
                        }
                    }, 25000);
                };
                ws.onmessage = (event) => {
                    if (event.data === "pong")
                        return;
                    try {
                        const parsed = JSON.parse(event.data);
                        setLastEvent(parsed);
                        // Fire registered event callbacks
                        const eventListeners = listenersRef.current.get(parsed.event);
                        if (eventListeners) {
                            eventListeners.forEach((cb) => {
                                try {
                                    cb(parsed.data);
                                }
                                catch (e) {
                                    console.error("Error in websocket listener", e);
                                }
                            });
                        }
                        // Universal wildcard listeners
                        const allListeners = listenersRef.current.get("*");
                        if (allListeners) {
                            allListeners.forEach((cb) => {
                                try {
                                    cb(parsed);
                                }
                                catch (e) {
                                    console.error("Error in wildcard listener", e);
                                }
                            });
                        }
                        // If notification event, show live floating toast!
                        if (parsed.event === "NOTIFICATION_CREATED" && parsed.data) {
                            addToast({
                                title: parsed.data.title || "New Notification",
                                message: parsed.data.message || "",
                                type: parsed.data.type || "INFO",
                                link: parsed.data.link,
                            });
                        }
                    }
                    catch (e) {
                        // Ignore non-JSON messages
                    }
                };
                ws.onclose = () => {
                    setIsConnected(false);
                    if (pingIntervalRef.current)
                        clearInterval(pingIntervalRef.current);
                    if (!isCleanedUp) {
                        reconnectTimeoutRef.current = setTimeout(connect, 3000);
                    }
                };
                ws.onerror = () => {
                    ws.close();
                };
            }
            catch (err) {
                setIsConnected(false);
                if (!isCleanedUp) {
                    reconnectTimeoutRef.current = setTimeout(connect, 3000);
                }
            }
        };
        connect();
        return () => {
            isCleanedUp = true;
            if (reconnectTimeoutRef.current)
                clearTimeout(reconnectTimeoutRef.current);
            if (pingIntervalRef.current)
                clearInterval(pingIntervalRef.current);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [currentOrg?.id, addToast]);
    return (<WebSocketContext.Provider value={{
            isConnected,
            lastEvent,
            subscribe,
            toasts: [],
            dismissToast: () => { },
        }}>
      {children}
    </WebSocketContext.Provider>);
};
export const useRealtime = () => useContext(WebSocketContext);
