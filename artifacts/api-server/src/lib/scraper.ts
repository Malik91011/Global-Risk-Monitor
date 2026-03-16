import { db } from "@workspace/db";
import { incidentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { classifyCategory, classifyRiskLevel, extractTags, generateAiSummary } from "./classifier.js";

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  country: string;
  region?: string;
}

const NEWS_SOURCES = [
  // Global/International
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World News", country: "Global" },
  { url: "https://rss.cnn.com/rss/edition_world.rss", name: "CNN World", country: "Global" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera", country: "Global" },
  { url: "https://feeds.reuters.com/reuters/worldNews", name: "Reuters World", country: "Global" },
  { url: "https://www.theguardian.com/world/rss", name: "The Guardian World", country: "Global" },
  // Regional
  { url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", name: "BBC Africa", country: "Africa" },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", name: "BBC Asia", country: "Asia" },
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", name: "BBC Middle East", country: "Middle East" },
  { url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", name: "BBC Latin America", country: "Latin America" },
  { url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml", name: "BBC Europe", country: "Europe" },
  // Security focused
  { url: "https://thesoufancenter.org/feed/", name: "Soufan Center", country: "Global" },
  { url: "https://www.counterterrorism.com/rss.xml", name: "Counter Terrorism", country: "Global" },
];

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "Afghanistan": [33.9391, 67.7100],
  "Nigeria": [9.0820, 8.6753],
  "Ukraine": [48.3794, 31.1656],
  "Syria": [34.8021, 38.9968],
  "Yemen": [15.5527, 48.5164],
  "Somalia": [5.1521, 46.1996],
  "Myanmar": [21.9162, 95.9560],
  "Sudan": [12.8628, 30.2176],
  "Iraq": [33.2232, 43.6793],
  "Pakistan": [30.3753, 69.3451],
  "Mexico": [23.6345, -102.5528],
  "Brazil": [-14.2350, -51.9253],
  "Colombia": [4.5709, -74.2973],
  "Haiti": [18.9712, -72.2852],
  "Ethiopia": [9.1450, 40.4897],
  "Israel": [31.0461, 34.8516],
  "Palestine": [31.9522, 35.2332],
  "Iran": [32.4279, 53.6880],
  "Russia": [61.5240, 105.3188],
  "China": [35.8617, 104.1954],
  "North Korea": [40.3399, 127.5101],
  "India": [20.5937, 78.9629],
  "United States": [37.0902, -95.7129],
  "United Kingdom": [55.3781, -3.4360],
  "France": [46.2276, 2.2137],
  "Germany": [51.1657, 10.4515],
  "Libya": [26.3351, 17.2283],
  "Mali": [17.5707, -3.9962],
  "Burkina Faso": [12.3641, -1.5197],
  "DR Congo": [-4.0383, 21.7587],
  "South Sudan": [6.8770, 31.3070],
  "Venezuela": [6.4238, -66.5897],
  "Global": [20, 0],
  "Africa": [8.7832, 34.5085],
  "Asia": [34.0479, 100.6197],
  "Middle East": [29.3117, 42.4453],
  "Latin America": [-8.7832, -55.4915],
  "Europe": [54.5260, 15.2551],
};

export let scraperState = {
  isRunning: false,
  lastRun: null as Date | null,
  nextRun: null as Date | null,
  totalIncidentsScraped: 0,
  sourcesConfigured: NEWS_SOURCES.length,
  errors: [] as string[],
};

async function fetchRssFeed(url: string, sourceName: string, country: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { "User-Agent": "GlobeWatch360/1.0 NewsAggregator" }
    });
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    
    const text = await response.text();
    const items: RssItem[] = [];
    
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    for (const match of itemMatches) {
      const itemXml = match[1];
      
      const title = extractXmlTag(itemXml, "title");
      const description = extractXmlTag(itemXml, "description");
      const link = extractXmlTag(itemXml, "link") || extractXmlTag(itemXml, "guid");
      const pubDate = extractXmlTag(itemXml, "pubDate");
      
      if (title && link) {
        items.push({
          title: cleanText(title),
          description: cleanText(description || ""),
          link: link.trim(),
          pubDate: pubDate || new Date().toISOString(),
          source: sourceName,
          country,
        });
      }
    }
    
    return items.slice(0, 20);
  } catch {
    return [];
  }
}

