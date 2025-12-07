"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, setAccessToken, getAccessToken, ApiError } from '../lib/api-client';

// Types from API
interface Role {
  id: string;
  name: string;
  type: string;
  permissions?: string[];
}

interface Organization {
  id: string;
  name: string;
  industry: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isActive: boolean;
  roleId: string;
  organizationId: string;
  role: Role;
  organization?: Organization;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Refresh token storage
let refreshToken: string | null = null;

function setRefreshToken(token: string | null) {
  refreshToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('topline_refresh_token', token);
    } else {
      localStorage.removeItem('topline_refresh_token');
    }
  }
}

function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('topline_refresh_token');
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const user = await api.auth.me();
          setState({
            user: user as User,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          // Token invalid, try refresh
          const rToken = getRefreshToken();
          if (rToken) {
            try {
              await api.auth.refresh(rToken);
              const user = await api.auth.me();
              setState({
                user: user as User,
                isLoading: false,
                isAuthenticated: true,
                error: null,
              });
            } catch {
              // Refresh failed, clear tokens
              setAccessToken(null);
              setRefreshToken(null);
              setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
              });
            }
          } else {
            setAccessToken(null);
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: null,
            });
          }
        }
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.auth.login({ email, password });
      setRefreshToken(response.refreshToken);

      // Fetch full user with organization
      const user = await api.auth.me();

      setState({
        user: user as User,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Login failed. Please try again.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.auth.register({ email, password, name, organizationName });
      setRefreshToken(response.refreshToken);

      // Fetch full user with organization
      const user = await api.auth.me();

      setState({
        user: user as User,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Registration failed. Please try again.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setRefreshToken(null);
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const user = await api.auth.me();
      setState(prev => ({
        ...prev,
        user: user as User,
      }));
    } catch {
      // If refresh fails, logout
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for requiring authentication
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}

// Helper hook for role-based access
export function useRequireRole(allowedRoles: string[], redirectTo = '/') {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!allowedRoles.includes(user.role.type)) {
        window.location.href = redirectTo;
      }
    }
  }, [user, isLoading, isAuthenticated, allowedRoles, redirectTo]);

  return { user, isLoading, isAuthenticated };
}
