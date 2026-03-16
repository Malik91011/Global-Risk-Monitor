import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { riskLevelEnum } from "./incidents";

export const threatAssessmentsTable = pgTable("threat_assessments", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id"),
  country: text("country").notNull(),
  region: text("region"),
  overallRisk: riskLevelEnum("overall_risk").notNull(),
  summary: text("summary").notNull(),
  keyThreats: text("key_threats").array().notNull().default([]),
  safetyRecommendations: text("safety_recommendations").array().notNull().default([]),
  operationalGuidance: text("operational_guidance").array().notNull().default([]),
  affectedAreas: text("affected_areas").array().notNull().default([]),
  assessedAt: timestamp("assessed_at").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
});

export const insertThreatAssessmentSchema = createInsertSchema(threatAssessmentsTable).omit({
  id: true,
  assessedAt: true,
});

export type InsertThreatAssessment = z.infer<typeof insertThreatAssessmentSchema>;
export type ThreatAssessment = typeof threatAssessmentsTable.$inferSelect;
