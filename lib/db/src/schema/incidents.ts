import { pgTable, serial, text, timestamp, boolean, real, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentCategoryEnum = pgEnum("incident_category", [
  "Security",
  "Crime",
  "PublicSafety",
  "Health",
  "Hazards",
  "Cyber",
  "CivilPolitical",
  "Other",
]);

export const riskLevelEnum = pgEnum("risk_level", [
  "Critical",
  "High",
  "HighImpact",
  "Ongoing",
  "Moderate",
  "Low",
]);

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  fullContent: text("full_content"),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  city: text("city"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  category: incidentCategoryEnum("category").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isOngoing: boolean("is_ongoing").notNull().default(false),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  tags: text("tags").array().notNull().default([]),
  aiSummary: text("ai_summary"),
  urlHash: text("url_hash").unique(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
