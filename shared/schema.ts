import { pgTable, serial, text, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("Member"),
  avatar: text("avatar"),
  theme: text("theme").notNull().default("light"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  rawNotes: text("raw_notes").notNull(),
  
  // AI-generated fields
  summary: text("summary"),
  clarityScore: decimal("clarity_score", { precision: 3, scale: 1 }),
  decisions: text("decisions").array(),
  discussionPoints: text("discussion_points").array(),
  risks: text("risks").array(),
  sentiment: text("sentiment"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: integer("assignee_id").references(() => teamMembers.id, { onDelete: "set null" }),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("todo"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === RELATIONS ===

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  actionItems: many(actionItems),
}));

export const meetingsRelations = relations(meetings, ({ many }) => ({
  actionItems: many(actionItems),
}));

export const actionItemsRelations = relations(actionItems, ({ one }) => ({
  meeting: one(meetings, {
    fields: [actionItems.meetingId],
    references: [meetings.id],
  }),
  assignee: one(teamMembers, {
    fields: [actionItems.assigneeId],
    references: [teamMembers.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ 
  id: true, 
  createdAt: true 
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  summary: true,
  clarityScore: true,
  decisions: true,
  discussionPoints: true,
  risks: true,
  sentiment: true,
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true,
});

// === EXPLICIT API CONTRACT TYPES ===

// Team Members
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type CreateTeamMemberRequest = InsertTeamMember;
export type UpdateTeamMemberRequest = Partial<InsertTeamMember>;
export type TeamMemberResponse = TeamMember;

// Meetings
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type CreateMeetingRequest = InsertMeeting;
export type UpdateMeetingRequest = Partial<InsertMeeting>;
export type MeetingResponse = Meeting & {
  actionItemsCount?: number;
};

export interface MeetingWithActions extends Meeting {
  actionItems: ActionItemResponse[];
}

// Action Items
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type CreateActionItemRequest = InsertActionItem;
export type UpdateActionItemRequest = Partial<InsertActionItem>;
export type ActionItemResponse = ActionItem & {
  assignee?: TeamMember;
  meeting?: Meeting;
};

// Analytics types
export interface DashboardStats {
  totalMeetings: number;
  openActionItems: number;
  overdueActionItems: number;
  completionRate: number;
  averageClarityScore: number;
}

export interface TeamPerformance {
  memberId: number;
  memberName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageDelay: number;
}

export interface MeetingIntelligence {
  decisionVsDiscussionRatio: number;
  topRisks: string[];
  recurringIssues: string[];
  sentimentTrend: string;
}

// Users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "passwordHash">;
export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
};
export type UpdateUserRequest = Partial<{
  name: string;
  email: string;
  role: string;
  avatar: string;
  theme: string;
}>;
