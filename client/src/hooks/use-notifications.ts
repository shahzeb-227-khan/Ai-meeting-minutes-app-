import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  type: "overdue" | "due_today" | "new_assignment";
  title: string;
  description: string;
  actionItemId: number;
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = "meetwise-read-notifications";

function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const result = await res.json();
      if (!res.ok || result.success === false)
        throw new Error(result.error || "Failed to fetch notifications");

      const readIds = getReadIds();
      return result.data.map((n: Omit<Notification, "read">) => ({
        ...n,
        read: readIds.includes(n.id),
      }));
    },
    refetchInterval: 30000,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return (ids: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };
}
