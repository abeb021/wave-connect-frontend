import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  UserResponse, 
  getToken, 
  setToken, 
  clearToken, 
  getCurrentUserId, 
  setCurrentUserId,
  getCurrentUsername,
  setCurrentUsername,
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
    const username = getCurrentUsername();
    const email = getCurrentEmail();
    const createdAt = getCurrentCreatedAt();
    
    if (token && userId && username && email) {
      // Restore session from cookies/localStorage
      setUser({
        id: userId,
        username: username,
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
    setCurrentUsername(userData.username);
    setCurrentEmail(userData.email);
    setCurrentCreatedAt(userData.created_at);
    
    // Update state
    setUser(userData);
  };

  const logout = () => {
    // Clear cookies and localStorage
    clearToken();
    setCurrentUserId('');
    setCurrentUsername('');
    setCurrentEmail('');
    setCurrentCreatedAt('');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('created_at');
    
    // Clear state
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
