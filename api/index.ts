/**
 * Vercel serverless entry point.
 * Handles all /api/* requests via the Express app.
 */
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();
const httpServer = createServer(app);

// Session store (Neon PostgreSQL)
const PgStore = connectPgSimple(session);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "fallback-secret-change-this",
    resave: false,
    saveUninitialized: false,
    name: "meetwise.sid",
    cookie: {
      secure: true, // Vercel always serves over HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Initialize routes once; reuse across invocations (module-level singleton)
let initialized: Promise<void> | null = null;

function ensureInitialized() {
  if (!initialized) {
    initialized = registerRoutes(httpServer, app)
      .then(() => {
        // Attach error handler AFTER routes so Express can use it
        app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
          const status = err?.status || err?.statusCode || 500;
          console.error("Unhandled API error:", err);
          if (res.headersSent) return;
          res
            .status(status)
            .json({ success: false, data: null, error: err?.message || "Internal server error" });
        });
      })
      .catch((err) => {
        console.error("Failed to initialize routes:", err);
        initialized = null; // allow retry on next invocation
        throw err;
      });
  }
  return initialized;
}

export default async function handler(req: Request, res: Response) {
  // Validate critical env vars and return a clear JSON error instead of crashing
  if (!process.env.DATABASE_URL) {
    console.error("[api] DATABASE_URL is not set — add it in Vercel → Settings → Environment Variables");
    return res.status(500).json({
      success: false,
      data: null,
      error: "Server configuration error: DATABASE_URL is not set. Contact the site owner.",
    });
  }

  try {
    await ensureInitialized();
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel API handler error:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, data: null, error: err?.message || "Internal server error" });
    }
  }
}
