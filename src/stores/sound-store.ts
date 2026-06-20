import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ALARM, type AlarmId } from "@/lib/alarms";

interface SoundState {
  alarm: AlarmId;
  muted: boolean;
  setAlarm: (id: AlarmId) => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      alarm: DEFAULT_ALARM,
      muted: false,
      setAlarm: (id) => set({ alarm: id }),
      setMuted: (m) => set({ muted: m }),
      toggleMuted: () => set({ muted: !get().muted }),
    }),
    {
      name: "timesketch-sound",
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
