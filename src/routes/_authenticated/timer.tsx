import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Coffee,
  Brain,
  BookOpen,
  VolumeX,
  Volume2,
} from "lucide-react";
import { Badge, Button, Card, Input, Tape } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { formatHMS } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  computeRemaining,
  TIMER_PRESETS,
  useTimerStore,
  type TimerPreset,
} from "@/stores/timer-store";
import { useSoundStore } from "@/stores/sound-store";

export const Route = createFileRoute("/_authenticated/timer")({
  head: () => ({ meta: [{ title: "Timer · DayCraft" }] }),
  component: TimerPage,
});

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pomodoro: Brain,
  "short-break": Coffee,
  "long-break": Coffee,
  "deep-work": BookOpen,
};

function TimerPage() {
  const timer = useTimerStore();
  const { muted, toggleMuted } = useSoundStore();

  const [hh, setHh] = React.useState("");
  const [mm, setMm] = React.useState("");
  const [ss, setSs] = React.useState("");

  // Local 250ms ticker so the visible clock updates smoothly. The source of
  // truth is the store's absolute `endAt`, so unmounting/navigating away does
  // NOT pause the timer.
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!timer.endAt) return;
    const id = window.setInterval(force, 250);
    return () => clearInterval(id);
  }, [timer.endAt]);

  const remaining = computeRemaining(timer);
  const running = !!timer.endAt;
  const progress = timer.duration > 0 ? 1 - remaining / timer.duration : 0;

  function applyPreset(p: TimerPreset) {
    timer.setPreset(p);
  }
  function applyCustom() {
    const h = Math.max(0, parseInt(hh || "0", 10) || 0);
    const m = Math.max(0, parseInt(mm || "0", 10) || 0);
    const s = Math.max(0, parseInt(ss || "0", 10) || 0);
    const total = h * 3600 + m * 60 + s;
    if (total <= 0 || total > 24 * 3600) return;
    const label = `Custom ${h ? h + "h " : ""}${m ? m + "m " : ""}${s ? s + "s" : ""}`.trim();
    timer.setDurationSeconds(total, label, "custom");
    setHh("");
    setMm("");
    setSs("");
  }

  const size = 280;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 left-12" rotate={-5} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-hand text-5xl leading-none">Timer</h1>
                <p className="text-ink-soft mt-1">
                  Pick a preset, label your focus, and let the page count down.
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMuted}
                aria-label={muted ? "Unmute alarm" : "Mute alarm"}
                title={muted ? "Unmute alarm" : "Mute alarm"}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </header>

          <Card>
            <div className="grid gap-2 sm:grid-cols-4">
              {TIMER_PRESETS.map((p) => {
                const active = timer.presetId === p.id;
                const Icon = PRESET_ICONS[p.id] ?? Brain;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    disabled={running || timer.alarming}
                    className={cn(
                      "flex items-center gap-2 px-3 py-3 ink-border rounded-[10px_14px_8px_12px] font-hand text-lg text-left",
                      "transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0",
                      active
                        ? "bg-accent text-accent-foreground ink-shadow"
                        : "bg-card ink-shadow-sm",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block leading-none">{p.label}</span>
                      <span className="block text-xs opacity-70 mt-0.5">
                        {Math.round(p.seconds / 60)} min
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <LabeledNumber label="hh" value={hh} onChange={setHh} max={24} disabled={running} />
              <LabeledNumber label="mm" value={mm} onChange={setMm} max={59} disabled={running} />
              <LabeledNumber label="ss" value={ss} onChange={setSs} max={59} disabled={running} />
              <Button
                variant="outline"
                size="sm"
                onClick={applyCustom}
                disabled={running || (!hh && !mm && !ss)}
              >
                Set custom
              </Button>
            </div>
          </Card>

          <Card className="text-center py-10">
            <div
              className="relative inline-grid place-items-center"
              style={{ width: size, height: size }}
            >
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="var(--rule)"
                  strokeWidth={stroke}
                />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: C * (1 - progress) }}
                  transition={{ duration: 0.4 }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div>
                  <div className="font-hand text-6xl tabular-nums leading-none">
                    {formatHMS(remaining)}
                  </div>
                  <div className="font-hand text-lg text-ink-soft mt-2">{timer.presetLabel}</div>
                  {timer.alarming && (
                    <div className="font-hand text-base text-accent mt-2 animate-pulse">
                      ⏰ ringing…
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {timer.alarming ? (
                <>
                  <Button onClick={timer.stopAlarm} variant="primary" size="lg">
                    <Square className="h-5 w-5" /> Stop alarm
                  </Button>
                  <Button
                    onClick={() => {
                      timer.stopAlarm();
                      timer.reset();
                    }}
                    variant="ghost"
                    size="lg"
                  >
                    <RotateCcw className="h-5 w-5" /> Reset
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => (running ? timer.pause() : timer.start())}
                    variant={running ? "outline" : "primary"}
                    size="lg"
                  >
                    {running ? (
                      <>
                        <Pause className="h-5 w-5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />{" "}
                        {remaining < timer.duration ? "Resume" : "Start"}
                      </>
                    )}
                  </Button>
                  <Button onClick={timer.reset} variant="ghost" size="lg">
                    <RotateCcw className="h-5 w-5" /> Reset
                  </Button>
                </>
              )}
            </div>

            <div className="mt-6 max-w-md mx-auto">
              <Input
                placeholder="what's the focus? (optional)"
                value={timer.label}
                onChange={(e) => timer.setLabel(e.target.value)}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge tone="soft">{Math.round(progress * 100)}% complete</Badge>
              {muted && <Badge tone="coral">muted</Badge>}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  max,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  max: number;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-hand text-xs text-ink-soft">{label}</span>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-20 text-center"
      />
    </label>
  );
}
