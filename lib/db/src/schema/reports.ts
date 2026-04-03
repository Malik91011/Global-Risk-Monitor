import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export const insertReportSchema = z.object({
  title: z.string(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  content: z.string(),
  executiveSummary: z.string(),
  incidentCount: z.number().default(0),
  criticalCount: z.number().default(0),
  highCount: z.number().default(0),
  moderateCount: z.number().default(0),
  lowCount: z.number().default(0),
  advisory: z.string().nullable().optional(),
});

export type InsertReport = z.infer<typeof insertReportSchema>;

export type Report = InsertReport & {
  id: string;
  createdAt: Date;
};

const reportSchema = new Schema({
  title: { type: String, required: true },
  country: { type: String },
  region: { type: String },
  content: { type: String, required: true },
  executiveSummary: { type: String, required: true },
  incidentCount: { type: Number, default: 0 },
  criticalCount: { type: Number, default: 0 },
  highCount: { type: Number, default: 0 },
  moderateCount: { type: Number, default: 0 },
  lowCount: { type: Number, default: 0 },
  advisory: { type: String },
  createdAt: { type: Date, default: Date.now },
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

reportSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const ReportModel = mongoose.models.Report || mongoose.model("Report", reportSchema);
