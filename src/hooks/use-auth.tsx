import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, type AppUser } from "@/lib/api";

type AuthContextValue = {
  user: AppUser | null;
  role: "admin" | "user" | null;
  loading: boolean;
  isAdmin: boolean;
  refreshAuth: () => Promise<void>;
  setUser: (user: AppUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const data = await apiFetch<{ user: AppUser }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      isAdmin: user?.role === "admin",
      refreshAuth,
      setUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
