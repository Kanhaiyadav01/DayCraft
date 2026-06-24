import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Sparkles, Flame, CheckCircle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, Tape, StatsCard, Badge } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { computeStreak } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · DayCraft" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user, isGuest } = useAuth();

  // Load timer runs (from DB or local storage)
  const { data: runs = [] } = useQuery({
    queryKey: ["analytics-runs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-timer-runs");
        return local ? JSON.parse(local) : [];
      }
      const { data, error } = await supabase
        .from("timer_runs")
        .select("seconds, created_at, kind, label")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Load focus sessions (from DB or local storage)
  const { data: sessions = [] } = useQuery({
    queryKey: ["analytics-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-focus-sessions");
        return local ? JSON.parse(local) : [];
      }
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("actual_seconds, started_at, completed")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // 1. Calculations for Daily focus mins (last 7 days)
  const dailyChartData = React.useMemo(() => {
    const dataMap: Record<string, { day: string; minutes: number }> = {};

    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const key = d.toISOString().slice(0, 10);
      dataMap[key] = { day: label, minutes: 0 };
    }

    // Accumulate timer runs seconds
    for (const r of runs) {
      const key = r.created_at.slice(0, 10);
      if (dataMap[key]) {
        dataMap[key].minutes += r.seconds / 60;
      }
    }

    // Accumulate focus sessions (avoid double counting by only adding if focus run not already logged)
    // Actually, timer_runs stores stopwatch/timer/focus kind runs. Let's make sure we just sum timer_runs as it represents the total time.
    // Let's round numbers
    return Object.values(dataMap).map((d) => ({
      ...d,
      minutes: Math.round(d.minutes * 10) / 10,
    }));
  }, [runs]);

  // 2. Vibe categorization metrics (Pie Chart)
  const pieData = React.useMemo(() => {
    let focusSec = 0;
    let stopwatchSec = 0;
    let timerSec = 0;

    for (const r of runs) {
      if (r.kind === "focus") focusSec += r.seconds;
      else if (r.kind === "stopwatch") stopwatchSec += r.seconds;
      else if (r.kind === "timer") timerSec += r.seconds;
    }

    const total = focusSec + stopwatchSec + timerSec;
    if (total === 0) {
      return [
        { name: "Focus Mode", value: 1, color: "var(--accent)" },
        { name: "Stopwatch", value: 1, color: "var(--mint)" },
        { name: "Timer", value: 1, color: "var(--coral)" },
      ];
    }

    return [
      { name: "Focus Mode", value: Math.round((focusSec / 60) * 10) / 10, color: "var(--accent)" },
      { name: "Stopwatch", value: Math.round((stopwatchSec / 60) * 10) / 10, color: "var(--mint)" },
      { name: "Timer", value: Math.round((timerSec / 60) * 10) / 10, color: "var(--coral)" },
    ];
  }, [runs]);

  // 3. Stats totals
  const totalMins = React.useMemo(() => {
    const sec = runs.reduce((sum, r) => sum + r.seconds, 0);
    return Math.round((sec / 60) * 10) / 10;
  }, [runs]);

  const streak = React.useMemo(() => computeStreak(runs), [runs]);

  const focusCompletionRate = React.useMemo(() => {
    if (sessions.length === 0) return 0;
    const completed = sessions.filter((s) => s.completed).length;
    return Math.round((completed / sessions.length) * 100);
  }, [sessions]);

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="relative paper-card p-6">
            <Tape className="absolute -top-3 left-10" rotate={-4} />
            <p className="font-hand text-xl text-ink-soft">productivity stats</p>
            <h1 className="font-hand text-5xl">
              <span className="highlight-marker">Analytics</span>
            </h1>
            <p className="text-ink-soft mt-2">
              Visualize your productivity trends, habits, and progress.
            </p>
          </header>

          {/* Stats overview */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Total focus minutes"
              value={String(totalMins)}
              hint="cumulative time"
              icon={<Clock className="h-6 w-6" />}
              tone="accent"
            />
            <StatsCard
              label="Focus sessions"
              value={String(sessions.length)}
              hint={`${sessions.filter((s) => s.completed).length} completed`}
              icon={<Sparkles className="h-6 w-6" />}
              tone="mint"
            />
            <StatsCard
              label="Current streak"
              value={`${streak} days`}
              hint="consistency check 🔥"
              icon={<Flame className="h-6 w-6" />}
              tone="coral"
            />
            <StatsCard
              label="Focus completion rate"
              value={`${focusCompletionRate}%`}
              hint="session efficiency"
              icon={<CheckCircle className="h-6 w-6" />}
              tone="sky"
            />
          </section>

          {/* Charts panel */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Daily Minutes Bar Chart */}
            <Card className="md:col-span-2 p-6 flex flex-col justify-between min-h-[350px]">
              <div className="flex items-center gap-2 mb-4">
                <Badge tone="accent">Activity Trend</Badge>
                <h3 className="font-hand text-2xl font-bold">Daily Focus Minutes</h3>
              </div>
              <div className="flex-1 w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <XAxis
                      dataKey="day"
                      stroke="var(--ink)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--ink)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "2px solid var(--ink)",
                        borderRadius: "8px",
                        fontFamily: "var(--font-hand)",
                        fontSize: "16px",
                      }}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                      stroke="var(--ink)"
                      strokeWidth={1.5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Vibe Breakdown Pie Chart */}
            <Card className="md:col-span-1 p-6 flex flex-col justify-between min-h-[350px]">
              <div className="flex items-center gap-2 mb-4">
                <Badge tone="mint">Activity Breakdown</Badge>
                <h3 className="font-hand text-2xl font-bold">Method Share</h3>
              </div>
              <div className="flex-1 w-full h-[180px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="var(--ink)"
                          strokeWidth={1.5}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "2px solid var(--ink)",
                        borderRadius: "8px",
                        fontFamily: "var(--font-hand)",
                        fontSize: "14px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center font-hand text-sm space-y-1 text-ink-soft border-t border-ink/10 pt-3">
                <div className="flex justify-around">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[var(--accent)] ink-border inline-block" />{" "}
                    Focus
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[var(--mint)] ink-border inline-block" />{" "}
                    Stopw.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[var(--coral)] ink-border inline-block" />{" "}
                    Timer
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
