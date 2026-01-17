// src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUserDetails, CheckAuth, LogoutUser } from "../libs/auth/actions/user.actions";
import { useRouter } from "next/navigation";

interface AuthContextType {
  currentUser: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const result = await getUserDetails();
      if (result.success) {
        setCurrentUser(result.data);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle login
  const login = (userData: any) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const logout = async () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    await LogoutUser()
    // Optionally redirect to login page
    router.push('/login');
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for storage events to handle auth state changes across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        isAuthenticated, 
        isLoading,
        refreshUser: fetchUser,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}