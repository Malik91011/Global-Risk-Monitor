import mongoose from "mongoose";
import { z } from "zod";
export declare const insertReportSchema: z.ZodObject<{
    title: z.ZodString;
    country: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodString;
    executiveSummary: z.ZodString;
    incidentCount: z.ZodDefault<z.ZodNumber>;
    criticalCount: z.ZodDefault<z.ZodNumber>;
    highCount: z.ZodDefault<z.ZodNumber>;
    moderateCount: z.ZodDefault<z.ZodNumber>;
    lowCount: z.ZodDefault<z.ZodNumber>;
    advisory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    executiveSummary: string;
    incidentCount: number;
    criticalCount: number;
    highCount: number;
    moderateCount: number;
    lowCount: number;
    country?: string | null | undefined;
    region?: string | null | undefined;
    advisory?: string | null | undefined;
}, {
    title: string;
    content: string;
    executiveSummary: string;
    country?: string | null | undefined;
    region?: string | null | undefined;
    incidentCount?: number | undefined;
    criticalCount?: number | undefined;
    highCount?: number | undefined;
    moderateCount?: number | undefined;
    lowCount?: number | undefined;
    advisory?: string | null | undefined;
}>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = InsertReport & {
    id: string;
    createdAt: Date;
};
export declare const ReportModel: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=reports.d.ts.map