import { useState } from "react";
import { Incident } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, ShieldAlert, BookOpen } from "lucide-react";
import { RiskBadge, CategoryBadge } from "./badges";
import { cn } from "@/lib/utils";

type IncidentWithBullets = Incident & {
  assessment?: string[];
  advisory?: string[];
};

export default function IncidentCard({ incident, compact = false }: { incident: IncidentWithBullets; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const assessment: string[] = (incident as any).assessment || [];
  const advisory: string[] = (incident as any).advisory || [];
  const hasContent = assessment.length > 0 || advisory.length > 0;

  return (
    <div className={cn(
      "group bg-card rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden relative",
      incident.riskLevel === 'Critical' && "border-destructive/30 hover:border-destructive shadow-[0_0_15px_rgba(220,38,38,0.05)]",
      compact ? "p-4" : "p-5"
    )}>
      <div className="flex justify-between items-start mb-3 gap-4">
        <div className="flex flex-wrap gap-2">
          <RiskBadge level={incident.riskLevel} />
          <CategoryBadge category={incident.category} />
        </div>
        <div className="flex items-center text-muted-foreground text-xs font-mono shrink-0">
          <Clock className="w-3 h-3 mr-1" />
          {formatDistanceToNow(new Date(incident.publishedAt), { addSuffix: true })}
        </div>
      </div>
      
      <Link href={`/incidents/${incident.id}`}>
        <h3 className={cn(
          "font-display font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-2",
          compact ? "text-base mb-2" : "text-lg mb-3"
        )}>
          {incident.title}
        </h3>
      </Link>
      
      {!compact && (
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {incident.summary}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center text-xs text-muted-foreground font-medium">
          <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" />
          {[incident.city, incident.region, incident.country].filter(Boolean).join(", ")}
        </div>
        
        <a 
          href={incident.sourceUrl} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {incident.sourceName}
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      {!compact && hasContent && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary/80 hover:text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Hide Assessment & Advisory" : "View Assessment & Advisory"}
          </button>

          {expanded && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {assessment.length > 0 && (
                <div className="rounded-lg bg-secondary/40 border border-white/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Assessment
                  </div>
                  <ul className="space-y-1">
                    {assessment.map((point, i) => (
                      <li key={i} className="flex gap-2 text-muted-foreground leading-snug">
                        <span className="text-amber-400 shrink-0">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {advisory.length > 0 && (
                <div className="rounded-lg bg-secondary/40 border border-white/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Advisory
                  </div>
                  <ul className="space-y-1">
                    {advisory.map((point, i) => (
                      <li key={i} className="flex gap-2 text-muted-foreground leading-snug">
                        <span className="text-blue-400 shrink-0">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
