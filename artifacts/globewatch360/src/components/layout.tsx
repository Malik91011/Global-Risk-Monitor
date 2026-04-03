import { Link, useLocation } from "wouter";
import { 
  Globe2, LayoutDashboard, AlertTriangle, ShieldAlert, 
  FileText, Activity, Search, Bell, Settings, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import AdSlot from "./ad-slot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetProfile, useUpdateProfile, useLogout, getGetProfileQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/incidents", label: "Incident Feed", icon: AlertTriangle },
  { href: "/threats", label: "Threat Assessments", icon: ShieldAlert },
  { href: "/reports", label: "Intelligence Reports", icon: FileText },
  { href: "/scraper", label: "Data Sources", icon: Activity },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profile } = useGetProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: logout } = useLogout();

  const alertsEnabled = profile?.alertsEnabled ?? true;
  const syncInterval = profile?.syncInterval ?? "30000";

  const { data: stats } = useGetDashboardStats({ 
    query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: Number(syncInterval) } 
  });

  const prevAlerts = useRef<number[]>([]);

  useEffect(() => {
    if (alertsEnabled && stats?.criticalAlerts) {
      const currentIds = stats.criticalAlerts.map((a: any) => a.id);
      
      if (prevAlerts.current.length > 0) {
        const newAlerts = stats.criticalAlerts.filter((a: any) => !prevAlerts.current.includes(a.id));
        newAlerts.forEach((alert: any) => {
          toast({
            title: "CRITICAL ALERT DETECTED",
            description: `${alert.title} - ${alert.country}`,
            variant: "destructive",
          });
        });
      }
      prevAlerts.current = currentIds;
    }
  }, [stats?.criticalAlerts, alertsEnabled, toast]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: "", email: "", role: "" });

  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || "system");
      setProfileData({
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role
      });
    }
  }, [profile, setTheme]);

  const handleUpdateSettings = (updates: Partial<typeof profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    // Optimistic cache update
    queryClient.setQueryData(getGetProfileQueryKey(), newProfile);
    updateProfile({ data: newProfile }, {
      onSuccess: () => {
        toast({ title: "Settings updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to update settings", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      }
    });
  };

  const handleSaveProfile = () => {
    handleUpdateSettings(profileData);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        toast({ title: "Logged out successfully" });
        queryClient.clear();
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-sidebar flex flex-col z-20 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Globe2 className="w-6 h-6 text-primary mr-3" />
          <span className="font-display font-bold text-lg tracking-wide text-foreground">
            GlobeWatch<span className="text-primary">360</span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Intelligence View
          </div>
          {NAV_ITEMS.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                  <Icon className={cn(
                    "w-5 h-5 mr-3 transition-colors", 
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  )}
               </Link>
            );
          })}
          
          <div className="pt-8">
             <AdSlot />
          </div>
        </nav>
        
        <div className="p-4 border-t border-border shrink-0">
          <div 
             className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary cursor-pointer transition-colors outline-none"
             onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-5 h-5 mr-3" />
            System Preferences
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative intel-gradient">
        <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search global incidents..." 
                className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    window.location.href = `/incidents?q=${encodeURIComponent(e.currentTarget.value)}`;
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer">
                  <Bell className="w-5 h-5" />
                  {alertsEnabled && stats?.criticalAlerts?.length ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
                  ) : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Recent Critical Alerts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stats?.criticalAlerts?.length ? (
                  stats.criticalAlerts.slice(0, 5).map(alert => (
                    <Link key={alert.id} href={`/incidents/${alert.id}`}>
                      <DropdownMenuItem className="cursor-pointer">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium line-clamp-1">{alert.title}</span>
                          <span className="text-xs text-muted-foreground">{alert.country}</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No critical alerts right now</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm cursor-pointer outline-none">
                  {profile?.fullName ? profile.fullName.substring(0,2).toUpperCase() : "OP"}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setProfileOpen(true)}>Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>System Preferences</DialogTitle>
            <DialogDescription>
              Manage your GlobalRiskMonitor dashboard settings. Changes are saved automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium text-sm text-foreground">Theme</div>
                <div className="text-xs text-muted-foreground">Appearance of the interface.</div>
              </div>
              <Select value={profile?.theme ?? "system"} onValueChange={(v) => { setTheme(v); handleUpdateSettings({ theme: v }); }}>
                <SelectTrigger className="w-32 bg-secondary/50">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium text-sm text-foreground">Real-time alerts</div>
                <div className="text-xs text-muted-foreground">Receive notifications for critical events.</div>
              </div>
              <Switch checked={alertsEnabled} onCheckedChange={(v) => handleUpdateSettings({ alertsEnabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium text-sm text-foreground">Intelligence Sync</div>
                <div className="text-xs text-muted-foreground">Backend polling frequency.</div>
              </div>
              <Select value={syncInterval} onValueChange={(v) => handleUpdateSettings({ syncInterval: v })}>
                <SelectTrigger className="w-32 bg-secondary/50">
                  <SelectValue placeholder="Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000">10 Seconds</SelectItem>
                  <SelectItem value="30000">30 Seconds</SelectItem>
                  <SelectItem value="60000">1 Minute</SelectItem>
                  <SelectItem value="300000">5 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your account details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={profileData.fullName} 
                onChange={(e) => setProfileData(p => ({ ...p, fullName: e.target.value }))} 
                className="bg-secondary/50 border-white/5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                type="email"
                value={profileData.email} 
                onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))} 
                className="bg-secondary/50 border-white/5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input 
                value={profileData.role} 
                onChange={(e) => setProfileData(p => ({ ...p, role: e.target.value }))} 
                className="bg-secondary/50 border-white/5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={isUpdating}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
