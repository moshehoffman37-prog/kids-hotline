import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getStoredAuth, storeAuth, clearAuth, User, AuthState } from "@/lib/auth";
import { getApiUrl } from "@/lib/query-client";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const { token, user } = await getStoredAuth();
      if (token && user) {
        setState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const baseUrl = getApiUrl();
        const response = await fetch(new URL("/api/auth/login", baseUrl).href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.message || "Login failed" };
        }

        await storeAuth(data.token, data.user);
        setState({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: "Unable to connect. Please check your internet connection.",
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await clearAuth();
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
