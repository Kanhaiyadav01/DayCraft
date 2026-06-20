import { cn } from "@/lib/utils";

interface TapeProps {
  className?: string;
  rotate?: number;
}

/** A standalone strip of washi tape used as decoration. */
export function Tape({ className, rotate = -3 }: TapeProps) {
  return (
    <span
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn("tape-strip inline-block h-5 w-24", className)}
    />
  );
}
