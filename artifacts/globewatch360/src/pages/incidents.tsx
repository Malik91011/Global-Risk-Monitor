import { useState } from "react";
import { useListIncidents, IncidentCategory, RiskLevel } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import IncidentCard from "@/components/incident-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdSlot from "@/components/ad-slot";

export default function Incidents() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<IncidentCategory | "ALL">("ALL");
  const [risk, setRisk] = useState<RiskLevel | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isFetching } = useListIncidents({
    search: search || undefined,
    category: category !== "ALL" ? category : undefined,
    riskLevel: risk !== "ALL" ? risk : undefined,
    limit,
    offset: page * limit
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // reset page on new search
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Incident Feed</h1>
            <p className="text-muted-foreground mt-1">Real-time stream of global events and threats</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border border-white/5 rounded-xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, location, or entities..." 
              className="pl-10 bg-secondary/30 border-white/10"
            />
          </form>
          
          <div className="flex w-full md:w-auto gap-4">
            <Select value={risk} onValueChange={(v: any) => setRisk(v)}>
              <SelectTrigger className="w-[160px] bg-secondary/30 border-white/10">
                <SelectValue placeholder="All Risks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Risk Levels</SelectItem>
                {Object.values(RiskLevel).map(r => (
                  <SelectItem key={r} value={r}>{r.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger className="w-[180px] bg-secondary/30 border-white/10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.values(IncidentCategory).map(c => (
                  <SelectItem key={c} value={c}>{c.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-white/10 hover:bg-secondary">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              More
            </Button>
          </div>
        </div>

        {/* Main Feed + Ad Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4 relative min-h-[500px]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : data?.incidents.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-white/5">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No incidents found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your search filters.</p>
                <Button variant="outline" className="mt-4" onClick={() => {setSearch(""); setRisk("ALL"); setCategory("ALL");}}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>Showing {data?.incidents.length} of {data?.total} incidents</span>
                  {isFetching && <span className="flex items-center"><Loader2 className="w-3 h-3 mr-2 animate-spin"/> Updating...</span>}
                </div>
                
                {data?.incidents.map((incident, idx) => (
                  <div key={incident.id}>
                    <IncidentCard incident={incident} />
                    {/* Inject an ad every 10 items */}
                    {idx === 9 && (
                      <div className="my-6">
                        <AdSlot format="horizontal" />
                      </div>
                    )}
                  </div>
                ))}
                
                {data && data.total > limit && (
                  <div className="flex justify-center gap-2 pt-8">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * limit >= data.total}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="hidden lg:block space-y-6">
            <AdSlot format="vertical" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
