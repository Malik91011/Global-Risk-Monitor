import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
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
export async function processNewsItemsWithAI(items) {
    if (items.length === 0)
        return [];
    const payloadStr = items.map((i, idx) => `[ITEM ${idx + 1}]\nTITLE: ${i.title}\nDATE: ${i.pubDate}\nLINK: ${i.link}\nSOURCE: ${i.source}\nCONTENT: ${i.description}`).join("\n\n---\n\n");
    const completion = await openai.chat.completions.parse({
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
        response_format: zodResponseFormat(IncidentArraySchema, "incident_extraction"),
        temperature: 0.1,
    });
    return completion.choices[0].message.parsed?.incidents || [];
}
