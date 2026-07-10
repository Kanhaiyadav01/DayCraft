import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Save,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button, Card, Input, Tape, Toggle, QuickChecklist } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { useAuth } from "@/hooks/use-auth";
import { formatHMS, formatMS, computeStreak, formatStopwatch, formatStopwatchMs } from "@/lib/time";
import { useTimerStore, computeRemaining } from "@/stores/timer-store";
import { useSoundStore } from "@/stores/sound-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · DayCraft" }] }),
  component: DashboardPage,
});

// Inline SVG doodles to match the handwritten cozy notebook style, with state-based animations
function StopwatchClock({ running }: { running: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(
        "w-14 h-14 text-ink opacity-70 shrink-0 transition-transform",
        running && "animate-[ts-wiggle_0.5s_ease-in-out_infinite]",
      )}
    >
      <circle cx="50" cy="55" r="28" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path
        d="M 28 28 A 10 10 0 0 1 42 22 L 35 25 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M 72 28 A 10 10 0 0 0 58 22 L 65 25 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path d="M 32 80 L 22 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 68 80 L 78 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M 45 22 L 50 17 L 55 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {running ? (
        // Awake face when running
        <>
          <circle cx="42" cy="50" r="2.5" fill="currentColor" />
          <circle cx="58" cy="50" r="2.5" fill="currentColor" />
          <path
            d="M 45 60 C 47 63, 53 63, 55 60"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        // Sleeping face + Zzz when stopped
        <>
          <path
            d="M 38 52 C 38 54, 44 54, 44 52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 56 52 C 56 54, 62 54, 62 52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 46 64 C 48 66, 52 66, 54 64"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <text x="72" y="28" className="font-hand text-lg fill-current animate-pulse">
            Z
          </text>
          <text x="78" y="22" className="font-hand text-sm fill-current animate-pulse delay-75">
            z
          </text>
          <text x="84" y="17" className="font-hand text-xs fill-current animate-pulse delay-150">
            z
          </text>
        </>
      )}
    </svg>
  );
}

function StopwatchStickFigure({ running }: { running: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(
        "w-12 h-20 text-ink opacity-70 shrink-0",
        running && "animate-[ts-bounce-soft_0.6s_ease-in-out_infinite]",
      )}
    >
      <circle cx="50" cy="25" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="47" cy="23" r="1.5" fill="currentColor" />
      <circle cx="53" cy="23" r="1.5" fill="currentColor" />
      <path
        d="M 47 28 C 48 29.5, 52 29.5, 53 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {running ? (
        // Running pose body lines
        <>
          <path d="M 50 35 L 48 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M 50 42 L 72 32 L 80 42"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 48 42 L 28 45 L 20 35"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 48 60 L 32 75 L 22 70"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 48 60 L 62 70 L 72 85"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        // Standing pose body lines
        <>
          <path d="M 50 35 L 50 65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 50 42 L 72 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 50 42 L 30 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 50 65 L 35 85" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M 50 65 L 62 75 L 72 90"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function TimerClock({ running, alarming }: { running: boolean; alarming: boolean }) {
  const animateClass = alarming
    ? "animate-[ts-wiggle_0.25s_ease-in-out_infinite]"
    : running
      ? "animate-[ts-wiggle_0.5s_ease-in-out_infinite]"
      : "";

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-14 h-14 text-ink opacity-70 shrink-0 transition-transform", animateClass)}
    >
      <circle cx="50" cy="55" r="28" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path
        d="M 28 28 A 10 10 0 0 1 42 22 L 35 25 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M 72 28 A 10 10 0 0 0 58 22 L 65 25 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path d="M 32 80 L 22 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 68 80 L 78 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M 45 22 L 50 17 L 55 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {running || alarming ? (
        // Open mouth ringing face (Mockup design)
        <>
          <line
            x1="38"
            y1="46"
            x2="42"
            y2="52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="42"
            y1="46"
            x2="38"
            y2="52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="58"
            y1="46"
            x2="62"
            y2="52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="46"
            x2="58"
            y2="52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="62" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        </>
      ) : (
        // Sleeping face + Zzz when stopped
        <>
          <path
            d="M 38 52 C 38 54, 44 54, 44 52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 56 52 C 56 54, 62 54, 62 52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 46 64 C 48 66, 52 66, 54 64"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <text x="72" y="28" className="font-hand text-lg fill-current animate-pulse">
            Z
          </text>
          <text x="78" y="22" className="font-hand text-sm fill-current animate-pulse delay-75">
            z
          </text>
          <text x="84" y="17" className="font-hand text-xs fill-current animate-pulse delay-150">
            z
          </text>
        </>
      )}
    </svg>
  );
}

