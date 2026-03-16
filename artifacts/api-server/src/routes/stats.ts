import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable } from "@workspace/db/schema";
import { eq, gte, desc, sql, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalResult,
      criticalResult,
      ongoingResult,
      last24hResult,
      last7dResult,
      categoryResult,
      riskResult,
      recentIncidents,
      criticalAlerts,
      countriesResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(incidentsTable),
      db.select({ count: count() }).from(incidentsTable).where(eq(incidentsTable.riskLevel, "Critical")),
      db.select({ count: count() }).from(incidentsTable).where(eq(incidentsTable.isOngoing, true)),
      db.select({ count: count() }).from(incidentsTable).where(gte(incidentsTable.publishedAt, oneDayAgo)),
      db.select({ count: count() }).from(incidentsTable).where(gte(incidentsTable.publishedAt, sevenDaysAgo)),
      db.select({
        category: incidentsTable.category,
        count: count(),
      }).from(incidentsTable).groupBy(incidentsTable.category),
      db.select({
        riskLevel: incidentsTable.riskLevel,
        count: count(),
      }).from(incidentsTable).groupBy(incidentsTable.riskLevel),
      db.select().from(incidentsTable).orderBy(desc(incidentsTable.publishedAt)).limit(10),
      db.select().from(incidentsTable).where(eq(incidentsTable.riskLevel, "Critical")).orderBy(desc(incidentsTable.publishedAt)).limit(5),
      db.selectDistinct({ country: incidentsTable.country }).from(incidentsTable),
    ]);

    const categoryBreakdown: Record<string, number> = {};
    for (const row of categoryResult) {
      categoryBreakdown[row.category] = row.count;
    }

    const riskBreakdown: Record<string, number> = {};
    for (const row of riskResult) {
      riskBreakdown[row.riskLevel] = row.count;
    }

    res.json({
      totalIncidents: totalResult[0]?.count ?? 0,
      criticalIncidents: criticalResult[0]?.count ?? 0,
      ongoingIncidents: ongoingResult[0]?.count ?? 0,
      countriesAffected: countriesResult.length,
      last24hIncidents: last24hResult[0]?.count ?? 0,
      last7dIncidents: last7dResult[0]?.count ?? 0,
      categoryBreakdown,
      riskBreakdown,
      recentIncidents: recentIncidents.map(formatIncident),
      criticalAlerts: criticalAlerts.map(formatIncident),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/countries", async (_req, res) => {
  try {
    const countryData = await db.select({
      country: incidentsTable.country,
      count: count(),
      latitude: sql<number>`AVG(${incidentsTable.latitude})`.as("latitude"),
      longitude: sql<number>`AVG(${incidentsTable.longitude})`.as("longitude"),
    })
    .from(incidentsTable)
    .groupBy(incidentsTable.country)
    .orderBy(desc(count()))
    .limit(100);

    const countries = await Promise.all(countryData.map(async (row) => {
      const [criticalResult, highResult, categoryResult] = await Promise.all([
        db.select({ count: count() }).from(incidentsTable)
          .where(eq(incidentsTable.country, row.country) && eq(incidentsTable.riskLevel, "Critical") as any),
        db.select({ count: count() }).from(incidentsTable)
          .where(eq(incidentsTable.country, row.country) && eq(incidentsTable.riskLevel, "High") as any),
        db.select({
          category: incidentsTable.category,
          count: count(),
        }).from(incidentsTable)
          .where(eq(incidentsTable.country, row.country))
          .groupBy(incidentsTable.category)
          .orderBy(desc(count()))
          .limit(1),
      ]);

      return {
        country: row.country,
        count: row.count,
        criticalCount: criticalResult[0]?.count ?? 0,
        highCount: highResult[0]?.count ?? 0,
        topCategory: categoryResult[0]?.category || "Other",
        latitude: row.latitude || null,
        longitude: row.longitude || null,
      };
    }));

    res.json({ countries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/trending", async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const recentData = await db.select({
      country: incidentsTable.country,
      region: incidentsTable.region,
      count: count(),
    })
    .from(incidentsTable)
    .where(gte(incidentsTable.publishedAt, sevenDaysAgo))
    .groupBy(incidentsTable.country, incidentsTable.region)
    .orderBy(desc(count()))
    .limit(20);

    const regions = await Promise.all(recentData.map(async (row) => {
      const name = row.region || row.country;

      const [riskResult, categoryResult] = await Promise.all([
        db.select({
          riskLevel: incidentsTable.riskLevel,
          count: count(),
        }).from(incidentsTable)
          .where(eq(incidentsTable.country, row.country))
          .groupBy(incidentsTable.riskLevel)
          .orderBy(desc(count()))
          .limit(1),
        db.select({
          category: incidentsTable.category,
          count: count(),
        }).from(incidentsTable)
          .where(eq(incidentsTable.country, row.country))
          .groupBy(incidentsTable.category)
          .orderBy(desc(count()))
          .limit(1),
      ]);

      const riskLevel = (riskResult[0]?.riskLevel || "Low") as string;

      return {
        name,
        country: row.country,
        incidentCount: row.count,
        riskLevel,
        trend: "rising" as const,
        topCategory: categoryResult[0]?.category || "Other",
      };
    }));

    res.json({ regions });
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

export default router;
