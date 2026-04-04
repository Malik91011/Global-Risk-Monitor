import { Router, type IRouter } from "express";
import { runScrape, scraperState } from "../lib/scraper.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.all("/trigger", requireAuth, async (_req, res) => {
  if (scraperState.isRunning) {
    return res.status(409).json({
      success: false,
      message: "Scraper is already running",
    });
  }

  console.log("Scraper trigger received. Starting scrape...");

  try {
    // We await it here so Vercel keeps the function alive.
    // Note: If this takes >60s it might still time out on Vercel Pro,
    // or >10s on Hobby.
    const result = await runScrape();

    console.log(`Scrape completed: ${result.incidentsAdded} added, ${result.errors.length} errors.`);

    return res.status(200).json({
      success: true,
      message: "Scraping completed successfully",
      ...result
    });
  } catch (err) {
    console.error("Scrape failed:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to complete scraper",
      errors: [String(err)],
    });
  }
});

router.get("/status", (_req, res) => {
  res.json({
    isRunning: scraperState.isRunning,
    lastRun: scraperState.lastRun?.toISOString() || null,
    nextRun: scraperState.nextRun?.toISOString() || null,
    totalIncidentsScraped: scraperState.totalIncidentsScraped,
    sourcesConfigured: scraperState.sourcesConfigured,
  });
});

export default router;
