import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { analyzeMeeting } from "./services/ai.service";
import { log } from "./index";
import bcrypt from "bcryptjs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json({ success: true, data: stats, error: null });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch dashboard stats" });
    }
  });

  // Team Members
  app.get(api.teamMembers.list.path, async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json({ success: true, data: members, error: null });
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch team members" });
    }
  });

  // Performance route MUST be before :id route to avoid NaN matching
  app.get(api.teamMembers.performance.path, async (req, res) => {
    try {
      const performance = await storage.getTeamPerformance();
      res.json({ success: true, data: performance, error: null });
    } catch (error: any) {
      console.error("Error fetching team performance:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch team performance" });
    }
  });

  app.get(api.teamMembers.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, data: null, error: "Invalid team member ID" });
      }
      const member = await storage.getTeamMember(id);
      if (!member) {
        return res.status(404).json({ success: false, data: null, error: "Team member not found" });
      }
      res.json({ success: true, data: member, error: null });
    } catch (error: any) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch team member" });
    }
  });

  app.post(api.teamMembers.create.path, async (req, res) => {
    try {
      const input = api.teamMembers.create.input.parse(req.body);
      const member = await storage.createTeamMember(input);
      res.status(201).json({ success: true, data: member, error: null });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: error.errors[0].message,
        });
      }
      console.error("Error creating team member:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to create team member" });
    }
  });

  app.put(api.teamMembers.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.teamMembers.update.input.parse(req.body);
      const member = await storage.updateTeamMember(id, input);
      res.json({ success: true, data: member, error: null });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: error.errors[0].message,
        });
      }
      console.error("Error updating team member:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to update team member" });
    }
  });

  app.delete(api.teamMembers.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteTeamMember(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Meetings
  app.get(api.meetings.intelligence.path, async (req, res) => {
    try {
      const intelligence = await storage.getMeetingIntelligence();
      res.json({ success: true, data: intelligence, error: null });
    } catch (error: any) {
      console.error("Error fetching meeting intelligence:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch meeting intelligence" });
    }
  });

  app.get(api.meetings.list.path, async (req, res) => {
    try {
      const meetingsList = await storage.getMeetings();
      res.json({ success: true, data: meetingsList, error: null });
    } catch (error: any) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch meetings" });
    }
  });

  app.get(api.meetings.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, data: null, error: "Invalid meeting ID" });
      }

      const meeting = await storage.getMeeting(id);
      if (!meeting) {
        return res.status(404).json({ success: false, data: null, error: "Meeting not found" });
      }

      const actions = await storage.getActionItems({ status: undefined, assigneeId: undefined });
      const meetingActions = actions.filter((a) => a.meetingId === id);

      res.json({ success: true, data: { ...meeting, actionItems: meetingActions }, error: null });
    } catch (error: any) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch meeting" });
    }
  });

  app.post(api.meetings.create.path, async (req, res) => {
    try {
      log(`Incoming meeting creation request: ${JSON.stringify(req.body)}`, "api");
      
      const bodySchema = api.meetings.create.input.extend({
        date: z.coerce.date(),
      });
      
      const input = bodySchema.parse(req.body);
      log(`Validated input: ${JSON.stringify(input)}`, "api");
      
      const meeting = await storage.createMeeting(input);
      log(`Meeting created in DB: ${meeting.id}`, "api");
      
      res.status(201).json({
        success: true,
        data: meeting,
        error: null
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        log(`Validation error creating meeting: ${JSON.stringify(error.errors)}`, "api");
        return res.status(400).json({
          success: false,
          data: null,
          error: error.errors[0].message
        });
      }
      console.error("Error creating meeting:", error);
      res.status(500).json({ 
        success: false, 
        data: null, 
        error: error.message || "Failed to create meeting" 
      });
    }
  });

  app.post(api.meetings.analyze.path, async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, data: null, error: "Invalid meeting ID" });
      }

      const meeting = await storage.getMeeting(id);
      if (!meeting) {
        return res.status(404).json({ success: false, data: null, error: "Meeting not found" });
      }

      const teamMembersList = await storage.getTeamMembers();

      log(`Starting AI analysis for meeting ${id}`, "api");

      const analysis = await analyzeMeeting(
        meeting.title,
        new Date(meeting.date),
        meeting.rawNotes,
        teamMembersList.map((m) => ({ id: m.id, name: m.name }))
      );

      await storage.updateMeeting(id, {
        summary: analysis.summary,
        clarityScore: String(analysis.clarityScore),
        decisions: analysis.decisions,
        discussionPoints: analysis.discussionPoints,
        risks: analysis.risks,
        sentiment: analysis.sentiment,
      });

      if (analysis.actionItems && analysis.actionItems.length > 0) {
        for (const item of analysis.actionItems) {
          await storage.createActionItem({
            meetingId: id,
            title: item.title,
            description: item.description || null,
            assigneeId: item.assigneeId || null,
            priority: item.priority,
            status: "todo",
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
          });
        }
      }

      const updatedMeeting = await storage.getMeeting(id);
      log(`Meeting ${id} analyzed successfully`, "api");
      res.json({ success: true, data: updatedMeeting, error: null });
    } catch (error: any) {
      log(`Error analyzing meeting: ${error.message}`, "api");
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to analyze meeting" });
    }
  });

  app.delete(api.meetings.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteMeeting(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  // Action Items
  app.get(api.actionItems.list.path, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = String(req.query.status);
      if (req.query.assigneeId) filters.assigneeId = Number(req.query.assigneeId);
      if (req.query.priority) filters.priority = String(req.query.priority);

      const items = await storage.getActionItems(filters);
      res.json({ success: true, data: items, error: null });
    } catch (error: any) {
      console.error("Error fetching action items:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch action items" });
    }
  });

  app.get(api.actionItems.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getActionItem(id);
      if (!item) {
        return res.status(404).json({ success: false, data: null, error: "Action item not found" });
      }
      res.json({ success: true, data: item, error: null });
    } catch (error: any) {
      console.error("Error fetching action item:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch action item" });
    }
  });

  app.post(api.actionItems.create.path, async (req, res) => {
    try {
      const bodySchema = api.actionItems.create.input.extend({
        meetingId: z.coerce.number(),
        assigneeId: z.coerce.number().nullable().optional(),
      });
      const input = bodySchema.parse(req.body);
      const item = await storage.createActionItem(input);
      res.status(201).json({ success: true, data: item, error: null });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: error.errors[0].message,
        });
      }
      console.error("Error creating action item:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to create action item" });
    }
  });

  app.put(api.actionItems.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const bodySchema = api.actionItems.update.input.extend({
        assigneeId: z.coerce.number().nullable().optional(),
      });
      const input = bodySchema.parse(req.body);
      const item = await storage.updateActionItem(id, input);
      res.json({ success: true, data: item, error: null });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: error.errors[0].message,
        });
      }
      console.error("Error updating action item:", error);
      res.status(500).json({ success: false, data: null, error: error.message || "Failed to update action item" });
    }
  });

  app.delete(api.actionItems.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteActionItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting action item:", error);
      res.status(500).json({ message: "Failed to delete action item" });
    }
  });

  // Notifications - derived from action items
  app.get("/api/notifications", async (req, res) => {
    try {
      const allItems = await storage.getActionItems({});
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const notifications: any[] = [];

      for (const item of allItems) {
        if (item.status === "done") continue;

        if (item.dueDate && new Date(item.dueDate) < now) {
          notifications.push({
            id: `overdue-${item.id}`,
            type: "overdue",
            title: `Overdue: ${item.title}`,
            description: `Assigned to ${(item as any).assignee?.name || "Unassigned"} · Due ${new Date(item.dueDate).toLocaleDateString()}`,
            actionItemId: item.id,
            createdAt: item.createdAt,
          });
        } else if (item.dueDate && new Date(item.dueDate) <= todayEnd) {
          notifications.push({
            id: `due-today-${item.id}`,
            type: "due_today",
            title: `Due Today: ${item.title}`,
            description: `Assigned to ${(item as any).assignee?.name || "Unassigned"}`,
            actionItemId: item.id,
            createdAt: item.createdAt,
          });
        }
      }

      res.json({ success: true, data: notifications, error: null });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ success: false, data: null, error: error.message });
    }
  });

  // ===== AUTH ROUTES =====

  // POST /api/auth/signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = z
        .object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Invalid email address"),
          password: z.string().min(8, "Password must be at least 8 characters"),
        })
        .parse(req.body);

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, error: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createUser({ name, email, password, passwordHash });

      req.session.userId = user.id;
      const { passwordHash: _ph, ...safeUser } = user;
      return res.status(201).json({ success: true, data: safeUser, error: null });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ success: false, error: error.errors[0]?.message || "Validation failed" });
      }
      console.error("Error signing up:", error);
      return res.status(500).json({ success: false, error: "Failed to create account" });
    }
  });

  // POST /api/auth/signin
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = z
        .object({
          email: z.string().email("Invalid email address"),
          password: z.string().min(1, "Password is required"),
        })
        .parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }

      req.session.userId = user.id;
      const { passwordHash: _ph, ...safeUser } = user;
      return res.json({ success: true, data: safeUser, error: null });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ success: false, error: error.errors[0]?.message || "Validation failed" });
      }
      console.error("Error signing in:", error);
      return res.status(500).json({ success: false, error: "Failed to sign in" });
    }
  });

  // POST /api/auth/signout
  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ success: false, error: "Failed to sign out" });
      }
      res.clearCookie("meetwise.sid");
      return res.json({ success: true, data: null, error: null });
    });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ success: false, error: "User not found" });
      }
      const { passwordHash: _ph, ...safeUser } = user;
      return res.json({ success: true, data: safeUser, error: null });
    } catch (error: any) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch user" });
    }
  });

  // PATCH /api/auth/me — update profile
  app.patch("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const updates = z
        .object({
          name: z.string().min(2).optional(),
          email: z.string().email().optional(),
          role: z.string().optional(),
          avatar: z.string().optional(),
          theme: z.string().optional(),
        })
        .parse(req.body);

      const user = await storage.updateUser(req.session.userId, updates);
      const { passwordHash: _ph, ...safeUser } = user;
      return res.json({ success: true, data: safeUser, error: null });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ success: false, error: error.errors[0]?.message || "Validation failed" });
      }
      console.error("Error updating profile:", error);
      return res.status(500).json({ success: false, error: "Failed to update profile" });
    }
  });

  // PATCH /api/auth/me/password — change password
  app.patch("/api/auth/me/password", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const { currentPassword, newPassword } = z
        .object({
          currentPassword: z.string().min(1, "Current password is required"),
          newPassword: z.string().min(8, "New password must be at least 8 characters"),
        })
        .parse(req.body);

      const user = await storage.getUserById(req.session.userId);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ success: false, error: "Current password is incorrect" });

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(req.session.userId, {});
      // Update passwordHash directly
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, req.session.userId));

      return res.json({ success: true, data: null, error: null });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ success: false, error: error.errors[0]?.message || "Validation failed" });
      }
      console.error("Error changing password:", error);
      return res.status(500).json({ success: false, error: "Failed to change password" });
    }
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingMembers = await storage.getTeamMembers();
    if (existingMembers.length === 0) {
      const member1 = await storage.createTeamMember({
        name: "Sarah Chen",
        email: "sarah.chen@meetwise.ai",
        role: "Product Manager",
        avatar: null,
      });

      const member2 = await storage.createTeamMember({
        name: "Marcus Williams",
        email: "marcus.w@meetwise.ai",
        role: "Engineering Lead",
        avatar: null,
      });

      const member3 = await storage.createTeamMember({
        name: "Priya Sharma",
        email: "priya.sharma@meetwise.ai",
        role: "Designer",
        avatar: null,
      });

      const member4 = await storage.createTeamMember({
        name: "Alex Thompson",
        email: "alex.t@meetwise.ai",
        role: "Developer",
        avatar: null,
      });

      const meeting1 = await storage.createMeeting({
        title: "Q1 Product Planning",
        date: new Date("2026-02-20T10:00:00Z"),
        rawNotes: `Team discussed Q1 priorities and feature roadmap.

Key Points:
- Focus on improving meeting analysis accuracy
- Add team performance dashboard
- Implement real-time collaboration features
- Address performance issues with large datasets

Decisions:
- Prioritize AI improvements over UI updates
- Allocate 2 engineers to performance optimization
- Launch beta program for enterprise customers

Action Items:
- Sarah to draft PRD for team dashboard
- Marcus to investigate database optimization strategies
- Priya to create mockups for collaboration features
- Alex to prototype AI improvements

Risks:
- Timeline might be tight for Q1 delivery
- Need more resources for enterprise support`,
      });

      await storage.updateMeeting(meeting1.id, {
        summary:
          "Team aligned on Q1 priorities focusing on AI improvements, performance optimization, and team dashboard. Beta program planned for enterprise customers.",
        clarityScore: "8.5",
        decisions: [
          "Prioritize AI improvements over UI updates",
          "Allocate 2 engineers to performance optimization",
          "Launch beta program for enterprise customers",
        ],
        discussionPoints: [
          "Meeting analysis accuracy improvements",
          "Team performance dashboard requirements",
          "Real-time collaboration features",
          "Database performance optimization",
        ],
        risks: [
          "Timeline might be tight for Q1 delivery",
          "Need more resources for enterprise support",
        ],
        sentiment: "positive",
      });

      await storage.createActionItem({
        meetingId: meeting1.id,
        title: "Draft PRD for Team Dashboard",
        description: "Create comprehensive product requirements document for the new team performance dashboard",
        assigneeId: member1.id,
        priority: "high",
        status: "in-progress",
        dueDate: new Date("2026-02-27T17:00:00Z"),
      });

      await storage.createActionItem({
        meetingId: meeting1.id,
        title: "Database Optimization Research",
        description: "Investigate and document strategies for optimizing database queries with large datasets",
        assigneeId: member2.id,
        priority: "urgent",
        status: "todo",
        dueDate: new Date("2026-02-25T17:00:00Z"),
      });

      await storage.createActionItem({
        meetingId: meeting1.id,
        title: "Collaboration Features Mockups",
        description: "Design UI mockups for real-time collaboration features",
        assigneeId: member3.id,
        priority: "medium",
        status: "todo",
        dueDate: new Date("2026-03-05T17:00:00Z"),
      });

      await storage.createActionItem({
        meetingId: meeting1.id,
        title: "AI Accuracy Prototype",
        description: "Build prototype to test improved meeting analysis algorithms",
        assigneeId: member4.id,
        priority: "high",
        status: "todo",
        dueDate: new Date("2026-03-01T17:00:00Z"),
      });

      const meeting2 = await storage.createMeeting({
        title: "Customer Feedback Review",
        date: new Date("2026-02-18T14:00:00Z"),
        rawNotes: `Reviewed recent customer feedback and support tickets.

Customer Pain Points:
- Action item extraction sometimes misses important tasks
- Mobile app needs better offline support
- Export functionality limited
- Notification system too noisy

Positive Feedback:
- Users love the clarity score feature
- Team performance analytics very useful
- Integration with calendar tools works great

Action Items:
- Alex to improve action item detection algorithm
- Priya to design offline mode for mobile
- Marcus to add CSV/PDF export options
- Sarah to review and improve notification settings`,
      });

      await storage.updateMeeting(meeting2.id, {
        summary:
          "Reviewed customer feedback highlighting action item detection improvements needed, offline mobile support, better export options, and notification refinements.",
        clarityScore: "7.5",
        decisions: ["Improve action item detection as top priority", "Add offline mobile support", "Implement CSV/PDF exports"],
        discussionPoints: [
          "Action item extraction accuracy",
          "Mobile offline capabilities",
          "Export functionality expansion",
          "Notification system improvements",
        ],
        risks: ["Action item detection improvements may require significant ML work"],
        sentiment: "neutral",
      });

      await storage.createActionItem({
        meetingId: meeting2.id,
        title: "Improve AI Action Item Detection",
        description: "Enhance ML model to better detect and extract action items from meeting notes",
        assigneeId: member4.id,
        priority: "urgent",
        status: "todo",
        dueDate: new Date("2026-02-28T17:00:00Z"),
      });

      await storage.createActionItem({
        meetingId: meeting2.id,
        title: "Design Mobile Offline Mode",
        description: "Create UX design for offline functionality in mobile app",
        assigneeId: member3.id,
        priority: "medium",
        status: "todo",
        dueDate: new Date("2026-03-10T17:00:00Z"),
      });

      await storage.createActionItem({
        meetingId: meeting2.id,
        title: "Implement Export Features",
        description: "Add CSV and PDF export options for meetings and action items",
        assigneeId: member2.id,
        priority: "medium",
        status: "todo",
        dueDate: new Date("2026-03-08T17:00:00Z"),
      });

      console.log("✅ Database seeded with example data");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
