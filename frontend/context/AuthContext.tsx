import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authAPI, userAPI, adminAPI, handleAPIError } from '../lib/api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  idNumber?: string;
  accountNumber?: string;
  balance?: number;
  verified: boolean;
  approved: boolean;
  role?: 'user' | 'admin';
  createdAt?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'staff';
  lastLogin?: string;
}

interface AuthContextType {
  // User state
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  setAdminSession: (token: string, admin: Admin) => void;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;

  // User methods
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  idNumber: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('admin');

    if (storedToken) {
      setToken(storedToken);
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      if (storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      
      const { token: authToken, user: userData } = response.data;
      
      // Store auth data
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.adminLogin({ email, password });
      
      const { token: authToken, admin: adminData } = response.data;
      
      // Store auth data
      localStorage.setItem('token', authToken);
      localStorage.setItem('admin', JSON.stringify(adminData));
      
      setToken(authToken);
      setAdmin(adminData);
      
      toast.success('Admin login successful!');
      return true;
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authAPI.register(userData);
      
      toast.success('Registration successful! Please check your email to verify your account.');
      return true;
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (verificationToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyEmail(verificationToken);
      
      toast.success(response.data.message);
      return true;
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    
    setToken(null);
    setUser(null);
    setAdmin(null);
    
    toast.success('Logged out successfully');
    router.push('/');
  };

  const setAdminSession = (authToken: string, adminData: Admin) => {
    // Store auth data
    localStorage.setItem('token', authToken);
    localStorage.setItem('admin', JSON.stringify(adminData));
    
    setToken(authToken);
    setAdmin(adminData);
  };

  const refreshProfile = async () => {
    try {
      if (user && token) {
        const response = await userAPI.getProfile();
        const updatedUser = response.data.user;
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const isAuthenticated = !!(token && (user || admin));

  const value: AuthContextType = {
    user,
    admin,
    isAuthenticated,
    isLoading,
    token,
    login,
    loginAdmin: adminLogin,
    adminLogin,
    setAdminSession,
    register,
    logout,
    verifyEmail,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};