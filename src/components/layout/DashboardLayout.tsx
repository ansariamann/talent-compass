import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSSE } from '@/hooks/useSSE';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  onSearch?: (query: string) => void;
}

export function DashboardLayout({ children, title, onSearch }: DashboardLayoutProps) {
  const { isConnected } = useSSE({ enabled: true });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} isConnected={isConnected} onSearch={onSearch} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
