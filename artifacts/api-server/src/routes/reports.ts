import { Router, type IRouter } from "express";
import { connectDB, ReportModel, IncidentModel } from "@workspace/db";
import mongoose from "mongoose";
import { generateReportContent } from "../lib/assessmentGenerator.js";

const router: IRouter = Router();

router.post("/generate", async (req, res) => {
  try {
    await connectDB();
    const { title, country, region, dateFrom, dateTo, categories, includeAssessment = true, includeAdvisory = true } = req.body;

    const query: any = {};
    if (country) query.country = { $regex: new RegExp(country, "i") };
    if (region) query.region = region;
    
    if (dateFrom || dateTo) {
      query.publishedAt = {};
      if (dateFrom) query.publishedAt.$gte = new Date(dateFrom);
      if (dateTo) query.publishedAt.$lte = new Date(dateTo + "T23:59:59Z");
    }
    if (categories && categories.length > 0) query.category = { $in: categories };

    const incidentsData = await IncidentModel.find(query)
      .sort({ publishedAt: -1 })
      .limit(100)
      .exec();

    const incidents = incidentsData.map((i) => i.toJSON());

    const { content, executiveSummary, advisory, criticalCount, highCount, moderateCount, lowCount } =
      generateReportContent(title, country, region, incidents, includeAssessment, includeAdvisory);

    const report = await ReportModel.create({
      title,
      country: country || null,
      region: region || null,
      content,
      executiveSummary,
      incidentCount: incidents.length,
      criticalCount,
      highCount,
      moderateCount,
      lowCount,
      advisory: advisory || null,
    });

    res.json(formatReport(report.toJSON()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const { limit = "20" } = req.query as Record<string, string>;
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    const [reports, total] = await Promise.all([
      ReportModel.find()
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .exec(),
      ReportModel.countDocuments().exec(),
    ]);

    res.json({ reports: reports.map((r) => formatReport(r.toJSON())), total: total || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/:id/export", async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id as string;
    const format = req.query.format === "pdf" ? "pdf" : "text";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid report ID" });
      return;
    }

    const report = await ReportModel.findById(id).exec();

    if (!report) {
      res.status(404).json({ error: "Not found", message: "Report not found" });
      return;
    }

    const filename = `globewatch360_report_${id}_${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "txt" : "txt"}`;

    res.json({
      reportId: id,
      format,
      content: report.content,
      filename,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

function formatReport(r: any) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    country: r.country || null,
    region: r.region || null,
    advisory: r.advisory || null,
  };
}

export default router;
