import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core"

// Better Auth core tables. These match the schema Better Auth's drizzle adapter
// expects for email/password auth. App-domain tables (players, reservations,
// etc.) will be added here in later phases.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  // App-specific fields (declared as Better Auth additionalFields in auth.ts).
  role: text("role").notNull().default("Front Desk"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
})

export type User = typeof user.$inferSelect

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
})

// --- App domain tables ---

export const player = pgTable("player", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
})

export type Player = typeof player.$inferSelect
export type NewPlayer = typeof player.$inferInsert

export const reservation = pgTable("reservation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  court: integer("court").notNull(),
  player: text("player").notNull(),
  bookedBy: text("booked_by").notNull(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  paymentStatus: text("payment_status").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
})

export type Reservation = typeof reservation.$inferSelect
export type NewReservation = typeof reservation.$inferInsert
