import { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Candidate } from "@/types/ats";

interface MergeCandidatesModalProps {
  candidates: Candidate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: (primaryId: string, secondaryIds: string[]) => Promise<void>;
}

interface MergeConflict {
  field: string;
  value1: string | number | undefined;
  value2: string | number | undefined;
}

/**
 * Modal for merging duplicate candidates with conflict resolution
 */
export function MergeCandidatesModal({
  candidates,
  open,
  onOpenChange,
  onMerge,
}: MergeCandidatesModalProps) {
  const [primaryId, setPrimaryId] = useState<string>(candidates[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<MergeConflict[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<
    Record<string, "primary" | "secondary">
  >({});

  if (candidates.length === 0) return null;

  const primaryCandidate = candidates.find((c) => c.id === primaryId);
  const secondaryCandidates = candidates.filter((c) => c.id !== primaryId);

  // Detect conflicts when primary candidate changes
  const detectConflicts = (primary: Candidate): MergeConflict[] => {
    const conflicts2: MergeConflict[] = [];
    const fieldsToCheck: (keyof Candidate)[] = [
      "phone",
      "company",
      "location",
      "ctcCurrent",
      "ctcExpected",
      "remark",
    ];

    fieldsToCheck.forEach((field) => {
      const primaryValue = primary[field];
      secondaryCandidates.forEach((secondary) => {
        const secondaryValue = secondary[field];
        if (
          primaryValue &&
          secondaryValue &&
          String(primaryValue) !== String(secondaryValue)
        ) {
          const existingConflict = conflicts2.find((c) => c.field === field);
          if (!existingConflict) {
            conflicts2.push({
              field,
              value1: primaryValue as string | number | undefined,
              value2: secondaryValue as string | number | undefined,
            });
          }
        }
      });
    });

    return conflicts2;
  };

  const handlePrimaryChange = (newPrimaryId: string) => {
    setPrimaryId(newPrimaryId);
    const newPrimary = candidates.find((c) => c.id === newPrimaryId);
    if (newPrimary) {
      const newConflicts = detectConflicts(newPrimary);
      setConflicts(newConflicts);
      setConflictResolutions({});
    }
  };

  const handleMerge = async () => {
    if (!primaryCandidate) {
      toast.error("Please select a primary candidate");
      return;
    }

    // Validate all conflicts are resolved
    const unresolvedConflicts = conflicts.filter(
      (c) => !conflictResolutions[c.field]
    );
    if (unresolvedConflicts.length > 0) {
      toast.error("Please resolve all conflicts before merging");
      return;
    }

    setIsLoading(true);
    try {
      await onMerge(
        primaryId,
        secondaryCandidates.map((c) => c.id)
      );
      toast.success("Candidates merged successfully");
      onOpenChange(false);
      setPrimaryId(candidates[0]?.id || "");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to merge candidates"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Merge Duplicate Candidates
          </DialogTitle>
          <DialogDescription>
            Select which candidate should be the primary record. Data from other
            records will be archived.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Primary Candidate Selection */}
          <div>
            <h3 className="font-medium mb-3">Select Primary Candidate</h3>
            <RadioGroup value={primaryId} onValueChange={handlePrimaryChange}>
              <div className="space-y-2">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handlePrimaryChange(candidate.id)}
                  >
                    <RadioGroupItem value={candidate.id} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {candidate.email}
                      </div>
                      {candidate.company && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {candidate.company}
                        </div>
                      )}
                      {candidate.experience && (
                        <div className="text-xs text-muted-foreground">
                          {candidate.experience} years experience
                        </div>
                      )}
                    </div>
                    {primaryId === candidate.id && (
                      <Badge className="bg-primary">Primary</Badge>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Conflicts Resolution */}
          {conflicts.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Resolve Conflicts ({conflicts.length})
              </h3>
              <div className="space-y-3">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.field}
                    className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20"
                  >
                    <div className="font-medium text-sm mb-2 capitalize">
                      {conflict.field.replace(/([A-Z])/g, " $1")}
                    </div>
                    <RadioGroup
                      value={conflictResolutions[conflict.field] || ""}
                      onValueChange={(value) =>
                        setConflictResolutions((prev) => ({
                          ...prev,
                          [conflict.field]: value as "primary" | "secondary",
                        }))
                      }
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem
                            value="primary"
                            id={`${conflict.field}-primary`}
                          />
                          <label
                            htmlFor={`${conflict.field}-primary`}
                            className="flex-1 cursor-pointer"
                          >
                            <span className="text-sm">Keep: </span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {String(conflict.value1)}
                            </code>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({primaryCandidate?.name})
                            </span>
                          </label>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem
                            value="secondary"
                            id={`${conflict.field}-secondary`}
                          />
                          <label
                            htmlFor={`${conflict.field}-secondary`}
                            className="flex-1 cursor-pointer"
                          >
                            <span className="text-sm">Use: </span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {String(conflict.value2)}
                            </code>
                          </label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              {secondaryCandidates.length} candidate record
              {secondaryCandidates.length > 1 ? "s" : ""} will be marked as
              duplicates and archived. All interactions and notes will be
              preserved.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={
              isLoading ||
              (conflicts.length > 0 &&
                Object.keys(conflictResolutions).length < conflicts.length)
            }
            className="bg-primary"
          >
            {isLoading ? "Merging..." : "Merge Candidates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
