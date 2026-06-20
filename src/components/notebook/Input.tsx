import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full bg-card border-b-2 border-ink px-3 font-body text-base text-ink",
        "placeholder:text-ink-soft placeholder:italic",
        "focus:outline-hidden focus:border-accent focus:bg-accent-soft/40",
        "rounded-t-[10px_14px_8px_12px] transition-colors",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full bg-card ink-border p-3 font-body text-base text-ink",
      "placeholder:text-ink-soft placeholder:italic",
      "focus:outline-hidden focus:ring-3 focus:ring-accent",
      "rounded-[12px_16px_10px_14px] ink-shadow-sm resize-y",
      // ruled-paper background
      "[background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_27px,color-mix(in_oklab,var(--rule)_50%,transparent)_27px,color-mix(in_oklab,var(--rule)_50%,transparent)_28px)] " +
        "[background-size:100%_28px]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
