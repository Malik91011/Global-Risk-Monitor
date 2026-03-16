import { Incident } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { RiskBadge, CategoryBadge } from "./badges";
import { cn } from "@/lib/utils";

export default function IncidentCard({ incident, compact = false }: { incident: Incident; compact?: boolean }) {
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
    </div>
  );
}
