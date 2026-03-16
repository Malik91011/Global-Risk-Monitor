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
  sourceCountry: string; // hint only — always overridden by detectCountry()
}

const NEWS_SOURCES = [
  // ── Global / International ──────────────────────────────────
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml",              name: "BBC World News",          country: "Global" },
  { url: "https://rss.cnn.com/rss/edition_world.rss",                name: "CNN World",               country: "Global" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                name: "Al Jazeera",              country: "Global" },
  { url: "https://feeds.reuters.com/reuters/worldNews",              name: "Reuters World",           country: "Global" },
  { url: "https://www.theguardian.com/world/rss",                    name: "The Guardian World",      country: "Global" },
  { url: "https://rss.dw.com/rss/en-world",                         name: "Deutsche Welle",          country: "Global" },
  { url: "https://www.france24.com/en/rss",                         name: "France 24",               country: "Global" },

  // ── Regional BBC ────────────────────────────────────────────
  { url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",       name: "BBC Africa",              country: "Africa" },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml",         name: "BBC Asia",                country: "Asia" },
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",  name: "BBC Middle East",         country: "Middle East" },
  { url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml",name: "BBC Latin America",       country: "Latin America" },
  { url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml",       name: "BBC Europe",              country: "Europe" },
  { url: "https://feeds.bbci.co.uk/news/world/south_asia/rss.xml",   name: "BBC South Asia",          country: "South Asia" },

  // ── Pakistan ─────────────────────────────────────────────────
  { url: "https://www.dawn.com/feeds/home",                          name: "Dawn Pakistan",           country: "Pakistan" },
  { url: "https://www.geo.tv/rss/10",                                name: "Geo News Pakistan",       country: "Pakistan" },
  { url: "https://arynews.tv/feed/",                                 name: "ARY News Pakistan",       country: "Pakistan" },
  { url: "https://www.thenews.com.pk/rss/1/16",                      name: "The News Pakistan",       country: "Pakistan" },
  { url: "https://tribune.com.pk/feed/rss",                          name: "Express Tribune Pakistan",country: "Pakistan" },

  // ── India ────────────────────────────────────────────────────
  { url: "https://feeds.feedburner.com/ndtvnews-top-stories",        name: "NDTV India",              country: "India" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",name: "Times of India",         country: "India" },
  { url: "https://indianexpress.com/feed/",                          name: "The Indian Express",      country: "India" },

  // ── Middle East ───────────────────────────────────────────────
  { url: "https://www.arabnews.com/rss.xml",                         name: "Arab News",               country: "Saudi Arabia" },
  { url: "https://www.middleeasteye.net/rss",                        name: "Middle East Eye",         country: "Middle East" },
  { url: "https://www.timesofisrael.com/feed/",                      name: "Times of Israel",         country: "Israel" },
  { url: "https://www.haaretz.com/srv/haaretz-eng-rss",              name: "Haaretz",                 country: "Israel" },
  { url: "https://www.presstv.ir/rss.xml",                           name: "Press TV Iran",           country: "Iran" },

  // ── Africa ────────────────────────────────────────────────────
  { url: "https://www.vanguardngr.com/feed/",                        name: "Vanguard Nigeria",        country: "Nigeria" },
  { url: "https://punchng.com/feed/",                                name: "Punch Nigeria",           country: "Nigeria" },
  { url: "https://www.monitor.co.ug/Uganda/rss",                     name: "Daily Monitor Uganda",   country: "Uganda" },
  { url: "https://www.nation.africa/kenya/rss.xml",                  name: "Daily Nation Kenya",      country: "Kenya" },
  { url: "https://www.dailymaverick.co.za/rss",                      name: "Daily Maverick SA",       country: "South Africa" },
  { url: "https://allafrica.com/tools/headlines/rdf/security/headlines.rdf", name: "AllAfrica Security", country: "Africa" },

  // ── Europe & Russia ───────────────────────────────────────────
  { url: "https://www.kyivpost.com/rss",                             name: "Kyiv Post Ukraine",       country: "Ukraine" },
  { url: "https://en.interfax.com.ua/news/general.rss",              name: "Interfax Ukraine",        country: "Ukraine" },
  { url: "https://meduza.io/rss/en/all",                             name: "Meduza Russia",           country: "Russia" },

  // ── Americas ──────────────────────────────────────────────────
  { url: "https://www.venezuelaanalysis.com/rss.xml",                name: "Venezuela Analysis",      country: "Venezuela" },
  { url: "https://insightcrime.org/feed/",                           name: "InSight Crime",           country: "Latin America" },

  // ── Asia-Pacific ──────────────────────────────────────────────
  { url: "https://www.channelnewsasia.com/rssfeeds/8395884",         name: "CNA Asia",                country: "Asia" },
  { url: "https://www.rfa.org/english/RSS",                          name: "Radio Free Asia",         country: "Asia" },

  // ── Security / Conflict specific ─────────────────────────────
  { url: "https://www.longwarjournal.org/feed",                      name: "Long War Journal",        country: "Global" },
  { url: "https://acleddata.com/feed/",                              name: "ACLED Conflict Data",     country: "Global" },
  { url: "https://www.reliefweb.int/headlines/rss.xml",              name: "ReliefWeb",               country: "Global" },
  { url: "https://www.crisisgroup.org/rss.xml",                      name: "ICG Crisis Group",        country: "Global" },
];

// ── Country coordinates for map ───────────────────────────────────────────────
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "Afghanistan": [33.93, 67.71], "Albania": [41.15, 20.17], "Algeria": [28.03, 1.66],
  "Angola": [-11.20, 17.87], "Argentina": [-38.41, -63.62], "Armenia": [40.07, 45.04],
  "Australia": [-25.27, 133.78], "Azerbaijan": [40.14, 47.58], "Bahrain": [26.07, 50.56],
  "Bangladesh": [23.68, 90.36], "Belarus": [53.71, 27.95], "Bolivia": [-16.29, -63.59],
  "Brazil": [-14.24, -51.93], "Burkina Faso": [12.36, -1.52], "Cambodia": [12.57, 104.99],
  "Cameroon": [7.37, 12.35], "Chad": [15.45, 18.73], "Chile": [-35.68, -71.54],
  "China": [35.86, 104.20], "Colombia": [4.57, -74.30], "Congo": [-0.23, 15.83],
  "Cuba": [21.52, -77.78], "DR Congo": [-4.04, 21.76], "Ecuador": [-1.83, -78.18],
  "Egypt": [26.82, 30.80], "El Salvador": [13.79, -88.90], "Ethiopia": [9.15, 40.49],
  "France": [46.23, 2.21], "Georgia": [42.32, 43.36], "Germany": [51.17, 10.45],
  "Ghana": [7.95, -1.02], "Greece": [39.07, 21.82], "Guatemala": [15.78, -90.23],
  "Guinea": [11.80, -15.18], "Haiti": [18.97, -72.29], "Honduras": [15.20, -86.24],
  "Hungary": [47.16, 19.50], "India": [20.59, 78.96], "Indonesia": [-0.79, 113.92],
  "Iran": [32.43, 53.69], "Iraq": [33.22, 43.68], "Israel": [31.05, 34.85],
  "Ivory Coast": [7.54, -5.55], "Japan": [36.20, 138.25], "Jordan": [30.59, 36.24],
  "Kazakhstan": [48.02, 66.92], "Kenya": [-0.02, 37.91], "Kosovo": [42.60, 20.90],
  "Kuwait": [29.31, 47.48], "Kyrgyzstan": [41.20, 74.77], "Laos": [19.86, 102.50],
  "Lebanon": [33.85, 35.86], "Libya": [26.34, 17.23], "Madagascar": [-18.77, 46.87],
  "Mali": [17.57, -3.99], "Mexico": [23.63, -102.55], "Moldova": [47.41, 28.37],
  "Morocco": [31.79, -7.09], "Mozambique": [-18.66, 35.53], "Myanmar": [21.92, 95.96],
  "Nepal": [28.39, 84.12], "Nicaragua": [12.87, -85.21], "Niger": [17.61, 8.08],
  "Nigeria": [9.08, 8.68], "North Korea": [40.34, 127.51], "Pakistan": [30.38, 69.35],
  "Palestine": [31.95, 35.23], "Panama": [8.54, -80.78], "Paraguay": [-23.44, -58.44],
  "Peru": [-9.19, -75.02], "Philippines": [12.88, 121.77], "Poland": [51.92, 19.15],
  "Qatar": [25.35, 51.18], "Romania": [45.94, 24.97], "Russia": [61.52, 105.32],
  "Rwanda": [-1.94, 29.87], "Saudi Arabia": [23.89, 45.08], "Senegal": [14.50, -14.45],
  "Serbia": [44.02, 21.01], "Sierra Leone": [8.46, -11.78], "Somalia": [5.15, 46.20],
  "South Africa": [-30.56, 22.94], "South Korea": [35.91, 127.77], "South Sudan": [6.88, 31.31],
  "Spain": [40.46, -3.75], "Sri Lanka": [7.87, 80.77], "Sudan": [12.86, 30.22],
  "Syria": [34.80, 38.10], "Taiwan": [23.70, 121.00], "Tajikistan": [38.86, 71.28],
  "Tanzania": [-6.37, 34.89], "Thailand": [15.87, 100.99], "Tunisia": [33.89, 9.54],
  "Turkey": [38.96, 35.24], "Turkmenistan": [38.97, 59.56], "Uganda": [1.37, 32.29],
  "Ukraine": [48.38, 31.17], "United Arab Emirates": [23.42, 53.85],
  "United Kingdom": [55.38, -3.44], "United States": [37.09, -95.71],
  "Uzbekistan": [41.38, 64.59], "Venezuela": [6.42, -66.59], "Vietnam": [14.06, 108.28],
  "Yemen": [15.55, 48.52], "Zambia": [-13.13, 27.85], "Zimbabwe": [-19.02, 29.15],
  // Regions
  "Global": [20, 0], "Africa": [8.78, 34.51], "Asia": [34.05, 100.62],
  "Middle East": [29.31, 42.45], "Latin America": [-8.78, -55.49], "Europe": [54.53, 15.26],
  "South Asia": [20.59, 78.96],
};

// ── State ────────────────────────────────────────────────────────────────────
export let scraperState = {
  isRunning: false,
  lastRun: null as Date | null,
  nextRun: null as Date | null,
  totalIncidentsScraped: 0,
  sourcesConfigured: NEWS_SOURCES.length,
  errors: [] as string[],
};

// ── Country keyword list (ordered most-specific first) ───────────────────────
const COUNTRY_LIST = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia",
  "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Bolivia", "Brazil", "Burkina Faso",
  "Cambodia", "Cameroon", "Chad", "Chile", "China", "Colombia", "Congo", "Cuba",
  "DR Congo", "Ecuador", "Egypt", "El Salvador", "Ethiopia", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Haiti", "Honduras", "Hungary",
  "India", "Indonesia", "Iran", "Iraq", "Israel", "Ivory Coast", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", "Libya",
  "Madagascar", "Mali", "Mexico", "Moldova", "Morocco", "Mozambique", "Myanmar",
  "Nepal", "Nicaragua", "Niger", "Nigeria", "North Korea", "Pakistan", "Palestine",
  "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Qatar", "Romania", "Russia",
  "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Sierra Leone", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Tunisia", "Turkey", "Turkmenistan",
  "Uganda", "Ukraine", "United Arab Emirates", "UAE", "United Kingdom", "UK",
  "United States", "USA", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia",
  "Zimbabwe", "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar",  // Pakistan cities
  "Mumbai", "Delhi", "Kabul", "Baghdad", "Tehran", "Beirut", "Cairo", "Nairobi",
  "Lagos", "Kyiv", "Moscow", "Beijing", "Ankara", "Riyadh", "Amman", "Damascus",
];

// Alias map — maps certain keywords back to country names
const COUNTRY_ALIASES: Record<string, string> = {
  "UK": "United Kingdom", "UAE": "United Arab Emirates", "USA": "United States",
  "Karachi": "Pakistan", "Lahore": "Pakistan", "Islamabad": "Pakistan",
  "Rawalpindi": "Pakistan", "Peshawar": "Pakistan", "Quetta": "Pakistan",
  "Mumbai": "India", "Delhi": "India", "Kolkata": "India", "Kabul": "Afghanistan",
  "Baghdad": "Iraq", "Tehran": "Iran", "Beirut": "Lebanon", "Cairo": "Egypt",
  "Nairobi": "Kenya", "Lagos": "Nigeria", "Kyiv": "Ukraine", "Moscow": "Russia",
  "Beijing": "China", "Ankara": "Turkey", "Riyadh": "Saudi Arabia",
  "Amman": "Jordan", "Damascus": "Syria",
};

function detectCountry(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();

  for (const name of COUNTRY_LIST) {
    // Match whole word (surrounded by space, comma, period, or start/end)
    const re = new RegExp(`(?<![a-z])${name.toLowerCase()}(?![a-z])`, "i");
    if (re.test(text)) {
      return COUNTRY_ALIASES[name] ?? name;
    }
  }
  return null;
}

// ── XML helpers ───────────────────────────────────────────────────────────────
function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "si"));
  return match ? match[1].trim() : "";
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ").trim();
}

