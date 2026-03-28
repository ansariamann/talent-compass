import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Client } from "@/types/ats";

const INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Education",
  "Consulting",
  "Media & Entertainment",
  "Real Estate",
  "Other",
] as const;

const formSchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  industry: z.enum(INDUSTRIES, { message: "Industry is required" }),
  contactName: z.string().trim().optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Enter a valid contact email"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-()\s]*$/, "Phone can contain only digits and common separators")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "Website must start with http:// or https://",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: Partial<Client>) => void;
}

function getDefaultValues(client?: Client | null): FormValues {
  return {
    name: client?.name || "",
    industry: (client?.industry as FormValues["industry"]) || "Technology",
    contactName: client?.contactName || "",
    contactEmail: client?.contactEmail || "",
    contactPhone: client?.contactPhone || "",
    address: client?.address || "",
    website: client?.website || "",
  };
}

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSubmit,
}: ClientFormModalProps) {
  const isEditing = Boolean(client);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(client),
  });

  useEffect(() => {
    form.reset(getDefaultValues(client));
  }, [client, form, open]);

  const submitValues = (values: FormValues) => {
    onSubmit({
      name: values.name.trim(),
      industry: values.industry,
      contactName: values.contactName?.trim() || "",
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone?.trim() || "",
      address: values.address?.trim() || "",
      website: values.website?.trim() || "",
      isActive: client?.isActive ?? true,
    });
    onOpenChange(false);
    setConfirmOpen(false);
    setPendingValues(null);
  };

  const handleSubmit = (values: FormValues) => {
    if (isEditing) {
      submitValues(values);
      return;
    }
    setPendingValues(values);
    setConfirmOpen(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset(getDefaultValues(client));
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Primary contact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 555-0100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Company address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Save Changes" : "Add Client"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Client And Send Credentials?</AlertDialogTitle>
            <AlertDialogDescription>
              The system will create the client, generate a default login email and temporary password,
              and send those credentials to <strong>{pendingValues?.contactEmail}</strong>.
              The email will also include password reset instructions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <div><strong>Client:</strong> {pendingValues?.name}</div>
            <div><strong>Contact:</strong> {pendingValues?.contactName || "Not provided"}</div>
            <div><strong>Email:</strong> {pendingValues?.contactEmail}</div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingValues(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingValues && submitValues(pendingValues)}>
              Confirm Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
