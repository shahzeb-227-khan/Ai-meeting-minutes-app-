import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateActionItemInput, type UpdateActionItemInput } from "@shared/routes";

export function useActionItems(filters?: { status?: string, assigneeId?: string, priority?: string }) {
  return useQuery({
    queryKey: [api.actionItems.list.path, filters],
    queryFn: async () => {
      let url = api.actionItems.list.path;
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params.append(k, v);
        });
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }
      const res = await fetch(url, { credentials: "include" });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to fetch action items");
      return result.data;
    },
  });
}

export function useCreateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateActionItemInput) => {
      const res = await fetch(api.actionItems.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to create action item");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.actionItems.list.path] });
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateActionItemInput) => {
      const url = buildUrl(api.actionItems.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to update action item");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.actionItems.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useDeleteActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.actionItems.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete action item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.actionItems.list.path] });
    },
  });
}
