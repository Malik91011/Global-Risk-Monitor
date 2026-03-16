import { useListThreatAssessments } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RiskBadge } from "@/components/badges";
import { ShieldAlert, MapPin, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Threats() {
  const { data, isLoading } = useListThreatAssessments({ limit: 20 });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Threat Assessments</h1>
            <p className="text-muted-foreground mt-1">AI-generated strategic risk analyses</p>
          </div>
          <Button className="bg-primary text-primary-foreground">
            <ShieldAlert className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-64 rounded-xl bg-card border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.assessments.map(assessment => (
              <Card key={assessment.id} className="glass-panel overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
                <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <RiskBadge level={assessment.overallRisk} />
                    <span className="text-xs text-muted-foreground font-mono">
                      {format(new Date(assessment.assessedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-display flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {assessment.country} {assessment.region ? `- ${assessment.region}` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex-1">
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4 line-clamp-3">
                    {assessment.summary}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center mb-2">
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-destructive" />
                        Key Threats
                      </h4>
                      <ul className="text-sm space-y-1">
                        {assessment.keyThreats.slice(0,2).map((t, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-destructive mr-2">•</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/10 border-t border-border/50 p-4 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" />
                    {assessment.safetyRecommendations.length} Recommendations
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                    View Full Report
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
