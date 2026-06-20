import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, X, Sparkles, Trees } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/notebook/Shell";
import { Button, Card, Badge, Input, Tape } from "@/components/notebook";
import { Plant } from "@/components/notebook/Plant";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { alarmPlayer } from "@/lib/alarms";
import { useSoundStore } from "@/stores/sound-store";
import { pickPosition, randomSpecies, stageForMinutes } from "@/lib/garden";
import { checkAndUnlockAchievements } from "@/lib/achievements";
import { formatHMS } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus Mode · TimeSketch" }] }),
  component: FocusPage,
});

const PRESETS = [
  { id: "pomodoro", label: "Pomodoro", minutes: 25, mode: "pomodoro" as const },
  { id: "deepwork", label: "Deep Work", minutes: 50, mode: "deepwork" as const },
  { id: "ultra", label: "Ultra Focus", minutes: 90, mode: "deepwork" as const },
  { id: "study", label: "Study Sprint", minutes: 30, mode: "study" as const },
];

function FocusPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const muted = useSoundStore((s) => s.muted);
  const alarm = useSoundStore((s) => s.alarm);

  const [preset, setPreset] = React.useState(PRESETS[0]);
  const [label, setLabel] = React.useState("");
  const [endAt, setEndAt] = React.useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = React.useState<number>(PRESETS[0].minutes * 60);
  const [now, setNow] = React.useState(Date.now());
  const [immersive, setImmersive] = React.useState(false);
  const [reward, setReward] = React.useState<null | { species: string; stage: string; minutes: number }>(null);
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    if (!endAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt]);

  const totalSeconds = preset.minutes * 60;
  const remaining = endAt
    ? Math.max(0, Math.round((endAt - now) / 1000))
    : pausedRemaining;
  const elapsed = totalSeconds - remaining;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  // Detect completion
  React.useEffect(() => {
    if (endAt && remaining === 0 && !completedRef.current) {
      completedRef.current = true;
      void onComplete(elapsed);
    }
  }, [endAt, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPreset(p: (typeof PRESETS)[number]) {
    if (endAt) return;
    setPreset(p);
    setPausedRemaining(p.minutes * 60);
  }

  function start() {
    if (endAt) return;
    setEndAt(Date.now() + pausedRemaining * 1000);
    setImmersive(true);
    completedRef.current = false;
  }

  function pause() {
    if (!endAt) return;
    const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    setEndAt(null);
    setPausedRemaining(left);
  }

  function reset() {
    setEndAt(null);
    setPausedRemaining(totalSeconds);
    completedRef.current = false;
    alarmPlayer.stop();
  }

  async function endEarly() {
    if (!endAt) {
      setImmersive(false);
      return;
    }
    const elapsedSec = totalSeconds - remaining;
    setEndAt(null);
    setPausedRemaining(totalSeconds);
    if (elapsedSec >= 60 && user) {
      await saveSession(elapsedSec, false);
      toast("Session ended early — saved your progress.");
    }
    setImmersive(false);
  }

  async function onComplete(elapsedSec: number) {
    setEndAt(null);
    setPausedRemaining(totalSeconds);
    if (!muted) alarmPlayer.startLoop(alarm);
    toast.success(`${preset.label} complete! 🌱`);

    if (!user) {
      setReward({ species: "flower", stage: "bloom", minutes: preset.minutes });
      return;
    }
    const session = await saveSession(elapsedSec, true);
    const species = randomSpecies();
    const stage = stageForMinutes(preset.minutes);

    // Place plant on an empty cell of the 8x5 grid
    const { data: existing } = await supabase
      .from("garden_plants")
      .select("position_x, position_y");
    const { x, y } = pickPosition(existing ?? []);
    await supabase.from("garden_plants").insert({
      user_id: user.id,
      session_id: session?.id ?? null,
      species,
      stage,
      position_x: x,
      position_y: y,
    });
    setReward({ species, stage, minutes: preset.minutes });

    await checkAndUnlockAchievements(user.id);
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    qc.invalidateQueries({ queryKey: ["garden"] });
    qc.invalidateQueries({ queryKey: ["achievements"] });
  }

  async function saveSession(seconds: number, completed: boolean) {
    if (!user) return null;
    const startedAt = new Date(Date.now() - seconds * 1000).toISOString();
    const { data } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        mode: preset.mode,
        planned_minutes: preset.minutes,
        actual_seconds: seconds,
        completed,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        label: label || preset.label,
      })
      .select("id")
      .single();
    await supabase.from("timer_runs").insert({
      user_id: user.id,
      kind: "focus",
      seconds,
      label: label || preset.label,
    });
    return data;
  }

  function dismissReward() {
    alarmPlayer.stop();
    setReward(null);
    setImmersive(false);
  }

  // Immersive overlay
  if (immersive) {
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    const hh = Math.floor(remaining / 3600);
    return (
      <div className="fixed inset-0 z-50 bg-paper flex flex-col">
        <div className="flex items-center justify-between p-5">
          <Badge tone="accent">
            <Sparkles className="h-3.5 w-3.5" /> {preset.label}
          </Badge>
          <Button variant="outline" size="sm" onClick={endEarly}>
            <X className="h-4 w-4" /> End session
          </Button>
        </div>
        <div className="flex-1 grid place-items-center px-4">
          <div className="text-center">
            {label && (
              <p className="font-hand text-2xl text-ink-soft mb-4">"{label}"</p>
            )}
            <FocusRing progress={progress} />
            <div className="font-hand text-[clamp(4rem,18vw,12rem)] leading-none mt-6">
              {hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`}
            </div>
            <p className="font-hand text-xl text-ink-soft mt-3">
              Stay sketching. Your garden is growing 🌱
            </p>
            <div className="mt-8 flex justify-center gap-3">
              {endAt ? (
                <Button variant="outline" onClick={pause}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              ) : (
                <Button onClick={start}>
                  <Play className="h-4 w-4" /> Resume
                </Button>
              )}
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {reward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center bg-ink/40 p-4"
            >
              <motion.div
                initial={{ y: 30, scale: 0.85 }}
                animate={{ y: 0, scale: 1 }}
                className="paper-card p-7 max-w-md w-full text-center relative"
              >
                <Tape className="absolute -top-3 left-1/2 -translate-x-1/2" rotate={-3} />
                <h2 className="font-hand text-4xl">A plant has sprouted! 🌱</h2>
                <p className="text-ink-soft mt-2">
                  {reward.minutes} minutes of focus earned a {reward.stage} for your garden.
                </p>
                <div className="my-5 grid place-items-center">
                  <Plant species={reward.species as never} stage={reward.stage as never} size={140} />
                </div>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => navigate({ to: "/garden" })}>
                    <Trees className="h-4 w-4" /> Visit garden
                  </Button>
                  <Button variant="outline" onClick={dismissReward}>
                    Keep going
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="relative paper-card p-7">
            <Tape className="absolute -top-3 left-10" rotate={-4} />
            <p className="font-hand text-xl text-ink-soft">deep work</p>
            <h1 className="font-hand text-5xl">
              <span className="highlight-marker">Focus Mode</span>
            </h1>
            <p className="text-ink-soft mt-2 max-w-lg">
              Pick a session length, name your intention, and let your garden grow with every
              minute of focused work.
            </p>
          </header>

          <Card>
            <h3 className="font-hand text-2xl mb-3">Choose a session</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={`ink-border rounded-[12px_16px_10px_14px] p-3 text-left transition-all ink-shadow-sm hover:-translate-y-0.5 ${
                    preset.id === p.id ? "bg-accent text-accent-foreground" : "bg-card"
                  }`}
                >
                  <div className="font-hand text-2xl leading-none">{p.minutes}m</div>
                  <div className="font-body text-sm mt-1">{p.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <label className="font-hand text-lg block mb-1">Intention (optional)</label>
              <Input
                placeholder="e.g. Outline chapter 3"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="font-hand text-4xl">{formatHMS(remaining)}</div>
              <div className="flex gap-2">
                <Button onClick={start}>
                  <Play className="h-4 w-4" /> Start focus
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card tilt="left">
            <h3 className="font-hand text-2xl mb-2">How it works</h3>
            <ul className="space-y-1.5 text-ink-soft font-body">
              <li>• Sessions over 1 minute are saved to your history.</li>
              <li>• Completing a session plants something new in your garden.</li>
              <li>• Longer sessions grow into bigger plants — try Deep Work for a bloom.</li>
              <li>• Achievements unlock as you build your streak.</li>
            </ul>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function FocusRing({ progress }: { progress: number }) {
  const r = 110;
  const c = 2 * Math.PI * r;
  return (
    <svg width={260} height={260} viewBox="0 0 260 260" className="mx-auto">
      <circle cx="130" cy="130" r={r} fill="none" stroke="var(--rule)" strokeWidth="6" />
      <circle
        cx="130"
        cy="130"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
        transform="rotate(-90 130 130)"
        style={{ transition: "stroke-dashoffset 0.4s linear" }}
      />
    </svg>
  );
}
