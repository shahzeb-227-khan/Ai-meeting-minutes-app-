import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { analyzeMeeting } from "./services/ai.service";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Team Members
  app.get(api.teamMembers.list.path, async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get(api.teamMembers.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const member = await storage.getTeamMember(id);
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post(api.teamMembers.create.path, async (req, res) => {
    try {
      const input = api.teamMembers.create.input.parse(req.body);
      const member = await storage.createTeamMember(input);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.put(api.teamMembers.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.teamMembers.update.input.parse(req.body);
      const member = await storage.updateTeamMember(id, input);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
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

  app.get(api.teamMembers.performance.path, async (req, res) => {
    try {
      const performance = await storage.getTeamPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching team performance:", error);
      res.status(500).json({ message: "Failed to fetch team performance" });
    }
  });

  // Meetings
  app.get(api.meetings.intelligence.path, async (req, res) => {
    try {
      const intelligence = await storage.getMeetingIntelligence();
      res.json(intelligence);
    } catch (error) {
      console.error("Error fetching meeting intelligence:", error);
      res.status(500).json({ message: "Failed to fetch meeting intelligence" });
    }
  });

  app.get(api.meetings.list.path, async (req, res) => {
    try {
      const meetingsList = await storage.getMeetings();
      res.json(meetingsList);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get(api.meetings.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }

      const meeting = await storage.getMeeting(id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const actions = await storage.getActionItems({ status: undefined, assigneeId: undefined });
      const meetingActions = actions.filter((a) => a.meetingId === id);

      res.json({ ...meeting, actionItems: meetingActions });
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  app.post(api.meetings.create.path, async (req, res) => {
    try {
      const input = api.meetings.create.input.parse(req.body);
      const meeting = await storage.createMeeting(input);
      res.status(201).json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.post(api.meetings.analyze.path, async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }

      const meeting = await storage.getMeeting(id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
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
      res.json(updatedMeeting);
    } catch (error: any) {
      log(`Error analyzing meeting: ${error.message}`, "api");
      res.status(500).json({ message: "Failed to analyze meeting" });
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
      res.json(items);
    } catch (error) {
      console.error("Error fetching action items:", error);
      res.status(500).json({ message: "Failed to fetch action items" });
    }
  });

  app.get(api.actionItems.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getActionItem(id);
      if (!item) {
        return res.status(404).json({ message: "Action item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching action item:", error);
      res.status(500).json({ message: "Failed to fetch action item" });
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
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating action item:", error);
      res.status(500).json({ message: "Failed to create action item" });
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
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error updating action item:", error);
      res.status(500).json({ message: "Failed to update action item" });
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
