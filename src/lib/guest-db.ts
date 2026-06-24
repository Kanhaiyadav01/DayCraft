export type GuestNote = {
  id: string;
  title: string | null;
  body: string | null;
  tags: string[];
  pinned: boolean;
  color: string;
  updated_at: string;
  created_at: string;
};

export type GuestTask = {
  id: string;
  text: string;
  done: boolean;
  sort_order: number;
  created_at: string;
};

export type GuestTimerRun = {
  id: string;
  kind: "stopwatch" | "timer" | "focus";
  label: string | null;
  seconds: number;
  created_at: string;
  laps?: number[];
};

export type GuestFocusSession = {
  id: string;
  label: string | null;
  mode: string;
  planned_minutes: number;
  actual_seconds: number;
  completed: boolean;
  started_at: string;
  ended_at: string;
};

export type GuestProfile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

// Generates a unique guest identifier if not present, and stores it.
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "guest-ssr";
  let id = localStorage.getItem("daycraft-guest-id");
  if (!id) {
    id = `guest_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("daycraft-guest-id", id);
  }
  return id;
}

export function getGuestNotes(): GuestNote[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("daycraft-guest-notes");
  return raw ? JSON.parse(raw) : [];
}

export function saveGuestNotes(notes: GuestNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("daycraft-guest-notes", JSON.stringify(notes));
}

export function getGuestTasks(): GuestTask[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("daycraft-guest-tasks");
  return raw ? JSON.parse(raw) : [];
}

export function saveGuestTasks(tasks: GuestTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("daycraft-guest-tasks", JSON.stringify(tasks));
}

export function getGuestTimerRuns(): GuestTimerRun[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("daycraft-guest-timer-runs");
  return raw ? JSON.parse(raw) : [];
}

export function saveGuestTimerRuns(runs: GuestTimerRun[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("daycraft-guest-timer-runs", JSON.stringify(runs));
}

export function getGuestFocusSessions(): GuestFocusSession[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("daycraft-guest-focus-sessions");
  return raw ? JSON.parse(raw) : [];
}

export function saveGuestFocusSessions(sessions: GuestFocusSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("daycraft-guest-focus-sessions", JSON.stringify(sessions));
}

export function getGuestProfile(): GuestProfile {
  if (typeof window === "undefined") {
    return { id: "guest", display_name: "Guest", bio: null, avatar_url: null };
  }
  const raw = localStorage.getItem("daycraft-guest-profile");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return {
    id: getOrCreateGuestId(),
    display_name: "Guest",
    bio: "Cozy planning guest mode ✏️",
    avatar_url: null,
  };
}

export function saveGuestProfile(profile: Partial<GuestProfile>) {
  if (typeof window === "undefined") return;
  const current = getGuestProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem("daycraft-guest-profile", JSON.stringify(updated));
}

export function resetAllGuestData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("daycraft-guest-id");
  localStorage.removeItem("daycraft-guest-notes");
  localStorage.removeItem("daycraft-guest-tasks");
  localStorage.removeItem("daycraft-guest-timer-runs");
  localStorage.removeItem("daycraft-guest-focus-sessions");
  localStorage.removeItem("daycraft-guest-profile");
  localStorage.removeItem("daycraft-today-goal");
}
