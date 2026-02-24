import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AuthUser, "name" | "email" | "role" | "avatar" | "theme">>) => Promise<void>;
  refetch: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthState(): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          applyTheme(data.data.theme);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Sign in failed");
    setUser(data.data);
    applyTheme(data.data.theme);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Sign up failed");
    setUser(data.data);
    applyTheme(data.data.theme);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    setUser(null);
    applyTheme("light");
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<AuthUser, "name" | "email" | "role" | "avatar" | "theme">>) => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");
      setUser(data.data);
      if (updates.theme) applyTheme(updates.theme);
    },
    []
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    refetch: fetchMe,
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove("dark", "high-contrast");

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "high-contrast") {
    root.classList.add("dark", "high-contrast");
  } else if (theme === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    }
  }
}
