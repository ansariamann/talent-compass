import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, User, Briefcase, Command, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  type: 'candidate' | 'skill' | 'recent' | 'command';
  value: string;
  label: string;
  meta?: string;
}

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Mock suggestions
const mockSuggestions: SearchSuggestion[] = [
  { type: 'candidate', value: 'Alex Johnson', label: 'Alex Johnson', meta: 'Python, React • 5 yrs' },
  { type: 'candidate', value: 'Maria Garcia', label: 'Maria Garcia', meta: 'Java, Spring Boot • 8 yrs' },
  { type: 'skill', value: 'skill:React', label: 'React', meta: '3 candidates' },
  { type: 'skill', value: 'skill:Python', label: 'Python', meta: '2 candidates' },
  { type: 'command', value: 'status:screening', label: 'Filter by Screening', meta: 'status filter' },
  { type: 'command', value: 'exp:>5', label: 'Experience > 5 years', meta: 'experience filter' },
];

const recentSearches = ['React developer', 'Python', 'status:new'];

export function EnhancedSearch({ value, onChange, placeholder = 'Search candidates...', className }: EnhancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = value.length > 0 
    ? mockSuggestions.filter(s => 
        s.label.toLowerCase().includes(value.toLowerCase()) ||
        s.value.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  const showRecent = isOpen && value.length === 0;
  const showSuggestions = isOpen && filteredSuggestions.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = showRecent ? recentSearches : filteredSuggestions;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (showRecent) {
            onChange(recentSearches[selectedIndex]);
          } else {
            onChange(filteredSuggestions[selectedIndex].value);
          }
        }
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'candidate': return <User className="w-3.5 h-3.5" />;
      case 'skill': return <Briefcase className="w-3.5 h-3.5" />;
      case 'command': return <Command className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          ref={inputRef}
          variant="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          data-search-input
          className="pl-10 pr-20 h-10 bg-muted/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {value && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange('')}
              className="h-5 w-5"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          <kbd className="hidden sm:inline-flex h-5 px-1.5 text-[10px] font-mono bg-muted rounded border border-border text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Dropdown */}
      {(showRecent || showSuggestions) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {/* Recent Searches */}
          {showRecent && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Recent Searches</p>
              {recentSearches.map((search, i) => (
                <button
                  key={search}
                  onClick={() => handleSelect(search)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedIndex === i ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  )}
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{search}</span>
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-border px-2">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Try:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">skill:React</code>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">status:new</code>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">exp:&gt;5</code>
                </p>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <div className="p-2">
              {filteredSuggestions.map((suggestion, i) => (
                <button
                  key={suggestion.value}
                  onClick={() => handleSelect(suggestion.value)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm transition-colors group',
                    selectedIndex === i ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center',
                      suggestion.type === 'candidate' && 'bg-primary/20 text-primary',
                      suggestion.type === 'skill' && 'bg-status-info/20 text-status-info',
                      suggestion.type === 'command' && 'bg-status-warning/20 text-status-warning',
                    )}>
                      {getIcon(suggestion.type)}
                    </span>
                    <span className="font-medium">{suggestion.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestion.meta && (
                      <span className="text-xs text-muted-foreground">{suggestion.meta}</span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
