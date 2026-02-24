import { useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  theme: "light" | "dark";
}

const DEFAULT_USER: UserProfile = {
  name: "Shahzeb Alam",
  email: "shahzeb@meetwise.ai",
  role: "Admin",
  avatar: "",
  theme: "light",
};

function applyTheme(theme: "light" | "dark") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useUser() {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem("meetwise-user");
      return stored ? { ...DEFAULT_USER, ...JSON.parse(stored) } : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // Apply theme on mount
  useEffect(() => {
    applyTheme(user.theme);
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("meetwise-user", JSON.stringify(updated));
    if (updates.theme !== undefined) {
      applyTheme(updates.theme);
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return { user, updateUser, initials };
}
