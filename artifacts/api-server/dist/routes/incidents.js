import { Router } from "express";
import { db } from "@workspace/db";
import { incidentsTable, threatAssessmentsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, or, desc, count } from "drizzle-orm";
import { insertIncidentSchema } from "@workspace/db/schema";
import { generateThreatAssessment, generateIncidentBullets } from "../lib/assessmentGenerator.js";
import { requireAuth } from "../middlewares/auth.js";
const router = Router();
// City / alias → canonical country name mappings for search expansion
const CITY_TO_COUNTRY = {
    // UAE
    "dubai": "United Arab Emirates", "abu dhabi": "United Arab Emirates",
    "sharjah": "United Arab Emirates", "uae": "United Arab Emirates",
    // Turkey
    "istanbul": "Turkey", "ankara": "Turkey", "izmir": "Turkey",
    // Pakistan
    "karachi": "Pakistan", "lahore": "Pakistan", "islamabad": "Pakistan",
    "rawalpindi": "Pakistan", "peshawar": "Pakistan", "quetta": "Pakistan",
    "multan": "Pakistan", "faisalabad": "Pakistan",
    // India
    "mumbai": "India", "delhi": "India", "new delhi": "India",
    "kolkata": "India", "chennai": "India", "bangalore": "India", "hyderabad": "India",
    // Saudi Arabia
    "riyadh": "Saudi Arabia", "jeddah": "Saudi Arabia", "mecca": "Saudi Arabia",
    "medina": "Saudi Arabia", "ksa": "Saudi Arabia",
    // Middle East cities
    "baghdad": "Iraq", "basra": "Iraq",
    "tehran": "Iran", "mashhad": "Iran",
    "beirut": "Lebanon",
    "amman": "Jordan",
    "damascus": "Syria", "aleppo": "Syria",
    "cairo": "Egypt", "alexandria": "Egypt",
    "doha": "Qatar",
    "kuwait city": "Kuwait",
    "muscat": "Oman",
    "manama": "Bahrain",
    "sanaa": "Yemen", "aden": "Yemen",
    "gaza": "Palestine", "ramallah": "Palestine", "west bank": "Palestine",
    "tel aviv": "Israel", "jerusalem": "Israel",
    "kabul": "Afghanistan",
    // Africa cities
    "nairobi": "Kenya", "mombasa": "Kenya",
    "lagos": "Nigeria", "abuja": "Nigeria", "kano": "Nigeria",
    "accra": "Ghana",
    "addis ababa": "Ethiopia",
    "johannesburg": "South Africa", "cape town": "South Africa", "pretoria": "South Africa",
    "mogadishu": "Somalia",
    "khartoum": "Sudan",
    "tripoli": "Libya",
    "tunis": "Tunisia",
    "casablanca": "Morocco", "rabat": "Morocco",
    "kinshasa": "DR Congo",
    "dakar": "Senegal",
    "kampala": "Uganda",
    "dar es salaam": "Tanzania",
    "harare": "Zimbabwe",
    // Europe cities
    "kyiv": "Ukraine", "kiev": "Ukraine", "kharkiv": "Ukraine",
    "moscow": "Russia", "st. petersburg": "Russia",
    "london": "United Kingdom",
    "paris": "France",
    "berlin": "Germany",
    "rome": "Italy",
    "madrid": "Spain",
    "warsaw": "Poland",
    "belgrade": "Serbia",
    "tbilisi": "Georgia",
    "baku": "Azerbaijan",
    "yerevan": "Armenia",
    // East Asia
    "beijing": "China", "shanghai": "China", "hong kong": "China",
    "tokyo": "Japan", "osaka": "Japan",
    "seoul": "South Korea", "busan": "South Korea",
    "taipei": "Taiwan",
    "pyongyang": "North Korea",
    // Southeast Asia
    "bangkok": "Thailand",
    "manila": "Philippines",
    "jakarta": "Indonesia",
    "kuala lumpur": "Malaysia",
    "singapore": "Singapore",
    "hanoi": "Vietnam", "ho chi minh": "Vietnam",
    "yangon": "Myanmar",
    "phnom penh": "Cambodia",
    // Americas
    "mexico city": "Mexico",
    "bogota": "Colombia",
    "lima": "Peru",
    "santiago": "Chile",
    "buenos aires": "Argentina",
    "caracas": "Venezuela",
    "havana": "Cuba",
    "port-au-prince": "Haiti",
};
function resolveCountrySearch(input) {
    const lower = input.toLowerCase().trim();
    return CITY_TO_COUNTRY[lower] ?? input;
}
router.get("/", async (req, res) => {
    try {
        const { country, region, city, category, riskLevel, dateFrom, dateTo, search, limit = "50", offset = "0", } = req.query;
        const conditions = [];
        if (country) {
            const resolved = resolveCountrySearch(country);
            // If resolved to a different name, search by exact canonical name; otherwise do ILIKE
            if (resolved !== country) {
                conditions.push(ilike(incidentsTable.country, `%${resolved}%`));
            }
            else {
                conditions.push(ilike(incidentsTable.country, `%${country}%`));
            }
        }
        if (region)
            conditions.push(ilike(incidentsTable.region, `%${region}%`));
        if (city)
            conditions.push(ilike(incidentsTable.city, `%${city}%`));
        if (category)
            conditions.push(eq(incidentsTable.category, category));
        if (riskLevel)
            conditions.push(eq(incidentsTable.riskLevel, riskLevel));
        if (dateFrom)
            conditions.push(gte(incidentsTable.publishedAt, new Date(dateFrom)));
        if (dateTo)
            conditions.push(lte(incidentsTable.publishedAt, new Date(dateTo + "T23:59:59Z")));
        if (search) {
            conditions.push(or(ilike(incidentsTable.title, `%${search}%`), ilike(incidentsTable.summary, `%${search}%`), ilike(incidentsTable.country, `%${search}%`)));
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
        return res.json({
            incidents: incidents.map(formatIncident),
            total: totalResult[0]?.count ?? 0,
            limit: limitNum,
            offset: offsetNum,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error", message: String(err) });
    }
});
router.post("/", requireAuth, async (req, res) => {
    try {
        const parseResult = insertIncidentSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", issues: parseResult.error.issues });
        }
        const body = parseResult.data;
        const [incident] = await db.insert(incidentsTable).values({
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
        }).returning();
        return res.status(201).json(formatIncident(incident));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error", message: String(err) });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Bad Request", message: "Invalid incident ID" });
        }
        const [incident] = await db.select()
            .from(incidentsTable)
            .where(eq(incidentsTable.id, id))
            .limit(1);
        if (!incident) {
            return res.status(404).json({ error: "Not found", message: "Incident not found" });
        }
        return res.json(formatIncident(incident));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error", message: String(err) });
    }
});
router.post("/:id/assess", requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Bad Request", message: "Invalid incident ID" });
        }
        const [incident] = await db.select()
            .from(incidentsTable)
            .where(eq(incidentsTable.id, id))
            .limit(1);
        if (!incident) {
            return res.status(404).json({ error: "Not found", message: "Incident not found" });
        }
        const recentIncidents = await db.select()
            .from(incidentsTable)
            .where(and(eq(incidentsTable.country, incident.country), gte(incidentsTable.publishedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))))
            .orderBy(desc(incidentsTable.publishedAt))
            .limit(20);
        const assessmentData = generateThreatAssessment(incident.country, incident.region, recentIncidents);
        const [assessment] = await db.insert(threatAssessmentsTable).values({
            ...assessmentData,
            incidentId: id,
        }).returning();
        return res.json(formatAssessment(assessment));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error", message: String(err) });
    }
});
function formatIncident(i) {
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
function formatAssessment(a) {
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