function TimerStickFigure({ running }: { running: boolean }) {
  return (
    <div className="flex flex-col items-center select-none shrink-0">
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "w-12 h-20 text-ink opacity-70",
          running && "animate-[ts-wiggle_1.1s_ease-in-out_infinite]",
        )}
      >
        <circle cx="50" cy="25" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
        {running ? (
          <>
            <circle cx="50" cy="25" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="50" cy="25" r="1" fill="currentColor" />
          </>
        ) : (
          <>
            <circle cx="47" cy="23" r="1" fill="currentColor" />
            <circle cx="53" cy="23" r="1" fill="currentColor" />
            <path
              d="M 47 28 C 48 29.5, 52 29.5, 53 28"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
        <path d="M 50 35 L 50 65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {running ? (
          // Dynamic ticking pose arms
          <>
            <path
              d="M 50 42 L 75 42"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 50 42 L 25 50"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          // Standing pose arms
          <>
            <path
              d="M 50 42 C 35 45, 35 55, 50 55"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 50 42 C 65 45, 65 55, 50 55"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
        <path d="M 50 65 L 42 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 50 65 L 58 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {running && (
        <span className="font-hand text-[9px] font-bold text-ink-soft animate-pulse uppercase leading-none mt-1 tracking-wider">
          TICK TOCK!
        </span>
      )}
    </div>
  );
}

function TargetCrosshair() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14 text-ink opacity-10 shrink-0">
      <circle
        cx="50"
        cy="50"
        r="30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
      <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      <path d="M 50 10 L 50 90" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      <path d="M 10 50 L 90 50" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}

function StickFigureGoal() {
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16 text-ink opacity-40 shrink-0 ml-auto mt-2">
      <circle cx="50" cy="30" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="47" cy="28" r="1" fill="currentColor" />
      <circle cx="53" cy="28" r="1" fill="currentColor" />
      <path
        d="M 46 33 C 48 34.5, 52 34.5, 54 33"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M 50 40 L 50 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M 50 45 L 30 35 L 20 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 50 45 L 70 35 L 80 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 50 70 L 40 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M 50 70 L 60 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      <path
        d="M 68 25 C 68 18, 92 18, 92 25 C 92 30, 80 32, 75 32 L 72 36 L 73 32 C 68 32, 68 25, 68 25 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="var(--card)"
      />
      <text
        x="80"
        y="27"
        className="font-hand text-[7px] text-center font-bold fill-current"
        textAnchor="middle"
      >
        Yes you did!
      </text>
    </svg>
  );
}

