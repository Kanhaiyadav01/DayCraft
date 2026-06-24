import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  VolumeX,
  Volume2,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/notebook/Shell";
import { Button, Card, Badge, Input, Tape, Modal } from "@/components/notebook";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { alarmPlayer } from "@/lib/alarms";
import { useSoundStore } from "@/stores/sound-store";
import { checkAndUnlockAchievements } from "@/lib/achievements";
import { formatHMS } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus Mode · DayCraft" }] }),
  component: FocusPage,
});

/* ─── Preset Types ─── */

interface FocusPreset {
  id: string;
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cycles: number;
  isDefault?: boolean;
}

const DEFAULT_PRESETS: FocusPreset[] = [
  {
    id: "pomodoro",
    name: "Pomodoro",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cycles: 4,
    isDefault: true,
  },
  {
    id: "deepwork",
    name: "Deep Work",
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    cycles: 2,
    isDefault: true,
  },
  {
    id: "quickfocus",
    name: "Quick Focus",
    focusMinutes: 15,
    shortBreakMinutes: 3,
    longBreakMinutes: 5,
    cycles: 3,
    isDefault: true,
  },
];

const LOCAL_KEY = "daycraft-custom-focus-presets";

/* ─── Multi-Cycle State Machine Types ─── */

type SessionPhase = "focus" | "shortBreak" | "longBreak";

interface CycleState {
  currentCycle: number;
  currentPhase: SessionPhase;
}

/* ─── Component ─── */