async function fetchRssFeed(url: string, sourceName: string, sourceCountry: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "GlobeWatch360/1.0 (+https://globewatch360.com)" },
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const text = await response.text();

    const items: RssItem[] = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);

    for (const match of itemMatches) {
      const xml = match[1];
      const title = cleanText(extractXmlTag(xml, "title"));
      const desc  = cleanText(extractXmlTag(xml, "description"));
      const link  = extractXmlTag(xml, "link").trim() || extractXmlTag(xml, "guid").trim();
      const date  = extractXmlTag(xml, "pubDate") || extractXmlTag(xml, "dc:date");

      if (title && link) {
        items.push({ title, description: desc, link, pubDate: date, source: sourceName, sourceCountry });
      }
    }

    return items.slice(0, 25);
  } catch {
    return [];
  }
}

// ── Main scrape ───────────────────────────────────────────────────────────────
export async function runScrape(): Promise<{
  incidentsFound: number;
  incidentsAdded: number;
  sourcesScraped: number;
  errors: string[];
}> {
  scraperState.isRunning = true;
  scraperState.errors = [];

  let incidentsFound = 0, incidentsAdded = 0, sourcesScraped = 0;
  const errors: string[] = [];

  try {
    for (const source of NEWS_SOURCES) {
      const items = await fetchRssFeed(source.url, source.name, source.country);
      if (items.length > 0) sourcesScraped++;

      for (const item of items) {
        incidentsFound++;

        const urlHash = createHash("md5").update(item.link).digest("hex");
        const existing = await db.select({ id: incidentsTable.id })
          .from(incidentsTable).where(eq(incidentsTable.urlHash, urlHash)).limit(1);
        if (existing.length > 0) continue;

        // Always try to detect a specific country from article text
        const detectedCountry = detectCountry(item.title, item.description);

        // Use: detected specific country > source country (if not a generic region) > fallback
        let country: string;
        if (detectedCountry) {
          country = detectedCountry;
        } else if (!["Global", "Africa", "Asia", "Europe", "Middle East", "Latin America", "South Asia"].includes(source.country)) {
          // Source is already country-specific (e.g. "Pakistan", "Nigeria")
          country = source.country;
        } else {
          // Regional source with no specific country detected — keep regional label
          country = source.country;
        }

        const category = classifyCategory(item.title, item.description);
        const riskLevel = classifyRiskLevel(item.title, item.description, category);
        const tags = extractTags(item.title, item.description, country);
        const aiSummary = generateAiSummary(item.title, item.description, category, riskLevel, country);
        const coords = COUNTRY_COORDINATES[country] ?? COUNTRY_COORDINATES["Global"]!;

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
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    scraperState.errors.push(msg);
  }

  scraperState.isRunning = false;
  scraperState.lastRun = new Date();
  scraperState.nextRun = new Date(Date.now() + 30 * 60 * 1000);

  return { incidentsFound, incidentsAdded, sourcesScraped, errors };
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerInterval) return;
  runScrape().catch(console.error);
  schedulerInterval = setInterval(() => { runScrape().catch(console.error); }, 30 * 60 * 1000);
  scraperState.nextRun = new Date(Date.now() + 30 * 60 * 1000);
}
