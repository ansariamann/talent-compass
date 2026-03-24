import { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  title: string;
  isConnected?: boolean;
  onSearch?: (query: string) => void;
  searchComponent?: ReactNode;
}

export function Header({ title, isConnected = true, onSearch, searchComponent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {searchComponent ? searchComponent : onSearch && (
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
        </div>
      </div>
    </header>
  );
}
