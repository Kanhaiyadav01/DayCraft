import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  Timer as TimerIcon,
  NotebookPen,
  Flame,
  CheckCircle2,
  Calendar,
  BarChart3,
  TimerReset,
  User,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tape,
  ThemePicker,
} from "@/components/notebook";
import { useApplyTheme, useThemeStore } from "@/stores/theme-store";
import { THEMES } from "@/lib/themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DayCraft — Cozy Notebook Productivity" },
      {
        name: "description",
        content:
          "Track time, manage tasks, write notes, monitor progress, and achieve your goals with DayCraft.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  useApplyTheme();
  const theme = useThemeStore((s) => s.theme);
  const themeMeta = THEMES.find((t) => t.id === theme)!;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleTryAsGuest() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: "Guest" } },
      });
      if (error) throw error;
      toast.success("Welcome to DayCraft guest session! ✏️");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start guest session");
    } finally {
      setBusy(false);
    }
  }

  const features = [
    {
      icon: Clock,
      title: "Time Tracking",
      desc: "Know exactly where your time goes and build better habits.",
      tone: "accent" as const,
      preview: (
        <div className="border border-ink/20 rounded p-2.5 bg-paper/50 font-hand text-sm space-y-1">
          <div className="flex justify-between border-b border-ink/10 pb-1">
            <span>Writing docs</span>
            <span className="font-bold">25:00</span>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-1">
            <span>Refactoring code</span>
            <span className="font-bold">45:12</span>
          </div>
          <div className="flex justify-between">
            <span>Design planning</span>
            <span className="font-bold">18:30</span>
          </div>
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: "Focus Timer",
      desc: "Stay distraction-free and complete deep work sessions.",
      tone: "mint" as const,
      preview: (
        <div className="flex flex-col items-center justify-center p-2 bg-paper/50 rounded border border-ink/20">
          <span className="font-hand text-2xl font-bold tracking-widest text-accent animate-pulse">
            24:59
          </span>
          <span className="text-[10px] text-ink-soft uppercase tracking-wider">
            deep work active
          </span>
        </div>
      ),
    },
    {
      icon: TimerIcon,
      title: "Timer",
      desc: "Use customizable countdown timers for work, study, and productivity.",
      tone: "coral" as const,
      preview: (
        <div className="flex justify-around items-center p-1 border border-ink/20 rounded bg-paper/50">
          <span className="text-xs border border-ink/20 px-1.5 py-0.5 rounded bg-accent/15">
            25m
          </span>
          <span className="text-xs border border-ink/20 px-1.5 py-0.5 rounded bg-accent/15">
            50m
          </span>
          <span className="text-xs border border-ink/20 px-1.5 py-0.5 rounded bg-accent/15">
            90m
          </span>
        </div>
      ),
    },
    {
      icon: TimerReset,
      title: "Stopwatch",
      desc: "Measure activities and track elapsed time precisely.",
      tone: "sky" as const,
      preview: (
        <div className="font-hand text-center py-2 bg-paper/50 rounded border border-ink/20">
          <div className="text-xl font-bold">01:45.62</div>
          <div className="text-[10px] text-ink-soft">Lap 1: 52.18s</div>
        </div>
      ),
    },
    {
      icon: CheckCircle2,
      title: "Today's Goals",
      desc: "Plan your day and focus on what matters most.",
      tone: "tape" as const,
      preview: (
        <div className="space-y-1 bg-paper/50 p-2 rounded border border-ink/20 text-xs">
          <div className="flex items-center gap-1.5">
            <input type="checkbox" checked readOnly className="rounded border-ink text-accent" />
            <span className="line-through text-ink-soft">Design mockup UI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={false}
              readOnly
              className="rounded border-ink text-accent"
            />
            <span>Finish the landing page</span>
          </div>
        </div>
      ),
    },
    {
      icon: NotebookPen,
      title: "Notes",
      desc: "Capture ideas, thoughts, and important information instantly.",
      tone: "highlight" as const,
      preview: (
        <div className="bg-paper-2 p-2 rounded border border-ink/30 text-xs font-hand rotate-[-1deg] shadow-sm">
          <div className="font-bold border-b border-ink/10 pb-0.5">💡 Ideas list</div>
          <p className="text-[10px] text-ink-soft leading-tight mt-1">
            Add theme picker preview. Support web audio alarms.
          </p>
        </div>
      ),
    },
    {
      icon: BarChart3,
      title: "Analytics",
      desc: "Visualize productivity trends and understand your progress.",
      tone: "soft" as const,
      preview: (
        <div className="h-16 flex items-end justify-between gap-1 px-2 pt-2 border border-ink/20 rounded bg-paper/50">
          <div className="w-full bg-accent/40 rounded-t h-8" />
          <div className="w-full bg-accent/60 rounded-t h-12" />
          <div className="w-full bg-accent/80 rounded-t h-14" />
          <div className="w-full bg-accent/30 rounded-t h-6" />
          <div className="w-full bg-accent rounded-t h-16" />
        </div>
      ),
    },
    {
      icon: Calendar,
      title: "Daily Planning",
      desc: "Organize tasks and structure your day effectively.",
      tone: "accent" as const,
      preview: (
        <div className="border border-ink/20 rounded p-2 bg-paper/50 text-xs space-y-1">
          <div className="text-[10px] text-ink-soft font-bold uppercase">Schedule</div>
          <div className="flex gap-2">
            <span className="font-bold">09:00</span>
            <span>Planning & Coffee</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">10:30</span>
            <span className="text-ink-soft">Review task queue</span>
          </div>
        </div>
      ),
    },
    {
      icon: User,
      title: "🚀 Try as Guest",
      desc: "Start using DayCraft instantly without creating an account. Track your time, focus sessions, notes, goals, analytics, timer history, and preferences. Your progress will be saved locally and automatically restored the next time you use Guest Mode on the same device.",
      tone: "mint" as const,
      preview: (
        <div className="bg-paper/50 p-2.5 rounded border border-ink/20 text-xs space-y-1">
          <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">
            Benefits
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-ink-soft">
            <div>• No signup required</div>
            <div>• Start instantly</div>
            <div>• Saved locally</div>
            <div>• Notes & goals preserved</div>
            <div>• History saved</div>
            <div>• Preferences kept</div>
            <div className="col-span-2 font-bold text-accent">• Upgrade anytime</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen px-4 pt-10 pb-6 sm:px-8 lg:px-16 flex flex-col justify-between bg-paper">
      <div className="mx-auto max-w-6xl w-full space-y-16">
        {/* Header */}
        <header className="relative paper-card p-6 sm:p-8">
          <Tape className="absolute -top-3 left-10" rotate={-5} />
          <Tape className="absolute -top-3 right-16 h-4 w-20" rotate={4} />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-hand text-xl text-ink-soft">handwritten workspace</p>
              <h1 className="font-hand text-6xl sm:text-7xl leading-none">
                Day<span className="highlight-marker">Craft</span> ✏️
              </h1>
              <p className="mt-3 max-w-xl text-ink-soft">
                Currently wearing{" "}
                <strong className="text-ink">
                  {themeMeta.emoji} {themeMeta.name}
                </strong>
                .
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge tone="accent">
                <Sparkles className="h-3.5 w-3.5" /> Live theme preview
              </Badge>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <ThemePicker variant="compact" />
                <Link to="/auth" search={{ mode: undefined }}>
                  <Button size="sm">Sign in →</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6 py-6 relative">
          <Tape className="absolute -top-6 left-1/2 -translate-x-1/2 h-4 w-24" rotate={1} />

          <blockquote className="border-l-4 border-accent pl-6 py-2 text-left italic font-hand text-2xl sm:text-3xl text-ink-soft leading-snug">
            “Time is what we want most, but what we use worst.”
          </blockquote>

          <div className="space-y-4">
            <h2 className="font-hand text-4xl sm:text-5xl leading-none">
              Craft better days with powerful tools for focus, productivity, planning, and personal
              growth.
            </h2>
            <p className="text-lg text-ink-soft max-w-xl mx-auto">
              Track your time, manage tasks, take notes, monitor progress, and achieve your
              goals—all in one place.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg">Get Started</Button>
            </Link>
            <Button size="lg" variant="outline" onClick={handleTryAsGuest} disabled={busy}>
              <User className="h-5 w-5 mr-1" />
              {busy ? "Loading..." : "Try as Guest"}
            </Button>
          </div>
        </section>

        {/* Feature Showcase Grid */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="font-hand text-4xl sm:text-5xl">Feature Showcase</h2>
            <p className="text-ink-soft mt-1">
              Explore all the interactive tools crafted inside your notebook.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Card key={i} className="flex flex-col justify-between p-5 space-y-4 h-full relative">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-full border border-ink/20 bg-accent-soft text-accent">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <Badge tone={f.tone} className="text-xs uppercase">
                      feature
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="font-hand text-2xl leading-none">{f.title}</CardTitle>
                    <p className="text-sm text-ink-soft leading-normal">{f.desc}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-ink/10">{f.preview}</div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Section */}
      <footer className="mt-20 border-t-2 border-ink/10 pt-6 text-center w-full">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-soft">
          <div>
            Built with ❤️ by{" "}
            <a
              href="https://github.com/Kanhaiyadav01"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-ink hover:text-accent transition-colors"
            >
              Kanhaiya Yadav
            </a>
          </div>
          <div className="font-hand text-base">© 2026 DayCraft. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
