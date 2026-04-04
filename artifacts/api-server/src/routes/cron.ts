import { Router, type IRouter } from "express";
import { runScrape, scraperState } from "../lib/scraper.js";
import { requireAuth } from "../middlewares/auth.js";
import { connectDB } from "@workspace/db";

const router: IRouter = Router();

/**
 * GET /api/cron
 * Centralized cron handler to comply with Vercel Hobby plan limits.
 * This function can coordinate multiple background tasks.
 */
router.all("/", requireAuth, async (_req, res) => {
  console.log("Centralized Cron Triggered at", new Date().toISOString());

  const results: Record<string, any> = {};
  const errors: string[] = [];

  try {
    await connectDB();

    // Task 1: Scraper
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

    // Add more tasks here as needed:
    // results.cleanup = await runCleanup();
    // results.notifications = await sendDigest();

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
});

export default router;
