import { IncidentCategory, RiskLevel } from "@workspace/api-client-react";

export const RISK_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.Critical]: "bg-red-500/10 text-red-500 border-red-500/20",
  [RiskLevel.HighImpact]: "bg-orange-600/10 text-orange-500 border-orange-600/20",
  [RiskLevel.High]: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  [RiskLevel.Ongoing]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  [RiskLevel.Moderate]: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  [RiskLevel.Low]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export const CATEGORY_COLORS: Record<IncidentCategory, string> = {
  [IncidentCategory.Security]: "bg-red-900/40 text-red-300 border-red-800/50",
  [IncidentCategory.Crime]: "bg-orange-900/40 text-orange-300 border-orange-800/50",
  [IncidentCategory.PublicSafety]: "bg-blue-900/40 text-blue-300 border-blue-800/50",
  [IncidentCategory.Health]: "bg-green-900/40 text-green-300 border-green-800/50",
  [IncidentCategory.Hazards]: "bg-amber-900/40 text-amber-300 border-amber-800/50",
  [IncidentCategory.Cyber]: "bg-violet-900/40 text-violet-300 border-violet-800/50",
  [IncidentCategory.CivilPolitical]: "bg-pink-900/40 text-pink-300 border-pink-800/50",
  [IncidentCategory.Other]: "bg-gray-800/40 text-gray-300 border-gray-700/50",
};
