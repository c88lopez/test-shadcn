import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// A single pooled pg connection reused across the serverless function instance.
// The Pool connects lazily, so importing this module without a live DB is safe.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = drizzle(pool, { schema })
