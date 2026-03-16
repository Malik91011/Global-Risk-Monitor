import { Router, type IRouter } from "express";
import { runScrape, scraperState } from "../lib/scraper.js";

const router: IRouter = Router();

router.post("/trigger", async (_req, res) => {
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
    const result = await runScrape();
    res.json({
      success: true,
      message: `Scrape complete. Found ${result.incidentsFound} items, added ${result.incidentsAdded} new incidents from ${result.sourcesScraped} sources.`,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: String(err),
      incidentsFound: 0,
      incidentsAdded: 0,
      sourcesScraped: 0,
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
