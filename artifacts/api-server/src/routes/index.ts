import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import incidentsRouter from "./incidents.js";
import threatsRouter from "./threats.js";
import reportsRouter from "./reports.js";
import scraperRouter from "./scraper.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/incidents", incidentsRouter);
router.use("/threats", threatsRouter);
router.use("/reports", reportsRouter);
router.use("/scraper", scraperRouter);
router.use("/stats", statsRouter);

export default router;
