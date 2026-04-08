import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI(); // Automatically uses process.env.OPENAI_API_KEY

export const IncidentSchema = z.object({
  title: z.string().describe("Title of the incident"),
  dateTimeUtc: z.string().describe("Date & time (UTC) ISO format"),
  location: z.object({
    country: z.string(),
    region: z.string().nullable().optional(),
    city: z.string().nullable().optional()
  }),
  category: z.string().describe("e.g. Security, Health, PublicSafety, Cyber, Hazmats, CivilPolitical"),
  summary: z.string().describe("Summary (2-3 sentences max)"),
  sourceUrl: z.string()
});

export const IncidentArraySchema = z.object({
  incidents: z.array(IncidentSchema)
});

export type ExtractedIncident = z.infer<typeof IncidentSchema>;

// Shared interface with scraper
export interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceCountry: string;
}

export async function processNewsItemsWithAI(items: RssItem[]): Promise<ExtractedIncident[]> {
  if (items.length === 0) return [];

  const payloadStr = items.map((i, idx) => `[ITEM ${idx + 1}]\nTITLE: ${i.title}\nDATE: ${i.pubDate}\nLINK: ${i.link}\nSOURCE: ${i.source}\nCONTENT: ${i.description}`).join("\n\n---\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a global news aggregator. Every hour, search the web for the latest breaking news and incidents from the following categories: conflicts & wars, natural disasters, political crises, terrorism, cyber attacks, public health emergencies, and major accidents.
For each news item found, extract:
Title of the incident
Date & time (UTC)
Location (country, region, city)
Category (e.g. Security, Disaster, Conflict, Crime, etc.)
Summary (2-3 sentences max)
Source URL

Pull from reputable sources including: BBC News, Reuters, AP News, Al Jazeera, The Guardian, France24, and Associated Press.
Return results as a structured JSON array. Deduplicate stories that cover the same event (if multiple items describe the same event, return exactly one incident combining the info). Prioritize stories from the last 24 hours. Ignore opinion pieces, editorials, and entertainment news. Analyze the provided raw RSS items and extract the true breaking news incidents.`
      },
      {
        role: "user",
        content: payloadStr
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "incident_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            incidents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  dateTimeUtc: { type: "string" },
                  location: {
                    type: "object",
                    properties: {
                      country: { type: "string" },
                      region: { type: ["string", "null"] },
                      city: { type: ["string", "null"] }
                    },
                    required: ["country", "region", "city"],
                    additionalProperties: false
                  },
                  category: { type: "string" },
                  summary: { type: "string" },
                  sourceUrl: { type: "string" }
                },
                required: ["title", "dateTimeUtc", "location", "category", "summary", "sourceUrl"],
                additionalProperties: false
              }
            }
          },
          required: ["incidents"],
          additionalProperties: false
        }
      }
    },
    temperature: 0.1,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = IncidentArraySchema.safeParse(parsed);
  return result.success ? result.data.incidents : [];
}
