import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, StatsCard, Tape, Badge } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { formatHMS } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · TimeSketch" }] }),
  component: AnalyticsPage,
});

const PIE_COLORS = ["var(--accent)", "var(--mint)", "var(--sky)", "var(--coral)"];

function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);
      const [{ data: runs }, { data: sessions }, { data: settings }] = await Promise.all([
        supabase
          .from("timer_runs")
          .select("seconds, kind, created_at")
          .gte("created_at", since.toISOString()),
        supabase
          .from("focus_sessions")
          .select("actual_seconds, planned_minutes, completed, started_at, mode")
          .gte("started_at", since.toISOString()),
        supabase.from("user_settings").select("daily_goal_minutes").maybeSingle(),
      ]);
      return {
        runs: runs ?? [],
        sessions: sessions ?? [],
        dailyGoal: settings?.daily_goal_minutes ?? 120,
      };
    },
  });

  const { runs = [], sessions = [], dailyGoal = 120 } = data ?? {};

  // Build last-30-days series
  const series = React.useMemo(() => {
    const days: { date: string; key: string; focus: number; timer: number; stopwatch: number; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        key: d.toDateString(),
        focus: 0, timer: 0, stopwatch: 0, total: 0,
      });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    for (const r of runs) {
      const k = new Date(r.created_at); k.setHours(0,0,0,0);
      const d = map.get(k.toDateString());
      if (!d) continue;
      const mins = r.seconds / 60;
      if (r.kind === "timer") d.timer += mins; else d.stopwatch += mins;
      d.total += mins;
    }
    for (const s of sessions) {
      const k = new Date(s.started_at); k.setHours(0,0,0,0);
      const d = map.get(k.toDateString());
      if (!d) continue;
      const mins = s.actual_seconds / 60;
      d.focus += mins;
      d.total += mins;
    }
    return days.map((d) => ({ ...d, focus: round(d.focus), timer: round(d.timer), stopwatch: round(d.stopwatch), total: round(d.total) }));
  }, [runs, sessions]);

  const last7 = series.slice(-7);
  const total30 = series.reduce((a, d) => a + d.total, 0);
  const avgDaily = total30 / 30;
  const bestDay = series.reduce((a, d) => (d.total > a.total ? d : a), series[0] ?? { total: 0, date: "—" });
  const todayMins = series[series.length - 1]?.total ?? 0;
  const goalPct = Math.min(100, Math.round((todayMins / dailyGoal) * 100));

  const breakdown = [
    { name: "Focus", value: round(series.reduce((a, d) => a + d.focus, 0)) },
    { name: "Timer", value: round(series.reduce((a, d) => a + d.timer, 0)) },
    { name: "Stopwatch", value: round(series.reduce((a, d) => a + d.stopwatch, 0)) },
  ].filter((b) => b.value > 0);

  const focusComplete = sessions.filter((s) => s.completed).length;
  const focusTotal = sessions.length;
  const completionRate = focusTotal ? Math.round((focusComplete / focusTotal) * 100) : 0;

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 left-12" rotate={-3} />
            <h1 className="font-hand text-5xl leading-none">Analytics</h1>
            <p className="text-ink-soft mt-1">Your last 30 days at a glance.</p>
          </header>

          {isLoading ? (
            <Card><p className="text-ink-soft">Crunching the numbers…</p></Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  icon={<Clock className="h-6 w-6" />}
                  label="Last 30 days"
                  value={`${Math.round(total30)}m`}
                  hint={`${formatHMS(total30 * 60)} logged`}
                  tone="accent"
                />
                <StatsCard
                  icon={<TrendingUp className="h-6 w-6" />}
                  label="Daily average"
                  value={`${avgDaily.toFixed(1)}m`}
                  hint="across the past month"
                  tone="mint"
                />
                <StatsCard
                  icon={<Flame className="h-6 w-6" />}
                  label="Best day"
                  value={`${Math.round(bestDay.total)}m`}
                  hint={bestDay.date}
                  tone="coral"
                />
                <StatsCard
                  icon={<Target className="h-6 w-6" />}
                  label="Today vs goal"
                  value={`${goalPct}%`}
                  hint={`${Math.round(todayMins)} / ${dailyGoal} min`}
                  tone="sky"
                />
              </div>

              <Card>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h2 className="font-hand text-2xl flex items-center gap-2"><BarChart3 className="h-5 w-5" /> 30-day focus</h2>
                  <Badge tone="soft">minutes per day</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} stroke="var(--ink-soft)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
                      <Tooltip
                        contentStyle={{ background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: 10, fontFamily: "var(--font-hand)" }}
                      />
                      <Bar dataKey="focus" stackId="a" fill="var(--accent)" name="Focus" />
                      <Bar dataKey="timer" stackId="a" fill="var(--sky)" name="Timer" />
                      <Bar dataKey="stopwatch" stackId="a" fill="var(--tape)" name="Stopwatch" />
                      <Legend wrapperStyle={{ fontFamily: "var(--font-hand)" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h2 className="font-hand text-2xl mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Past 7 days</h2>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={last7}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--ink-soft)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--ink-soft)" />
                        <Tooltip contentStyle={{ background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: 10 }} />
                        <Line type="monotone" dataKey="total" stroke="var(--ink)" strokeWidth={3} dot={{ r: 4, fill: "var(--accent)", stroke: "var(--ink)", strokeWidth: 2 }} name="Total min" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h2 className="font-hand text-2xl mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5" /> Time breakdown</h2>
                  {breakdown.length === 0 ? (
                    <p className="text-ink-soft">No sessions yet — start tracking to see your mix.</p>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={80} stroke="var(--ink)" strokeWidth={2}>
                            {breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: 10 }} />
                          <Legend wrapperStyle={{ fontFamily: "var(--font-hand)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>

              <Card>
                <h2 className="font-hand text-2xl mb-2">Focus quality</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric label="Sessions started" value={focusTotal} />
                  <Metric label="Sessions completed" value={focusComplete} />
                  <Metric label="Completion rate" value={`${completionRate}%`} />
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="paper-card p-4">
      <div className="font-hand text-3xl leading-none">{value}</div>
      <div className="text-xs uppercase tracking-wide text-ink-soft mt-1">{label}</div>
    </div>
  );
}

function round(n: number) { return Math.round(n * 10) / 10; }
