import mongoose from "mongoose";
import { z } from "zod";
export declare const insertThreatAssessmentSchema: z.ZodObject<{
    incidentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodString;
    region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    overallRisk: z.ZodEnum<["Critical", "High", "HighImpact", "Ongoing", "Moderate", "Low"]>;
    summary: z.ZodString;
    keyThreats: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    safetyRecommendations: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    operationalGuidance: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    affectedAreas: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    validUntil: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    summary: string;
    country: string;
    overallRisk: "Critical" | "High" | "HighImpact" | "Ongoing" | "Moderate" | "Low";
    keyThreats: string[];
    safetyRecommendations: string[];
    operationalGuidance: string[];
    affectedAreas: string[];
    region?: string | null | undefined;
    incidentId?: string | null | undefined;
    validUntil?: Date | null | undefined;
}, {
    summary: string;
    country: string;
    overallRisk: "Critical" | "High" | "HighImpact" | "Ongoing" | "Moderate" | "Low";
    region?: string | null | undefined;
    incidentId?: string | null | undefined;
    keyThreats?: string[] | undefined;
    safetyRecommendations?: string[] | undefined;
    operationalGuidance?: string[] | undefined;
    affectedAreas?: string[] | undefined;
    validUntil?: Date | null | undefined;
}>;
export type InsertThreatAssessment = z.infer<typeof insertThreatAssessmentSchema>;
export type ThreatAssessment = InsertThreatAssessment & {
    id: string;
    assessedAt: Date;
};
export declare const ThreatAssessmentModel: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=threats.d.ts.map