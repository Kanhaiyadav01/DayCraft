import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { THEMES, type ThemeMeta } from "@/lib/themes";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import { Tape } from "./Tape";

export interface ThemePickerProps {
  /** "grid" for full picker, "compact" for inline list */
  variant?: "grid" | "compact";
  className?: string;
}

export function ThemePicker({ variant = "grid", className }: ThemePickerProps) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-label={t.name}
            className={cn(
              "h-9 w-9 rounded-full ink-border ink-shadow-sm transition-transform hover:-translate-y-0.5",
              theme === t.id && "ring-3 ring-accent ring-offset-2 ring-offset-paper",
            )}
            style={{
              background: `conic-gradient(${t.swatches.paper} 0 25%, ${t.swatches.tape} 0 50%, ${t.swatches.accent} 0 75%, ${t.swatches.ink} 0 100%)`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {THEMES.map((t) => (
        <ThemeSwatchCard
          key={t.id}
          theme={t}
          active={theme === t.id}
          onPick={() => setTheme(t.id)}
        />
      ))}
    </div>
  );
}

function ThemeSwatchCard({
  theme,
  active,
  onPick,
}: {
  theme: ThemeMeta;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      whileHover={{ y: -3, rotate: -0.4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative text-left paper-card p-0 overflow-hidden",
        active && "ring-3 ring-accent ring-offset-2 ring-offset-paper",
      )}
      style={{ background: theme.swatches.paper, color: theme.swatches.ink }}
    >
      <Tape className="absolute -top-2 left-6 h-4 w-16" rotate={-6} />

      {/* mini "preview page" */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between">
          <h4 className="font-hand text-2xl leading-none">
            {theme.emoji} {theme.name}
          </h4>
          {active && (
            <span
              className="grid place-items-center h-7 w-7 rounded-full ink-shadow-sm"
              style={{
                background: theme.swatches.accent,
                color: theme.swatches.paper,
                border: `2px solid ${theme.swatches.ink}`,
              }}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="mt-1 text-sm opacity-70">{theme.tagline}</p>

        {/* sample chips */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className="h-7 px-3 grid place-items-center rounded-[8px_12px_6px_10px] text-xs font-bold"
            style={{
              background: theme.swatches.accent,
              color: theme.swatches.paper,
              border: `2px solid ${theme.swatches.ink}`,
              boxShadow: `2px 2px 0 0 ${theme.swatches.ink}`,
            }}
          >
            Button
          </span>
          <span
            className="h-7 px-3 grid place-items-center rounded-[8px_12px_6px_10px] text-xs font-bold"
            style={{
              background: theme.swatches.tape,
              color: theme.swatches.ink,
              border: `2px solid ${theme.swatches.ink}`,
              boxShadow: `2px 2px 0 0 ${theme.swatches.ink}`,
            }}
          >
            Tape
          </span>
          <span
            className="h-7 w-7 rounded-full"
            style={{ background: theme.swatches.ink, border: `2px solid ${theme.swatches.ink}` }}
          />
        </div>

        {/* faux ruled lines */}
        <div
          className="mt-4 h-12 rounded-md"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 11px, ${theme.swatches.ink}22 11px, ${theme.swatches.ink}22 12px)`,
          }}
        />
      </div>
    </motion.button>
  );
}
