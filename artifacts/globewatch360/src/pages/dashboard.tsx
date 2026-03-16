import { 
  useGetDashboardStats, 
  useGetCountryStats, 
  useGetTrendingRegions 
} from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { AlertTriangle, Globe2, Activity, ShieldAlert, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IncidentCard from "@/components/incident-card";
import WorldMap from "@/components/world-map";
import AdSlot from "@/components/ad-slot";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/badges";
import { CATEGORY_COLORS } from "@/lib/constants";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: countries, isLoading: countriesLoading } = useGetCountryStats();
  const { data: trends, isLoading: trendsLoading } = useGetTrendingRegions();

  const riskData = stats ? Object.entries(stats.riskBreakdown).map(([name, value]) => ({ name, value })) : [];
  const categoryData = stats ? Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];
  
  // Basic colors for charts
  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Global Intelligence</h1>
            <p className="text-muted-foreground mt-1">Real-time threat monitoring and assessment dashboard</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Status: Operational
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Incidents (24h)" 
            value={stats?.last24hIncidents} 
            icon={Activity} 
            trend="+12%" 
            loading={statsLoading} 
          />
          <StatCard 
            title="Critical Alerts" 
            value={stats?.criticalIncidents} 
            icon={AlertTriangle} 
            alert 
            loading={statsLoading} 
          />
          <StatCard 
            title="Ongoing Events" 
            value={stats?.ongoingIncidents} 
            icon={ShieldAlert} 
            loading={statsLoading} 
          />
          <StatCard 
            title="Countries Affected" 
            value={stats?.countriesAffected} 
            icon={Globe2} 
            loading={statsLoading} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass-panel border-white/5">
              <CardHeader>
                <CardTitle className="font-display">Global Threat Map</CardTitle>
              </CardHeader>
              <CardContent>
                {countriesLoading ? (
                  <Skeleton className="w-full aspect-[2/1] rounded-xl bg-secondary/50" />
                ) : (
                  <WorldMap data={countries?.countries} />
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  {statsLoading ? <Skeleton className="w-full h-full bg-secondary/50" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskData} margin={{ left: -20, bottom: -10 }}>
                        <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  {statsLoading ? <Skeleton className="w-full h-full bg-secondary/50" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold">Critical Alerts</h2>
                <a href="/incidents?riskLevel=Critical" className="text-sm text-primary hover:underline font-medium">View All</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statsLoading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl bg-secondary/50" />)
                ) : stats?.criticalAlerts.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-muted-foreground bg-card rounded-xl border border-white/5">
                    No critical alerts at this time.
                  </div>
                ) : (
                  stats?.criticalAlerts.slice(0, 4).map(incident => (
                    <IncidentCard key={incident.id} incident={incident} compact />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card className="glass-panel overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-secondary/20 pb-4">
                <CardTitle className="text-lg font-display flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Trending Regions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {trendsLoading ? (
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-secondary/50" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {trends?.regions.slice(0, 5).map(region => (
                      <div key={region.name} className="p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-foreground">{region.name}</div>
                          <div className="text-xs text-muted-foreground">{region.country}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <RiskBadge level={region.riskLevel} className="scale-90 origin-right" />
                          <span className="text-xs font-mono text-muted-foreground">{region.incidentCount} events</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <AdSlot format="rectangle" />

            <div className="bg-card rounded-xl border border-white/5 p-4">
              <h3 className="font-display font-semibold mb-4">Recent Intel</h3>
              <div className="space-y-4">
                {statsLoading ? (
                  <Skeleton className="h-32 w-full bg-secondary/50" />
                ) : (
                  stats?.recentIncidents.slice(0, 3).map(incident => (
                    <div key={incident.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="text-xs text-primary mb-1 font-mono">{new Date(incident.publishedAt).toLocaleTimeString()}</div>
                      <a href={`/incidents/${incident.id}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-2">
                        {incident.title}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, alert, trend, loading }: any) {
  return (
    <Card className={`glass-panel overflow-hidden relative ${alert ? 'border-destructive/50' : ''}`}>
      {alert && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive to-destructive/50" />}
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-secondary/50" />
            ) : (
              <h3 className={`text-3xl font-display font-bold ${alert ? 'text-destructive' : 'text-foreground'}`}>
                {value?.toLocaleString() || 0}
              </h3>
            )}
            {trend && (
              <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> {trend} vs last week
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${alert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
