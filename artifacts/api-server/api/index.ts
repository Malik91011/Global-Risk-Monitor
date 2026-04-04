import app from "../src/app.js";

/**
 * Standard Vercel Serverless Function gateway for the main Express API.
 * Handles all other /api/* routes except for specialized functions like /api/cron.
 */
export default app;
