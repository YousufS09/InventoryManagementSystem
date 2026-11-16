import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { AUTH_EXPIRED_EVENT, apiFetch, apiRequest } from "../services/api";

export type User = {
  id: number;
  username: string;
  email: string;
};

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Loads the signed-in user once for the whole app, instead of every page
 * fetching /api/auth/profile on its own.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: User }>("/api/auth/profile");
      setUserState(data.user);
      setStatus("authenticated");
    } catch {
      setUserState(null);
      setStatus("anonymous");
    }
  }, []);

  const setUser = useCallback((nextUser: User) => {
    setUserState(nextUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local state even if the server could not be reached.
    }
    setUserState(null);
    setStatus("anonymous");
  }, []);

  // Initial session check on app load.
  useEffect(() => {
    apiRequest<{ user: User }>("/api/auth/profile")
      .then((data) => {
        setUserState(data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        setUserState(null);
        setStatus("anonymous");
      });
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUserState(null);
      setStatus("anonymous");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const value = useMemo(
    () => ({ user, status, setUser, refresh, logout }),
    [user, status, setUser, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
