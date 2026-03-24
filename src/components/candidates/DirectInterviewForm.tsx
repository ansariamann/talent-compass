import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, MessageSquare, Star, Briefcase, Wrench } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Candidate, DirectInterviewRecord } from "@/types/ats";
import { useClients } from "@/hooks/useClients";
import { candidatesApi } from "@/lib/api";

const formSchema = z.object({
  interview_date: z.string().min(1, "Interview date is required"),
  company_id: z.string().min(1, "Please select a company"),
  position: z.string().min(1, "Position is required"),
  skills: z.string().optional(),
  notes: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DirectInterviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  interview?: DirectInterviewRecord | null;
  onSuccess: () => void;
}

export function DirectInterviewForm({
  open,
  onOpenChange,
  candidate,
  interview,
  onSuccess,
}: DirectInterviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: clients = [] } = useClients();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interview_date: new Date().toISOString().slice(0, 16),
      company_id: "",
      position: "",
      skills: "",
      notes: "",
      rating: undefined,
    },
  });

  const isEditing = Boolean(interview);

  const toLocalDatetimeValue = (value?: string) => {
    if (!value) return new Date().toISOString().slice(0, 16);
    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!open) return;
    form.reset({
      interview_date: toLocalDatetimeValue(interview?.interviewDate),
      company_id: interview?.companyId || "",
      position: interview?.position || "",
      skills: interview?.skills?.join(", ") || "",
      notes: interview?.notes || "",
      rating: interview?.rating ?? undefined,
    });
  }, [form, interview, open]);

  const onSubmit = async (data: FormValues) => {
    if (!candidate) return;

    setIsSubmitting(true);
    try {
      if (interview) {
        await candidatesApi.updateInterviewRecord(candidate.id, interview.id, {
          interviewDate: new Date(data.interview_date).toISOString(),
          companyId: data.company_id,
          position: data.position,
          skills: (data.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
          notes: data.notes || undefined,
          rating: data.rating ?? undefined,
        });
        toast.success("Interview updated successfully");
      } else {
        await candidatesApi.recordDirectInterview(candidate.id, {
          interviewDate: new Date(data.interview_date).toISOString(),
          companyId: data.company_id,
          position: data.position,
          skills: (data.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
          notes: data.notes || undefined,
          rating: data.rating ?? undefined,
        });
        toast.success("Interview recorded successfully");
      }
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record interview"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Direct Interview" : "Record Direct Interview"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update" : "Record"} interview details for {candidate?.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Interview Date */}
            <FormField
              control={form.control}
              name="interview_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Interview Date & Time
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Selection */}
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Company</FormLabel>
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

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Position
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Python Developer" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Skills
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Comma-separated skills, e.g. Python, FastAPI, PostgreSQL"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Interview Rating (1-5)
                  </FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => field.onChange(rating)}
                          className={`px-3 py-2 rounded border transition-colors ${
                            field.value === rating
                              ? "bg-blue-500 text-white border-blue-500"
                              : "border-gray-300 hover:border-blue-300"
                          }`}
                          disabled={isSubmitting}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Interview Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Record your interview observations and feedback..."
                      {...field}
                      disabled={isSubmitting}
                      className="resize-none"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Record Interview"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
