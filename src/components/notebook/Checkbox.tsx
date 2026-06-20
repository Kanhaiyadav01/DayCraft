import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  id?: string;
}

export function Checkbox({ checked = false, onCheckedChange, label, className, id }: CheckboxProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  return (
    <label
      htmlFor={inputId}
      className={cn("inline-flex items-center gap-2.5 cursor-pointer select-none group", className)}
    >
      <span
        className={cn(
          "relative grid place-items-center h-6 w-6 ink-border bg-card transition-all",
          "rounded-[6px_9px_5px_8px] ink-shadow-sm group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none",
          checked && "bg-accent",
        )}
      >
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
        />
        {checked && (
          <Check
            className="h-4 w-4 text-accent-foreground"
            strokeWidth={3.5}
            // hand-drawn vibe
            style={{ transform: "rotate(-6deg)" }}
          />
        )}
      </span>
      {label && (
        <span
          className={cn(
            "font-body text-base text-ink relative transition-opacity",
            checked && "text-ink-soft",
          )}
        >
          {label}
          {checked && (
            <span
              aria-hidden
              className="absolute left-0 right-0 top-1/2 h-[2px] bg-ink"
              style={{ transform: "translateY(-50%) rotate(-1deg)" }}
            />
          )}
        </span>
      )}
    </label>
  );
}
