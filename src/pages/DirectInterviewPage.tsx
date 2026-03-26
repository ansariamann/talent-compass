import { useDeferredValue, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DirectInterviewForm } from "@/components/candidates/DirectInterviewForm";
import { DirectSelectionModal } from "@/components/candidates/DirectSelectionModal";
import { InterviewHistoryDialog } from "@/components/candidates/InterviewHistoryDialog";
import { AssignExistingInterviewDialog } from "@/components/candidates/AssignExistingInterviewDialog";
import { EnhancedSearch } from "@/components/search/EnhancedSearch";
import { candidatesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Candidate, DirectInterviewStats } from "@/types/ats";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type DirectInterviewTab = "pending" | "interviewed" | "selected";

function mapTabToFilters(tab: DirectInterviewTab, search: string): CandidateFilters {
  if (tab === "selected") {
    return {
      search,
      status: ["selected"],
    };
  }
  if (tab === "interviewed") {
    return {
      search,
      status: ["new"],
      isDirectInterview: true,
    };
  }
  return {
    search,
    status: ["new"] as const,
    isDirectInterview: false,
  };
}

export default function DirectInterviewPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "hr_admin";

  const [activeTab, setActiveTab] = useState<DirectInterviewTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<DirectInterviewStats>({ pending: 0, interviewed: 0, selected: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isInterviewFormOpen, setIsInterviewFormOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAssignExistingOpen, setIsAssignExistingOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setError("Only HR admins can access the direct interview workflow");
      return;
    }
    let cancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const response = await candidatesApi.getDirectInterviewStats();
        if (!cancelled) setStats(response);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load interview stats";
          setError(message);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function loadCandidates() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await candidatesApi.list(mapTabToFilters(activeTab, deferredSearch), 1, 100);
        if (!cancelled) {
          setCandidates(response.data);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to fetch candidates";
          setError(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [activeTab, deferredSearch, isAdmin]);

  const refreshAll = async () => {
    try {
      const [candidateResponse, statsResponse] = await Promise.all([
        candidatesApi.list(mapTabToFilters(activeTab, deferredSearch), 1, 100),
        candidatesApi.getDirectInterviewStats(),
      ]);
      setCandidates(candidateResponse.data);
      setStats(statsResponse);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to refresh direct interview data";
      setError(message);
      toast.error(message);
    }
  };

  const handleInterviewSuccess = async () => {
    toast.success("Interview recorded successfully");
    await refreshAll();
    setActiveTab("interviewed");
  };

  const handleSelectionSuccess = async () => {
    toast.success("Candidate selected successfully");
    await refreshAll();
    setActiveTab("selected");
  };

  if (!isAdmin) {
    return (
      <DashboardLayout title="Direct Interview">
        <div className="mx-auto max-w-4xl p-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Access denied. Only HR administrators can access the direct interview workflow.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Direct Interview">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Direct Interview Workflow</h1>
          <p className="text-sm text-muted-foreground">
            Record interviews directly and move qualified candidates into selected status without a job posting.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Pending Interviews" value={stats.pending} icon={FileText} loading={statsLoading} />
          <StatCard title="Interviewed" value={stats.interviewed} icon={CheckCircle2} loading={statsLoading} />
          <StatCard title="Selected" value={stats.selected} icon={Users} loading={statsLoading} />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <EnhancedSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, company, location or skill..."
            className="max-w-2xl"
          />
          <div className="flex gap-2">
            <Button onClick={() => setIsAssignExistingOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Existing Candidate
            </Button>
            <Button variant="outline" onClick={refreshAll}>
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DirectInterviewTab)}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="interviewed">Interviewed ({stats.interviewed})</TabsTrigger>
            <TabsTrigger value="selected">Selected ({stats.selected})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading candidates...
          </div>
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No candidates found for this view.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                tab={activeTab}
                onInterviewRecord={() => {
                  setSelectedCandidate(candidate);
                  setIsInterviewFormOpen(true);
                }}
                onViewHistory={() => {
                  setSelectedCandidate(candidate);
                  setIsHistoryOpen(true);
                }}
                onSelectCandidate={() => {
                  setSelectedCandidate(candidate);
                  setIsSelectionModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <DirectInterviewForm
        open={isInterviewFormOpen}
        onOpenChange={setIsInterviewFormOpen}
        candidate={selectedCandidate}
        onSuccess={handleInterviewSuccess}
      />

      <DirectSelectionModal
        open={isSelectionModalOpen}
        onOpenChange={setIsSelectionModalOpen}
        candidate={selectedCandidate}
        onSuccess={handleSelectionSuccess}
      />

      <InterviewHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        candidate={selectedCandidate}
        onChanged={refreshAll}
      />

      <AssignExistingInterviewDialog
        open={isAssignExistingOpen}
        onOpenChange={setIsAssignExistingOpen}
        onSuccess={async () => {
          await refreshAll();
          setActiveTab("interviewed");
        }}
      />
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: typeof FileText;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl">{loading ? "..." : value}</CardTitle>
      </CardContent>
    </Card>
  );
}

function CandidateCard({
  candidate,
  tab,
  onInterviewRecord,
  onViewHistory,
  onSelectCandidate,
}: {
  candidate: Candidate;
  tab: DirectInterviewTab;
  onInterviewRecord: () => void;
  onViewHistory: () => void;
  onSelectCandidate: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{candidate.name}</h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {candidate.email && <span>{candidate.email}</span>}
                {candidate.phone && <span>{candidate.phone}</span>}
                {candidate.company && <span>{candidate.company}</span>}
                {candidate.location && <span>{candidate.location}</span>}
              </div>
            </div>

            {candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 5 && (
                  <Badge variant="outline">+{candidate.skills.length - 5}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <Badge variant={tab === "selected" ? "default" : candidate.isDirectInterview ? "secondary" : "outline"}>
              {tab === "selected" ? "SELECTED" : candidate.isDirectInterview ? "INTERVIEWED" : "PENDING"}
            </Badge>

            {tab === "pending" && (
              <Button onClick={onInterviewRecord}>Record Interview</Button>
            )}

            {candidate.isDirectInterview && (
              <Button variant="outline" onClick={onViewHistory}>
                View Interviews
              </Button>
            )}

            {tab === "interviewed" && (
              <Button onClick={onSelectCandidate} className="bg-green-600 hover:bg-green-700">
                Select & Assign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
