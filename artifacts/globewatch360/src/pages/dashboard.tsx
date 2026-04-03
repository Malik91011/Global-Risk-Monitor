import {
  useGetDashboardStats,
  useGetCountryStats,
  useGetTrendingRegions,
  getGetDashboardStatsQueryKey,
  getGetCountryStatsQueryKey,
  getGetTrendingRegionsQueryKey
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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 30000 } });
  const { data: countries, isLoading: countriesLoading, isError: countriesError } = useGetCountryStats({ query: { queryKey: getGetCountryStatsQueryKey(), refetchInterval: 30000 } });
  const { data: trends, isLoading: trendsLoading } = useGetTrendingRegions({ query: { queryKey: getGetTrendingRegionsQueryKey(), refetchInterval: 30000 } });

  const riskData = stats?.riskBreakdown ? Object.entries(stats.riskBreakdown).map(([name, value]) => ({ name, value })) : [];
  const categoryData = stats?.categoryBreakdown ? Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];

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

        {statsError && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">Failed to connect to the intelligence server. Retrying...</p>
          </div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Incidents (24h)" value={stats?.last24hIncidents} icon={Activity} trend="+12%" loading={statsLoading} />
          <StatCard title="Critical Alerts" value={stats?.criticalIncidents} icon={AlertTriangle} alert loading={statsLoading} />
          <StatCard title="Ongoing Events" value={stats?.ongoingIncidents} icon={ShieldAlert} loading={statsLoading} />
          <StatCard title="Countries Affected" value={stats?.countriesAffected} icon={Globe2} loading={statsLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass-panel border-white/5">
              <CardHeader>
                <CardTitle className="font-display">Global Threat Map</CardTitle>
              </CardHeader>
              <CardContent>
                {countriesError ? (
                  <div className="w-full aspect-[2/1] rounded-xl bg-secondary/20 flex items-center justify-center border border-dashed border-white/10">
                    <p className="text-muted-foreground text-sm flex items-center gap-2"><Globe2 className="w-4 h-4" /> Map data unavailable</p>
                  </div>
                ) : countriesLoading ? (
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
                      <BarChart data={riskData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#f59e0b" />
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
                        <Pie data={categoryData} dataKey="value">
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Trending Regions</CardTitle>
              </CardHeader>
              <CardContent>
                {trends?.regions?.map(region => (
                  <div key={region.name}>{region.name}</div>
                ))}
              </CardContent>
            </Card>

            <AdSlot format="rectangle" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface StatCardProps {
  title: string;
  value?: number | string;
  icon: React.ElementType;
  alert?: boolean;
  trend?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, alert, trend, loading }: StatCardProps) {
  return (
    <Card className={alert ? "border-destructive/50" : ""}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <h3 className={`text-2xl font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value || 0}</h3>}
            {trend && <p className="text-xs text-emerald-400 font-medium">{trend}</p>}
          </div>
          <Icon className={`w-5 h-5 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}