"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginApi, signupApi, fetchMe, clearApiCache } from "@/lib/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  const persistSession = useCallback((data) => {
    localStorage.setItem("flowstock_token", data.access_token);
    localStorage.setItem("flowstock_org_id", data.organization.id);
    localStorage.setItem("flowstock_org_slug", data.organization.slug);
    localStorage.setItem("flowstock_org_name", data.organization.name);
    localStorage.setItem("flowstock_user_id", data.user.id);
    localStorage.setItem("flowstock_user_name", data.user.name);
    localStorage.setItem("flowstock_user_role", data.user.role);
    setToken(data.access_token);
    setUser(data.user);
    setOrganization(data.organization);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("flowstock_token");
    localStorage.removeItem("flowstock_org_id");
    localStorage.removeItem("flowstock_org_slug");
    localStorage.removeItem("flowstock_org_name");
    localStorage.removeItem("flowstock_user_id");
    localStorage.removeItem("flowstock_user_name");
    localStorage.removeItem("flowstock_user_role");
    clearApiCache();
    setToken(null);
    setUser(null);
    setOrganization(null);
  }, []);

  // On mount: check for existing token
  useEffect(() => {
    const savedToken = localStorage.getItem("flowstock_token");
    if (savedToken) {
      fetchMe(savedToken)
        .then((data) => {
          persistSession(data);
        })
        .catch(() => {
          clearSession();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [persistSession, clearSession]);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    persistSession(data);
    return data;
  };

  const signup = async (signupData) => {
    const data = await signupApi(signupData);
    persistSession(data);
    return data;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      token,
      isAuthenticated,
      loading,
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
