import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateTeamMemberInput, type UpdateTeamMemberInput } from "@shared/routes";

export function useTeamMembers() {
  return useQuery({
    queryKey: [api.teamMembers.list.path],
    queryFn: async () => {
      const res = await fetch(api.teamMembers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team members");
      return api.teamMembers.list.responses[200].parse(await res.json());
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
      if (!res.ok) throw new Error("Failed to create team member");
      return api.teamMembers.create.responses[201].parse(await res.json());
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
      if (!res.ok) throw new Error("Failed to fetch team performance");
      return api.teamMembers.performance.responses[200].parse(await res.json());
    },
  });
}
