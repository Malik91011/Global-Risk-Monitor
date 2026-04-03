import { Router } from "express";
import { db } from "@workspace/db";
import { threatAssessmentsTable } from "@workspace/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { formatAssessment } from "./incidents.js";
const router = Router();
router.get("/", async (req, res) => {
    try {
        const { country, riskLevel, limit = "20" } = req.query;
        const conditions = [];
        if (country)
            conditions.push(eq(threatAssessmentsTable.country, country));
        if (riskLevel)
            conditions.push(eq(threatAssessmentsTable.overallRisk, riskLevel));
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const [assessments, totalResult] = await Promise.all([
            db.select()
                .from(threatAssessmentsTable)
                .where(whereClause)
                .orderBy(desc(threatAssessmentsTable.assessedAt))
                .limit(limitNum),
            db.select({ count: count() })
                .from(threatAssessmentsTable)
                .where(whereClause),
        ]);
        res.json({
            assessments: assessments.map(formatAssessment),
            total: totalResult[0]?.count ?? 0,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error", message: String(err) });
    }
});
export default router;
