"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { login as loginAction, register as registerAction, logout as logoutAction, getCurrentUser } from '@/actions/auth';

// Types
interface Role {
  id: string;
  name: string;
  type: string;
  permissions?: unknown;
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
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      try {
        const result = await getCurrentUser();
        if (result.success && result.data) {
          setState({
            user: result.data as User,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } catch {
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
      const result = await loginAction({ email, password });

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      setState({
        user: result.data!.user as User,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error
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
      const result = await registerAction({
        email,
        password,
        name,
        organizationName,
      });

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      setState({
        user: result.data!.user as User,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error
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

  const logout = useCallback(async () => {
    await logoutAction();
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
    try {
      const result = await getCurrentUser();
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          user: result.data as User,
        }));
      } else {
        // If refresh fails, logout
        await logout();
      }
    } catch {
      await logout();
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
