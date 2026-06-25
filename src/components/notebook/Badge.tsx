import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-hand text-sm font-medium border-2 border-ink px-2.5 py-0.5 " +
    "rounded-[8px_12px_6px_10px] ink-shadow-sm",
  {
    variants: {
      tone: {
        accent: "bg-accent text-accent-foreground",
        tape: "bg-tape text-ink",
        mint: "bg-mint text-ink",
        coral: "bg-coral text-white",
        sky: "bg-sky text-ink",
        soft: "bg-accent-soft text-ink",
        highlight: "bg-highlight text-ink",
      },
    },
    defaultVariants: { tone: "soft" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
