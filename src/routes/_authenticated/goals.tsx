import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, AlertCircle, Sparkles, Award } from "lucide-react";
import { Card, Tape, QuickChecklist, Badge } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Today's Goals · DayCraft" }] }),
  component: GoalsPage,
});

type Task = {
  id: string;
  text: string;
  done: boolean;
  sort_order: number;
  created_at: string;
};

function GoalsPage() {
  const { user, isGuest } = useAuth();

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-tasks");
        return local ? JSON.parse(local) : [];
      }
      const { data, error } = await supabase
        .from("tasks")
        .select("id, text, done, sort_order, created_at");
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const motivationalMessage = React.useMemo(() => {
    if (total === 0) return "Add some goals above to structure your day! ✏️";
    if (completed === 0) return "Ready to take on the day? Let's start ticking! 💪";
    if (completed === total) return "Phenomenal work! You completed all your goals today! 🎉";
    if (pct >= 75) return "Almost there! Keep pushing to finish your list! 🚀";
    return "Great progress! Steady consistency is the key. ☕";
  }, [completed, total, pct]);

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="relative paper-card p-6">
            <Tape className="absolute -top-3 left-10" rotate={-4} />
            <p className="font-hand text-xl text-ink-soft">daily planning</p>
            <h1 className="font-hand text-5xl">
              <span className="highlight-marker">Today's Goals</span>
            </h1>
            <p className="text-ink-soft mt-2">
              Plan your day, organize tasks, and focus on what matters most.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column: Progress details */}
            <div className="md:col-span-1 space-y-6">
              <Card className="p-5 flex flex-col justify-between text-center min-h-[200px]">
                <Badge tone="accent" className="mx-auto">
                  Goal Progress
                </Badge>
                <div className="my-4">
                  <div className="font-hand text-6xl font-bold">
                    {completed}/{total}
                  </div>
                  <div className="text-sm text-ink-soft mt-1">tasks completed</div>
                </div>
                {total > 0 && (
                  <div className="w-full bg-paper border border-ink/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                <div className="text-xs text-ink-soft mt-1">{pct}% complete</div>
              </Card>

              <Card tilt="left" className="p-5 space-y-3">
                <h3 className="font-hand text-2xl flex items-center gap-1.5 leading-none">
                  <Sparkles className="h-5 w-5 text-accent" /> Insights
                </h3>
                <p className="font-body text-base text-ink-soft leading-snug">
                  {motivationalMessage}
                </p>
                {completed === total && total > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-mint/20 border border-mint rounded text-xs">
                    <Award className="h-5 w-5 shrink-0 text-ink" />
                    <span>Double task streak points awarded!</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Interactive Checklist */}
            <div className="md:col-span-2">
              <Card className="p-6 relative">
                <Tape className="absolute -top-3 right-10 w-24 h-4" rotate={4} />
                <h3 className="font-hand text-3xl mb-4 flex items-center gap-2">
                  <CheckSquare className="h-6 w-6" /> Checklist Planner
                </h3>
                <QuickChecklist limit={20} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
