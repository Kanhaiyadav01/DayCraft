import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  NotebookPen,
  Flame,
  TimerReset,
  Timer as TimerIcon,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button, Card, StatsCard, Tape, NoteCard, QuickChecklist } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { useAuth } from "@/hooks/use-auth";
import { formatHMS, formatRelative } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · TimeSketch" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isGuest } = useAuth();
  const name =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    (isGuest ? "Guest" : "Friend");

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: runs }, { data: notes }] = await Promise.all([
        supabase.from("timer_runs").select("seconds, created_at, kind, label"),
        supabase.from("notes").select("id, title, body, tags, pinned, color, updated_at").order("updated_at", { ascending: false }).limit(4),
      ]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySec = (runs ?? [])
        .filter((r) => new Date(r.created_at) >= today)
        .reduce((sum, r) => sum + (r.seconds ?? 0), 0);
      const totalSec = (runs ?? []).reduce((sum, r) => sum + (r.seconds ?? 0), 0);
      // streak = consecutive days back from today with at least one run
      const dayKey = (d: Date) => d.toISOString().slice(0, 10);
      const days = new Set((runs ?? []).map((r) => dayKey(new Date(r.created_at))));
      let streak = 0;
      const cursor = new Date(today);
      while (days.has(dayKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return {
        todaySec,
        totalSec,
        streak,
        notes: notes ?? [],
        notesCount: notes?.length ?? 0,
        recentRuns: (runs ?? []).slice(-5).reverse(),
      };
    },
  });

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative paper-card p-7"
          >
            <Tape className="absolute -top-3 left-10" rotate={-4} />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-hand text-xl text-ink-soft">today's page</p>
                <h1 className="font-hand text-5xl sm:text-6xl leading-none">
                  Hi, <span className="highlight-marker">{name}</span> 👋
                </h1>
                {isGuest && (
                  <p className="mt-3 text-ink-soft max-w-md">
                    Sketching as a guest. Sign up from the sidebar to keep your notebook forever.
                  </p>
                )}
              </div>
              <Badge tone="accent">
                <Sparkles className="h-3.5 w-3.5" /> {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </Badge>
            </div>
          </motion.header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Today"
              value={formatHMS(stats?.todaySec ?? 0)}
              hint="time tracked today"
              icon={<Clock className="h-6 w-6" />}
              tone="accent"
            />
            <StatsCard
              label="All time"
              value={formatHMS(stats?.totalSec ?? 0)}
              hint="across every run"
              icon={<TimerIcon className="h-6 w-6" />}
              tone="mint"
            />
            <StatsCard
              label="Streak"
              value={stats?.streak ?? 0}
              hint={stats?.streak ? "days in a row 🔥" : "start your streak"}
              icon={<Flame className="h-6 w-6" />}
              tone="coral"
            />
            <StatsCard
              label="Notes"
              value={stats?.notesCount ?? 0}
              hint="recent ideas"
              icon={<NotebookPen className="h-6 w-6" />}
              tone="sky"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <Link to="/stopwatch" className="block">
              <Card className="h-full" tilt="left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-hand text-3xl">Stopwatch</h3>
                    <p className="text-ink-soft mt-1">Track open-ended sessions with laps.</p>
                  </div>
                  <span className="grid place-items-center h-14 w-14 ink-border ink-shadow rounded-[12px_16px_10px_14px] bg-mint">
                    <TimerReset className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 font-hand text-lg text-ink-soft">
                  Open <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
            <Link to="/timer" className="block">
              <Card className="h-full" tilt="right">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-hand text-3xl">Timer</h3>
                    <p className="text-ink-soft mt-1">Pomodoro & focus countdowns.</p>
                  </div>
                  <span className="grid place-items-center h-14 w-14 ink-border ink-shadow rounded-[12px_16px_10px_14px] bg-coral text-white">
                    <TimerIcon className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 font-hand text-lg text-ink-soft">
                  Open <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
            <Link to="/notes" className="block">
              <Card className="h-full" tilt="left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-hand text-3xl">Quick Notes</h3>
                    <p className="text-ink-soft mt-1">Capture thoughts on sticky paper.</p>
                  </div>
                  <span className="grid place-items-center h-14 w-14 ink-border ink-shadow rounded-[12px_16px_10px_14px] bg-sky">
                    <NotebookPen className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 font-hand text-lg text-ink-soft">
                  Open <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card tilt="left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-hand text-3xl">Quick Notes Checklist</h3>
                <Badge tone="mint">today</Badge>
              </div>
              <QuickChecklist limit={8} />
            </Card>

            <Card>
              <h3 className="font-hand text-3xl mb-3">Recent sessions</h3>
              {stats?.recentRuns?.length ? (
                <ul className="divide-y divide-rule">
                  {stats.recentRuns.map((r, i) => (
                    <li key={i} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-hand text-xl truncate">{r.label || (r.kind === "timer" ? "Timer" : "Stopwatch")}</div>
                        <div className="text-xs text-ink-soft">{formatRelative(r.created_at)}</div>
                      </div>
                      <Badge tone={r.kind === "timer" ? "coral" : "mint"}>{formatHMS(r.seconds)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-soft">
                  No sessions yet — hit the stopwatch or set a timer to start your notebook.
                </p>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-hand text-3xl">Latest notes</h3>
                <Link to="/notes">
                  <Button variant="ghost" size="sm">All notes <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </div>
              {stats?.notes?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {stats.notes.slice(0, 4).map((n) => (
                    <NoteCard
                      key={n.id}
                      title={n.title || "Untitled"}
                      body={n.body || ""}
                      tags={n.tags ?? []}
                      pinned={n.pinned}
                      date={formatRelative(n.updated_at)}
                      tilt={Math.random() > 0.5 ? "left" : "right"}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-ink-soft">No notes yet. Jot one down on the Notes page.</p>
              )}
            </Card>
          </section>
        </div>
      </div>
    </Shell>
  );
}
