import { Router } from "express";

export const authRouter = Router();

authRouter.post("/logout", (req, res) => {
  // Normally this would clear a session or JWT cookie
  res.json({ success: true });
});
