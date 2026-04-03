import { Router } from "express";

export const profileRouter = Router();

// In-memory mock user profile
let mockUserProfile = {
  fullName: "Operator",
  email: "admin@globewatch.local",
  role: "SysAdmin",
  theme: "dark",
  alertsEnabled: true,
  syncInterval: "30000"
};

profileRouter.get("/", (req, res) => {
  res.json(mockUserProfile);
});

profileRouter.post("/", (req, res) => {
  const { fullName, email, role, theme, alertsEnabled, syncInterval } = req.body;
  if (fullName !== undefined) mockUserProfile.fullName = fullName;
  if (email !== undefined) mockUserProfile.email = email;
  if (role !== undefined) mockUserProfile.role = role;
  if (theme !== undefined) mockUserProfile.theme = theme;
  if (alertsEnabled !== undefined) mockUserProfile.alertsEnabled = alertsEnabled;
  if (syncInterval !== undefined) mockUserProfile.syncInterval = syncInterval;
  
  res.json(mockUserProfile);
});
