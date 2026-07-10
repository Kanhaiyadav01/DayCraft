import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Flag, Save } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Input, Tape } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatMS, formatHMS, formatStopwatch, formatStopwatchMs } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/stopwatch")({
  head: () => ({ meta: [{ title: "Stopwatch · DayCraft" }] }),
  component: StopwatchPage,
});

function StopwatchPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0); // ms
  const [laps, setLaps] = React.useState<number[]>([]);
  const [label, setLabel] = React.useState("");
  const startRef = React.useRef<number | null>(null);
  const accRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!running) return;
    const tick = () => {
      const now = performance.now();
      setElapsed(accRef.current + (now - (startRef.current ?? now)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  function toggle() {
    if (running) {
      accRef.current = elapsed;
      startRef.current = null;
      setRunning(false);
    } else {
      startRef.current = performance.now();
      setRunning(true);
    }
  }
  function reset() {
    setRunning(false);
    accRef.current = 0;
    startRef.current = null;
    setElapsed(0);
    setLaps([]);
  }
  function addLap() {
    if (elapsed === 0) return;
    setLaps((l) => [elapsed, ...l]);
  }

  async function save() {
    if (!user || elapsed < 1000) {
      toast.error("Run at least 1 second before saving.");
      return;
    }
    const seconds = Math.floor(elapsed / 1000);
    const { error } = await supabase.from("timer_runs").insert({
      user_id: user.id,
      kind: "stopwatch",
      seconds,
      label: label || null,
      laps: laps.length ? laps.map((ms) => Math.floor(ms / 1000)) : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Saved ${formatHMS(seconds)} to your notebook ✨`);
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    reset();
    setLabel("");
  }

  const lapDeltas = laps.map((ms, i) => (i === laps.length - 1 ? ms : ms - laps[i + 1]));

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 right-12" rotate={6} />
            <h1 className="font-hand text-5xl leading-none">Stopwatch</h1>
            <p className="text-ink-soft mt-1">
              Open-ended timing with laps. Save the whole run when you're done.
            </p>
          </header>

          <Card className="text-center py-12">
            <motion.div
              key={Math.floor(elapsed / 1000)}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              className="font-hand text-7xl sm:text-8xl tabular-nums tracking-tight"
            >
              {formatStopwatch(elapsed)}
              <span className="text-3xl sm:text-4xl text-ink-soft">
                .{formatStopwatchMs(elapsed)}
              </span>
            </motion.div>
            <div className="mt-2 text-ink-soft font-hand text-xl">
              {running ? "tick… tick… tick…" : elapsed > 0 ? "paused" : "ready when you are"}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={toggle} variant={running ? "outline" : "primary"} size="lg">
                {running ? (
                  <>
                    <Pause className="h-5 w-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" /> {elapsed > 0 ? "Resume" : "Start"}
                  </>
                )}
              </Button>
              <Button onClick={addLap} variant="tape" size="lg" disabled={!running}>
                <Flag className="h-5 w-5" /> Lap
              </Button>
              <Button onClick={reset} variant="ghost" size="lg">
                <RotateCcw className="h-5 w-5" /> Reset
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
              <Input
                placeholder="what were you working on?"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Button onClick={save} variant="primary" disabled={elapsed < 1000}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </Card>

          {laps.length > 0 && (
            <Card>
              <h3 className="font-hand text-2xl mb-3">Laps</h3>
              <ul className="divide-y divide-rule">
                {laps.map((ms, i) => (
                  <li key={i} className="py-2 flex items-center justify-between">
                    <Badge tone={i === 0 ? "accent" : "soft"}>Lap {laps.length - i}</Badge>
                    <span className="font-hand text-xl tabular-nums">{formatMS(lapDeltas[i])}</span>
                    <span className="font-body text-sm text-ink-soft tabular-nums">
                      {formatMS(ms)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  );
}
