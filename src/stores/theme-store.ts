import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME, type ThemeId } from "@/lib/themes";

interface ThemeState {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (id) => set({ theme: id }),
    }),
    {
      name: "timesketch-theme",
      // SSR-safe storage shim
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

/** Applies the active theme to <html data-theme="…"> */
export function useApplyTheme() {
  const theme = useThemeStore((s) => s.theme);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}
