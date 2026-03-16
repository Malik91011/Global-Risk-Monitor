import { useState } from "react";
import { useListIncidents, IncidentCategory, RiskLevel } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import IncidentCard from "@/components/incident-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Globe, Map, Building2, Calendar, LayoutList, X, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdSlot from "@/components/ad-slot";
import { format } from "date-fns";

type TabType = "all" | "countries" | "regions" | "cities" | "timeline";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "all",       label: "All",      icon: <LayoutList className="w-4 h-4" /> },
  { id: "countries", label: "Countries", icon: <Globe className="w-4 h-4" /> },
  { id: "regions",   label: "Regions",  icon: <Map className="w-4 h-4" /> },
  { id: "cities",    label: "Cities",   icon: <Building2 className="w-4 h-4" /> },
  { id: "timeline",  label: "Timeline", icon: <Calendar className="w-4 h-4" /> },
];

const RISK_LEVELS = Object.values(RiskLevel);
const CATEGORIES  = Object.values(IncidentCategory);

const RISK_COLORS: Record<string, string> = {
  Critical:   "text-red-400",
  High:       "text-orange-400",
  HighImpact: "text-orange-500",
  Ongoing:    "text-purple-400",
  Moderate:   "text-yellow-400",
  Low:        "text-green-400",
};

