import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Copy,
  Mail,
  MapPin,
  Wallet,
} from 'lucide-react';
import type { Candidate } from '@/types/ats';

interface CandidateActionsMenuProps {
  candidate: Candidate;
  onView: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
  onFindDuplicates: (candidate: Candidate) => void;
  duplicates?: Candidate[];
  isLoadingDuplicates?: boolean;
}

export function CandidateActionsMenu({
  candidate,
  onView,
  onDelete,
  onFindDuplicates,
  duplicates,
  isLoadingDuplicates,
}: CandidateActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicatesDialogOpen, setDuplicatesDialogOpen] = useState(false);

  const handleFindDuplicates = () => {
    onFindDuplicates(candidate);
    setDuplicatesDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(candidate)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleFindDuplicates}>
            <Copy className="mr-2 h-4 w-4" />
            Find Duplicates
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{candidate.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(candidate.id);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicates Dialog */}
      <Dialog open={duplicatesDialogOpen} onOpenChange={setDuplicatesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Potential Duplicates</DialogTitle>
            <DialogDescription>
              Candidates that might be duplicates of <strong>{candidate.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {isLoadingDuplicates ? (
            <div className="py-8 text-center text-muted-foreground">
              Searching for duplicates...
            </div>
          ) : duplicates && duplicates.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{dup.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {dup.email}
                        </div>
                        {dup.location && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {dup.location}
                          </div>
                        )}
                        {(dup.ctcCurrent || dup.ctcExpected) && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Wallet className="w-3 h-3" />
                            {dup.ctcCurrent && `Current: ₹${dup.ctcCurrent.toLocaleString()}`}
                            {dup.ctcCurrent && dup.ctcExpected && ' | '}
                            {dup.ctcExpected && `Expected: ₹${dup.ctcExpected.toLocaleString()}`}
                          </div>
                        )}
                      </div>
                      <Badge variant="warning">Duplicate</Badge>
                    </div>
                    {dup.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dup.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {dup.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{dup.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No duplicates found
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}