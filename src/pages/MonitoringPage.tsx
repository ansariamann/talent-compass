import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import { mockCandidates, mockApplications, mockClients } from '@/lib/mock-data';
import { candidatesApi } from '@/lib/api';
import { Candidate } from '@/types/ats';
import { 
  Users, 
  FileText, 
  Building2, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function MonitoringPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Try API first, fallback to mock data filter
      try {
        const results = await candidatesApi.search(query);
        setSearchResults(results);
      } catch {
        // Fallback to local mock search
        const filtered = mockCandidates.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          c.skills.some(s => s.toLowerCase().includes(query.toLowerCase())) ||
          c.currentStatus.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const stats = {
    totalCandidates: mockCandidates.length,
    activeCandidates: mockCandidates.filter(c => !c.isBlacklisted && !c.isLeaver).length,
    newThisWeek: mockCandidates.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.createdAt) > weekAgo;
    }).length,
    totalApplications: mockApplications.length,
    pendingApplications: mockApplications.filter(a => a.status === 'pending' || a.status === 'in_review').length,
    totalClients: mockClients.length,
    activeClients: mockClients.filter(c => c.isActive).length,
  };

  const statusBreakdown = mockCandidates.reduce((acc, c) => {
    acc[c.currentStatus] = (acc[c.currentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Search Section */}
        <div className="panel p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <EnhancedSearch
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search candidates by name, email, skills..."
                className="max-w-xl"
              />
            </div>
            {isSearching && (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && searchQuery.length >= 2 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Found {searchResults.length} candidate{searchResults.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.slice(0, 5).map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => navigate('/candidates')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {candidate.currentStatus.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {candidate.experience}y exp
                      </span>
                    </div>
                  </button>
                ))}
                {searchResults.length > 5 && (
                  <button
                    onClick={() => navigate('/candidates')}
                    className="w-full text-center text-sm text-primary hover:underline py-2"
                  >
                    View all {searchResults.length} results →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Users}
            label="Active Candidates"
            value={stats.activeCandidates}
            subtext={`+${stats.newThisWeek} this week`}
            trend="up"
          />
          <StatCard 
            icon={FileText}
            label="Applications"
            value={stats.totalApplications}
            subtext={`${stats.pendingApplications} pending`}
          />
          <StatCard 
            icon={Building2}
            label="Active Clients"
            value={stats.activeClients}
            subtext={`of ${stats.totalClients} total`}
          />
          <StatCard 
            icon={Clock}
            label="Avg. Time to Hire"
            value="18d"
            subtext="Last 30 days"
            trend="down"
          />
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-semibold">Candidate Status Breakdown</h3>
            </div>
            <div className="panel-body">
              <div className="space-y-3">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-primary/30 rounded-full" 
                        style={{ width: `${(count / stats.totalCandidates) * 100}px` }}
                      />
                      <span className="text-sm font-mono text-muted-foreground w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="font-semibold">Recent Activity</h3>
            </div>
            <div className="panel-body">
              <div className="space-y-4">
                <ActivityItem
                  icon={CheckCircle2}
                  iconColor="text-status-success"
                  title="Application status updated"
                  description="Maria Garcia moved to Shortlisted for TechCorp"
                  time="2 hours ago"
                />
                <ActivityItem
                  icon={Users}
                  iconColor="text-status-info"
                  title="New candidate added"
                  description="Sarah Kim added to candidate pool"
                  time="4 hours ago"
                />
                <ActivityItem
                  icon={AlertCircle}
                  iconColor="text-status-warning"
                  title="Duplicate flag raised"
                  description="Emily Chen flagged as potential duplicate"
                  time="6 hours ago"
                />
                <ActivityItem
                  icon={FileText}
                  iconColor="text-status-info"
                  title="New application received"
                  description="Robert Martinez applied for DevOps Lead"
                  time="1 day ago"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  trend 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <Badge variant={trend === 'up' ? 'success' : 'info'} className="gap-1">
            <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {trend === 'up' ? 'Up' : 'Down'}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({
  icon: Icon,
  iconColor,
  title,
  description,
  time,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}
