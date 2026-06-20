import * as React from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "accent" | "mint" | "coral" | "sky" | "tape";
  className?: string;
}

const toneBg: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  accent: "bg-accent text-accent-foreground",
  mint: "bg-mint text-ink",
  coral: "bg-coral text-white",
  sky: "bg-sky text-ink",
  tape: "bg-tape text-ink",
};

export function StatsCard({ label, value, hint, icon, tone = "accent", className }: StatsCardProps) {
  return (
    <Card className={cn("flex items-start gap-4", className)} tilt="left">
      {icon && (
        <span
          className={cn(
            "grid place-items-center h-12 w-12 ink-border rounded-[12px_16px_10px_14px] ink-shadow-sm shrink-0",
            toneBg[tone],
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="font-hand text-3xl leading-none">{value}</div>
        <div className="mt-1 text-sm text-ink-soft uppercase tracking-wide">{label}</div>
        {hint && <div className="mt-1.5 text-sm text-ink-soft">{hint}</div>}
      </div>
    </Card>
  );
}
