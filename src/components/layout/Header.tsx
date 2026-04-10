import { ReactNode } from 'react';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  title: string;
  isConnected?: boolean;
  onSearch?: (query: string) => void;
  searchComponent?: ReactNode;
}

export function Header({ title, isConnected = true, onSearch, searchComponent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                isConnected
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              )}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? "Live" : "Offline"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isConnected ? "Connected to server" : "Connection lost — retrying…"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-3">
          {searchComponent ? searchComponent : onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                variant="search"
                className="w-64"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
