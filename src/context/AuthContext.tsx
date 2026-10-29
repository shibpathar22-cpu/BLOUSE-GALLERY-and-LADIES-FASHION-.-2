import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount, UserRole, StaffPermissions } from '../types';

interface AuthContextType {
  currentUser: UserAccount;
  isAuthenticated: boolean;
  users: UserAccount[];
  isOwner: boolean;
  hasPermission: (perm: keyof StaffPermissions) => boolean;
  sendOtp: (phone: string) => Promise<{
    success: boolean;
    message: string;
    devCode?: string;
    providerStatus: {
      configured: boolean;
      providerName: string;
      instructions: string;
    };
  }>;
  verifyOtp: (phone: string, code: string) => Promise<UserAccount>;
  logout: () => void;
  switchUserForDemo: (userId: string) => void;
  createStaff: (data: {
    name: string;
    phone: string;
    permissions: StaffPermissions;
  }) => void;
  updateStaff: (id: string, updates: Partial<UserAccount>) => void;
  toggleStaffStatus: (id: string) => void;
}

const STORAGE_KEYS = {
  USERS: 'bg_users_v1',
  SESSION_USER: 'bg_auth_session_user_v1',
  SESSION_TOKEN: 'bg_auth_session_token_v1',
};

const DEFAULT_OWNER: UserAccount = {
  id: 'usr-owner-01',
  name: 'Mrs. Jayashree Sharma (Owner)',
  phone: '+91 98765 43210',
  role: 'owner',
  isActive: true,
  permissions: {
    canManageSales: true,
    canManageExpenses: true,
    canManageCashDrawer: true,
    canViewReports: true,
    canManageStock: true,
  },
  createdAt: Date.now() - 30 * 86400000,
  lastLoginAt: Date.now(),
};

const DEFAULT_STAFF: UserAccount = {
  id: 'usr-staff-01',
  name: 'Aarti (Counter & Billing Staff)',
  phone: '+91 98765 11223',
  role: 'staff',
  isActive: true,
  permissions: {
    canManageSales: true,
    canManageExpenses: false,
    canManageCashDrawer: false,
    canViewReports: true,
    canManageStock: true,
  },
  createdAt: Date.now() - 15 * 86400000,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
      return [DEFAULT_OWNER, DEFAULT_STAFF];
    } catch {
      return [DEFAULT_OWNER, DEFAULT_STAFF];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Find in current users list
        return parsed;
      }
      return DEFAULT_OWNER;
    } catch {
      return DEFAULT_OWNER;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  // Sync session user
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to save session user', e);
    }
  }, [currentUser]);

  const isOwner = currentUser.role === 'owner';

  const hasPermission = (perm: keyof StaffPermissions): boolean => {
    if (currentUser.role === 'owner') return true;
    if (!currentUser.isActive) return false;
    return Boolean(currentUser.permissions[perm]);
  };

  const sendOtp = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send OTP');
      }

      const data = await res.json();
      return data;
    } catch (error: any) {
      // Fallback for full offline / no network environment
      console.warn('API send-otp call failed, running offline verified generator', error);
      const cleaned = phone.replace(/[^\d+]/g, '');
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem(`offline_otp_${cleaned}`, code);

      return {
        success: true,
        message: `Offline OTP generated for ${cleaned}`,
        devCode: code,
        providerStatus: {
          configured: false,
          providerName: 'Offline Mode OTP Gateway',
          instructions: 'Operating without active network. Use the verified code shown above.',
        },
      };
    }
  };

  const verifyOtp = async (phone: string, code: string): Promise<UserAccount> => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const matchedUser = users.find((u) => u.phone.replace(/[^\d+]/g, '') === cleaned);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: code,
          userProfile: matchedUser,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid OTP code');
      }

      const data = await res.json();
      const verifiedUser = data.user as UserAccount;

      // Update in state
      setCurrentUser(verifiedUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, data.token);

      return verifiedUser;
    } catch (apiErr: any) {
      // Fallback for offline mode verification
      const storedOffline = sessionStorage.getItem(`offline_otp_${cleaned}`);
      if (storedOffline && storedOffline === code.trim()) {
        sessionStorage.removeItem(`offline_otp_${cleaned}`);
        const userToLogin: UserAccount = matchedUser || {
          id: cleaned.includes('9876543210') ? 'usr-owner-01' : `usr-staff-${Date.now()}`,
          name: cleaned.includes('9876543210') ? 'Mrs. Jayashree Sharma (Owner)' : 'Staff User',
          phone: cleaned,
          role: cleaned.includes('9876543210') ? 'owner' : 'staff',
          isActive: true,
          permissions: {
            canManageSales: true,
            canManageExpenses: false,
            canManageCashDrawer: false,
            canViewReports: true,
            canManageStock: true,
          },
          createdAt: Date.now(),
        };

        setCurrentUser(userToLogin);
        setIsAuthenticated(true);
        return userToLogin;
      }

      throw new Error(apiErr.message || 'OTP verification failed. Please try again.');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    // Don't erase user profile; switch to logged-out state
  };

  const switchUserForDemo = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
    }
  };

  const createStaff = (data: {
    name: string;
    phone: string;
    permissions: StaffPermissions;
  }) => {
    if (!isOwner) {
      throw new Error('Only the shop owner can create staff accounts.');
    }

    const newStaff: UserAccount = {
      id: `usr-staff-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      role: 'staff',
      isActive: true,
      permissions: data.permissions,
      createdAt: Date.now(),
    };

    setUsers((prev) => [...prev, newStaff]);
  };

  const updateStaff = (id: string, updates: Partial<UserAccount>) => {
    if (!isOwner) {
      throw new Error('Only the shop owner can edit staff permissions.');
    }

    // Protect owner account from modification by staff
    const target = users.find((u) => u.id === id);
    if (target?.role === 'owner' && updates.role === 'staff') {
      throw new Error('Cannot downgrade owner account.');
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );

    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const toggleStaffStatus = (id: string) => {
    if (!isOwner) {
      throw new Error('Only the shop owner can change account status.');
    }

    const target = users.find((u) => u.id === id);
    if (target?.role === 'owner') {
      throw new Error('Cannot deactivate the owner account.');
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
        isOwner,
        hasPermission,
        sendOtp,
        verifyOtp,
        logout,
        switchUserForDemo,
        createStaff,
        updateStaff,
        toggleStaffStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
