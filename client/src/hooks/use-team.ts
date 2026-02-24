import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateTeamMemberInput, type UpdateTeamMemberInput } from "@shared/routes";

export function useTeamMembers() {
  return useQuery({
    queryKey: [api.teamMembers.list.path],
    queryFn: async () => {
      const res = await fetch(api.teamMembers.list.path, { credentials: "include" });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to fetch team members");
      return result.data;
    },
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTeamMemberInput) => {
      const res = await fetch(api.teamMembers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to create team member");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teamMembers.list.path] });
    },
  });
}

export function useTeamPerformance() {
  return useQuery({
    queryKey: [api.teamMembers.performance.path],
    queryFn: async () => {
      const res = await fetch(api.teamMembers.performance.path, { credentials: "include" });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to fetch team performance");
      return result.data;
    },
  });
}
