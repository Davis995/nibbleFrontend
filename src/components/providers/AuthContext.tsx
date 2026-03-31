"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { authService } from '@/lib/authService.js';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
  user_type: string;
  organisation: string | null;
  organisation_id: string | number | null;
  is_trial_active: boolean;
  trial_remaining_days: number;
  onboarding: boolean;
  org_orientation: boolean;
  subscription: {
    plan_name: string;
    status: string;
    remaining_credits: number;
    billing_end_date: string;
    remaining_days: number;
  };
}

interface Tokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  role: string | null;
  plan: any;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  setSession: (data: { user: User; tokens: Tokens }) => void;
  redirectToDashboardByRole: (role: string | null) => void;
  updateOnboarding: (value: boolean) => void;
  updateOrgOrientation: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedTokens = localStorage.getItem('tokens');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const storedPlan = localStorage.getItem('plan');

    if (storedTokens && storedUser) {
      setTokens(JSON.parse(storedTokens));
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      setPlan(storedPlan ? JSON.parse(storedPlan) : null);
    }
    setIsLoading(false);
  }, []);

  const roleRoutes: { [key: string]: string } = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    school_admin: '/school/dashboard',
    'school-admin': '/school/dashboard',
    admin: '/school/dashboard',
    // Add other roles as needed
  };

  const getRouteForRole = (role: string | null) => {
    if (!role) return '/dashboard';

    const normalizedRole = role.trim().toLowerCase();
    return roleRoutes[normalizedRole] || '/dashboard';
  };

  const redirectToDashboardByRole = (role: string | null) => {
    const route = getRouteForRole(role);
    console.log('Redirecting to:', route);
    window.location.href = route;
  };

  const setSession = (data: { user: User; tokens: Tokens }) => {
    setUser(data.user);
    setTokens(data.tokens);
    setRole(data.user.role);
    setPlan(data.user.subscription);

    localStorage.setItem('tokens', JSON.stringify(data.tokens));
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('plan', JSON.stringify(data.user.subscription));
    localStorage.setItem('onboarding', JSON.stringify(data.user.onboarding));
    localStorage.setItem('org_orientation', JSON.stringify(data.user.org_orientation));
    
    // Immediately set cookie for middleware to prevent redirect loops
    if (data.tokens?.access) {
      document.cookie = `auth-token=${data.tokens.access}; path=/; max-age=86400; samesite=strict`;
    }
    
    // Store organisation_id for school admins
    if (['school_admin', 'school-admin', 'admin', 'school admin'].includes(data.user.role)) {
      if (data.user.organisation_id) {
        localStorage.setItem('organisation_id', data.user.organisation_id.toString());
      }
    }
  };

  const updateOnboarding = (value: boolean) => {
    if (user) {
      const updatedUser = { ...user, onboarding: value };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('onboarding', JSON.stringify(value));
    }
  };

  const updateOrgOrientation = (value: boolean) => {
    if (user) {
      const updatedUser = { ...user, org_orientation: value };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('org_orientation', JSON.stringify(value));
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    console.log('Login attempt with credentials:', credentials);
    try {
      setIsLoading(true);
      console.log('Calling authService.login...');
      const data = await authService.login(credentials);
      console.log('Login response:', data);

      setSession(data);
      toast.success(data.message || 'Login successful');

      // Check onboarding status
      const adminRoles = ['school_admin', 'school-admin', 'admin'];
      if (data.user.is_superuser) {
        window.location.href = '/admin/tools';
      } else if (data.user.onboarding === false && !adminRoles.includes(data.user.role?.toLowerCase())) {
        window.location.href = '/onboarding';
      } else {
        redirectToDashboardByRole(data.user.role);
      }

    } catch (error) {
      console.error('Login error:', error);
      toast.error((error as Error).message || 'Login failed');
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if we have tokens
      if (tokens?.access) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }

    // Clear local state
    setUser(null);
    setTokens(null);
    setRole(null);
    setPlan(null);

    // Clear localStorage
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('plan');
    localStorage.removeItem('organisation_id');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    tokens,
    role,
    plan,
    isLoading,
    login,
    logout,
    setSession,
    redirectToDashboardByRole,
    updateOnboarding,
    updateOrgOrientation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};