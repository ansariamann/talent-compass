import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Building2,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Table2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';

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
  { label: 'Candidates', href: '/candidates', icon: Users },
  { label: 'Applications', href: '/applications', icon: FileText },
  { label: 'Processing', href: '/resume-processing', icon: FileText }, // Using FileText for now, or maybe Mail/Inbox
  { label: 'Clients', href: '/clients', icon: Building2 },
];

const databaseItems: DatabaseItem[] = [
  { label: 'Candidates', href: '/database/candidates' },
  { label: 'Applications', href: '/database/applications' },
  { label: 'Clients', href: '/database/clients' },
  { label: 'Jobs', href: '/database/jobs' },
  { label: 'Interviews', href: '/database/interviews' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';
  return (
    <aside
      className={cn(
        "flex flex-col h-screen transition-all duration-300 relative",
        "bg-gradient-to-b from-background/80 via-background/60 to-background/80",
        "backdrop-blur-xl border-r border-white/10",
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary/5 before:via-transparent before:to-vibrant-purple/5 before:pointer-events-none",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/10 relative z-10">
        <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-vibrant-purple flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">TalentFlow</span>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                isActive
                  ? "bg-white/10 text-foreground shadow-lg shadow-primary/10 backdrop-blur-sm border border-white/20"
                  : "text-foreground/70 hover:text-foreground hover:bg-white/5 hover:backdrop-blur-sm"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-vibrant-purple/20 opacity-50" />
              )}
              <Icon className={cn(
                "w-5 h-5 shrink-0 relative z-10 transition-colors",
                isActive ? "text-primary" : "group-hover:text-primary/80"
              )} />
              {!isCollapsed && <span className="relative z-10">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full relative z-10 backdrop-blur-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Master Database Section */}
        {!isCollapsed ? (
          <Collapsible open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-foreground/70 hover:text-foreground hover:bg-white/5 hover:backdrop-blur-sm transition-all duration-200">
                <Database className="w-5 h-5 shrink-0" />
                <span>Master Database (PostgreSQL)</span>
                <ChevronRight className={cn(
                  "w-4 h-4 ml-auto transition-transform duration-200",
                  isDatabaseOpen && "rotate-90"
                )} />
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
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative group",
                      isActive
                        ? "bg-white/10 text-foreground backdrop-blur-sm border border-white/20"
                        : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-vibrant-purple/10 opacity-50" />
                    )}
                    <Table2 className={cn(
                      "w-4 h-4 shrink-0 relative z-10",
                      isActive && "text-primary"
                    )} />
                    <span className="relative z-10">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="ml-auto text-xs text-muted-foreground font-mono relative z-10">
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
              "flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname.startsWith('/database')
                ? "bg-white/10 text-foreground backdrop-blur-sm border border-white/20"
                : "text-foreground/70 hover:text-foreground hover:bg-white/5"
            )}
          >
            <Database className="w-5 h-5" />
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-white/10 space-y-2 relative z-10">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
            location.pathname === '/settings'
              ? "bg-white/10 text-foreground backdrop-blur-sm border border-white/20"
              : "text-foreground/70 hover:text-foreground hover:bg-white/5"
          )}
        >
          {location.pathname === '/settings' && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-vibrant-purple/20 opacity-50" />
          )}
          <Settings className={cn(
            "w-5 h-5 shrink-0 relative z-10",
            location.pathname === '/settings' && "text-primary"
          )} />
          {!isCollapsed && <span className="relative z-10">Settings</span>}
        </NavLink>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full mt-2 justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 backdrop-blur-sm"
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
