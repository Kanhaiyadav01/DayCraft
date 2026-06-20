import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-hand text-lg font-bold select-none " +
    "border-2 border-ink transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] " +
    "active:shadow-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-hidden " +
    "focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground ink-shadow hover:-translate-y-[1px]",
        ghost: "bg-transparent text-ink border-transparent hover:bg-accent-soft",
        outline: "bg-card text-ink ink-shadow-sm hover:-translate-y-[1px]",
        tape: "bg-tape text-ink ink-shadow-sm -rotate-1 hover:rotate-0",
        danger: "bg-coral text-white ink-shadow hover:-translate-y-[1px]",
      },
      size: {
        sm: "h-9 px-3 text-base rounded-[10px_14px_8px_12px]",
        md: "h-11 px-5 rounded-[12px_16px_10px_14px]",
        lg: "h-14 px-7 text-xl rounded-[14px_20px_12px_18px]",
        icon: "h-10 w-10 rounded-[12px_16px_10px_14px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
