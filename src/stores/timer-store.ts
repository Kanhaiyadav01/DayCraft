import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TimerPreset {
  id: string;
  label: string;
  seconds: number;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { id: "pomodoro", label: "Pomodoro", seconds: 25 * 60 },
  { id: "short-break", label: "Short break", seconds: 5 * 60 },
  { id: "long-break", label: "Long break", seconds: 15 * 60 },
  { id: "deep-work", label: "Deep work", seconds: 50 * 60 },
];

interface TimerState {
  /** total seconds the current cycle is set to */
  duration: number;
  /** absolute epoch ms when timer ends (running) or null */
  endAt: number | null;
  /** seconds remaining when paused; null when not paused */
  pausedRemaining: number | null;
  presetId: string;
  presetLabel: string;
  label: string;
  /** true once duration hit 0; alarm should keep ringing */
  alarming: boolean;

  setPreset: (p: TimerPreset) => void;
  setDurationSeconds: (s: number, label?: string, presetId?: string) => void;
  setLabel: (l: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  stopAlarm: () => void;
  /** internal: called by runner when reaching zero */
  _markComplete: () => void;
}

const FIRST = TIMER_PRESETS[0];

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      duration: FIRST.seconds,
      endAt: null,
      pausedRemaining: FIRST.seconds,
      presetId: FIRST.id,
      presetLabel: FIRST.label,
      label: "",
      alarming: false,

      setPreset: (p) => {
        if (get().endAt) return; // ignore while running
        set({
          presetId: p.id,
          presetLabel: p.label,
          duration: p.seconds,
          pausedRemaining: p.seconds,
          endAt: null,
          alarming: false,
        });
      },
      setDurationSeconds: (s, label, presetId) => {
        if (get().endAt) return;
        set({
          duration: s,
          pausedRemaining: s,
          endAt: null,
          alarming: false,
          ...(label ? { presetLabel: label } : {}),
          ...(presetId ? { presetId } : {}),
        });
      },
      setLabel: (l) => set({ label: l }),
      start: () => {
        const { endAt, pausedRemaining, duration, alarming } = get();
        if (endAt || alarming) return;
        const remaining = pausedRemaining ?? duration;
        if (remaining <= 0) return;
        set({
          endAt: Date.now() + remaining * 1000,
          pausedRemaining: null,
        });
      },
      pause: () => {
        const { endAt } = get();
        if (!endAt) return;
        const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        set({ endAt: null, pausedRemaining: remaining });
      },
      reset: () => {
        set({
          endAt: null,
          pausedRemaining: get().duration,
          alarming: false,
        });
      },
      stopAlarm: () => {
        set({ alarming: false, endAt: null, pausedRemaining: get().duration });
      },
      _markComplete: () => {
        set({ endAt: null, pausedRemaining: 0, alarming: true });
      },
    }),
    {
      name: "daycraft-timer",
      storage: {
        getItem: (k) => {
          if (typeof window === "undefined") return null;
          const v = window.localStorage.getItem(k);
          return v ? JSON.parse(v) : null;
        },
        setItem: (k, v) => {
          if (typeof window === "undefined") return;
          window.localStorage.setItem(k, JSON.stringify(v));
        },
        removeItem: (k) => {
          if (typeof window === "undefined") return;
          window.localStorage.removeItem(k);
        },
      },
    },
  ),
);

/** Pure helper for components that tick: compute remaining seconds. */
export function computeRemaining(
  state: Pick<TimerState, "endAt" | "pausedRemaining" | "duration">,
): number {
  if (state.endAt) return Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
  return Math.max(0, state.pausedRemaining ?? state.duration);
}
