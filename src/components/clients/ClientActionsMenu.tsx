import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MoreHorizontal, Edit, Trash2, Send, Link, Copy, CheckCircle, XCircle } from 'lucide-react';
import type { Client } from '@/types/ats';

interface ClientActionsMenuProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onSendInvite: (clientId: string) => void;
  onToggleActive: (clientId: string, isActive: boolean) => void;
}

export function ClientActionsMenu({ 
  client, 
  onEdit, 
  onDelete, 
  onSendInvite,
  onToggleActive 
}: ClientActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const registrationLink = client.registrationToken 
    ? `${window.location.origin}/client-register?token=${client.registrationToken}`
    : null;

  const handleCopyLink = () => {
    if (registrationLink) {
      navigator.clipboard.writeText(registrationLink);
      toast.success('Registration link copied to clipboard');
    }
  };

  const handleSendInvite = () => {
    onSendInvite(client.id);
    setShowInviteDialog(false);
  };

  const handleDelete = () => {
    onDelete(client.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-strong w-48">
          <DropdownMenuItem onClick={() => onEdit(client)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            Send Registration Link
          </DropdownMenuItem>

          {registrationLink && (
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Registration Link
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onToggleActive(client.id, !client.isActive)}>
            {client.isActive ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Mark Inactive
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Active
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>? 
              This action cannot be undone and will affect all associated applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Send Registration Link
            </DialogTitle>
            <DialogDescription>
              Send a registration link to <strong>{client.contactName}</strong> at <strong>{client.contactEmail}</strong>.
              They can use this link to create their client portal account.
            </DialogDescription>
          </DialogHeader>

          {registrationLink && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Link</label>
              <div className="flex gap-2">
                <Input 
                  value={registrationLink} 
                  readOnly 
                  className="text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {client.registrationSentAt && (
                <p className="text-xs text-muted-foreground">
                  Last sent: {new Date(client.registrationSentAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button className="btn-vibrant" onClick={handleSendInvite}>
              <Send className="w-4 h-4 mr-2" />
              {registrationLink ? 'Resend Invite' : 'Generate & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