function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "si"));
  return match ? match[1].trim() : "";
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCountry(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  const countryList = [
    "Afghanistan", "Nigeria", "Ukraine", "Syria", "Yemen", "Somalia", "Myanmar",
    "Sudan", "Iraq", "Pakistan", "Mexico", "Brazil", "Colombia", "Haiti",
    "Ethiopia", "Israel", "Palestine", "Iran", "Russia", "China", "North Korea",
    "India", "United States", "United Kingdom", "France", "Germany", "Libya",
    "Mali", "Burkina Faso", "DR Congo", "South Sudan", "Venezuela", "Philippines",
    "Indonesia", "Bangladesh", "Kenya", "Tanzania", "Ghana", "Cameroon",
    "Saudi Arabia", "Turkey", "Egypt", "Tunisia", "Morocco", "Algeria",
    "Japan", "South Korea", "Thailand", "Vietnam", "Malaysia", "Sri Lanka",
    "Argentina", "Chile", "Peru", "Bolivia", "Ecuador", "Guatemala", "Honduras",
    "El Salvador", "Nicaragua", "Cuba", "Jamaica", "Trinidad", "Barbados",
    "Canada", "Australia", "New Zealand", "South Africa", "Zimbabwe", "Zambia",
    "Uganda", "Rwanda", "Mozambique", "Angola", "Senegal", "Ivory Coast",
    "Poland", "Hungary", "Romania", "Czech Republic", "Serbia", "Kosovo",
    "Belarus", "Georgia", "Armenia", "Azerbaijan",
  ];
  
  for (const country of countryList) {
    if (text.includes(country.toLowerCase())) return country;
  }
  
  return "Global";
}

export async function runScrape(): Promise<{
  incidentsFound: number;
  incidentsAdded: number;
  sourcesScraped: number;
  errors: string[];
}> {
  scraperState.isRunning = true;
  scraperState.errors = [];
  
  let incidentsFound = 0;
  let incidentsAdded = 0;
  let sourcesScraped = 0;
  const errors: string[] = [];

  try {
    for (const source of NEWS_SOURCES) {
      const items = await fetchRssFeed(source.url, source.name, source.country);
      if (items.length > 0) sourcesScraped++;

      for (const item of items) {
        incidentsFound++;
        
        const urlHash = createHash("md5").update(item.link).digest("hex");
        
        const existing = await db.select({ id: incidentsTable.id })
          .from(incidentsTable)
          .where(eq(incidentsTable.urlHash, urlHash))
          .limit(1);
        
        if (existing.length > 0) continue;
        
        const country = source.country === "Global" 
          ? detectCountry(item.title, item.description) 
          : source.country;
        
        const category = classifyCategory(item.title, item.description);
        const riskLevel = classifyRiskLevel(item.title, item.description, category);
        const tags = extractTags(item.title, item.description, country);
        const aiSummary = generateAiSummary(item.title, item.description, category, riskLevel, country);
        const coords = COUNTRY_COORDINATES[country] || COUNTRY_COORDINATES["Global"];
        
        let publishedAt: Date;
        try {
          publishedAt = new Date(item.pubDate);
          if (isNaN(publishedAt.getTime())) publishedAt = new Date();
        } catch {
          publishedAt = new Date();
        }
        
        await db.insert(incidentsTable).values({
          title: item.title.slice(0, 500),
          summary: item.description.slice(0, 1000) || item.title,
          fullContent: item.description,
          sourceUrl: item.link,
          sourceName: item.source,
          country,
          latitude: coords[0],
          longitude: coords[1],
          category,
          riskLevel,
          isVerified: false,
          isOngoing: riskLevel === "Ongoing",
          publishedAt,
          tags,
          aiSummary,
          urlHash,
        }).onConflictDoNothing();
        
        incidentsAdded++;
        scraperState.totalIncidentsScraped++;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    errors.push(errMsg);
    scraperState.errors.push(errMsg);
  }

  scraperState.isRunning = false;
  scraperState.lastRun = new Date();
  scraperState.nextRun = new Date(Date.now() + 30 * 60 * 1000);

  return { incidentsFound, incidentsAdded, sourcesScraped, errors };
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerInterval) return;
  
  runScrape().catch(console.error);
  
  schedulerInterval = setInterval(() => {
    runScrape().catch(console.error);
  }, 30 * 60 * 1000);
  
  scraperState.nextRun = new Date(Date.now() + 30 * 60 * 1000);
}
