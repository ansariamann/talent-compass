import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSSE } from '@/hooks/useSSE';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  onSearch?: (query: string) => void;
  searchComponent?: ReactNode;
}

export function DashboardLayout({ children, title, onSearch, searchComponent }: DashboardLayoutProps) {
  const { isConnected } = useSSE({ enabled: true });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} isConnected={isConnected} onSearch={onSearch} searchComponent={searchComponent} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
