import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { riskLevelEnum } from "./incidents.js";

export const insertThreatAssessmentSchema = z.object({
  incidentId: z.string().nullable().optional(), // Now referencing string ObjectId
  country: z.string(),
  region: z.string().nullable().optional(),
  overallRisk: z.enum(riskLevelEnum),
  summary: z.string(),
  keyThreats: z.array(z.string()).default([]),
  safetyRecommendations: z.array(z.string()).default([]),
  operationalGuidance: z.array(z.string()).default([]),
  affectedAreas: z.array(z.string()).default([]),
  validUntil: z.date().nullable().optional(),
});

export type InsertThreatAssessment = z.infer<typeof insertThreatAssessmentSchema>;

export type ThreatAssessment = InsertThreatAssessment & {
  id: string;
  assessedAt: Date;
};

const threatAssessmentSchema = new Schema({
  incidentId: { type: Schema.Types.ObjectId, ref: 'Incident' },
  country: { type: String, required: true },
  region: { type: String },
  overallRisk: { type: String, enum: riskLevelEnum, required: true },
  summary: { type: String, required: true },
  keyThreats: { type: [String], default: [] },
  safetyRecommendations: { type: [String], default: [] },
  operationalGuidance: { type: [String], default: [] },
  affectedAreas: { type: [String], default: [] },
  assessedAt: { type: Date, default: Date.now },
  validUntil: { type: Date },
}, {
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      ret.id = ret._id.toString();
      ret.incidentId = ret.incidentId?.toString() || null;
      delete ret._id;
      delete ret.__v;
    }
  }
});

threatAssessmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const ThreatAssessmentModel = mongoose.models.ThreatAssessment || mongoose.model("ThreatAssessment", threatAssessmentSchema);
