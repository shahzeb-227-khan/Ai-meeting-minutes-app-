import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Do NOT throw here at module level — a module-level throw crashes the
// entire serverless function before any try/catch can handle it.
// The pool will fail gracefully with a connection error when first used.
if (!process.env.DATABASE_URL) {
  console.error(
    "[db] WARNING: DATABASE_URL is not set. Database calls will fail. " +
    "Add DATABASE_URL to your environment variables (Vercel → Settings → Environment Variables)."
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL || "" });
export const db = drizzle(pool, { schema });
