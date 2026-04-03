import { Router, type IRouter } from "express";
import { connectDB, IncidentModel, ThreatAssessmentModel } from "@workspace/db";
import { insertIncidentSchema, type InsertIncident } from "@workspace/db/schema";
import mongoose from "mongoose";
import { generateThreatAssessment, generateIncidentBullets } from "../lib/assessmentGenerator.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// City / alias → canonical country name mappings for search expansion
const CITY_TO_COUNTRY: Record<string, string> = {
  "dubai": "United Arab Emirates", "abu dhabi": "United Arab Emirates",
  "sharjah": "United Arab Emirates", "uae": "United Arab Emirates",
  "istanbul": "Turkey", "ankara": "Turkey", "izmir": "Turkey",
  "karachi": "Pakistan", "lahore": "Pakistan", "islamabad": "Pakistan",
  "rawalpindi": "Pakistan", "peshawar": "Pakistan", "quetta": "Pakistan",
  "multan": "Pakistan", "faisalabad": "Pakistan",
  "mumbai": "India", "delhi": "India", "new delhi": "India",
  "kolkata": "India", "chennai": "India", "bangalore": "India", "hyderabad": "India",
  "riyadh": "Saudi Arabia", "jeddah": "Saudi Arabia", "mecca": "Saudi Arabia",
  "medina": "Saudi Arabia", "ksa": "Saudi Arabia",
  "baghdad": "Iraq", "basra": "Iraq",
  "tehran": "Iran", "mashhad": "Iran",
  "beirut": "Lebanon", "amman": "Jordan",
  "damascus": "Syria", "aleppo": "Syria",
  "cairo": "Egypt", "alexandria": "Egypt",
  "doha": "Qatar", "kuwait city": "Kuwait",
  "muscat": "Oman", "manama": "Bahrain",
  "sanaa": "Yemen", "aden": "Yemen",
  "gaza": "Palestine", "ramallah": "Palestine", "west bank": "Palestine",
  "tel aviv": "Israel", "jerusalem": "Israel",
  "kabul": "Afghanistan",
  "nairobi": "Kenya", "mombasa": "Kenya",
  "lagos": "Nigeria", "abuja": "Nigeria", "kano": "Nigeria",
  "accra": "Ghana", "addis ababa": "Ethiopia",
  "johannesburg": "South Africa", "cape town": "South Africa", "pretoria": "South Africa",
  "mogadishu": "Somalia", "khartoum": "Sudan",
  "tripoli": "Libya", "tunis": "Tunisia",
  "casablanca": "Morocco", "rabat": "Morocco",
  "kinshasa": "DR Congo", "dakar": "Senegal",
  "kampala": "Uganda", "dar es salaam": "Tanzania",
  "harare": "Zimbabwe",
  "kyiv": "Ukraine", "kiev": "Ukraine", "kharkiv": "Ukraine",
  "moscow": "Russia", "st. petersburg": "Russia",
  "london": "United Kingdom", "paris": "France",
  "berlin": "Germany", "rome": "Italy",
  "madrid": "Spain", "warsaw": "Poland",
  "belgrade": "Serbia", "tbilisi": "Georgia",
  "baku": "Azerbaijan", "yerevan": "Armenia",
  "beijing": "China", "shanghai": "China", "hong kong": "China",
  "tokyo": "Japan", "osaka": "Japan",
  "seoul": "South Korea", "busan": "South Korea",
  "taipei": "Taiwan", "pyongyang": "North Korea",
  "bangkok": "Thailand", "manila": "Philippines",
  "jakarta": "Indonesia", "kuala lumpur": "Malaysia",
  "singapore": "Singapore", "hanoi": "Vietnam", "ho chi minh": "Vietnam",
  "yangon": "Myanmar", "phnom penh": "Cambodia",
  "mexico city": "Mexico", "bogota": "Colombia",
  "lima": "Peru", "santiago": "Chile",
  "buenos aires": "Argentina", "caracas": "Venezuela",
  "havana": "Cuba", "port-au-prince": "Haiti",
};

