import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  FileText,
  Building2,
  Database,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Table2,
  Briefcase,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface DatabaseItem {
  label: string;
  href: string;
  count?: number;
}

const navItems: NavItem[] = [
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Direct Interview", href: "/direct-interview", icon: UserPlus },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: ClipboardList },
  { label: "Processing", href: "/resume-processing", icon: FileText },
  { label: "Clients", href: "/clients", icon: Handshake },
  { label: "Activity Logs", href: "/activity-logs", icon: Activity },
];

const databaseItems: DatabaseItem[] = [
  { label: "Candidates", href: "/database/candidates" },
  { label: "Applications", href: "/database/applications" },
  { label: "Clients", href: "/database/clients" },
  { label: "Jobs", href: "/database/jobs" },
  { label: "Interviews", href: "/database/interviews" },
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-border bg-background",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="h-14 border-b border-border px-4 flex items-center">
        <NavLink
          to="/"
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold">
              TalentFlow
            </span>
          )}
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive
                  ? "border border-border bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-foreground" : ""
                )}
              />
              {!isCollapsed && (
                <span>{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Master Database Section */}
        {!isCollapsed ? (
          <Collapsible
            open={isDatabaseOpen}
            onOpenChange={setIsDatabaseOpen}
            className="mt-4"
          >
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                <Database className="w-5 h-5 shrink-0" />
                <span>Master Database (PostgreSQL)</span>
                <ChevronRight
                  className={cn(
                    "ml-auto h-4 w-4",
                    isDatabaseOpen && "rotate-90"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              {databaseItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      isActive
                        ? "border border-border bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Table2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive && "text-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {item.count.toLocaleString()}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <NavLink
            to="/database"
            className={cn(
              "flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium",
              location.pathname.startsWith("/database")
                ? "border border-border bg-muted text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Database className="w-5 h-5" />
          </NavLink>
        )}
      </nav>

      <div className="space-y-2 border-t border-border p-2">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            location.pathname === "/settings"
              ? "border border-border bg-muted text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings
            className={cn(
              "h-5 w-5 shrink-0",
              location.pathname === "/settings" && "text-foreground"
            )}
          />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-2 w-full justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
