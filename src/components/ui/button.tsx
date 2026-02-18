import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13.5px] font-medium ring-offset-background transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Solid Apple-blue primary
        default:     "bg-primary text-primary-foreground shadow-sm hover:brightness-[1.07] active:brightness-[0.94]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:brightness-[1.07] active:brightness-[0.94]",
        // Bordered — Apple's secondary button style
        outline:     "border border-border bg-background text-foreground hover:bg-secondary active:bg-muted",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-muted active:bg-border",
        ghost:       "text-foreground hover:bg-secondary active:bg-muted",
        link:        "text-primary underline-offset-4 hover:underline",
        // ATS semantic variants — tinted pill style
        status:      "bg-primary/10 text-primary hover:bg-primary/16 border border-primary/20",
        success:     "bg-[hsl(var(--status-success)/0.10)] text-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success)/0.16)] border border-[hsl(var(--status-success)/0.25)]",
        warning:     "bg-[hsl(var(--status-warning)/0.10)] text-[hsl(var(--status-warning))] hover:bg-[hsl(var(--status-warning)/0.16)] border border-[hsl(var(--status-warning)/0.25)]",
        danger:      "bg-[hsl(var(--status-error)/0.10)]   text-[hsl(var(--status-error))]   hover:bg-[hsl(var(--status-error)/0.16)]   border border-[hsl(var(--status-error)/0.25)]",
        glow:        "bg-primary text-primary-foreground shadow-md hover:brightness-[1.07]",
      },
      size: {
        default:  "h-9 px-4 py-2",
        sm:       "h-7 rounded-md px-3 text-xs",
        lg:       "h-11 rounded-xl px-6 text-[15px]",
        icon:     "h-9 w-9",
        "icon-sm":"h-7 w-7",
        xl:       "h-12 rounded-xl px-8 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
