import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants for ATS
        success: "border-transparent bg-status-success/15 text-status-success",
        warning: "border-transparent bg-status-warning/15 text-status-warning",
        error: "border-transparent bg-status-error/15 text-status-error",
        info: "border-transparent bg-status-info/15 text-status-info",
        pending: "border-transparent bg-status-pending/15 text-status-pending",
        neutral: "border-border bg-muted text-muted-foreground",
        // Flag types
        verified: "border-status-success/30 bg-status-success/10 text-status-success",
        priority: "border-status-warning/30 bg-status-warning/10 text-status-warning",
        duplicate: "border-status-error/30 bg-status-error/10 text-status-error",
        incomplete: "border-status-warning/30 bg-status-warning/10 text-status-warning",
        internal: "border-status-info/30 bg-status-info/10 text-status-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