function FocusPage() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const muted = useSoundStore((s) => s.muted);
  const alarm = useSoundStore((s) => s.alarm);
  const alarmMode = useSoundStore((s) => s.alarmMode);
  const volume = useSoundStore((s) => s.volume);
  const customSoundData = useSoundStore((s) => s.customSoundData);

  /* ── Custom Presets persistence ── */
  const [customPresets, setCustomPresets] = React.useState<FocusPreset[]>([]);

  // Load custom presets from localStorage or Supabase
  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-profile");
        return local ? JSON.parse(local) : null;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  React.useEffect(() => {
    // Load from profile if authenticated, else from localStorage
    if (profileData?.custom_presets) {
      const presets = profileData.custom_presets as FocusPreset[];
      if (Array.isArray(presets)) setCustomPresets(presets);
    } else {
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        try {
          setCustomPresets(JSON.parse(local));
        } catch {
          /* ignore */
        }
      }
    }
  }, [profileData]);

  async function saveCustomPresets(presets: FocusPreset[]) {
    setCustomPresets(presets);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(presets));
    if (user && !isGuest) {
      await supabase.from("profiles").upsert({
        id: user.id,
        custom_presets: presets as unknown,
      });
    }
  }

  /* ── Session State ── */
  const allPresets = [...DEFAULT_PRESETS, ...customPresets];
  const [preset, setPreset] = React.useState<FocusPreset>(DEFAULT_PRESETS[0]);
  const [label, setLabel] = React.useState("");
  const [endAt, setEndAt] = React.useState<number | null>(null);
  const [cycleState, setCycleState] = React.useState<CycleState>({
    currentCycle: 1,
    currentPhase: "focus",
  });
  const [pausedRemaining, setPausedRemaining] = React.useState<number>(
    DEFAULT_PRESETS[0].focusMinutes * 60,
  );
  const [now, setNow] = React.useState(Date.now());
  const [immersive, setImmersive] = React.useState(false);
  const [sessionComplete, setSessionComplete] = React.useState(false);
  const [alarmActive, setAlarmActive] = React.useState(false);
  const completedRef = React.useRef(false);
  const totalFocusSecondsRef = React.useRef(0);

  // Modal state for creating/editing custom presets
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState<FocusPreset | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formFocus, setFormFocus] = React.useState("25");
  const [formShortBreak, setFormShortBreak] = React.useState("5");
  const [formLongBreak, setFormLongBreak] = React.useState("15");
  const [formCycles, setFormCycles] = React.useState("4");
  const [formErrors, setFormErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!endAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt]);

  const phaseDuration = React.useMemo(() => {
    switch (cycleState.currentPhase) {
      case "focus":
        return preset.focusMinutes * 60;
      case "shortBreak":
        return preset.shortBreakMinutes * 60;
      case "longBreak":
        return preset.longBreakMinutes * 60;
    }
  }, [preset, cycleState.currentPhase]);

  const remaining = endAt ? Math.max(0, Math.round((endAt - now) / 1000)) : pausedRemaining;
  const elapsed = phaseDuration - remaining;
  const progress = phaseDuration > 0 ? elapsed / phaseDuration : 0;

  /* ── Estimated completion time ── */
  const estimatedCompletion = React.useMemo(() => {
    if (!endAt && !immersive) return null;
    let totalRemainingSec = remaining;

    // Add remaining phases in this cycle
    const { currentCycle, currentPhase } = cycleState;
    const totalCycles = preset.cycles;

    // After current phase, what's left in this cycle?
    if (currentPhase === "focus") {
      // Still need break after this focus
      const isLastCycle = currentCycle === totalCycles;
      totalRemainingSec += isLastCycle
        ? preset.longBreakMinutes * 60
        : preset.shortBreakMinutes * 60;
    }
    // If in break, just remaining break time for this cycle

    // Add subsequent full cycles
    for (let c = currentCycle + 1; c <= totalCycles; c++) {
      totalRemainingSec += preset.focusMinutes * 60;
      const isLast = c === totalCycles;
      totalRemainingSec += isLast ? preset.longBreakMinutes * 60 : preset.shortBreakMinutes * 60;
    }

    const completionDate = new Date(Date.now() + totalRemainingSec * 1000);
    return completionDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }, [remaining, cycleState, preset, endAt, immersive]);

  /* ── Detect phase completion ── */
  React.useEffect(() => {
    if (endAt && remaining === 0 && !completedRef.current) {
      completedRef.current = true;
      handlePhaseComplete();
    }
  }, [endAt, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePhaseComplete() {
    setEndAt(null);
    setAlarmActive(true);

    // Play alarm
    if (!muted) {
      alarmPlayer.start(alarm, alarmMode, customSoundData, volume);
    }

    const { currentCycle, currentPhase } = cycleState;

    if (currentPhase === "focus") {
      // Track focus time
      totalFocusSecondsRef.current += preset.focusMinutes * 60;

      // Transition to break
      const isLastCycle = currentCycle === preset.cycles;
      const nextPhase: SessionPhase = isLastCycle ? "longBreak" : "shortBreak";
      const breakDuration = isLastCycle
        ? preset.longBreakMinutes * 60
        : preset.shortBreakMinutes * 60;

      setCycleState({ currentCycle, currentPhase: nextPhase });
      setPausedRemaining(breakDuration);
      toast.success(`Focus period complete! Time for a ${isLastCycle ? "long" : "short"} break 🌿`);
    } else {
      // Break complete
      if (currentCycle >= preset.cycles) {
        // Entire session complete!
        setSessionComplete(true);
        toast.success(`${preset.name} session complete! All ${preset.cycles} cycles done! 🎉`);
        void onSessionComplete(totalFocusSecondsRef.current);
      } else {
        // Move to next cycle's focus
        const nextCycle = currentCycle + 1;
        setCycleState({ currentCycle: nextCycle, currentPhase: "focus" });
        setPausedRemaining(preset.focusMinutes * 60);
        toast.success(`Break's over! Starting cycle ${nextCycle} of ${preset.cycles} 📝`);
      }
    }
  }

  function selectPreset(p: FocusPreset) {
    if (endAt) return;
    setPreset(p);
    setCycleState({ currentCycle: 1, currentPhase: "focus" });
    setPausedRemaining(p.focusMinutes * 60);
    setSessionComplete(false);
    totalFocusSecondsRef.current = 0;
  }

  function start() {
    if (endAt || sessionComplete) return;
    setEndAt(Date.now() + pausedRemaining * 1000);
    setImmersive(true);
    completedRef.current = false;
    setAlarmActive(false);
  }

  function pause() {
    if (!endAt) return;
    const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    setEndAt(null);
    setPausedRemaining(left);
  }

  function reset() {
    setEndAt(null);
    setCycleState({ currentCycle: 1, currentPhase: "focus" });
    setPausedRemaining(preset.focusMinutes * 60);
    completedRef.current = false;
    setSessionComplete(false);
    totalFocusSecondsRef.current = 0;
    stopAlarm();
  }

  function stopAlarm() {
    alarmPlayer.stop();
    setAlarmActive(false);
  }

  function muteAlarm() {
    alarmPlayer.stop();
  }

  function replayAlarm() {
    if (!muted) {
      alarmPlayer.start(alarm, alarmMode, customSoundData, volume);
    }
  }

  async function endEarly() {
    if (!endAt) {
      setImmersive(false);
      stopAlarm();
      return;
    }
    const elapsedSec = phaseDuration - remaining;
    setEndAt(null);
    setPausedRemaining(preset.focusMinutes * 60);
    setCycleState({ currentCycle: 1, currentPhase: "focus" });
    if (elapsedSec >= 60 && user) {
      await saveSession(
        totalFocusSecondsRef.current + (cycleState.currentPhase === "focus" ? elapsedSec : 0),
        false,
      );
      toast("Session ended early — saved your progress.");
    }
    setImmersive(false);
    stopAlarm();
  }

  async function onSessionComplete(totalFocusSec: number) {
    if (!user) return;
    await saveSession(totalFocusSec, true);
    await checkAndUnlockAchievements(user.id);
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    qc.invalidateQueries({ queryKey: ["achievements"] });
  }

  async function saveSession(seconds: number, completed: boolean) {
    if (!user) return null;
    const startedAt = new Date(Date.now() - seconds * 1000).toISOString();
    if (isGuest) {
      const localFs = localStorage.getItem("daycraft-guest-focus-sessions");
      const sessions = localFs ? JSON.parse(localFs) : [];
      const newSession = {
        id: `g-focus-${Math.random().toString(36).slice(2, 9)}`,
        mode: preset.isDefault ? preset.id : "custom",
        planned_minutes: preset.focusMinutes * preset.cycles,
        actual_seconds: seconds,
        completed,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        label: label || preset.name,
      };
      sessions.push(newSession);
      localStorage.setItem("daycraft-guest-focus-sessions", JSON.stringify(sessions));

      const localTr = localStorage.getItem("daycraft-guest-timer-runs");
      const runs = localTr ? JSON.parse(localTr) : [];
      runs.push({
        id: `g-run-${Math.random().toString(36).slice(2, 9)}`,
        kind: "focus",
        seconds,
        label: label || preset.name,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("daycraft-guest-timer-runs", JSON.stringify(runs));
      return newSession;
    }
    const { data } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        mode: (preset.isDefault ? preset.id : "custom") as
          | "pomodoro"
          | "deepwork"
          | "study"
          | "custom"
          | "free",
        planned_minutes: preset.focusMinutes * preset.cycles,
        actual_seconds: seconds,
        completed,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        label: label || preset.name,
      })
      .select("id")
      .single();
    await supabase.from("timer_runs").insert({
      user_id: user.id,
      kind: "focus",
      seconds,
      label: label || preset.name,
    });
    return data;
  }

  function dismissReward() {
    stopAlarm();
    setImmersive(false);
    setSessionComplete(false);
    setCycleState({ currentCycle: 1, currentPhase: "focus" });
    setPausedRemaining(preset.focusMinutes * 60);
    totalFocusSecondsRef.current = 0;
  }

  /* ── Custom Preset Form ── */

  function openCreateForm() {
    setEditingPreset(null);
    setFormName("");
    setFormFocus("25");
    setFormShortBreak("5");
    setFormLongBreak("15");
    setFormCycles("4");
    setFormErrors([]);
    setFormOpen(true);
  }

  function openEditForm(p: FocusPreset) {
    setEditingPreset(p);
    setFormName(p.name);
    setFormFocus(String(p.focusMinutes));
    setFormShortBreak(String(p.shortBreakMinutes));
    setFormLongBreak(String(p.longBreakMinutes));
    setFormCycles(String(p.cycles));
    setFormErrors([]);
    setFormOpen(true);
  }

  function validateForm(): string[] {
    const errors: string[] = [];
    const name = formName.trim();
    if (!name) errors.push("Name is required.");
    const focus = Number(formFocus);
    if (!focus || focus <= 0) errors.push("Focus minutes must be greater than 0.");
    const shortBreak = Number(formShortBreak);
    if (shortBreak < 0) errors.push("Short break cannot be negative.");
    const longBreak = Number(formLongBreak);
    if (longBreak < 0) errors.push("Long break cannot be negative.");
    const cycles = Number(formCycles);
    if (!cycles || cycles < 1) errors.push("Cycles must be at least 1.");

    // Check for duplicate names
    const existing = allPresets.filter((p) => (editingPreset ? p.id !== editingPreset.id : true));
    if (existing.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      errors.push("A preset with this name already exists.");
    }
    return errors;
  }

  function handleSavePreset() {
    const errors = validateForm();
    if (errors.length) {
      setFormErrors(errors);
      return;
    }
    const newPreset: FocusPreset = {
      id: editingPreset?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: formName.trim(),
      focusMinutes: Number(formFocus),
      shortBreakMinutes: Number(formShortBreak),
      longBreakMinutes: Number(formLongBreak),
      cycles: Number(formCycles),
    };

    let updated: FocusPreset[];
    if (editingPreset) {
      updated = customPresets.map((p) => (p.id === editingPreset.id ? newPreset : p));
      // If the currently selected preset was edited, update it
      if (preset.id === editingPreset.id) {
        selectPreset(newPreset);
      }
    } else {
      updated = [...customPresets, newPreset];
    }
    void saveCustomPresets(updated);
    setFormOpen(false);
    toast.success(editingPreset ? "Session updated!" : "Session created!");
  }

  function handleDeletePreset(id: string) {
    const updated = customPresets.filter((p) => p.id !== id);
    void saveCustomPresets(updated);
    if (preset.id === id) {
      selectPreset(DEFAULT_PRESETS[0]);
    }
    toast.success("Session deleted.");
  }

  /* ── Phase label ── */
  function phaseLabel(): string {
    switch (cycleState.currentPhase) {
      case "focus":
        return "Focus";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
    }
  }

  /* ── Immersive overlay ── */
  if (immersive) {
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    const hh = Math.floor(remaining / 3600);
    return (
      <div className="fixed inset-0 z-50 bg-paper flex flex-col">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <Badge tone="accent">
              <Sparkles className="h-3.5 w-3.5" /> {preset.name}
            </Badge>
            <Badge tone={cycleState.currentPhase === "focus" ? "mint" : "coral"}>
              {phaseLabel()} · Cycle {cycleState.currentCycle} of {preset.cycles}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={endEarly}>
            <X className="h-4 w-4" /> End session
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto grid place-items-center px-4 py-2 sm:py-6">
          <div className="text-center w-full max-w-lg mx-auto flex flex-col items-center justify-center">
            {label && <p className="font-hand text-lg sm:text-2xl text-ink-soft mb-2">"{label}"</p>}
            <FocusRing progress={progress} phase={cycleState.currentPhase} />
            <div className="font-hand text-[clamp(3rem,8vh,6rem)] leading-none mt-2 sm:mt-4">
              {hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`}
            </div>

            {/* Phase & Cycle Info */}
            <div className="mt-2 space-y-1">
              <p className="font-hand text-xl text-ink-soft">
                {phaseLabel()} · Cycle {cycleState.currentCycle} of {preset.cycles}
              </p>
              {estimatedCompletion && (
                <p className="font-body text-sm text-ink-soft opacity-75">
                  Est. completion: {estimatedCompletion}
                </p>
              )}
            </div>

            {/* Session complete banner */}
            {sessionComplete && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 p-4 paper-card bg-accent/10 text-center"
              >
                <p className="font-hand text-2xl">🎉 Session Complete!</p>
                <p className="text-ink-soft text-sm mt-1">
                  All {preset.cycles} cycles of {preset.name} finished.
                </p>
                <Button className="mt-3" onClick={dismissReward}>
                  Done
                </Button>
              </motion.div>
            )}

            {/* Alarm controls */}
            {alarmActive && (
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="danger" onClick={stopAlarm}>
                  <VolumeX className="h-4 w-4" /> Stop Alarm
                </Button>
                <Button variant="outline" onClick={muteAlarm}>
                  Mute
                </Button>
                <Button variant="outline" onClick={replayAlarm}>
                  <RotateCw className="h-4 w-4" /> Replay
                </Button>
              </div>
            )}

            {!sessionComplete && (
              <>
                <p className="font-hand text-base sm:text-lg italic text-ink-soft opacity-75 max-w-sm mt-3 mb-2 text-center select-none">
                  {cycleState.currentPhase === "focus"
                    ? "\u201cTime is what we want most, but what we use worst.\u201d"
                    : "\u201cRest is not idleness.\u201d"}
                </p>
                <div className="mt-3 sm:mt-6 flex justify-center gap-3">
                  {endAt ? (
                    <Button variant="outline" onClick={pause}>
                      <Pause className="h-4 w-4" /> Pause
                    </Button>
                  ) : !alarmActive ? (
                    <Button onClick={start}>
                      <Play className="h-4 w-4" />{" "}
                      {remaining === phaseDuration ? "Start" : "Resume"}
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
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
              Pick a session length, name your intention, and track your focus sessions in your cozy
              notebook.
            </p>
          </header>

          {/* ── Default Presets ── */}
          <Card>
            <h3 className="font-hand text-2xl mb-3">Default Sessions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={`ink-border rounded-[12px_16px_10px_14px] p-4 text-left transition-all ink-shadow-sm hover:-translate-y-0.5 ${
                    preset.id === p.id ? "bg-accent text-accent-foreground" : "bg-card"
                  }`}
                >
                  <div className="font-hand text-2xl leading-none">
                    {p.focusMinutes}m / {p.shortBreakMinutes}m
                  </div>
                  <div className="font-body text-sm mt-1">{p.name}</div>
                  <div className="font-body text-xs text-ink-soft mt-0.5">{p.cycles} cycles</div>
                </button>
              ))}
            </div>
          </Card>

          {/* ── Custom Presets ("My Sessions") ── */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-hand text-2xl">My Sessions</h3>
              <Button variant="outline" size="sm" onClick={openCreateForm}>
                <Plus className="h-4 w-4" /> Create New Session
              </Button>
            </div>
            {customPresets.length === 0 ? (
              <p className="text-ink-soft text-sm font-body">
                No custom sessions yet. Create one to get started!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customPresets.map((p) => (
                  <div
                    key={p.id}
                    className={`ink-border rounded-[12px_16px_10px_14px] p-4 text-left transition-all ink-shadow-sm hover:-translate-y-0.5 relative group ${
                      preset.id === p.id ? "bg-accent text-accent-foreground" : "bg-card"
                    }`}
                  >
                    <button className="block w-full text-left" onClick={() => selectPreset(p)}>
                      <div className="font-hand text-xl leading-none">{p.name}</div>
                      <div className="font-body text-sm mt-1">
                        {p.focusMinutes}m focus · {p.shortBreakMinutes}m break · {p.cycles} cycles
                      </div>
                      {p.longBreakMinutes > 0 && (
                        <div className="font-body text-xs text-ink-soft mt-0.5">
                          Long break: {p.longBreakMinutes}m
                        </div>
                      )}
                    </button>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(p);
                        }}
                        className="p-1.5 rounded-full hover:bg-ink/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(p.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Active Session Controls ── */}
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-hand text-2xl">{preset.name}</h3>
                <p className="text-ink-soft text-sm font-body">
                  {preset.focusMinutes}m focus · {preset.shortBreakMinutes}m short break ·{" "}
                  {preset.longBreakMinutes}m long break · {preset.cycles} cycles
                </p>
              </div>
              <Badge
                tone={cycleState.currentPhase === "focus" ? "mint" : "coral"}
                className="shrink-0"
              >
                {phaseLabel()} · Cycle {cycleState.currentCycle}/{preset.cycles}
              </Badge>
            </div>

            <div className="mt-3">
              <label className="font-hand text-lg block mb-1">Intention (optional)</label>
              <Input
                placeholder="e.g. Outline chapter 3"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-hand text-4xl">{formatHMS(remaining)}</div>
                {estimatedCompletion && (
                  <p className="font-body text-xs text-ink-soft mt-1">
                    Est. completion: {estimatedCompletion}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={start} disabled={sessionComplete}>
                  <Play className="h-4 w-4" /> Start {phaseLabel().toLowerCase()}
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
              <li>• Choose a built-in or custom session with focus/break intervals.</li>
              <li>• Each session runs through multiple focus + break cycles.</li>
              <li>• Sessions over 1 minute are saved to your history.</li>
              <li>• Custom sounds and alarm modes play when each phase completes.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* ── Create/Edit Session Modal ── */}
      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingPreset ? "Edit Session" : "Create New Session"}
        description="Configure your focus and break intervals."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              {editingPreset ? "Save Changes" : "Create Session"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              {formErrors.map((err, i) => (
                <p key={i} className="text-red-600 text-sm">
                  {err}
                </p>
              ))}
            </div>
          )}
          <label className="block">
            <span className="block font-hand text-lg mb-1">Session Name</span>
            <Input
              placeholder="e.g. Deep Study"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block font-hand text-base mb-1">Focus (min)</span>
              <Input
                type="number"
                min="1"
                value={formFocus}
                onChange={(e) => setFormFocus(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block font-hand text-base mb-1">Short Break (min)</span>
              <Input
                type="number"
                min="0"
                value={formShortBreak}
                onChange={(e) => setFormShortBreak(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block font-hand text-base mb-1">Long Break (min)</span>
              <Input
                type="number"
                min="0"
                value={formLongBreak}
                onChange={(e) => setFormLongBreak(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block font-hand text-base mb-1">Cycles</span>
              <Input
                type="number"
                min="1"
                value={formCycles}
                onChange={(e) => setFormCycles(e.target.value)}
              />
            </label>
          </div>
        </div>
      </Modal>
    </Shell>
  );
}

/* ── Focus Ring ── */

function FocusRing({ progress, phase }: { progress: number; phase: SessionPhase }) {
  const r = 110;
  const c = 2 * Math.PI * r;
  const strokeColor = phase === "focus" ? "var(--accent)" : "var(--mint, #34d399)";
  return (
    <svg
      viewBox="0 0 260 260"
      className="mx-auto w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] max-w-full max-h-[25vh]"
    >
      <circle cx="130" cy="130" r={r} fill="none" stroke="var(--rule)" strokeWidth="6" />
      <circle
        cx="130"
        cy="130"
        r={r}
        fill="none"
        stroke={strokeColor}
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
