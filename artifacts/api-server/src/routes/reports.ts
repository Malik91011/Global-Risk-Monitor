import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reportsTable, incidentsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, inArray, ilike, desc, count } from "drizzle-orm";
import { generateReportContent } from "../lib/assessmentGenerator.js";

const router: IRouter = Router();

router.post("/generate", async (req, res) => {
  try {
    const { title, country, region, dateFrom, dateTo, categories, includeAssessment = true, includeAdvisory = true } = req.body;

    const conditions = [];
    if (country) conditions.push(ilike(incidentsTable.country, `%${country}%`));
    if (region) conditions.push(eq(incidentsTable.region, region));
    if (dateFrom) conditions.push(gte(incidentsTable.publishedAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(incidentsTable.publishedAt, new Date(dateTo + "T23:59:59Z")));
    if (categories && categories.length > 0) conditions.push(inArray(incidentsTable.category, categories));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const incidents = await db.select()
      .from(incidentsTable)
      .where(whereClause)
      .orderBy(desc(incidentsTable.publishedAt))
      .limit(100);

    const { content, executiveSummary, advisory, criticalCount, highCount, moderateCount, lowCount } =
      generateReportContent(title, country, region, incidents, includeAssessment, includeAdvisory);

    const [report] = await db.insert(reportsTable).values({
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
    }).returning();

    res.json(formatReport(report));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/", async (req, res) => {
  try {
    const { limit = "20" } = req.query as Record<string, string>;
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    const [reports, totalResult] = await Promise.all([
      db.select()
        .from(reportsTable)
        .orderBy(desc(reportsTable.createdAt))
        .limit(limitNum),
      db.select({ count: count() }).from(reportsTable),
    ]);

    res.json({ reports: reports.map(formatReport), total: totalResult[0]?.count ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/:id/export", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const format = req.query.format === "pdf" ? "pdf" : "text";

    const [report] = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, id))
      .limit(1);

    if (!report) {
      return res.status(404).json({ error: "Not found", message: "Report not found" });
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
