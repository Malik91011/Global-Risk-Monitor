import { useGetScraperStatus, useTriggerScrape } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Database, RefreshCw, Power, Server, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Scraper() {
  const { data: status, isLoading, refetch } = useGetScraperStatus();
  const { mutate: trigger, isPending } = useTriggerScrape();
  const { toast } = useToast();

  const handleTrigger = () => {
    trigger(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Scrape Triggered",
          description: `Found ${res.incidentsFound} incidents, added ${res.incidentsAdded}.`
        });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to trigger scrape", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Data Sources & Engine</h1>
          <p className="text-muted-foreground mt-1">Manage global RSS scraping and aggregation pipeline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-panel border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="font-display flex items-center">
                <Server className="w-5 h-5 mr-2 text-primary" />
                Engine Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-secondary/50 rounded" />
                  <div className="h-10 bg-secondary/50 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-white/5">
                    <div className="flex items-center">
                      <Power className={`w-5 h-5 mr-3 ${status?.isRunning ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Daemon State</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status?.isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                      {status?.isRunning ? 'Running' : 'Idle'}
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2"/> Last Run</span>
                      <span className="font-mono">{status?.lastRun ? format(new Date(status.lastRun), 'PPp') : 'Never'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Next Scheduled</span>
                      <span className="font-mono">{status?.nextRun ? format(new Date(status.nextRun), 'PPp') : 'Unknown'}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-display flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary" />
                Data Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 text-center">
                  <div className="text-3xl font-display font-bold text-foreground mb-1">
                    {status?.totalIncidentsScraped?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Indexed</div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 text-center">
                  <div className="text-3xl font-display font-bold text-primary mb-1">
                    {status?.sourcesConfigured || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Sources</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                  onClick={handleTrigger}
                  disabled={isPending || status?.isRunning}
                >
                  <Activity className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                  {isPending ? 'Aggregating...' : 'Force Manual Scrape Now'}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  This will trigger an immediate pull from all configured global sources.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
