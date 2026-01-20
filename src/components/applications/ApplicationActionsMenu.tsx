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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw,
  Flag,
  FlagOff,
} from 'lucide-react';
import type { Application } from '@/types/ats';

interface ApplicationActionsMenuProps {
  application: Application;
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onFlag: (id: string, reason?: string) => void;
  onUnflag: (id: string) => void;
}

export function ApplicationActionsMenu({
  application,
  onEdit,
  onDelete,
  onRestore,
  onFlag,
  onUnflag,
}: ApplicationActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const handleFlag = () => {
    onFlag(application.id, flagReason || undefined);
    setFlagDialogOpen(false);
    setFlagReason('');
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
          <DropdownMenuItem onClick={() => onEdit(application)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          {application.isFlagged ? (
            <DropdownMenuItem onClick={() => onUnflag(application.id)}>
              <FlagOff className="mr-2 h-4 w-4" />
              Unflag
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setFlagDialogOpen(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Flag
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {application.isDeleted ? (
            <DropdownMenuItem onClick={() => onRestore(application.id)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This is a soft delete
              and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(application.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Flag Application</DialogTitle>
            <DialogDescription>
              Add an optional reason for flagging this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flagReason">Reason (optional)</Label>
              <Input
                id="flagReason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g., Needs review, Duplicate, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFlag}>
              <Flag className="mr-2 h-4 w-4" />
              Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}