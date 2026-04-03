import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export const incidentCategoryEnum = [
  "Security",
  "Crime",
  "PublicSafety",
  "Health",
  "Hazards",
  "Cyber",
  "CivilPolitical",
  "Other",
] as const;

export const riskLevelEnum = [
  "Critical",
  "High",
  "HighImpact",
  "Ongoing",
  "Moderate",
  "Low",
] as const;

export const insertIncidentSchema = z.object({
  title: z.string(),
  summary: z.string(),
  fullContent: z.string().nullable().optional(),
  sourceUrl: z.string(),
  sourceName: z.string(),
  country: z.string(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category: z.enum(incidentCategoryEnum),
  riskLevel: z.enum(riskLevelEnum),
  isVerified: z.boolean().default(false),
  isOngoing: z.boolean().default(false),
  publishedAt: z.date().default(() => new Date()),
  tags: z.array(z.string()).default([]),
  aiSummary: z.string().nullable().optional(),
  urlHash: z.string().nullable().optional(),
});

// Since zod schemas differ from the actual model typing sometimes, here's standard types
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type Incident = InsertIncident & {
  id: string; // The UI expects `id`, which we'll derive from Mongoose `_id`
  createdAt: Date;
};

// Mongoose Schema
const incidentSchema = new Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  fullContent: { type: String },
  sourceUrl: { type: String, required: true },
  sourceName: { type: String, required: true },
  country: { type: String, required: true },
  region: { type: String },
  city: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  category: { type: String, enum: incidentCategoryEnum, required: true },
  riskLevel: { type: String, enum: riskLevelEnum, required: true },
  isVerified: { type: Boolean, default: false },
  isOngoing: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  tags: { type: [String], default: [] },
  aiSummary: { type: String },
  urlHash: { type: String, unique: true, sparse: true },
}, {
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Ensure a virtual `id` exists to match the type easily if needed
incidentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const IncidentModel = mongoose.models.Incident || mongoose.model("Incident", incidentSchema);
