import OpenAI from "openai";
import { log } from "../utils";

// Lazily create the OpenAI client so a missing key doesn't crash the module
// (and therefore the entire Vercel serverless function) on import.
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!apiKey || !baseURL) {
    throw new Error(
      "AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL must be set to use AI analysis"
    );
  }
  return new OpenAI({ apiKey, baseURL });
}

const MAX_INPUT_LENGTH = 50000;
const AI_TIMEOUT_MS = 60000;

export interface MeetingAnalysis {
  summary: string;
  clarityScore: number;
  decisions: string[];
  discussionPoints: string[];
  risks: string[];
  sentiment: string;
  actionItems: Array<{
    title: string;
    description?: string;
    assigneeId?: number;
    priority: string;
    dueDate?: string;
  }>;
}

const DEFAULT_ANALYSIS: MeetingAnalysis = {
  summary: "Meeting analysis unavailable. Please review notes manually.",
  clarityScore: 5.0,
  decisions: [],
  discussionPoints: [],
  risks: [],
  sentiment: "neutral",
  actionItems: [],
};

function sanitizeInput(input: string): string {
  return input.trim().slice(0, MAX_INPUT_LENGTH);
}

function validateAnalysis(data: any): MeetingAnalysis {
  return {
    summary: typeof data.summary === "string" ? data.summary : DEFAULT_ANALYSIS.summary,
    clarityScore:
      typeof data.clarityScore === "number" && data.clarityScore >= 0 && data.clarityScore <= 10
        ? data.clarityScore
        : 5.0,
    decisions: Array.isArray(data.decisions) ? data.decisions.filter((d: any) => typeof d === "string") : [],
    discussionPoints: Array.isArray(data.discussionPoints)
      ? data.discussionPoints.filter((d: any) => typeof d === "string")
      : [],
    risks: Array.isArray(data.risks) ? data.risks.filter((r: any) => typeof r === "string") : [],
    sentiment: typeof data.sentiment === "string" ? data.sentiment : "neutral",
    actionItems: Array.isArray(data.actionItems)
      ? data.actionItems
          .filter((item: any) => item && typeof item.title === "string")
          .map((item: any) => ({
            title: item.title,
            description: typeof item.description === "string" ? item.description : undefined,
            assigneeId: typeof item.assigneeId === "number" ? item.assigneeId : undefined,
            priority:
              typeof item.priority === "string" &&
              ["low", "medium", "high", "urgent"].includes(item.priority)
                ? item.priority
                : "medium",
            dueDate: typeof item.dueDate === "string" ? item.dueDate : undefined,
          }))
      : [],
  };
}

export async function analyzeMeeting(
  title: string,
  date: Date,
  rawNotes: string,
  teamMembers: Array<{ id: number; name: string }>
): Promise<MeetingAnalysis> {
  try {
    const sanitizedNotes = sanitizeInput(rawNotes);

    if (sanitizedNotes.length < 10) {
      log("Meeting notes too short for analysis", "ai-service");
      return DEFAULT_ANALYSIS;
    }

    const analysisPrompt = `Analyze the following meeting notes and extract structured information:

Meeting Title: ${title}
Meeting Date: ${date.toISOString()}
Raw Notes:
${sanitizedNotes}

Available team members: ${teamMembers.map((m) => `${m.name} (ID: ${m.id})`).join(", ")}

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the meeting",
  "clarityScore": 8.5,
  "decisions": ["Decision 1", "Decision 2"],
  "discussionPoints": ["Discussion topic 1", "Discussion topic 2"],
  "risks": ["Risk 1", "Risk 2"],
  "sentiment": "positive",
  "actionItems": [
    {
      "title": "Action item title",
      "description": "Description",
      "assigneeId": 1,
      "priority": "high",
      "dueDate": "2026-03-15T10:00:00.000Z"
    }
  ]
}

Rules:
- clarityScore: 0-10 based on how clear and actionable the meeting was
- sentiment: one of "positive", "neutral", "negative"
- priority: one of "low", "medium", "high", "urgent"
- Extract all action items with realistic assignees from the available team members
- All date strings must be in ISO format
- Return valid JSON only`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const openai = getOpenAIClient();

    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      try {
        const response = await openai.chat.completions.create(
          {
            model: "gpt-5.2",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert meeting analyst. Extract structured information and action items from meeting notes. Always return valid JSON.",
              },
              { role: "user", content: analysisPrompt },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from AI");
        }

        const parsed = JSON.parse(content);
        const validated = validateAnalysis(parsed);

        log(`Meeting analyzed successfully (attempt ${attempt + 1})`, "ai-service");
        return validated;
      } catch (parseError: any) {
        attempt++;
        log(`AI analysis parse error (attempt ${attempt}): ${parseError.message}`, "ai-service");

        if (attempt >= maxAttempts) {
          throw parseError;
        }
      }
    }

    return DEFAULT_ANALYSIS;
  } catch (error: any) {
    log(`AI analysis failed: ${error.message}`, "ai-service");

    if (error.name === "AbortError") {
      log("AI request timed out", "ai-service");
    }

    return {
      ...DEFAULT_ANALYSIS,
      summary: `Meeting: ${title}. AI analysis unavailable. Please review notes manually.`,
    };
  }
}
