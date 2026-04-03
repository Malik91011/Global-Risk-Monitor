import { Router, type IRouter } from "express";
import { runScrape, scraperState } from "../lib/scraper.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/trigger", requireAuth, async (_req, res) => {
  if (scraperState.isRunning) {
    return res.json({
      success: false,
      message: "Scraper is already running",
      incidentsFound: 0,
      incidentsAdded: 0,
      sourcesScraped: 0,
      errors: ["Scraper already running"],
    });
  }

  try {
    // Fire and forget
    runScrape().catch((err) => {
      console.error("Background scrape failed:", err);
    });

    return res.status(202).json({
      success: true,
      message: "Scraping job has been accepted and is running in the background.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to start scraper",
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
