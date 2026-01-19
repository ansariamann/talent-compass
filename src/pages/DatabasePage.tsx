import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockCandidates, mockApplications, mockClients } from '@/lib/mock-data';
import { 
  Table2, 
  Plus, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
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

// Transform mock data to table format
const getTablesData = () => ({
  candidates: {
    columns: ['ID', 'Name', 'Email', 'Phone', 'Status', 'Experience', 'Skills', 'Created At'],
    rows: mockCandidates.map(c => [
      c.id,
      c.name,
      c.email,
      c.phone || '-',
      c.currentStatus,
      `${c.experience} yrs`,
      c.skills.slice(0, 3).join(', '),
      new Date(c.createdAt).toLocaleDateString(),
    ]),
  },
  applications: {
    columns: ['ID', 'Candidate', 'Client', 'Job Title', 'Status', 'Submitted'],
    rows: mockApplications.map(a => [
      a.id,
      a.candidate?.name || a.candidateId,
      a.client?.name || a.clientId,
      a.jobTitle,
      a.status,
      new Date(a.submittedAt).toLocaleDateString(),
    ]),
  },
  clients: {
    columns: ['ID', 'Name', 'Industry', 'Contact Name', 'Contact Email', 'Active', 'Created At'],
    rows: mockClients.map(c => [
      c.id,
      c.name,
      c.industry,
      c.contactName,
      c.contactEmail,
      c.isActive ? 'Yes' : 'No',
      new Date(c.createdAt).toLocaleDateString(),
    ]),
  },
  jobs: {
    columns: ['ID', 'Title', 'Client ID', 'Status', 'Openings', 'Created At'],
    rows: [
      ['job_001', 'Senior Developer', 'client_001', 'open', '3', '2024-12-01'],
      ['job_002', 'Full Stack Engineer', 'client_002', 'open', '2', '2024-12-05'],
      ['job_003', 'Tech Lead', 'client_001', 'filled', '1', '2024-11-20'],
      ['job_004', 'DevOps Lead', 'client_003', 'open', '1', '2024-12-10'],
      ['job_005', 'Data Scientist', 'client_001', 'open', '2', '2024-12-15'],
    ],
  },
  interviews: {
    columns: ['ID', 'Application ID', 'Type', 'Scheduled', 'Duration', 'Status'],
    rows: [
      ['int_001', 'app_001', 'video', '2024-12-20 10:00', '60 min', 'completed'],
      ['int_002', 'app_003', 'onsite', '2024-12-22 14:00', '90 min', 'scheduled'],
      ['int_003', 'app_002', 'phone', '2024-12-26 11:00', '30 min', 'completed'],
      ['int_004', 'app_001', 'onsite', '2024-12-28 09:00', '120 min', 'scheduled'],
    ],
  },
});

export default function DatabasePage() {
  const { table = 'candidates' } = useParams<{ table?: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const tablesData = useMemo(() => getTablesData(), []);
  const currentTable = tablesData[table as keyof typeof tablesData] || tablesData.candidates;
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
                {currentTable.rows.length} records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="glow" size="sm">
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

        {/* Table */}
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
              {filteredRows.map((row, i) => (
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
      </div>
    </DashboardLayout>
  );
}
