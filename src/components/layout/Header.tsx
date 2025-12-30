import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  isConnected?: boolean;
  onSearch?: (query: string) => void;
}

export function Header({ title, isConnected = true, onSearch }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{title}</h1>
          
          {/* Connection status */}
          <Badge 
            variant={isConnected ? "success" : "error"} 
            className="gap-1.5"
          >
            {isConnected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="text-[10px] uppercase tracking-wider">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </Badge>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                variant="search"
                placeholder="Search... (⌘K)"
                className="w-64"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-error rounded-full" />
          </Button>

          {/* User avatar */}
          <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
            SC
          </button>
        </div>
      </div>
    </header>
  );
}
