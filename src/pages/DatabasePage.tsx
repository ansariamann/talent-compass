import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Database, 
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

// Mock database tables data
const tablesData: Record<string, { columns: string[]; rows: string[][] }> = {
  candidates: {
    columns: ['ID', 'Name', 'Email', 'Status', 'Experience', 'Created At'],
    rows: [
      ['cand_001', 'Alex Johnson', 'alex@email.com', 'screening', '5', '2024-12-15'],
      ['cand_002', 'Sarah Miller', 'sarah@email.com', 'new', '3', '2024-12-18'],
      ['cand_003', 'David Chen', 'david@email.com', 'interviewed', '8', '2024-12-10'],
      ['cand_004', 'Emily Davis', 'emily@email.com', 'offered', '6', '2024-12-12'],
      ['cand_005', 'Michael Brown', 'michael@email.com', 'hired', '4', '2024-12-08'],
    ],
  },
  applications: {
    columns: ['ID', 'Candidate ID', 'Client ID', 'Job Title', 'Status', 'Submitted'],
    rows: [
      ['app_001', 'cand_001', 'client_001', 'Senior Developer', 'in_review', '2024-12-16'],
      ['app_002', 'cand_002', 'client_002', 'Full Stack Engineer', 'pending', '2024-12-19'],
      ['app_003', 'cand_003', 'client_001', 'Tech Lead', 'interview', '2024-12-11'],
    ],
  },
  clients: {
    columns: ['ID', 'Name', 'Industry', 'Contact', 'Active', 'Created At'],
    rows: [
      ['client_001', 'TechCorp Inc.', 'Technology', 'hr@techcorp.com', 'Yes', '2024-01-15'],
      ['client_002', 'StartupXYZ', 'Fintech', 'talent@startupxyz.com', 'Yes', '2024-03-20'],
      ['client_003', 'Enterprise Co.', 'Enterprise', 'recruiting@enterprise.com', 'Yes', '2024-02-10'],
    ],
  },
  jobs: {
    columns: ['ID', 'Title', 'Client ID', 'Status', 'Openings', 'Created At'],
    rows: [
      ['job_001', 'Senior Developer', 'client_001', 'open', '3', '2024-12-01'],
      ['job_002', 'Full Stack Engineer', 'client_002', 'open', '2', '2024-12-05'],
      ['job_003', 'Tech Lead', 'client_001', 'filled', '1', '2024-11-20'],
    ],
  },
  interviews: {
    columns: ['ID', 'Application ID', 'Type', 'Scheduled', 'Duration', 'Status'],
    rows: [
      ['int_001', 'app_001', 'video', '2024-12-20 10:00', '60 min', 'completed'],
      ['int_002', 'app_003', 'onsite', '2024-12-22 14:00', '90 min', 'scheduled'],
    ],
  },
};

export default function DatabasePage() {
  const { table = 'candidates' } = useParams<{ table?: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const currentTable = tablesData[table] || tablesData.candidates;
  const tableName = table.charAt(0).toUpperCase() + table.slice(1);

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
              {currentTable.rows.map((row, i) => (
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
          <span>Showing {currentTable.rows.length} of {currentTable.rows.length} records</span>
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
