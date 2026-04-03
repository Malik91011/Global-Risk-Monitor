import { Router, type IRouter } from "express";
import { connectDB, ThreatAssessmentModel } from "@workspace/db";
import { formatAssessment } from "./incidents.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const { country, riskLevel, limit = "20" } = req.query as Record<string, string>;

    const query: any = {};
    if (country) query.country = country;
    if (riskLevel) query.overallRisk = riskLevel;

    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const [assessments, total] = await Promise.all([
      ThreatAssessmentModel.find(query)
        .sort({ assessedAt: -1 })
        .limit(limitNum)
        .exec(),
      ThreatAssessmentModel.countDocuments(query).exec(),
    ]);

    return res.json({
      assessments: assessments.map((a) => formatAssessment(a.toJSON())),
      total: total || 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

export default router;
