import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { Shell } from "@/components/notebook/Shell";
import { Card, Badge, StatsCard, Tape } from "@/components/notebook";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements · TimeSketch" }] }),
  component: AchievementsPage,
});

const CATEGORY_LABEL: Record<string, string> = {
  focus: "Focus",
  time: "Time",
  streak: "Streak",
  notes: "Notes",
  garden: "Garden",
  meta: "Style",
};

function AchievementsPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: catalog }, { data: mine }, { data: sessions }, { data: runs }, { data: notes }, { data: plants }] =
        await Promise.all([
          supabase
            .from("achievements")
            .select("id, name, description, icon, category, threshold")
            .order("threshold", { ascending: true }),
          supabase.from("user_achievements").select("achievement_id, unlocked_at"),
          supabase.from("focus_sessions").select("id, completed").eq("user_id", user!.id),
          supabase.from("timer_runs").select("seconds, created_at").eq("user_id", user!.id),
          supabase.from("notes").select("id").eq("user_id", user!.id),
          supabase.from("garden_plants").select("id").eq("user_id", user!.id),
        ]);
      const unlockedMap = new Map((mine ?? []).map((m) => [m.achievement_id, m.unlocked_at]));
      const stats = {
        focus: (sessions ?? []).filter((s) => s.completed).length,
        time: (runs ?? []).reduce((s, r) => s + (r.seconds ?? 0), 0),
        streak: computeStreak(runs ?? []),
        notes: notes?.length ?? 0,
        garden: plants?.length ?? 0,
        meta: 0,
      };
      return { catalog: catalog ?? [], unlockedMap, stats };
    },
  });

  const catalog = data?.catalog ?? [];
  const unlockedMap = data?.unlockedMap ?? new Map();
  const stats = data?.stats ?? { focus: 0, time: 0, streak: 0, notes: 0, garden: 0, meta: 0 };
  const unlockedCount = catalog.filter((a) => unlockedMap.has(a.id)).length;

  const grouped = catalog.reduce<Record<string, typeof catalog>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="relative paper-card p-7">
            <Tape className="absolute -top-3 left-10" rotate={-3} />
            <p className="font-hand text-xl text-ink-soft">pinned to the wall</p>
            <h1 className="font-hand text-5xl">
              <span className="highlight-marker">Achievements</span> 🏆
            </h1>
            <p className="text-ink-soft mt-2">
              {unlockedCount} of {catalog.length} unlocked. Every session counts.
            </p>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Sessions" value={stats.focus} tone="accent" icon={<Trophy className="h-5 w-5" />} />
            <StatsCard label="Streak" value={stats.streak} tone="coral" />
            <StatsCard label="Notes" value={stats.notes} tone="sky" />
            <StatsCard label="Plants" value={stats.garden} tone="mint" />
          </section>

          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <h3 className="font-hand text-2xl mb-3 capitalize">
                {CATEGORY_LABEL[category] ?? category}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a, idx) => {
                  const unlocked = unlockedMap.has(a.id);
                  const value = (stats as Record<string, number>)[a.category] ?? 0;
                  const pct = Math.min(100, Math.round((value / a.threshold) * 100));
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={cn(
                        "relative ink-border rounded-[12px_16px_10px_14px] p-4 ink-shadow-sm bg-card",
                        unlocked ? "" : "opacity-80",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 grid place-items-center ink-border rounded-[12px_16px_10px_14px] text-2xl",
                            unlocked ? "bg-highlight" : "bg-paper-2",
                          )}
                        >
                          {unlocked ? a.icon : <Lock className="h-5 w-5 text-ink-soft" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-hand text-xl leading-tight">{a.name}</h4>
                            {unlocked && <Badge tone="mint">unlocked</Badge>}
                          </div>
                          <p className="text-sm text-ink-soft mt-1">{a.description}</p>
                          {!unlocked && (
                            <div className="mt-3">
                              <div className="h-2 ink-border rounded-full overflow-hidden bg-paper-2">
                                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-xs text-ink-soft mt-1 font-body">
                                {formatProgress(a.category, value, a.threshold)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function formatProgress(category: string, value: number, threshold: number): string {
  if (category === "time") {
    const v = Math.floor(value / 60);
    const t = Math.floor(threshold / 60);
    return `${v} / ${t} minutes`;
  }
  return `${Math.min(value, threshold)} / ${threshold}`;
}

function computeStreak(runs: Array<{ created_at: string }>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const days = new Set(runs.map((r) => key(new Date(r.created_at))));
  let streak = 0;
  const cursor = new Date(today);
  while (days.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
