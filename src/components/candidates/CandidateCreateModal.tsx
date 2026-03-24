import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreateCandidate } from "@/hooks/useCandidates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const candidateStatuses = [
  { value: "new", label: "Active" },
  { value: "selected", label: "Selected" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Left" },
  { value: "on_hold", label: "Inactive" },
] as const;

const statusValues = ["new", "selected", "hired", "rejected", "withdrawn", "on_hold"] as const;

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().min(0, "Value must be 0 or more").optional()
);

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-()\s]*$/, "Phone can contain only digits and common separators")
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(255, "Company is too long").optional().or(z.literal("")),
  location: z.string().trim().max(255, "Location is too long").optional().or(z.literal("")),
  presentAddress: z.string().trim().optional().or(z.literal("")),
  permanentAddress: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  keySkill: z.string().trim().optional().or(z.literal("")),
  skills: z.string().trim().optional().or(z.literal("")),
  experience: z.coerce.number().min(0, "Experience must be 0 or more").max(60, "Experience is too high"),
  ctcCurrent: optionalNonNegativeNumber,
  ctcExpected: optionalNonNegativeNumber,
  status: z.enum(statusValues),
  remark: z.string().trim().optional().or(z.literal("")),
  previousEmployment: z.string().trim().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.dateOfBirth) {
    const parsedDate = new Date(data.dateOfBirth);
    if (Number.isNaN(parsedDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Enter a valid date of birth",
      });
    } else if (parsedDate > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Date of birth cannot be in the future",
      });
    }
  }

  if (data.previousEmployment) {
    try {
      const parsed = JSON.parse(data.previousEmployment);
      if (!Array.isArray(parsed)) {
        throw new Error("Previous employment must be a JSON array");
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["previousEmployment"],
        message: "Previous employment must be a valid JSON array",
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface CandidateCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateCreateModal({
  open,
  onOpenChange,
}: CandidateCreateModalProps) {
  const createCandidate = useCreateCandidate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      location: "",
      presentAddress: "",
      permanentAddress: "",
      dateOfBirth: "",
      keySkill: "",
      skills: "",
      experience: 0,
      ctcCurrent: undefined,
      ctcExpected: undefined,
      status: "new",
      remark: "",
      previousEmployment: "",
    },
  });

  const previousEmploymentPlaceholder = useMemo(
    () =>
      JSON.stringify(
        [
          {
            company: "Example Corp",
            title: "Software Engineer",
            start_date: "2022-01-01",
            end_date: "2024-12-31",
          },
        ],
        null,
        2
      ),
    []
  );

  const handleSubmit = async (values: FormValues) => {
    try {
      await createCandidate.mutateAsync({
        name: values.name.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        company: values.company?.trim() || undefined,
        location: values.location?.trim() || undefined,
        presentAddress: values.presentAddress?.trim() || undefined,
        permanentAddress: values.permanentAddress?.trim() || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        keySkill: values.keySkill?.trim() || undefined,
        skills: values.skills
          ? values.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
          : [],
        experience: values.experience,
        ctcCurrent: values.ctcCurrent,
        ctcExpected: values.ctcExpected,
        currentStatus: values.status,
        remark: values.remark?.trim() || undefined,
        previousEmployment: values.previousEmployment
          ? JSON.parse(values.previousEmployment)
          : undefined,
      });

      toast.success("Candidate added to the database");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create candidate");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Candidate</DialogTitle>
          <DialogDescription>
            Create a candidate directly in the master database without resume upload.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Candidate full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="candidate@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 9876543210" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Most Recent Company</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Current or most recent company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City, State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience (Years)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.1"
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {candidateStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="ctcCurrent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current CTC</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === "" ? undefined : event.target.value
                          )
                        }
                        placeholder="Current CTC"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctcExpected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected CTC</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === "" ? undefined : event.target.value
                          )
                        }
                        placeholder="Expected CTC"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="keySkill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Skill</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Short key skill summary" />
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
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Comma-separated skills, for example: Python, Django, PostgreSQL"
                      />
                    </FormControl>
                    <FormDescription>
                      Skills are stored in the database as structured JSON.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Present Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="Current address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permanentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="Permanent address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remark</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Internal remarks or notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousEmployment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Employment</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={8}
                        placeholder={previousEmploymentPlaceholder}
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a JSON array if you want to persist full employment history.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCandidate.isPending}>
                {createCandidate.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Candidate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
