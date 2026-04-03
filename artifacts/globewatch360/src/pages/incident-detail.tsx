import { useGetIncident, useAssessIncident } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Calendar, MapPin, ShieldAlert, Cpu, CheckCircle2, Globe2 } from "lucide-react";
import { RiskBadge, CategoryBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function IncidentDetail() {
  const [, params] = useRoute("/incidents/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();

  const { data: incident, isLoading, error } = useGetIncident(id);
  const { mutate: assess, isPending: isAssessing } = useAssessIncident();

  const handleAssess = () => {
    assess({ id }, {
      onSuccess: () => {
        toast({
          title: "Assessment Complete",
          description: "AI threat assessment has been generated successfully.",
        });
        // In a real app, this might navigate to the threat page or update local state
      },
      onError: (err) => {
        toast({
          title: "Assessment Failed",
          description: "Could not generate assessment at this time.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-24 bg-secondary/50 mb-8" />
          <Skeleton className="h-12 w-3/4 bg-secondary/50" />
          <Skeleton className="h-6 w-1/2 bg-secondary/50" />
          <div className="h-64 rounded-xl bg-secondary/20 mt-8" />
        </div>
      </Layout>
    );
  }

  if (error || !incident) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Incident Not Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">The requested incident could not be loaded or does not exist.</p>
          <Link href="/incidents">
            <Button>Return to Feed</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <Link href="/incidents">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-4 mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
          </Button>
        </Link>

        <header className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <RiskBadge level={incident.riskLevel} />
            <CategoryBadge category={incident.category} />
            {incident.isVerified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border bg-emerald-900/40 text-emerald-300 border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Source
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">
            {incident.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground py-2 border-y border-white/10">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {format(new Date(incident.publishedAt), 'PPP at p')}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {[incident.city, incident.region, incident.country].filter(Boolean).join(", ")}
            </div>
            <div className="flex items-center">
              <Globe2 className="w-4 h-4 mr-2 text-primary" />
              <a href={incident.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center">
                {incident.sourceName} <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </header>

        {incident.aiSummary && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Cpu className="w-24 h-24 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-primary flex items-center mb-3">
              <Cpu className="w-5 h-5 mr-2" />
              AI Intelligence Summary
            </h3>
            <p className="text-foreground/90 leading-relaxed relative z-10">
              {incident.aiSummary}
            </p>
          </div>
        )}

        <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed">
          {/* Fallback to summary if fullContent isn't available */}
          <p className="whitespace-pre-wrap text-lg">
            {incident.fullContent || incident.summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-6 border-t border-white/10">
          {incident.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground border border-white/5">
              #{tag}
            </span>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mt-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold mb-2">Deep Threat Analysis Required?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Generate a comprehensive AI threat assessment including operational guidance, safety recommendations, and affected areas.
          </p>
          <Button
            size="lg"
            className="font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAssess}
            disabled={isAssessing}
          >
            {isAssessing ? "Generating..." : "Generate Threat Assessment"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
