import { db } from "./db";
import {
  teamMembers,
  meetings,
  actionItems,
  type TeamMember,
  type Meeting,
  type ActionItem,
  type CreateTeamMemberRequest,
  type UpdateTeamMemberRequest,
  type CreateMeetingRequest,
  type UpdateMeetingRequest,
  type CreateActionItemRequest,
  type UpdateActionItemRequest,
  type MeetingResponse,
  type ActionItemResponse,
  type DashboardStats,
  type TeamPerformance,
  type MeetingIntelligence,
} from "@shared/schema";
import { eq, desc, sql, count, and, isNotNull, lt } from "drizzle-orm";

export interface IStorage {
  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(member: CreateTeamMemberRequest): Promise<TeamMember>;
  updateTeamMember(id: number, updates: UpdateTeamMemberRequest): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<void>;
  getTeamPerformance(): Promise<TeamPerformance[]>;

  // Meetings
  getMeetings(): Promise<MeetingResponse[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: CreateMeetingRequest): Promise<Meeting>;
  updateMeeting(id: number, updates: UpdateMeetingRequest): Promise<Meeting>;
  deleteMeeting(id: number): Promise<void>;
  getMeetingIntelligence(): Promise<MeetingIntelligence>;

  // Action Items
  getActionItems(filters?: { status?: string; assigneeId?: number; priority?: string }): Promise<ActionItemResponse[]>;
  getActionItem(id: number): Promise<ActionItemResponse | undefined>;
  createActionItem(actionItem: CreateActionItemRequest): Promise<ActionItem>;
  updateActionItem(id: number, updates: UpdateActionItemRequest): Promise<ActionItem>;
  deleteActionItem(id: number): Promise<void>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers).orderBy(teamMembers.name);
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(member: CreateTeamMemberRequest): Promise<TeamMember> {
    const [created] = await db.insert(teamMembers).values(member).returning();
    return created;
  }

  async updateTeamMember(id: number, updates: UpdateTeamMemberRequest): Promise<TeamMember> {
    const [updated] = await db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, id))
      .returning();
    return updated;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async getTeamPerformance(): Promise<TeamPerformance[]> {
    const members = await db.select().from(teamMembers);
    const now = new Date();

    const performance = await Promise.all(
      members.map(async (member) => {
        const tasks = await db
          .select()
          .from(actionItems)
          .where(eq(actionItems.assigneeId, member.id));

        const completedTasks = tasks.filter((t) => t.status === "done");
        const overdueTasks = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
        );

        const delaySum = completedTasks.reduce((sum, task) => {
          if (task.completedAt && task.dueDate) {
            const delay = Math.max(
              0,
              (new Date(task.completedAt).getTime() - new Date(task.dueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + delay;
          }
          return sum;
        }, 0);

        return {
          memberId: member.id,
          memberName: member.name,
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
          averageDelay: completedTasks.length > 0 ? delaySum / completedTasks.length : 0,
        };
      })
    );

    return performance;
  }

  // Meetings
  async getMeetings(): Promise<MeetingResponse[]> {
    const allMeetings = await db.select().from(meetings).orderBy(desc(meetings.date));

    const meetingsWithCounts = await Promise.all(
      allMeetings.map(async (meeting) => {
        const [countResult] = await db
          .select({ count: count() })
          .from(actionItems)
          .where(eq(actionItems.meetingId, meeting.id));

        return {
          ...meeting,
          actionItemsCount: countResult.count,
        };
      })
    );

    return meetingsWithCounts;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: CreateMeetingRequest): Promise<Meeting> {
    const [created] = await db.insert(meetings).values(meeting).returning();
    return created;
  }

  async updateMeeting(id: number, updates: UpdateMeetingRequest): Promise<Meeting> {
    const [updated] = await db
      .update(meetings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return updated;
  }

  async deleteMeeting(id: number): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  async getMeetingIntelligence(): Promise<MeetingIntelligence> {
    const allMeetings = await db.select().from(meetings);

    let totalDecisions = 0;
    let totalDiscussions = 0;
    const allRisks: string[] = [];
    const sentiments: string[] = [];

    allMeetings.forEach((meeting) => {
      totalDecisions += meeting.decisions?.length || 0;
      totalDiscussions += meeting.discussionPoints?.length || 0;
      if (meeting.risks) {
        allRisks.push(...meeting.risks);
      }
      if (meeting.sentiment) {
        sentiments.push(meeting.sentiment);
      }
    });

    // Calculate risk frequency
    const riskCounts = allRisks.reduce((acc, risk) => {
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRisks = Object.entries(riskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([risk]) => risk);

    // Find recurring issues (risks mentioned 2+ times)
    const recurringIssues = Object.entries(riskCounts)
      .filter(([, count]) => count >= 2)
      .map(([risk]) => risk);

    // Determine sentiment trend
    const positiveSentiments = sentiments.filter((s) =>
      ["positive", "optimistic", "enthusiastic"].includes(s.toLowerCase())
    ).length;
    const negativeSentiments = sentiments.filter((s) =>
      ["negative", "concerned", "frustrated"].includes(s.toLowerCase())
    ).length;

    let sentimentTrend = "neutral";
    if (positiveSentiments > negativeSentiments) {
      sentimentTrend = "positive";
    } else if (negativeSentiments > positiveSentiments) {
      sentimentTrend = "negative";
    }

    return {
      decisionVsDiscussionRatio:
        totalDiscussions > 0 ? totalDecisions / totalDiscussions : 0,
      topRisks,
      recurringIssues,
      sentimentTrend,
    };
  }

  // Action Items
  async getActionItems(filters?: {
    status?: string;
    assigneeId?: number;
    priority?: string;
  }): Promise<ActionItemResponse[]> {
    let query = db
      .select({
        actionItem: actionItems,
        assignee: teamMembers,
        meeting: meetings,
      })
      .from(actionItems)
      .leftJoin(teamMembers, eq(actionItems.assigneeId, teamMembers.id))
      .leftJoin(meetings, eq(actionItems.meetingId, meetings.id));

    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(actionItems.status, filters.status));
    }
    if (filters?.assigneeId) {
      conditions.push(eq(actionItems.assigneeId, filters.assigneeId));
    }
    if (filters?.priority) {
      conditions.push(eq(actionItems.priority, filters.priority));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(actionItems.createdAt));

    return results.map((row) => ({
      ...row.actionItem,
      assignee: row.assignee || undefined,
      meeting: row.meeting || undefined,
    }));
  }

  async getActionItem(id: number): Promise<ActionItemResponse | undefined> {
    const [result] = await db
      .select({
        actionItem: actionItems,
        assignee: teamMembers,
        meeting: meetings,
      })
      .from(actionItems)
      .leftJoin(teamMembers, eq(actionItems.assigneeId, teamMembers.id))
      .leftJoin(meetings, eq(actionItems.meetingId, meetings.id))
      .where(eq(actionItems.id, id));

    if (!result) return undefined;

    return {
      ...result.actionItem,
      assignee: result.assignee || undefined,
      meeting: result.meeting || undefined,
    };
  }

  async createActionItem(actionItem: CreateActionItemRequest): Promise<ActionItem> {
    const [created] = await db.insert(actionItems).values(actionItem).returning();
    return created;
  }

  async updateActionItem(id: number, updates: UpdateActionItemRequest): Promise<ActionItem> {
    // If status is being set to "done", set completedAt
    const updateData = { ...updates };
    if (updates.status === "done" && !updates.completedAt) {
      updateData.completedAt = new Date();
    }
    // If status is being changed from "done" to something else, clear completedAt
    if (updates.status && updates.status !== "done") {
      updateData.completedAt = null;
    }

    const [updated] = await db
      .update(actionItems)
      .set(updateData)
      .where(eq(actionItems.id, id))
      .returning();
    return updated;
  }

  async deleteActionItem(id: number): Promise<void> {
    await db.delete(actionItems).where(eq(actionItems.id, id));
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalMeetingsResult] = await db.select({ count: count() }).from(meetings);
    const totalMeetings = totalMeetingsResult.count;

    const [openActionsResult] = await db
      .select({ count: count() })
      .from(actionItems)
      .where(sql`${actionItems.status} != 'done'`);
    const openActionItems = openActionsResult.count;

    const now = new Date();
    const [overdueResult] = await db
      .select({ count: count() })
      .from(actionItems)
      .where(
        and(
          isNotNull(actionItems.dueDate),
          lt(actionItems.dueDate, now),
          sql`${actionItems.status} != 'done'`
        )
      );
    const overdueActionItems = overdueResult.count;

    const [totalActionsResult] = await db.select({ count: count() }).from(actionItems);
    const totalActions = totalActionsResult.count;

    const [completedActionsResult] = await db
      .select({ count: count() })
      .from(actionItems)
      .where(eq(actionItems.status, "done"));
    const completedActions = completedActionsResult.count;

    const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

    const allMeetings = await db.select().from(meetings);
    const clarityScores = allMeetings
      .map((m) => (m.clarityScore ? parseFloat(m.clarityScore) : null))
      .filter((s): s is number => s !== null);

    const averageClarityScore =
      clarityScores.length > 0
        ? clarityScores.reduce((sum, score) => sum + score, 0) / clarityScores.length
        : 0;

    return {
      totalMeetings,
      openActionItems,
      overdueActionItems,
      completionRate,
      averageClarityScore,
    };
  }
}

export const storage = new DatabaseStorage();
