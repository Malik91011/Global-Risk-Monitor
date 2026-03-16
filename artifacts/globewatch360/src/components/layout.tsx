import { Link, useLocation } from "wouter";
import { 
  Globe2, LayoutDashboard, AlertTriangle, ShieldAlert, 
  FileText, Activity, Search, Bell, Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import AdSlot from "./ad-slot";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/incidents", label: "Incident Feed", icon: AlertTriangle },
  { href: "/threats", label: "Threat Assessments", icon: ShieldAlert },
  { href: "/reports", label: "Intelligence Reports", icon: FileText },
  { href: "/scraper", label: "Data Sources", icon: Activity },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row dark">
      {/* Sidebar */}
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
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 mr-3 transition-colors", 
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  )}
                </div>
              </Link>
            );
          })}
          
          <div className="pt-8">
             <AdSlot />
          </div>
        </nav>
        
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary cursor-pointer transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            System Preferences
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative intel-gradient">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search global incidents..." 
                className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
              OP
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
