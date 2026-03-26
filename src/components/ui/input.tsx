import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-xl border text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input bg-background focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10",
        ghost: "border-transparent bg-muted/50 hover:bg-muted focus:bg-muted",
        search: "border-border/40 bg-card/60 backdrop-blur-md pl-9 shadow-sm hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 focus-visible:border-primary/50 focus-visible:shadow-lg focus-visible:shadow-primary/10 focus-visible:bg-card/80",
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-2 py-1 text-xs",
        lg: "h-11 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
