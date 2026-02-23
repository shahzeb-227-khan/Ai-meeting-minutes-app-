import { z } from "zod";
import { insertTeamMemberSchema, insertMeetingSchema, insertActionItemSchema } from "./schema";

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Dashboard
  dashboard: {
    stats: {
      method: "GET" as const,
      path: "/api/dashboard/stats" as const,
      responses: {
        200: z.object({
          totalMeetings: z.number(),
          openActionItems: z.number(),
          overdueActionItems: z.number(),
          completionRate: z.number(),
          averageClarityScore: z.number(),
        }),
      },
    },
  },

  // Team Members
  teamMembers: {
    list: {
      method: "GET" as const,
      path: "/api/team-members" as const,
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/team-members/:id" as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/team-members" as const,
      input: insertTeamMemberSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/team-members/:id" as const,
      input: insertTeamMemberSchema.partial(),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/team-members/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    performance: {
      method: "GET" as const,
      path: "/api/team-members/performance" as const,
      responses: {
        200: z.array(z.object({
          memberId: z.number(),
          memberName: z.string(),
          totalTasks: z.number(),
          completedTasks: z.number(),
          overdueTasks: z.number(),
          completionRate: z.number(),
          averageDelay: z.number(),
        })),
      },
    },
  },

  // Meetings
  meetings: {
    list: {
      method: "GET" as const,
      path: "/api/meetings" as const,
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/meetings/:id" as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/meetings" as const,
      input: insertMeetingSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    analyze: {
      method: "POST" as const,
      path: "/api/meetings/:id/analyze" as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    intelligence: {
      method: "GET" as const,
      path: "/api/meetings/intelligence" as const,
      responses: {
        200: z.object({
          decisionVsDiscussionRatio: z.number(),
          topRisks: z.array(z.string()),
          recurringIssues: z.array(z.string()),
          sentimentTrend: z.string(),
        }),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/meetings/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Action Items
  actionItems: {
    list: {
      method: "GET" as const,
      path: "/api/action-items" as const,
      input: z.object({
        status: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
        assigneeId: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/action-items/:id" as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/action-items" as const,
      input: insertActionItemSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/action-items/:id" as const,
      input: insertActionItemSchema.partial(),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/action-items/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type CreateTeamMemberInput = z.infer<typeof api.teamMembers.create.input>;
export type UpdateTeamMemberInput = z.infer<typeof api.teamMembers.update.input>;
export type CreateMeetingInput = z.infer<typeof api.meetings.create.input>;
export type CreateActionItemInput = z.infer<typeof api.actionItems.create.input>;
export type UpdateActionItemInput = z.infer<typeof api.actionItems.update.input>;
export type DashboardStatsResponse = z.infer<typeof api.dashboard.stats.responses[200]>;
export type MeetingIntelligenceResponse = z.infer<typeof api.meetings.intelligence.responses[200]>;
