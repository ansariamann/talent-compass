import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Building2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { Candidate } from "@/types/ats";
import { useClients } from "@/hooks/useClients";
import { candidatesApi } from "@/lib/api";

const formSchema = z.object({
  company_id: z.string().min(1, "Please select a company"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DirectSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onSuccess: () => void;
}

export function DirectSelectionModal({
  open,
  onOpenChange,
  candidate,
  onSuccess,
}: DirectSelectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: clients = [] } = useClients();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!candidate) return;

    setIsSubmitting(true);
    try {
      await candidatesApi.selectDirectCandidate(candidate.id, {
        companyId: data.company_id,
        notes: data.notes || undefined,
      });

      toast.success(
        `${candidate.name} has been selected and added to the company pool`
      );
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to select candidate"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCompanyName = clients.find(
    (c) => c.id === form.watch("company_id")
  )?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Direct Selection</DialogTitle>
          <DialogDescription>
            Transition {candidate?.name} to selected status and add to company
            pool
          </DialogDescription>
        </DialogHeader>

        {candidate && (
          <div className="space-y-4">
            {/* Candidate Summary */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold">{candidate.name}</div>
                <div className="text-sm mt-1">
                  {candidate.email && <div>📧 {candidate.email}</div>}
                  {candidate.phone && <div>📱 {candidate.phone}</div>}
                  {candidate.company && <div>🏢 {candidate.company}</div>}
                </div>
              </AlertDescription>
            </Alert>

            {/* Selection Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Company Selection */}
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Assign to Company
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Additional Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional context for the company assignment..."
                          {...field}
                          disabled={isSubmitting}
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Summary */}
                {selectedCompanyName && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>{candidate.name}</strong> will be:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>
                          Transitioned to <strong>SELECTED</strong> status
                        </li>
                        <li>
                          Added to <strong>{selectedCompanyName}</strong> talent
                          pool
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Confirm Selection
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
