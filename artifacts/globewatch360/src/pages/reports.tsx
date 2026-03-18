import { useState } from "react";
import { useListReports, useGenerateReport } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Plus, Loader2, Calendar, X, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: number;
  title: string;
  executiveSummary: string;
  content: string;
  advisory: string | null;
  incidentCount: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  country: string | null;
  region: string | null;
  createdAt: string;
};

export default function Reports() {
  const { data, isLoading, refetch } = useListReports({ limit: 50 });
  const { mutate: generate, isPending } = useGenerateReport();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    generate({ data: { title, country: country || undefined } }, {
      onSuccess: () => {
        toast({ title: "Report generated successfully" });
        setOpen(false);
        setTitle("");
        setCountry("");
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Failed to generate report", description: String(err?.message || "Unknown error"), variant: "destructive" });
      }
    });
  };

  const handleDownload = (report: Report) => {
    const blob = new Blob([report.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GlobeWatch360_Report_${report.id}_${report.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloading report..." });
  };

  const riskColor = (count: number, color: string) =>
    count > 0 ? color : "text-muted-foreground";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Intelligence Reports</h1>
            <p className="text-muted-foreground mt-1">Client-ready briefings and situational overviews</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Generate New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-white/10 bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Create Intelligence Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGenerate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Report Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Q3 EMEA Security Overview"
                    required
                    className="bg-secondary/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Country (Optional)</Label>
                  <Input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="e.g. Pakistan, Nigeria, Iran"
                    className="bg-secondary/50 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to compile a global report across all incidents.</p>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  {isPending ? "Compiling Intelligence Data..." : "Generate Report"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="h-40 rounded-xl bg-card border border-white/5 animate-pulse" />
          ) : !data?.reports || data.reports.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-white/5">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No reports generated yet</h3>
              <p className="text-muted-foreground mt-1">Click "Generate New Report" above to compile your first intelligence briefing.</p>
            </div>
          ) : (
            (data.reports as Report[]).map(report => (
              <Card key={report.id} className="glass-panel hover:bg-secondary/10 transition-colors">
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-display font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.executiveSummary?.split("\n")[0]}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </span>
                      <span>•</span>
                      <span className="text-primary">{report.incidentCount} Incidents</span>
                      {report.criticalCount > 0 && (
                        <span className={`flex items-center gap-1 ${riskColor(report.criticalCount, "text-red-400")}`}>
                          <AlertTriangle className="w-3 h-3" /> {report.criticalCount} Critical
                        </span>
                      )}
                      {report.highCount > 0 && (
                        <span className={riskColor(report.highCount, "text-orange-400")}>{report.highCount} High</span>
                      )}
                      {report.country && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {report.country}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3 w-full md:w-auto">
                    <Button
                      variant="outline"
                      className="w-full md:w-auto border-white/10 hover:bg-secondary"
                      onClick={() => setViewReport(report)}
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => handleDownload(report)}
                      className="w-full md:w-auto bg-white text-black hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-card border border-white/10 rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-card border-b border-white/10 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-display font-bold text-foreground">{viewReport.title}</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownload(viewReport)}
                  className="bg-white text-black hover:bg-gray-200 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
                <button
                  onClick={() => setViewReport(null)}
                  className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5">
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                {viewReport.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
