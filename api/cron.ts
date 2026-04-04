import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runScrape, scraperState } from "../artifacts/api-server/src/lib/scraper";
import { connectDB } from "@workspace/db";

/**
 * Standard Vercel Serverless Function for Cron Jobs.
 * Located at /api/cron.ts for direct access.
 */
export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  console.log("Vercel Cron Triggered at", new Date().toISOString());

  const results: Record<string, any> = {};
  const errors: string[] = [];

  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Clear state for this specific execution (as it's serverless)
    scraperState.isRunning = true;
    scraperState.errors = [];

    // 3. Execute Scraper Task
    console.log("Starting Scraper task...");
    try {
      const scrapeResult = await runScrape();
      results.scraper = { 
        success: true, 
        incidentsAdded: scrapeResult.incidentsAdded,
        sourcesScraped: scrapeResult.sourcesScraped
      };
      
      if (scrapeResult.errors && scrapeResult.errors.length > 0) {
        errors.push(...scrapeResult.errors);
      }
    } catch (err: any) {
      console.error("Scraper task failed:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Scraper: ${errorMsg}`);
      results.scraper = { success: false, error: errorMsg };
    }

    // Task 4: Finalize response
    scraperState.isRunning = false;

    return res.status(200).json({
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err: any) {
    console.error("Critical error during cron execution:", err);
    return res.status(500).json({
      success: false,
      message: "Cron execution encountered a critical crash",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