function resolveCountrySearch(input: string): string {
  const lower = input.toLowerCase().trim();
  return CITY_TO_COUNTRY[lower] ?? input;
}

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const {
      country, region, city, category, riskLevel,
      dateFrom, dateTo, search, limit = "50", offset = "0",
    } = req.query as Record<string, string>;

    const query: any = {};

    if (country) {
      const resolved = resolveCountrySearch(country);
      if (resolved !== country) {
        query.country = { $regex: new RegExp(resolved, "i") };
      } else {
        query.country = { $regex: new RegExp(country, "i") };
      }
    }
    if (region) query.region = { $regex: new RegExp(region, "i") };
    if (city) query.city = { $regex: new RegExp(city, "i") };
    if (category) query.category = category;
    if (riskLevel) query.riskLevel = riskLevel;
    
    if (dateFrom || dateTo) {
      query.publishedAt = {};
      if (dateFrom) query.publishedAt.$gte = new Date(dateFrom);
      if (dateTo) query.publishedAt.$lte = new Date(dateTo + "T23:59:59Z");
    }

    if (search) {
      query.$or = [
        { title: { $regex: new RegExp(search, "i") } },
        { summary: { $regex: new RegExp(search, "i") } },
        { country: { $regex: new RegExp(search, "i") } }
      ];
    }

    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offsetNum = parseInt(offset) || 0;

    const [incidents, total] = await Promise.all([
      IncidentModel.find(query)
        .sort({ publishedAt: -1 })
        .limit(limitNum)
        .skip(offsetNum)
        .exec(),
      IncidentModel.countDocuments(query).exec(),
    ]);

    return res.json({
      incidents: incidents.map((i) => formatIncident(i.toJSON())),
      total: total || 0,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const parseResult = insertIncidentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Validation failed", issues: parseResult.error.issues });
    }
    const body: InsertIncident = parseResult.data;

    const incident = await IncidentModel.create({
      title: body.title,
      summary: body.summary,
      fullContent: body.fullContent,
      sourceUrl: body.sourceUrl,
      sourceName: body.sourceName,
      country: body.country,
      region: body.region || null,
      city: body.city || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      category: body.category,
      riskLevel: body.riskLevel,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      isVerified: body.isVerified ?? false,
      isOngoing: body.isOngoing ?? false,
      tags: body.tags || [],
    });

    return res.status(201).json(formatIncident(incident.toJSON()));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Bad Request", message: "Invalid incident ID" });
    }

    const incident = await IncidentModel.findById(id).exec();
    if (!incident) {
      return res.status(404).json({ error: "Not found", message: "Incident not found" });
    }

    return res.json(formatIncident(incident.toJSON()));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

router.post("/:id/assess", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Bad Request", message: "Invalid incident ID" });
    }

    const incident = await IncidentModel.findById(id).exec();
    if (!incident) {
      return res.status(404).json({ error: "Not found", message: "Incident not found" });
    }

    const recentIncidentsMap = await IncidentModel.find({
      country: incident.country,
      publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ publishedAt: -1 })
    .limit(20)
    .exec();

    const recentIncidents = recentIncidentsMap.map((i) => i.toJSON());

    const assessmentData = generateThreatAssessment(incident.country, incident.region || "", recentIncidents);

    const assessment = await ThreatAssessmentModel.create({
      ...assessmentData,
      incidentId: id,
    });

    return res.json(formatAssessment(assessment.toJSON()));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", message: String(err) });
  }
});

function formatIncident(i: any) {
  const { assessment, advisory } = generateIncidentBullets(i.category, i.riskLevel);
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
    assessment,
    advisory,
  };
}

function formatAssessment(a: any) {
  return {
    ...a,
    assessedAt: a.assessedAt instanceof Date ? a.assessedAt.toISOString() : a.assessedAt,
    validUntil: a.validUntil instanceof Date ? a.validUntil.toISOString() : (a.validUntil || null),
    region: a.region || null,
    incidentId: a.incidentId?.toString() || null,
    keyThreats: a.keyThreats || [],
    safetyRecommendations: a.safetyRecommendations || [],
    operationalGuidance: a.operationalGuidance || [],
    affectedAreas: a.affectedAreas || [],
  };
}

export { formatAssessment };
export default router;
