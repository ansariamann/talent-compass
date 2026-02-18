import { ReactNode } from 'react';
import { Bell, Search, Wifi, WifiOff, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  isConnected?: boolean;
  onSearch?: (query: string) => void;
  searchComponent?: ReactNode;
}

export function Header({ title, isConnected = true, onSearch, searchComponent }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="h-[52px] border-b border-border bg-[hsl(var(--glass-bg))] backdrop-saturate-[180%] backdrop-blur-[20px] sticky top-0 z-40">
      <div className="h-full px-5 flex items-center justify-between gap-4">

        {/* Left: Page title */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[17px] font-semibold text-foreground tracking-tight truncate">
            {title}
          </h1>

          {/* Live indicator — subtle pill, not a badge */}
          <span className={cn(
            'hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full',
            isConnected
              ? 'text-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.1)]'
              : 'text-muted-foreground bg-muted'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isConnected ? 'bg-[hsl(var(--status-success))]' : 'bg-muted-foreground'
            )} />
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Right: Search + actions */}
        <div className="flex items-center gap-2">
          {searchComponent
            ? searchComponent
            : onSearch && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    variant="search"
                    placeholder="Search…"
                    className="w-56 pl-8 h-8 text-sm bg-secondary border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </div>
              )
          }

          {/* Bell — minimal icon button */}
          <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[hsl(var(--status-error))] rounded-full" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center hover:bg-primary/25 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {userInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile & Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/* tiny helper — cn is used inline here without importing */
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
