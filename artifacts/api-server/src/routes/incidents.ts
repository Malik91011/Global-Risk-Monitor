import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable, threatAssessmentsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, or, desc, count, sql } from "drizzle-orm";
import { generateThreatAssessment } from "../lib/assessmentGenerator.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const {
      country, region, city, category, riskLevel,
      dateFrom, dateTo, search, limit = "50", offset = "0",
    } = req.query as Record<string, string>;

    const conditions = [];

    if (country) conditions.push(ilike(incidentsTable.country, `%${country}%`));
    if (region)  conditions.push(ilike(incidentsTable.region,  `%${region}%`));
    if (city)    conditions.push(ilike(incidentsTable.city,    `%${city}%`));
    if (category) conditions.push(eq(incidentsTable.category, category as any));
    if (riskLevel) conditions.push(eq(incidentsTable.riskLevel, riskLevel as any));
    if (dateFrom) conditions.push(gte(incidentsTable.publishedAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(incidentsTable.publishedAt, new Date(dateTo + "T23:59:59Z")));
    if (search) {
      conditions.push(or(
        ilike(incidentsTable.title, `%${search}%`),
        ilike(incidentsTable.summary, `%${search}%`),
        ilike(incidentsTable.country, `%${search}%`),
      )!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offsetNum = parseInt(offset) || 0;

    const [incidents, totalResult] = await Promise.all([
      db.select()
        .from(incidentsTable)
        .where(whereClause)
        .orderBy(desc(incidentsTable.publishedAt))
        .limit(limitNum)
        .offset(offsetNum),
      db.select({ count: count() })
        .from(incidentsTable)
        .where(whereClause),
    ]);

    res.json({
      incidents: incidents.map(formatIncident),
      total: totalResult[0]?.count ?? 0,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [incident] = await db.insert(incidentsTable).values({
      title: body.title,
      summary: body.summary,
      fullContent: body.fullContent,
      sourceUrl: body.sourceUrl,
      sourceName: body.sourceName,
      country: body.country,
      region: body.region,
      city: body.city,
      latitude: body.latitude,
      longitude: body.longitude,
      category: body.category,
      riskLevel: body.riskLevel,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      tags: body.tags || [],
    }).returning();

    res.status(201).json(formatIncident(incident));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [incident] = await db.select()
      .from(incidentsTable)
      .where(eq(incidentsTable.id, id))
      .limit(1);

    if (!incident) {
      return res.status(404).json({ error: "Not found", message: "Incident not found" });
    }

    res.json(formatIncident(incident));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.post("/:id/assess", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [incident] = await db.select()
      .from(incidentsTable)
      .where(eq(incidentsTable.id, id))
      .limit(1);

    if (!incident) {
      return res.status(404).json({ error: "Not found", message: "Incident not found" });
    }

    const recentIncidents = await db.select()
      .from(incidentsTable)
      .where(and(
        eq(incidentsTable.country, incident.country),
        gte(incidentsTable.publishedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      ))
      .orderBy(desc(incidentsTable.publishedAt))
      .limit(20);

    const assessmentData = generateThreatAssessment(incident.country, incident.region, recentIncidents);

    const [assessment] = await db.insert(threatAssessmentsTable).values({
      ...assessmentData,
      incidentId: id,
    }).returning();

    res.json(formatAssessment(assessment));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

function formatIncident(i: any) {
  return {
    ...i,
    publishedAt: i.publishedAt instanceof Date ? i.publishedAt.toISOString() : i.publishedAt,
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
    tags: i.tags || [],
    region: i.region || null,
    city: i.city || null,
    latitude: i.latitude || null,
    longitude: i.longitude || null,
    aiSummary: i.aiSummary || null,
    fullContent: i.fullContent || null,
  };
}

function formatAssessment(a: any) {
  return {
    ...a,
    assessedAt: a.assessedAt instanceof Date ? a.assessedAt.toISOString() : a.assessedAt,
    validUntil: a.validUntil instanceof Date ? a.validUntil.toISOString() : (a.validUntil || null),
    region: a.region || null,
    incidentId: a.incidentId || null,
    keyThreats: a.keyThreats || [],
    safetyRecommendations: a.safetyRecommendations || [],
    operationalGuidance: a.operationalGuidance || [],
    affectedAreas: a.affectedAreas || [],
  };
}

export { formatAssessment };
export default router;
