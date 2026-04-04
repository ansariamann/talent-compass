import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { candidatesApi, applicationsApi, clientsApi, monitoringApi, jobsApi } from '@/lib/api';
import {
  Table2,
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

interface DatabaseSourceInfo {
  engine: string;
  host: string | null;
  port: number | null;
  database: string | null;
  connected: boolean;
  timestamp: string;
}

const ID_COLUMN_PATTERN = /(^| )ID$/i;

function hashStringTo4DigitSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 10000;
}

export default function DatabasePage() {
  const { table = 'candidates' } = useParams<{ table?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [tablesData, setTablesData] = useState<Record<string, TableData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [dbSource, setDbSource] = useState<DatabaseSourceInfo | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [candidatesRes, applicationsRes, clientsList, jobsRes, dbSourceRes] = await Promise.allSettled([
        candidatesApi.list({}, 1, 100),
        applicationsApi.list({}, 1, 100),
        clientsApi.list(),
        jobsApi.list({}, 1, 100),
        monitoringApi.getDatabaseSource(),
      ]);

      const data: Record<string, TableData> = {};
      const idMap = new Map<string, string>();
      const usedDisplayIds = new Set<string>();
      const toDisplayId = (rawId: string): string => {
        const existing = idMap.get(rawId);
        if (existing) return existing;

        const base = hashStringTo4DigitSeed(rawId);
        for (let offset = 0; offset < 10000; offset += 1) {
          const candidate = ((base + offset) % 10000).toString().padStart(4, '0');
          if (!usedDisplayIds.has(candidate)) {
            usedDisplayIds.add(candidate);
            idMap.set(rawId, candidate);
            return candidate;
          }
        }
        // Fallback should never happen in practice, but keep a deterministic output.
        const fallback = base.toString().padStart(4, '0');
        idMap.set(rawId, fallback);
        return fallback;
      };

      const formatIdLike = (value: string): string => {
        if (!value || value === '-') return value;
        return toDisplayId(value);
      };

      const formatRowIdsByColumns = (columns: string[], row: string[]): string[] => {
        return row.map((cell, index) => {
          if (ID_COLUMN_PATTERN.test(columns[index])) {
            return formatIdLike(cell);
          }
          return cell;
        });
      };

      // Candidates
      if (candidatesRes.status === 'fulfilled') {
        const candidates = candidatesRes.value.data;
        const columns = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Experience', 'Skills', 'Created At'];
        data.candidates = {
          columns,
          rows: candidates.map(c =>
            formatRowIdsByColumns(columns, [
              c.id,
              c.name,
              c.email || '-',
              c.phone || '-',
              c.currentStatus,
              c.experience ? `${c.experience} yrs` : '-',
              c.skills?.slice(0, 3).join(', ') || '-',
              new Date(c.createdAt).toLocaleDateString(),
            ])
          ),
        };
      } else {
        data.candidates = { columns: ['Error'], rows: [['Failed to load candidates: ' + candidatesRes.reason]] };
      }

      // Applications
      if (applicationsRes.status === 'fulfilled') {
        const applications = applicationsRes.value.data;
        const columns = ['ID', 'Candidate ID', 'Client ID', 'Job Title', 'Status', 'Submitted'];
        data.applications = {
          columns,
          rows: applications.map(a =>
            formatRowIdsByColumns(columns, [
              a.id,
              a.candidateId,
              a.clientId,
              a.jobTitle,
              a.status,
              new Date(a.submittedAt).toLocaleDateString(),
            ])
          ),
        };
      } else {
        data.applications = { columns: ['Error'], rows: [['Failed to load applications: ' + applicationsRes.reason]] };
      }

      // Clients
      if (clientsList.status === 'fulfilled') {
        const clients = clientsList.value;
        const columns = ['ID', 'Name', 'Industry', 'Contact Name', 'Contact Email', 'Active', 'Created At'];
        data.clients = {
          columns,
          rows: clients.map((c: any) =>
            formatRowIdsByColumns(columns, [
              c.id,
              c.name || c.company_name || '-',
              c.industry || '-',
              c.contactName || c.contact_name || '-',
              c.contactEmail || c.contact_email || '-',
              (c.isActive ?? c.is_active) ? 'Yes' : 'No',
              c.createdAt || c.created_at ? new Date(c.createdAt || c.created_at).toLocaleDateString() : '-',
            ])
          ),
        };
      } else {
        data.clients = { columns: ['Error'], rows: [['Failed to load clients: ' + clientsList.reason]] };
      }

      // Jobs
      if (jobsRes.status === 'fulfilled') {
        const jobs = jobsRes.value.data;
        const columns = ['ID', 'Title', 'Company / Client', 'Vacant', 'Experience', 'Salary (LPA)', 'Location', 'Created At'];
        data.jobs = {
          columns,
          rows: jobs.map(j =>
            formatRowIdsByColumns(columns, [
              j.id,
              j.title,
              j.companyName || (j.clientId ? formatIdLike(j.clientId) : '-') || '-',
              j.vacant !== false ? 'Yes' : 'No',
              j.experienceRequired !== undefined ? `${j.experienceRequired} yrs` : '-',
              j.salaryLpa !== undefined ? j.salaryLpa.toString() : '-',
              j.location || '-',
              j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '-',
            ])
          ),
        };
      } else {
        data.jobs = { columns: ['Error'], rows: [['Failed to load jobs: ' + jobsRes.reason]] };
      }

      // Interviews — no backend endpoint yet
      data.interviews = {
        columns: ['ID', 'Application ID', 'Type', 'Scheduled', 'Duration', 'Status'],
        rows: [],
      };

      if (dbSourceRes.status === 'fulfilled') {
        setDbSource(dbSourceRes.value);
      } else {
        setDbSource(null);
      }

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

  const handleExport = useCallback(() => {
    if (!currentTable || currentTable.columns.length === 0 || filteredRows.length === 0) return;
    const header = currentTable.columns.join(',');
    const csvRows = filteredRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );
    const csvString = [header, ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName}_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentTable, filteredRows, tableName]);

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
              <p className="text-xs text-muted-foreground mt-1">
                {dbSource
                  ? `Source: ${dbSource.engine.toUpperCase()} ${dbSource.database ? `(${dbSource.database})` : ''} ${dbSource.connected ? 'connected' : 'disconnected'}`
                  : 'Source: backend database connection'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
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

    </DashboardLayout>
  );
}
