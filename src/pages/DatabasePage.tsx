import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { candidatesApi, applicationsApi, clientsApi } from '@/lib/api';
import { ResumeUploadDialog } from '@/components/ResumeUploadDialog';
import {
  Table2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableData {
  columns: string[];
  rows: string[][];
}

export default function DatabasePage() {
  const { table = 'candidates' } = useParams<{ table?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [tablesData, setTablesData] = useState<Record<string, TableData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [candidatesRes, applicationsRes, clientsList] = await Promise.allSettled([
        candidatesApi.list({}, 1, 100),
        applicationsApi.list({}, 1, 100),
        clientsApi.list(),
      ]);

      const data: Record<string, TableData> = {};

      // Candidates
      if (candidatesRes.status === 'fulfilled') {
        const candidates = candidatesRes.value.data;
        data.candidates = {
          columns: ['ID', 'Name', 'Email', 'Phone', 'Status', 'Experience', 'Skills', 'Created At'],
          rows: candidates.map(c => [
            c.id,
            c.name,
            c.email || '-',
            c.phone || '-',
            c.currentStatus,
            c.experience ? `${c.experience} yrs` : '-',
            c.skills?.slice(0, 3).join(', ') || '-',
            new Date(c.createdAt).toLocaleDateString(),
          ]),
        };
      } else {
        data.candidates = { columns: ['Error'], rows: [['Failed to load candidates: ' + candidatesRes.reason]] };
      }

      // Applications
      if (applicationsRes.status === 'fulfilled') {
        const applications = applicationsRes.value.data;
        data.applications = {
          columns: ['ID', 'Candidate ID', 'Client ID', 'Job Title', 'Status', 'Submitted'],
          rows: applications.map(a => [
            a.id,
            a.candidateId,
            a.clientId,
            a.jobTitle,
            a.status,
            new Date(a.submittedAt).toLocaleDateString(),
          ]),
        };
      } else {
        data.applications = { columns: ['Error'], rows: [['Failed to load applications: ' + applicationsRes.reason]] };
      }

      // Clients
      if (clientsList.status === 'fulfilled') {
        const clients = clientsList.value;
        data.clients = {
          columns: ['ID', 'Name', 'Industry', 'Contact Name', 'Contact Email', 'Active', 'Created At'],
          rows: clients.map((c: any) => [
            c.id,
            c.name || c.company_name || '-',
            c.industry || '-',
            c.contactName || c.contact_name || '-',
            c.contactEmail || c.contact_email || '-',
            (c.isActive ?? c.is_active) ? 'Yes' : 'No',
            c.createdAt || c.created_at ? new Date(c.createdAt || c.created_at).toLocaleDateString() : '-',
          ]),
        };
      } else {
        data.clients = { columns: ['Error'], rows: [['Failed to load clients: ' + clientsList.reason]] };
      }

      // Jobs & Interviews — no backend endpoint yet
      data.jobs = {
        columns: ['ID', 'Title', 'Client ID', 'Status', 'Openings', 'Created At'],
        rows: [],
      };
      data.interviews = {
        columns: ['ID', 'Application ID', 'Type', 'Scheduled', 'Duration', 'Status'],
        rows: [],
      };

      setTablesData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentTable = tablesData[table as string] || { columns: [], rows: [] };
  const tableName = table.charAt(0).toUpperCase() + table.slice(1);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery) return currentTable.rows;
    return currentTable.rows.filter(row =>
      row.some(cell =>
        cell.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [currentTable.rows, searchQuery]);

  return (
    <DashboardLayout title={`Database: ${tableName}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Table2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{tableName}</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `${currentTable.rows.length} records`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="glow" size="sm" onClick={() => setIsUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tableName.toLowerCase()}...`}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load data</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading {tableName.toLowerCase()}...</span>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {currentTable.columns.map((col) => (
                    <TableHead key={col} className="font-semibold">
                      <span className="flex items-center gap-1">
                        {col}
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentTable.columns.length + 1} className="text-center py-8 text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      {row.map((cell, j) => (
                        <TableCell key={j} className="font-mono text-sm">
                          {currentTable.columns[j] === 'Status' ? (
                            <Badge variant="secondary">{cell}</Badge>
                          ) : currentTable.columns[j] === 'Active' ? (
                            <Badge variant={cell === 'Yes' ? 'success' : 'secondary'}>
                              {cell}
                            </Badge>
                          ) : (
                            cell
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredRows.length} of {currentTable.rows.length} records</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ResumeUploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={fetchData}
      />
    </DashboardLayout>
  );
}
