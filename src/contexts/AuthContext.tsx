import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService, LoginResponse } from '@/services/authService';
import { userService } from '@/services/userService';
import { Chatbot } from '@/services/chatbotService';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: string | null;
  clientId: string | null;
  chatbots: Chatbot[];
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

interface DecodedToken {
  user_id: string;
  user_type: string;
  clients: Record<string, string>; // Map of client_id -> some_value
  iat: number;
  exp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));
  const [clientId, setClientId] = useState<string | null>(localStorage.getItem('client_id'));
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);

  const fetchUserInfo = useCallback(async (uId: string, cId: string) => {
    try {
      const userInfo = await userService.getUserInfo(uId, cId);
      console.log("User info fetched", userInfo);
      if (userInfo.configs && userInfo.configs.length > 0) {
        const firstConfig = userInfo.configs[0];
        localStorage.setItem('config_id', firstConfig.config_id);
      }
      if (userInfo.chatbots) {
        setChatbots(userInfo.chatbots);
      }
    } catch (err) {
      console.error("Failed to fetch user info via /me", err);
    }
  }, []);

  useEffect(() => {
    // Restore session if token exists
    const token = localStorage.getItem('access_token');
    const uId = localStorage.getItem('user_id');
    const cId = localStorage.getItem('client_id');

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Verify expiration (simple check)
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          const storedUser = localStorage.getItem('user_details');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          // Fetch fresh user data including chatbots
          if (uId && cId) {
            fetchUserInfo(uId, cId);
          }
        }
      } catch (e) {
        logout();
      }
    }
  }, [fetchUserInfo]);

  const login = async (email: string, pass: string) => {
    try {
      const data: LoginResponse = await authService.login(email, pass);

      const token = data.access_token;
      const decoded = jwtDecode<DecodedToken>(token);

      const uId = decoded.user_id;
      // Extract the first client id from the KEYS as per user request.
      // "clients": { "a3ea1cda...": "..." } -> We want "a3ea1cda..."
      const clientKeys = Object.keys(decoded.clients);
      const cId = clientKeys.length > 0 ? clientKeys[0] : null;

      if (!uId || !cId) {
        console.error("Could not extract user_id or client_id from token", decoded);
        toast.error("Login failed: Invalid token format.");
        return;
      }

      // Save to state and local storage
      setAccessToken(token);
      setUserId(uId);
      setClientId(cId);

      const userData: User = {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`,
        email: data.user.email,
        phone: data.user.phone
      };

      setUser(userData);

      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_id', uId);
      localStorage.setItem('client_id', cId);
      localStorage.setItem('user_details', JSON.stringify(userData));

      // Call the background user-login API
      try {
        await authService.createUserLogin(uId, cId);
      } catch (err) {
        console.error("Background user creation failed", err);
      }

      // Call /me to get user info (configs, chatbots)
      await fetchUserInfo(uId, cId);

    } catch (error: any) {
      console.error("Login error", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAccessToken(null);
    setUserId(null);
    setClientId(null);
    setChatbots([]);
  };

  const refreshUserData = async () => {
    if (userId && clientId) {
      await fetchUserInfo(userId, clientId);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!accessToken,
      accessToken,
      userId,
      clientId,
      chatbots,
      login,
      logout,
      refreshUserData
    }}>
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
