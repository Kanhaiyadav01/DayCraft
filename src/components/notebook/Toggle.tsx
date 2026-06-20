import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}

export function Toggle({ checked, onCheckedChange, label, className }: ToggleProps) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-7 w-14 ink-border rounded-full transition-colors ink-shadow-sm",
          checked ? "bg-accent" : "bg-paper-2",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] h-[22px] w-[22px] rounded-full bg-card ink-border transition-transform duration-200",
            checked && "translate-x-[28px]",
          )}
        />
      </button>
      {label && <span className="font-body text-base text-ink">{label}</span>}
    </label>
  );
}
