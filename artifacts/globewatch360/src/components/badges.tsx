import { IncidentCategory, RiskLevel } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, RISK_COLORS } from "@/lib/constants";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const style = RISK_COLORS[level] || "bg-gray-800 text-gray-300 border-gray-700";
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      style,
      level === RiskLevel.Ongoing && "animate-pulse",
      level === RiskLevel.Critical && "shadow-[0_0_10px_rgba(220,38,38,0.3)]",
      className
    )}>
      {level.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  );
}

export function CategoryBadge({ category, className }: { category: IncidentCategory; className?: string }) {
  const style = CATEGORY_COLORS[category] || "bg-gray-800 text-gray-300 border-gray-700";
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider",
      style,
      className
    )}>
      {category.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  );
}
