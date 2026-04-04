// /api-server/api/cron.ts
import { runScrape, scraperState } from "../lib/scraper.js";
import { connectDB } from "@workspace/db";

export default async function handler(req, res) {
  console.log("Centralized Cron Triggered at", new Date().toISOString());

  const results = {};
  const errors = [];

  try {
    await connectDB();

    // Scraper task
    if (scraperState.isRunning) {
      results.scraper = { success: false, message: "Scraper already running" };
    } else {
      console.log("Starting Scraper task...");
      try {
        const scrapeResult = await runScrape();
        results.scraper = { success: true, ...scrapeResult };
      } catch (err) {
        console.error("Scraper task failed:", err);
        errors.push(`Scraper: ${String(err)}`);
        results.scraper = { success: false, error: String(err) };
      }
    }

    return res.status(200).json({
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err) {
    console.error("Centralized cron failed:", err);
    return res.status(500).json({
      success: false,
      message: "Centralized cron execution failed",
      error: String(err),
    });
  }
}
