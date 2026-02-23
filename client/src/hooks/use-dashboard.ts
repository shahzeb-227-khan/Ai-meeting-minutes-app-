import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path, { credentials: "include" });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to fetch dashboard stats");
      return result.data;
    },
  });
}

export function useMeetingIntelligence() {
  return useQuery({
    queryKey: [api.meetings.intelligence.path],
    queryFn: async () => {
      const res = await fetch(api.meetings.intelligence.path, { credentials: "include" });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to fetch meeting intelligence");
      return result.data;
    },
  });
}
