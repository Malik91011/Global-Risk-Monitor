import { useState } from "react";
import { useListIncidents, useGetCountryStats, IncidentCategory, RiskLevel } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import IncidentCard from "@/components/incident-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Globe, Map, Building2, Calendar, LayoutList, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdSlot from "@/components/ad-slot";
import { format } from "date-fns";

type TabType = "all" | "countries" | "regions" | "cities" | "timeline";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Incidents", icon: <LayoutList className="w-4 h-4" /> },
  { id: "countries", label: "Countries", icon: <Globe className="w-4 h-4" /> },
  { id: "regions", label: "Regions", icon: <Map className="w-4 h-4" /> },
  { id: "cities", label: "Cities", icon: <Building2 className="w-4 h-4" /> },
  { id: "timeline", label: "Timeline", icon: <Calendar className="w-4 h-4" /> },
];

const CATEGORIES = Object.values(IncidentCategory);
const RISK_LEVELS = Object.values(RiskLevel);

const RISK_COLORS: Record<string, string> = {
  Critical: "text-red-400",
  High: "text-orange-400",
  HighImpact: "text-orange-500",
  Ongoing: "text-purple-400",
  Moderate: "text-yellow-400",
  Low: "text-green-400",
};

export default function Incidents() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<IncidentCategory | "ALL">("ALL");
  const [risk, setRisk] = useState<RiskLevel | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const limit = 20;

  const { data, isLoading, isFetching } = useListIncidents({
    search: search || undefined,
    country: country || undefined,
    region: region || undefined,
    city: city || undefined,
    category: category !== "ALL" ? category : undefined,
    riskLevel: risk !== "ALL" ? risk : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit,
    offset: page * limit,
  });

  const { data: countryData } = useGetCountryStats();

  const clearAll = () => {
    setSearch(""); setCountry(""); setRegion(""); setCity("");
    setCategory("ALL"); setRisk("ALL"); setDateFrom(""); setDateTo("");
    setPage(0);
  };

  const hasActiveFilters = search || country || region || city || category !== "ALL" || risk !== "ALL" || dateFrom || dateTo;

  const groupByCountry = () => {
    if (!data?.incidents) return {};
    return data.incidents.reduce((acc: Record<string, typeof data.incidents>, inc) => {
      acc[inc.country] = acc[inc.country] || [];
      acc[inc.country].push(inc);
      return acc;
    }, {});
  };

  const groupByRegion = () => {
    if (!data?.incidents) return {};
    return data.incidents.reduce((acc: Record<string, typeof data.incidents>, inc) => {
      const key = inc.region || "(No Region)";
      acc[key] = acc[key] || [];
      acc[key].push(inc);
      return acc;
    }, {});
  };

  const groupByCity = () => {
    if (!data?.incidents) return {};
    return data.incidents.reduce((acc: Record<string, typeof data.incidents>, inc) => {
      const key = inc.city || "(No City)";
      acc[key] = acc[key] || [];
      acc[key].push(inc);
      return acc;
    }, {});
  };

  const groupByDate = () => {
    if (!data?.incidents) return {};
    return data.incidents.reduce((acc: Record<string, typeof data.incidents>, inc) => {
      const key = format(new Date(inc.publishedAt), "MMMM d, yyyy");
      acc[key] = acc[key] || [];
      acc[key].push(inc);
      return acc;
    }, {});
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Incident Feed</h1>
          <p className="text-muted-foreground mt-1">Real-time stream of global events and threats</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-card border border-white/5 rounded-xl p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Filter Bar */}
        <div className="bg-card border border-white/5 rounded-xl p-4 shadow space-y-3">
          {/* Row 1: Search + Risk + Category */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by keywords, location, or incident type..."
                className="pl-10 bg-secondary/30 border-white/10"
              />
            </div>
            <Select value={risk} onValueChange={(v: any) => { setRisk(v); setPage(0); }}>
              <SelectTrigger className="w-full md:w-[170px] bg-secondary/30 border-white/10">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Risk Levels</SelectItem>
                {RISK_LEVELS.map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className={RISK_COLORS[r]}>{r.replace(/([A-Z])/g, " $1").trim()}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v: any) => { setCategory(v); setPage(0); }}>
              <SelectTrigger className="w-full md:w-[180px] bg-secondary/30 border-white/10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c.replace(/([A-Z])/g, " $1").trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className={`border-white/10 whitespace-nowrap ${showAdvanced ? "bg-primary/20 border-primary/40 text-primary" : "hover:bg-secondary"}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvanced ? "Hide Filters" : "More Filters"}
            </Button>
          </div>

          {/* Row 2: Advanced Filters (Country, Region, City, Dates) */}
          {showAdvanced && (
            <div className="border-t border-white/5 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Country */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Country
                </label>
                <Select
                  value={country || "ALL"}
                  onValueChange={(v) => { setCountry(v === "ALL" ? "" : v); setPage(0); }}
                >
                  <SelectTrigger className="bg-secondary/30 border-white/10 text-sm">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="ALL">All Countries</SelectItem>
                    {countryData?.countries
                      .sort((a, b) => a.country.localeCompare(b.country))
                      .map((c) => (
                        <SelectItem key={c.country} value={c.country}>
                          {c.country} ({c.count})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Map className="w-3 h-3" /> Region / Province
                </label>
                <Input
                  value={region}
                  onChange={(e) => { setRegion(e.target.value); setPage(0); }}
                  placeholder="e.g. Middle East, Sahel..."
                  className="bg-secondary/30 border-white/10 text-sm"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> City
                </label>
                <Input
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(0); }}
                  placeholder="e.g. Kabul, Lagos..."
                  className="bg-secondary/30 border-white/10 text-sm"
                />
              </div>

              {/* Date From */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                  className="bg-secondary/30 border-white/10 text-sm"
                />
              </div>

              {/* Date To */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                  className="bg-secondary/30 border-white/10 text-sm"
                />
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
              {search && <Chip label={`Search: "${search}"`} onRemove={() => setSearch("")} />}
              {country && <Chip label={`Country: ${country}`} onRemove={() => setCountry("")} />}
              {region && <Chip label={`Region: ${region}`} onRemove={() => setRegion("")} />}
              {city && <Chip label={`City: ${city}`} onRemove={() => setCity("")} />}
              {risk !== "ALL" && <Chip label={`Risk: ${risk}`} onRemove={() => setRisk("ALL")} />}
              {category !== "ALL" && <Chip label={`Category: ${category}`} onRemove={() => setCategory("ALL")} />}
              {dateFrom && <Chip label={`From: ${dateFrom}`} onRemove={() => setDateFrom("")} />}
              {dateTo && <Chip label={`To: ${dateTo}`} onRemove={() => setDateTo("")} />}
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive underline ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4 relative min-h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading incidents...</p>
                </div>
              </div>
            ) : data?.incidents.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-white/5">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium text-foreground">No incidents found</h3>
                <p className="text-muted-foreground mt-1 text-sm">Try adjusting your filters or search terms.</p>
                <Button variant="outline" className="mt-4" onClick={clearAll}>Clear All Filters</Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Showing {data?.incidents.length} of {data?.total} incidents</span>
                  {isFetching && <span className="text-primary animate-pulse text-xs">Updating...</span>}
                </div>

                {/* Tab-specific views */}
                {activeTab === "all" && (
                  <div className="space-y-3">
                    {data?.incidents.map((incident, idx) => (
                      <div key={incident.id}>
                        <IncidentCard incident={incident} />
                        {idx === 9 && <div className="my-4"><AdSlot format="horizontal" /></div>}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "countries" && (
                  <div className="space-y-6">
                    {Object.entries(groupByCountry())
                      .sort(([, a], [, b]) => b.length - a.length)
                      .map(([c, incidents]) => (
                        <div key={c}>
                          <div
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => { setCountry(c); setActiveTab("all"); }}
                          >
                            <Globe className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-foreground">{c}</h3>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{incidents.length} incident{incidents.length !== 1 ? "s" : ""}</span>
                            <span className="text-xs text-muted-foreground ml-auto hover:text-primary">Filter by this country →</span>
                          </div>
                          <div className="space-y-2 pl-6 border-l border-white/10">
                            {incidents.slice(0, 3).map((inc) => <IncidentCard key={inc.id} incident={inc} compact />)}
                            {incidents.length > 3 && (
                              <button
                                className="text-xs text-primary hover:underline pl-2"
                                onClick={() => { setCountry(c); setActiveTab("all"); }}
                              >
                                +{incidents.length - 3} more in {c}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {activeTab === "regions" && (
                  <div className="space-y-6">
                    {Object.entries(groupByRegion())
                      .sort(([, a], [, b]) => b.length - a.length)
                      .map(([r, incidents]) => (
                        <div key={r}>
                          <div
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => { if (r !== "(No Region)") { setRegion(r); setActiveTab("all"); } }}
                          >
                            <Map className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-foreground">{r}</h3>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{incidents.length} incident{incidents.length !== 1 ? "s" : ""}</span>
                            {r !== "(No Region)" && <span className="text-xs text-muted-foreground ml-auto hover:text-primary">Filter →</span>}
                          </div>
                          <div className="space-y-2 pl-6 border-l border-white/10">
                            {incidents.slice(0, 3).map((inc) => <IncidentCard key={inc.id} incident={inc} compact />)}
                            {incidents.length > 3 && (
                              <button
                                className="text-xs text-primary hover:underline pl-2"
                                onClick={() => { if (r !== "(No Region)") { setRegion(r); setActiveTab("all"); } }}
                              >
                                +{incidents.length - 3} more
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {activeTab === "cities" && (
                  <div className="space-y-6">
                    {Object.entries(groupByCity())
                      .sort(([, a], [, b]) => b.length - a.length)
                      .map(([c, incidents]) => (
                        <div key={c}>
                          <div
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => { if (c !== "(No City)") { setCity(c); setActiveTab("all"); } }}
                          >
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-foreground">{c}</h3>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{incidents.length}</span>
                            {c !== "(No City)" && <span className="text-xs text-muted-foreground ml-auto hover:text-primary">Filter →</span>}
                          </div>
                          <div className="space-y-2 pl-6 border-l border-white/10">
                            {incidents.slice(0, 3).map((inc) => <IncidentCard key={inc.id} incident={inc} compact />)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="space-y-8">
                    {Object.entries(groupByDate())
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .map(([date, incidents]) => (
                        <div key={date}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                            <h3 className="font-semibold text-foreground">{date}</h3>
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-muted-foreground">{incidents.length} event{incidents.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                            {incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} compact />)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Pagination */}
                {data && data.total > limit && (
                  <div className="flex justify-center items-center gap-2 pt-8">
                    <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                      ← Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">Page {page + 1} of {Math.ceil(data.total / limit)}</span>
                    <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * limit >= data.total}>
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Ad */}
          <div className="hidden lg:block space-y-6">
            <AdSlot format="vertical" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/15 text-primary border border-primary/25 rounded-full px-3 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-destructive ml-1">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
