import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ALARM, type AlarmId } from "@/lib/alarms";

interface SoundState {
  alarm: AlarmId;
  muted: boolean;
  alarmMode: "notification" | "repeat" | "continuous";
  customSoundData: string | null;
  customSoundName: string | null;
  volume: number;
  setAlarm: (id: AlarmId) => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
  setAlarmMode: (mode: "notification" | "repeat" | "continuous") => void;
  setCustomSound: (data: string | null, name: string | null) => void;
  setVolume: (v: number) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      alarm: DEFAULT_ALARM,
      muted: false,
      alarmMode: "notification",
      customSoundData: null,
      customSoundName: null,
      volume: 0.8,
      setAlarm: (id) => set({ alarm: id }),
      setMuted: (m) => set({ muted: m }),
      toggleMuted: () => set({ muted: !get().muted }),
      setAlarmMode: (mode) => set({ alarmMode: mode }),
      setCustomSound: (data, name) => set({ customSoundData: data, customSoundName: name }),
      setVolume: (v) => set({ volume: v }),
    }),
    {
      name: "daycraft-sound",
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
