import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Check if it's a Vercel Cron job
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return next();
  }

  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const validKey = process.env.API_KEY || "dev_secret_key";

  if (!apiKey || apiKey !== validKey) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or missing API key" });
    return;
  }

  next();
}

