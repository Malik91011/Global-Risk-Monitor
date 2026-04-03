import { Router, type IRouter } from "express";
import { connectDB, IncidentModel } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res) => {
  try {
    await connectDB();
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
      IncidentModel.countDocuments().exec(),
      IncidentModel.countDocuments({ riskLevel: "Critical" }).exec(),
      IncidentModel.countDocuments({ isOngoing: true }).exec(),
      IncidentModel.countDocuments({ publishedAt: { $gte: oneDayAgo } }).exec(),
      IncidentModel.countDocuments({ publishedAt: { $gte: sevenDaysAgo } }).exec(),
      IncidentModel.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]).exec(),
      IncidentModel.aggregate([
        { $group: { _id: "$riskLevel", count: { $sum: 1 } } }
      ]).exec(),
      IncidentModel.find().sort({ publishedAt: -1 }).limit(10).exec(),
      IncidentModel.find({ riskLevel: "Critical" }).sort({ publishedAt: -1 }).limit(5).exec(),
      IncidentModel.distinct("country").exec(),
    ]);

    const categoryBreakdown: Record<string, number> = {};
    for (const row of categoryResult) {
      if (row._id) categoryBreakdown[row._id] = row.count;
    }

    const riskBreakdown: Record<string, number> = {};
    for (const row of riskResult) {
      if (row._id) riskBreakdown[row._id] = row.count;
    }

    return res.json({
      totalIncidents: totalResult || 0,
      criticalIncidents: criticalResult || 0,
      ongoingIncidents: ongoingResult || 0,
      countriesAffected: countriesResult.length || 0,
      last24hIncidents: last24hResult || 0,
      last7dIncidents: last7dResult || 0,
      categoryBreakdown,
      riskBreakdown,
      recentIncidents: recentIncidents.map((i) => formatIncident(i.toJSON())),
      criticalAlerts: criticalAlerts.map((i) => formatIncident(i.toJSON())),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/countries", async (_req, res) => {
  try {
    await connectDB();
    const countryData = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 },
          latitude: { $avg: "$latitude" },
          longitude: { $avg: "$longitude" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]).exec();

    const countries = await Promise.all(countryData.map(async (row) => {
      const country = row._id;
      if (!country) return null;

      const [criticalCount, highCount, categoryResult] = await Promise.all([
        IncidentModel.countDocuments({ country, riskLevel: "Critical" }).exec(),
        IncidentModel.countDocuments({ country, riskLevel: "High" }).exec(),
        IncidentModel.aggregate([
          { $match: { country } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]).exec(),
      ]);

      return {
        country,
        count: row.count,
        criticalCount: criticalCount || 0,
        highCount: highCount || 0,
        topCategory: categoryResult[0]?._id || "Other",
        latitude: row.latitude || null,
        longitude: row.longitude || null,
      };
    }));

    return res.json({ countries: countries.filter(Boolean) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/trending", async (_req, res) => {
  try {
    await connectDB();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentData = await IncidentModel.aggregate([
      { $match: { publishedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { country: "$country", region: "$region" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).exec();

    const regions = await Promise.all(recentData.map(async (row) => {
      const { country, region } = row._id || {};
      if (!country) return null;

      const name = region || country;

      const [riskResult, categoryResult] = await Promise.all([
        IncidentModel.aggregate([
          { $match: { country } },
          { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]).exec(),
        IncidentModel.aggregate([
          { $match: { country } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]).exec()
      ]);

      const riskLevel = riskResult[0]?._id || "Low";

      return {
        name,
        country,
        incidentCount: row.count,
        riskLevel,
        trend: "rising",
        topCategory: categoryResult[0]?._id || "Other",
      };
    }));

    return res.json({ regions: regions.filter(Boolean) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
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