function DashboardPage() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const timer = useTimerStore();
  const { muted, setMuted } = useSoundStore();

  // ── Database queries ──────────────────────────────────────────
  const { data: runsData } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-timer-runs");
        return local ? JSON.parse(local) : [];
      }
      const { data } = await supabase
        .from("timer_runs")
        .select("seconds, created_at, kind, label")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: recentLapsHistory } = useQuery({
    queryKey: ["recent-laps-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-timer-runs");
        const runs = local ? JSON.parse(local) : [];
        const swRuns = runs.filter(
          (r: { kind: string; laps?: unknown }) => r.kind === "stopwatch" && r.laps,
        );
        if (swRuns.length > 0) {
          swRuns.sort(
            (a: { created_at: string }, b: { created_at: string }) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          return (swRuns[0].laps as unknown[]) ?? [];
        }
        return [];
      }
      const { data } = await supabase
        .from("timer_runs")
        .select("laps")
        .eq("kind", "stopwatch")
        .not("laps", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data?.laps as number[] | null) ?? [];
    },
  });

  const streak = React.useMemo(() => computeStreak(runsData ?? []), [runsData]);

  // ── Stopwatch widget logic ────────────────────────────────────
  const [swRunning, setSwRunning] = React.useState(false);
  const [swElapsed, setSwElapsed] = React.useState(0); // ms
  const [swLaps, setSwLaps] = React.useState<number[]>([]); // ms
  const [swLabel, setSwLabel] = React.useState("");
  const swStartRef = React.useRef<number | null>(null);
  const swAccRef = React.useRef(0);
  const swRafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!swRunning) return;
    const tick = () => {
      const now = performance.now();
      setSwElapsed(swAccRef.current + (now - (swStartRef.current ?? now)));
      swRafRef.current = requestAnimationFrame(tick);
    };
    swRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (swRafRef.current) cancelAnimationFrame(swRafRef.current);
    };
  }, [swRunning]);

  function handleSwToggle() {
    if (swRunning) {
      swAccRef.current = swElapsed;
      swStartRef.current = null;
      setSwRunning(false);
    } else {
      swStartRef.current = performance.now();
      setSwRunning(true);
    }
  }

  function handleSwReset() {
    setSwRunning(false);
    swAccRef.current = 0;
    swStartRef.current = null;
    setSwElapsed(0);
    setSwLaps([]);
  }

  function handleSwLap() {
    if (swElapsed === 0) return;
    setSwLaps((l) => [swElapsed, ...l]);
  }

  async function saveStopwatch() {
    if (!user || swElapsed < 1000) {
      toast.error("Run at least 1 second before saving.");
      return;
    }
    const seconds = Math.floor(swElapsed / 1000);
    if (isGuest) {
      const local = localStorage.getItem("daycraft-guest-timer-runs");
      const runs = local ? JSON.parse(local) : [];
      runs.push({
        id: `g-run-${Math.random().toString(36).slice(2, 9)}`,
        kind: "stopwatch",
        seconds,
        label: swLabel || null,
        laps: swLaps.length ? swLaps.map((ms) => Math.floor(ms / 1000)) : null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("daycraft-guest-timer-runs", JSON.stringify(runs));
    } else {
      const { error } = await supabase.from("timer_runs").insert({
        user_id: user.id,
        kind: "stopwatch",
        seconds,
        label: swLabel || null,
        laps: swLaps.length ? swLaps.map((ms) => Math.floor(ms / 1000)) : null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    toast.success(`Saved stopwatch run: ${formatHMS(seconds)} ✨`);
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    qc.invalidateQueries({ queryKey: ["recent-laps-history"] });
    handleSwReset();
    setSwLabel("");
  }

  // ── Timer widget logic ────────────────────────────────────────
  const [timerHh, setTimerHh] = React.useState(1);
  const [timerMm, setTimerMm] = React.useState(20);
  const [timerSs, setTimerSs] = React.useState(0);

  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!timer.endAt) return;
    const id = window.setInterval(forceUpdate, 250);
    return () => clearInterval(id);
  }, [timer.endAt]);

  const remaining = computeRemaining(timer);
  const timerRunning = !!timer.endAt;

  const displayHh = timerRunning ? Math.floor(remaining / 3600) : timerHh;
  const displayMm = timerRunning ? Math.floor((remaining % 3600) / 60) : timerMm;
  const displaySs = timerRunning ? remaining % 60 : timerSs;

  function adjustTimer(unit: "h" | "m" | "s", delta: number) {
    if (timerRunning) return;
    if (unit === "h") {
      setTimerHh((h) => Math.max(0, Math.min(24, h + delta)));
    } else if (unit === "m") {
      setTimerMm((m) => Math.max(0, Math.min(59, m + delta)));
    } else {
      setTimerSs((s) => Math.max(0, Math.min(59, s + delta)));
    }
  }

  function handleTimerToggle() {
    if (timer.alarming) {
      timer.stopAlarm();
      return;
    }
    if (timerRunning) {
      timer.pause();
    } else {
      const total = timerHh * 3600 + timerMm * 60 + timerSs;
      if (total <= 0) {
        toast.error("Set a duration before starting.");
        return;
      }
      timer.setDurationSeconds(total, "Dashboard focus", "dashboard");
      timer.start();
    }
  }

  function handleTimerReset() {
    timer.reset();
    setTimerHh(1);
    setTimerMm(20);
    setTimerSs(0);
  }

  // ── Today's Goal logic ────────────────────────────────────────
  const [todayGoal, setTodayGoal] = React.useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("daycraft-today-goal") ||
        "Stay focused and finish what you started! 💪"
      );
    }
    return "";
  });

  const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTodayGoal(val);
    localStorage.setItem("daycraft-today-goal", val);
  };

  // ── Laps to display ───────────────────────────────────────────
  const activeLaps =
    swLaps.length > 0 ? swLaps.map((ms) => Math.floor(ms / 1000)) : recentLapsHistory || [];

  return (
    <Shell>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* ── LEFT COLUMN: Stopwatch & Timer ──────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stopwatch Card */}
              <Card className="relative overflow-hidden flex flex-col p-6 min-h-[300px] justify-between">
                <Tape className="absolute -top-3 left-10" rotate={-3} />

                {/* Header Tag */}
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    tone="coral"
                    className="font-hand text-lg border-ink uppercase font-bold px-3"
                  >
                    Stopwatch
                  </Badge>
                  <div className="flex items-center gap-1.5 opacity-55">
                    <span className="w-3.5 h-3.5 border border-ink rounded-sm" />
                    <span className="w-3.5 h-3.5 border border-ink rotate-45 rounded-sm" />
                  </div>
                </div>

                {/* Main display row */}
                <div className="flex items-center justify-between gap-4 my-2">
                  <StopwatchClock running={swRunning} />
                  <motion.div
                    key={Math.floor(swElapsed / 1000)}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="font-hand text-6xl sm:text-7xl tabular-nums tracking-tight font-bold text-center flex-1"
                  >
                    {formatStopwatch(swElapsed)}
                    <span className="text-2xl sm:text-3xl text-ink-soft">
                      .{formatStopwatchMs(swElapsed)}
                    </span>
                  </motion.div>
                  <StopwatchStickFigure running={swRunning} />
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <Button
                    onClick={handleSwToggle}
                    variant="outline"
                    className={cn(
                      "font-hand text-xl px-6 py-2.5 flex items-center gap-2 transition-transform cursor-pointer text-ink font-bold",
                      swRunning ? "bg-card" : "bg-mint",
                    )}
                  >
                    {swRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    {swRunning ? "Pause" : swElapsed > 0 ? "Resume" : "Start"}
                  </Button>

                  <Button
                    onClick={handleSwReset}
                    variant="outline"
                    className="font-hand text-xl px-6 py-2.5 bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 font-bold"
                  >
                    <RotateCcw className="h-5 w-5" /> Reset
                  </Button>

                  <Button
                    onClick={handleSwLap}
                    disabled={!swRunning}
                    variant="outline"
                    className="font-hand text-xl px-6 py-2.5 bg-muted text-ink hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer flex items-center gap-2 border-ink font-bold"
                  >
                    <Flag className="h-5 w-5" /> Lap
                  </Button>
                </div>

                {/* Save Input & Button */}
                {swElapsed >= 1000 && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto w-full">
                    <Input
                      placeholder="What were you working on?"
                      value={swLabel}
                      onChange={(e) => setSwLabel(e.target.value)}
                      className="flex-1 min-w-[200px]"
                    />
                    <Button
                      onClick={saveStopwatch}
                      className="bg-accent text-accent-foreground flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" /> Save
                    </Button>
                  </div>
                )}
              </Card>

              {/* Timer Card */}
              <Card className="relative overflow-hidden flex flex-col p-6 min-h-[340px] justify-between">
                <Tape className="absolute -top-3 right-12" rotate={4} />

                {/* Header Tag */}
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    tone="accent"
                    className="font-hand text-lg border-ink uppercase font-bold px-3"
                  >
                    Timer
                  </Badge>
                  <div className="flex items-center gap-1.5 opacity-55">
                    <span className="w-3.5 h-3.5 border border-ink rounded-sm" />
                    <span className="w-3.5 h-3.5 border border-ink rotate-45 rounded-sm" />
                  </div>
                </div>

                {/* Timer Clock Display */}
                <div className="flex items-center justify-between gap-4 my-2">
                  <TimerClock running={timerRunning} alarming={timer.alarming} />

                  {timerRunning ? (
                    <div className="font-hand text-6xl sm:text-7xl font-bold tabular-nums text-center flex-1">
                      {formatHMS(remaining)}
                      <div className="text-sm font-body text-ink-soft mt-1.5">
                        {timer.alarming ? "⏰ Ringing..." : "Focus session running"}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 flex-1 select-none">
                      {/* Hours box */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => adjustTimer("h", 1)}
                          className="hover:text-accent cursor-pointer"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={24}
                          value={displayHh === 0 ? "" : displayHh}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(24, parseInt(e.target.value) || 0));
                            setTimerHh(val);
                          }}
                          placeholder="00"
                          disabled={timerRunning}
                          className="w-14 h-14 border-2 border-ink rounded-md flex items-center justify-center font-hand text-3xl bg-card font-bold text-center outline-hidden focus:ring-2 focus:ring-accent select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => adjustTimer("h", -1)}
                          className="hover:text-accent cursor-pointer"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] text-ink-soft font-body mt-0.5">HOURS</span>
                      </div>

                      <span className="font-hand text-3xl font-bold mb-5">:</span>

                      {/* Minutes box */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => adjustTimer("m", 1)}
                          className="hover:text-accent cursor-pointer"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={displayMm === 0 ? "" : displayMm}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                            setTimerMm(val);
                          }}
                          placeholder="00"
                          disabled={timerRunning}
                          className="w-14 h-14 border-2 border-ink rounded-md flex items-center justify-center font-hand text-3xl bg-card font-bold text-center outline-hidden focus:ring-2 focus:ring-accent select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => adjustTimer("m", -1)}
                          className="hover:text-accent cursor-pointer"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] text-ink-soft font-body mt-0.5">MINUTES</span>
                      </div>

                      <span className="font-hand text-3xl font-bold mb-5">:</span>

                      {/* Seconds box */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => adjustTimer("s", 1)}
                          className="hover:text-accent cursor-pointer"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={displaySs === 0 ? "" : displaySs}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                            setTimerSs(val);
                          }}
                          placeholder="00"
                          disabled={timerRunning}
                          className="w-14 h-14 border-2 border-ink rounded-md flex items-center justify-center font-hand text-3xl bg-card font-bold text-center outline-hidden focus:ring-2 focus:ring-accent select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => adjustTimer("s", -1)}
                          className="hover:text-accent cursor-pointer"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] text-ink-soft font-body mt-0.5">SECONDS</span>
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-center justify-center w-12 h-20">
                    <div className="absolute inset-0 grid place-items-center opacity-30">
                      <TargetCrosshair />
                    </div>
                    <TimerStickFigure running={timerRunning} />
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  {timer.alarming ? (
                    <Button
                      onClick={timer.stopAlarm}
                      variant="outline"
                      className="font-hand text-xl px-6 py-2.5 bg-accent text-accent-foreground hover:-translate-y-0.5 cursor-pointer animate-pulse text-ink font-bold"
                    >
                      Stop Alarm
                    </Button>
                  ) : (
                    <Button
                      onClick={handleTimerToggle}
                      variant="outline"
                      className={cn(
                        "font-hand text-xl px-6 py-2.5 flex items-center gap-2 transition-transform cursor-pointer text-ink font-bold",
                        timerRunning ? "bg-card" : "bg-mint",
                      )}
                    >
                      {timerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      {timerRunning ? "Pause" : remaining < timer.duration ? "Resume" : "Start"}
                    </Button>
                  )}

                  <Button
                    onClick={handleTimerReset}
                    variant="outline"
                    className="font-hand text-xl px-6 py-2.5 bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 font-bold"
                  >
                    <RotateCcw className="h-5 w-5" /> Reset
                  </Button>
                </div>

                {/* Sound Toggle Footer */}
                <div className="mt-4 flex items-center gap-3 pt-2">
                  <span className="font-hand text-lg leading-none">Sound:</span>
                  <Toggle
                    checked={!muted}
                    onCheckedChange={(v) => setMuted(!v)}
                    label={muted ? "Off 🔇" : "On 🔊"}
                  />
                </div>
              </Card>
            </div>

            {/* ── RIGHT COLUMN: Today's Goal, Streak, Checklist, Recent Laps ── */}
            <div className="space-y-6">
              {/* Today's Goal */}
              <Card className="relative p-5">
                <Tape className="absolute -top-3 left-10" rotate={-5} />
                <h3 className="font-hand text-2xl flex items-center gap-1.5 mb-2">
                  Today's Goal <span className="text-yellow-500">⭐</span>
                </h3>
                <div className="flex gap-3 items-start">
                  <textarea
                    value={todayGoal}
                    onChange={handleGoalChange}
                    className="w-full bg-transparent font-body text-base border-none outline-none resize-none h-[80px]"
                    placeholder="Jot down your primary goal..."
                  />
                  <StickFigureGoal />
                </div>
              </Card>

              {/* Streak Card */}
              <Card className="p-5 flex items-center gap-4 bg-accent-soft relative">
                <Tape className="absolute -top-3 right-6 h-4 w-12" rotate={3} />
                <span className="grid place-items-center h-12 w-12 ink-border rounded-full bg-coral text-white shrink-0">
                  <Flame className="h-6 w-6 animate-pulse" />
                </span>
                <div>
                  <h4 className="font-hand text-xl leading-none">Daily Streak</h4>
                  <div className="font-hand text-3xl font-bold mt-1 text-ink">{streak} Days</div>
                  <p className="text-[11px] text-ink-soft font-body">Keep the flame burning 🔥</p>
                </div>
              </Card>

              {/* Quick Notes Checklist */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3 border-b border-rule pb-1.5">
                  <h3 className="font-hand text-2xl flex items-center gap-1.5">
                    <BookOpen className="h-5 w-5 text-mint" /> Quick Notes
                  </h3>
                  <Badge tone="mint">today</Badge>
                </div>
                <QuickChecklist limit={6} />
              </Card>

              {/* Recent Laps */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3 border-b border-rule pb-1.5">
                  <h3 className="font-hand text-2xl flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" /> Recent Laps
                  </h3>
                </div>

                {activeLaps && activeLaps.length > 0 ? (
                  <ul className="divide-y divide-rule font-body max-h-[160px] overflow-y-auto pr-1">
                    {activeLaps.map((seconds, i) => (
                      <li key={i} className="py-1.5 flex items-center justify-between text-sm">
                        <Badge tone={i === 0 ? "accent" : "soft"}>
                          Lap {activeLaps.length - i}
                        </Badge>
                        <span className="font-hand text-base tabular-nums font-bold">
                          {formatHMS(seconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-soft text-sm font-body">No stopwatch laps recorded yet.</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
