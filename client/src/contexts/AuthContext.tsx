import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  UserResponse, 
  getToken, 
  setToken,
  clearSession,
  getCurrentUserId, 
  setCurrentUserId,
  getCurrentEmail,
  setCurrentEmail,
  getCurrentCreatedAt,
  setCurrentCreatedAt
} from '@/lib/api';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: UserResponse, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount (from cookies/localStorage)
  useEffect(() => {
    const token = getToken();
    const userId = getCurrentUserId();
    const email = getCurrentEmail();
    const createdAt = getCurrentCreatedAt();
    
    if (token && userId && email) {
      // Restore session from cookies/localStorage
      setUser({
        id: userId,
        email: email,
        created_at: createdAt || new Date().toISOString(),
      });
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: UserResponse, token: string) => {
    // Store in cookies (with localStorage fallback)
    setToken(token);
    setCurrentUserId(userData.id);
    setCurrentEmail(userData.email);
    setCurrentCreatedAt(userData.created_at);
    
    // Update state
    setUser(userData);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
