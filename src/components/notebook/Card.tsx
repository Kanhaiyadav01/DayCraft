import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add a piece of washi tape at the top */
  taped?: boolean;
  /** Slight rotation for personality */
  tilt?: "left" | "right" | "none";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, taped, tilt = "none", children, ...props }, ref) => {
    const tiltClass =
      tilt === "left" ? "-rotate-[0.6deg]" : tilt === "right" ? "rotate-[0.6deg]" : "";
    return (
      <div
        ref={ref}
        className={cn(
          "relative paper-card p-5 transition-transform duration-200 hover:-translate-y-[2px]",
          tiltClass,
          className,
        )}
        {...props}
      >
        {taped && (
          <span
            aria-hidden
            className="tape-strip absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-20 -rotate-2"
          />
        )}
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-start justify-between gap-3", className)} {...p} />;
}
export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-hand text-lg font-semibold leading-none", className)} {...p} />;
}
export function CardDescription({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-soft", className)} {...p} />;
}
export function CardContent({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-body text-base", className)} {...p} />;
}
export function CardFooter({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex items-center gap-2", className)} {...p} />;
}
