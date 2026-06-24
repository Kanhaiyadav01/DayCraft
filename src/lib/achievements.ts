import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeStreak } from "./time";

/**
 * Recompute the user's stats and unlock any newly earned achievements.
 * Idempotent: relies on the (user_id, achievement_id) PK to avoid duplicates.
 */
export async function checkAndUnlockAchievements(userId: string) {
  const [
    { data: achievements },
    { data: unlocked },
    { data: sessions },
    { data: runs },
    { data: notes },
    { data: plants },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("achievements").select("id, name, icon, category, threshold"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabase.from("focus_sessions").select("id, completed").eq("user_id", userId),
    supabase.from("timer_runs").select("seconds, created_at").eq("user_id", userId),
    supabase.from("notes").select("id").eq("user_id", userId),
    supabase.from("garden_plants").select("id").eq("user_id", userId),
    supabase.from("tasks").select("id").eq("user_id", userId).eq("done", true),
  ]);

  const have = new Set((unlocked ?? []).map((u) => u.achievement_id));

  const completedSessions = (sessions ?? []).filter((s) => s.completed).length;
  const totalSeconds = (runs ?? []).reduce((s, r) => s + (r.seconds ?? 0), 0);
  const noteCount = notes?.length ?? 0;
  const plantCount = plants?.length ?? 0;
  const taskCount = tasks?.length ?? 0;
  const streak = computeStreak(runs ?? []);

  const stats: Record<string, number> = {
    focus: completedSessions,
    time: totalSeconds,
    streak,
    notes: noteCount,
    garden: plantCount,
    tasks: taskCount,
  };

  const newlyUnlocked = (achievements ?? []).filter((a) => {
    if (have.has(a.id)) return false;
    const value = stats[a.category] ?? 0;
    return value >= a.threshold;
  });

  if (newlyUnlocked.length === 0) return [];

  await supabase
    .from("user_achievements")
    .insert(newlyUnlocked.map((a) => ({ user_id: userId, achievement_id: a.id })));

  for (const a of newlyUnlocked) {
    toast.success(`${a.icon} Achievement unlocked: ${a.name}`, { duration: 6000 });
  }
  return newlyUnlocked;
}

/** Unlock a single achievement by id (e.g. when user picks a custom theme). */
export async function unlockAchievement(userId: string, achievementId: string) {
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId)
    .eq("achievement_id", achievementId)
    .maybeSingle();
  if (existing) return;
  const { data: ach } = await supabase
    .from("achievements")
    .select("name, icon")
    .eq("id", achievementId)
    .maybeSingle();
  await supabase
    .from("user_achievements")
    .insert({ user_id: userId, achievement_id: achievementId });
  if (ach) toast.success(`${ach.icon} Achievement unlocked: ${ach.name}`);
}
