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
  Inbox,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
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
}

interface DatabaseItem {
  label: string;
  href: string;
  count?: number;
}

const navItems: NavItem[] = [
  { label: 'Candidates',   href: '/candidates',        icon: Users      },
  { label: 'Applications', href: '/applications',       icon: FileText   },
  { label: 'Processing',   href: '/resume-processing',  icon: Inbox      },
  { label: 'Clients',      href: '/clients',            icon: Building2  },
  { label: 'Monitoring',   href: '/monitoring',         icon: BarChart3  },
];

const databaseItems: DatabaseItem[] = [
  { label: 'Candidates',   href: '/database/candidates',  count: 1247 },
  { label: 'Applications', href: '/database/applications', count: 3892 },
  { label: 'Clients',      href: '/database/clients',     count: 48   },
  { label: 'Jobs',         href: '/database/jobs',        count: 156  },
  { label: 'Interviews',   href: '/database/interviews',  count: 892  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(true);

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'flex flex-col h-screen shrink-0 transition-all duration-300',
        'bg-[hsl(var(--sidebar-background))] border-r border-border',
        isCollapsed ? 'w-[64px]' : 'w-[220px]'
      )}
    >
      {/* ── Logo / brand ──────────────────────────────────────── */}
      <div className="h-[52px] flex items-center px-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              TalentFlow
            </span>
          )}
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13.5px] font-medium transition-colors duration-100',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]'
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* ── Master Database section ──────────────────────────── */}
        <div className="pt-3 pb-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 select-none">
              Database
            </p>
          )}

          {!isCollapsed ? (
            <Collapsible open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13.5px] font-medium w-full text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-100">
                  <Database className="w-[18px] h-[18px] shrink-0" />
                  <span>Master DB</span>
                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 ml-auto text-muted-foreground transition-transform duration-200',
                    isDatabaseOpen && 'rotate-90'
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {databaseItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-[6px] rounded-lg text-[13px] transition-colors duration-100',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground'
                      )}
                    >
                      <Table2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.count !== undefined && (
                        <span className="text-[11px] font-mono text-muted-foreground">
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
              title="Master Database"
              className={cn(
                'flex items-center justify-center px-2.5 py-[7px] rounded-lg text-[13.5px] font-medium transition-colors duration-100',
                location.pathname.startsWith('/database')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]'
              )}
            >
              <Database className="w-[18px] h-[18px]" />
            </NavLink>
          )}
        </div>
      </nav>

      {/* ── Bottom: Settings + collapse ──────────────────────── */}
      <div className="px-2 py-2 border-t border-border space-y-0.5">
        {/* User row */}
        {!isCollapsed && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg w-full hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-100"
          >
            <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <span className="text-[13px] font-medium text-foreground truncate flex-1 text-left">
              {user?.name || user?.email || 'Account'}
            </span>
          </button>
        )}

        <NavLink
          to="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13.5px] font-medium transition-colors duration-100',
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]'
          )}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] w-full transition-colors duration-100',
            'text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground'
          )}
        >
          {isDark
            ? <Sun className="w-[18px] h-[18px] shrink-0" />
            : <Moon className="w-[18px] h-[18px] shrink-0" />
          }
          {!isCollapsed && (
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] w-full text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground transition-colors duration-100"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed
            ? <ChevronRight className="w-[18px] h-[18px] shrink-0" />
            : <><ChevronLeft className="w-[18px] h-[18px] shrink-0" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
