import { useState } from "react";
import { useListReports, useGenerateReport, useExportReport, ExportReportFormat } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, Plus, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { data, isLoading, refetch } = useListReports({ limit: 50 });
  const { mutate: generate, isPending } = useGenerateReport();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    generate({ data: { title, country: country || undefined } }, {
      onSuccess: () => {
        toast({ title: "Report Generated successfully" });
        setOpen(false);
        setTitle("");
        setCountry("");
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to generate report", variant: "destructive" });
      }
    });
  };

  const handleExport = async (id: number) => {
    // In a real app, we'd trigger a download via API. Here we just mock the toast.
    toast({ title: "Export Started", description: "Your PDF is being generated..." });
  };

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
                    placeholder="e.g. France" 
                    className="bg-secondary/50 border-white/10"
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  {isPending ? "Compiling Data..." : "Generate Report"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
             <div className="h-40 rounded-xl bg-card border border-white/5 animate-pulse" />
          ) : data?.reports.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-white/5">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No reports generated yet</h3>
              <p className="text-muted-foreground mt-1">Click the button above to generate your first intelligence report.</p>
            </div>
          ) : (
            data?.reports.map(report => (
              <Card key={report.id} className="glass-panel hover:bg-secondary/10 transition-colors">
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-display font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.executiveSummary}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span className="text-primary">{report.incidentCount} Incidents Analyzed</span>
                      {report.country && (
                        <>
                          <span>•</span>
                          <span>Target: {report.country}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3 w-full md:w-auto">
                    <Button variant="outline" className="w-full md:w-auto border-white/10 hover:bg-secondary">
                      View
                    </Button>
                    <Button onClick={() => handleExport(report.id)} className="w-full md:w-auto bg-white text-black hover:bg-gray-200">
                      <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
