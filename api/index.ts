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
      secure: true,       // Vercel always serves over HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, error: err.message || "Internal server error" });
});

// Initialize routes once; reuse across invocations (module-level singleton)
let initialized: Promise<void> | null = null;

function ensureInitialized() {
  if (!initialized) {
    initialized = registerRoutes(httpServer, app)
      .then(() => {/* ready */})
      .catch((err) => {
        console.error("Failed to initialize routes:", err);
        initialized = null; // allow retry
        throw err;
      });
  }
  return initialized;
}

export default async function handler(req: Request, res: Response) {
  await ensureInitialized();
  app(req, res);
}