export default function Incidents() {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  /* ── filters ── */
  const [search,   setSearch]   = useState("");
  const [country,  setCountry]  = useState("");
  const [region,   setRegion]   = useState("");
  const [city,     setCity]     = useState("");
  const [category, setCategory] = useState<IncidentCategory | "ALL">("ALL");
  const [risk,     setRisk]     = useState<RiskLevel | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(0);
  const limit = 20;

  const { data, isLoading, isFetching } = useListIncidents({
    search:    search    || undefined,
    country:   country   || undefined,
    region:    region    || undefined,
    city:      city      || undefined,
    category:  category  !== "ALL" ? category  : undefined,
    riskLevel: risk      !== "ALL" ? risk       : undefined,
    dateFrom:  dateFrom  || undefined,
    dateTo:    dateTo    || undefined,
    limit,
    offset: page * limit,
  });

  const clearAll = () => {
    setSearch(""); setCountry(""); setRegion(""); setCity("");
    setCategory("ALL"); setRisk("ALL"); setDateFrom(""); setDateTo("");
    setPage(0);
  };

  const activeCount = [search, country, region, city]
    .filter(Boolean).length
    + (category !== "ALL" ? 1 : 0)
    + (risk     !== "ALL" ? 1 : 0)
    + (dateFrom  ? 1 : 0)
    + (dateTo    ? 1 : 0);

  /* ── group helpers ── */
  const group = (key: (i: (typeof data)["incidents"][0]) => string) =>
    (data?.incidents ?? []).reduce((acc: Record<string, typeof data.incidents>, inc) => {
      const k = key(inc) || "(Unknown)";
      (acc[k] = acc[k] ?? []).push(inc);
      return acc;
    }, {});

  const byCountry  = group(i => i.country);
  const byRegion   = group(i => i.region  ?? "(No Region)");
  const byCity     = group(i => i.city    ?? "(No City)");
  const byDate     = group(i => {
    try { return format(new Date(i.publishedAt), "MMMM d, yyyy"); } catch { return "Unknown Date"; }
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-5 pb-12">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Incident Feed</h1>
          <p className="text-muted-foreground mt-1">Real-time stream of global events and threats</p>
        </div>

        {/* ── View Tabs ── */}
        <div className="flex gap-1 bg-card border border-white/5 rounded-xl p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ── ALWAYS-VISIBLE FILTER PANEL ── */}
        <div className="bg-card border border-white/5 rounded-xl p-5 shadow space-y-4">

          {/* Row 1 – Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by keyword, headline, or topic…"
              className="pl-10 bg-secondary/30 border-white/10"
            />
          </div>

          {/* Row 2 – Country · Region · City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3 text-primary" /> Country
              </label>
              <Input
                value={country}
                onChange={e => { setCountry(e.target.value); setPage(0); }}
                placeholder="e.g. Nigeria, Iran, Ukraine…"
                className="bg-secondary/30 border-white/10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Map className="w-3 h-3 text-primary" /> Region / Province
              </label>
              <Input
                value={region}
                onChange={e => { setRegion(e.target.value); setPage(0); }}
                placeholder="e.g. Middle East, Sahel…"
                className="bg-secondary/30 border-white/10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary" /> City
              </label>
              <Input
                value={city}
                onChange={e => { setCity(e.target.value); setPage(0); }}
                placeholder="e.g. Kabul, Lagos, Kyiv…"
                className="bg-secondary/30 border-white/10 text-sm"
              />
            </div>
          </div>

          {/* Row 3 – Date range · Risk · Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(0); }}
                className="bg-secondary/30 border-white/10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(0); }}
                className="bg-secondary/30 border-white/10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Risk Level</label>
              <Select value={risk} onValueChange={(v: any) => { setRisk(v); setPage(0); }}>
                <SelectTrigger className="bg-secondary/30 border-white/10 text-sm">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Risk Levels</SelectItem>
                  {RISK_LEVELS.map(r => (
                    <SelectItem key={r} value={r}>
                      <span className={RISK_COLORS[r]}>{r.replace(/([A-Z])/g, " $1").trim()}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Category</label>
              <Select value={category} onValueChange={(v: any) => { setCategory(v); setPage(0); }}>
                <SelectTrigger className="bg-secondary/30 border-white/10 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/([A-Z])/g, " $1").trim()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips + clear */}
          {activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
              <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
              {search   && <Chip label={`Keyword: "${search}"`}  onRemove={() => setSearch("")} />}
              {country  && <Chip label={`Country: ${country}`}   onRemove={() => setCountry("")} />}
              {region   && <Chip label={`Region: ${region}`}     onRemove={() => setRegion("")} />}
              {city     && <Chip label={`City: ${city}`}         onRemove={() => setCity("")} />}
              {risk     !== "ALL" && <Chip label={`Risk: ${risk}`}         onRemove={() => setRisk("ALL")} />}
              {category !== "ALL" && <Chip label={`Category: ${category}`} onRemove={() => setCategory("ALL")} />}
              {dateFrom && <Chip label={`From: ${dateFrom}`}     onRemove={() => setDateFrom("")} />}
              {dateTo   && <Chip label={`To: ${dateTo}`}         onRemove={() => setDateTo("")} />}
              <button onClick={clearAll} className="ml-2 text-xs text-red-400 hover:text-red-300 underline">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Results + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Feed */}
          <div className="lg:col-span-3 space-y-4 min-h-[500px]">

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Loading incidents…</p>
              </div>
            ) : !data?.incidents.length ? (
              <div className="text-center py-20 bg-card rounded-xl border border-white/5">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium text-foreground">No incidents found</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {activeCount > 0
                    ? "No results match your current filters. Try broadening your search."
                    : "No incidents in the database yet. The scraper runs every 30 minutes."}
                </p>
                {activeCount > 0 && (
                  <Button variant="outline" className="mt-4" onClick={clearAll}>Clear All Filters</Button>
                )}
              </div>
            ) : (
              <>
                {/* Result count */}
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    Showing <strong className="text-foreground">{data.incidents.length}</strong> of{" "}
                    <strong className="text-foreground">{data.total}</strong> incidents
                    {country && <span className="text-primary ml-1">in {country}</span>}
                    {dateFrom && dateTo && <span className="text-primary ml-1">({dateFrom} → {dateTo})</span>}
                  </span>
                  {isFetching && <span className="text-primary text-xs animate-pulse">Updating…</span>}
                </div>

                {/* ── TAB: All ── */}
                {activeTab === "all" && (
                  <div className="space-y-3">
                    {data.incidents.map((inc, idx) => (
                      <div key={inc.id}>
                        <IncidentCard incident={inc} />
                        {idx === 9 && <div className="my-4"><AdSlot format="horizontal" /></div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── TAB: Countries ── */}
                {activeTab === "countries" && (
                  <div className="space-y-8">
                    {Object.entries(byCountry)
                      .sort(([, a], [, b]) => b.length - a.length)
                      .map(([c, incs]) => (
                        <GroupSection
                          key={c} title={c} count={incs.length} icon={<Globe className="w-4 h-4 text-primary" />}
                          onFilter={() => { setCountry(c); setActiveTab("all"); }}
                          incidents={incs}
                        />
                      ))}
                  </div>
                )}

                {/* ── TAB: Regions ── */}
                {activeTab === "regions" && (
                  <div className="space-y-8">
                    {Object.entries(byRegion)
                      .sort(([, a], [, b]) => b.length - a.length)
                      .map(([r, incs]) => (
                        <GroupSection
                          key={r} title={r} count={incs.length} icon={<Map className="w-4 h-4 text-primary" />}
                          onFilter={r !== "(No Region)" ? () => { setRegion(r); setActiveTab("all"); } : undefined}
                          incidents={incs}
                        />
                      ))}
                  </div>
                )}

                {/* ── TAB: Cities ── */}
                {activeTab === "cities" && (
                  <div className="space-y-8">
                    {Object.entries(byCity)
                      .sort(([, a], [, b]) => b.length - a.length)
                      .map(([c, incs]) => (
                        <GroupSection
                          key={c} title={c} count={incs.length} icon={<Building2 className="w-4 h-4 text-primary" />}
                          onFilter={c !== "(No City)" ? () => { setCity(c); setActiveTab("all"); } : undefined}
                          incidents={incs}
                        />
                      ))}
                  </div>
                )}

                {/* ── TAB: Timeline ── */}
                {activeTab === "timeline" && (
                  <div className="space-y-10">
                    {Object.entries(byDate)
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .map(([date, incs]) => (
                        <div key={date}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                            <h3 className="font-semibold text-foreground">{date}</h3>
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-muted-foreground">{incs.length} event{incs.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                            {incs.map(inc => <IncidentCard key={inc.id} incident={inc} compact />)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Pagination */}
                {data.total > limit && (
                  <div className="flex justify-center items-center gap-3 pt-8">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      ← Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {Math.ceil(data.total / limit)}
                    </span>
                    <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= data.total}>
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <AdSlot format="vertical" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ── Shared group section ── */
function GroupSection({
  title, count, icon, onFilter, incidents,
}: {
  title: string; count: number; icon: React.ReactNode;
  onFilter?: () => void;
  incidents: any[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{count}</span>
        {onFilter && (
          <button onClick={onFilter} className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">
            Filter only this →
          </button>
        )}
      </div>
      <div className="space-y-2 pl-5 border-l-2 border-white/10">
        {incidents.slice(0, 4).map(inc => <IncidentCard key={inc.id} incident={inc} compact />)}
        {incidents.length > 4 && onFilter && (
          <button onClick={onFilter} className="text-xs text-primary hover:underline pl-1">
            +{incidents.length - 4} more…
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Filter chip ── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/15 text-primary border border-primary/25 rounded-full px-3 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-destructive">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
