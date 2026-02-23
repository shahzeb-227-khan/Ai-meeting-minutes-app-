import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateMeetingInput } from "@shared/routes";

export function useMeetings() {
  return useQuery({
    queryKey: [api.meetings.list.path],
    queryFn: async () => {
      const res = await fetch(api.meetings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return api.meetings.list.responses[200].parse(await res.json());
    },
  });
}

export function useMeeting(id: number) {
  return useQuery({
    queryKey: [api.meetings.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.meetings.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch meeting");
      return api.meetings.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMeetingInput) => {
      const res = await fetch(api.meetings.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create meeting");
      return api.meetings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meetings.list.path] });
    },
  });
}

export function useAnalyzeMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meetings.analyze.path, { id });
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to analyze meeting");
      return api.meetings.analyze.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.meetings.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.meetings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useMeetingIntelligence() {
  return useQuery({
    queryKey: [api.meetings.intelligence.path],
    queryFn: async () => {
      const res = await fetch(api.meetings.intelligence.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meeting intelligence");
      return api.meetings.intelligence.responses[200].parse(await res.json());
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meetings.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete meeting");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meetings.list.path] });
    },
  });
}
