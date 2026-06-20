import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock, Timer as TimerIcon, NotebookPen, Flame, Sprout } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Modal,
  NoteCard,
  StatsCard,
  Tape,
  Textarea,
  ThemePicker,
  Toggle,
} from "@/components/notebook";
import { useApplyTheme, useThemeStore } from "@/stores/theme-store";
import { THEMES } from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TimeSketch — Design System Showcase" },
      {
        name: "description",
        content:
          "Preview the TimeSketch notebook design system: cards, buttons, notes, stats, and 8 hand-drawn themes.",
      },
    ],
  }),
  component: ShowcasePage,
});

function ShowcasePage() {
  useApplyTheme();
  const theme = useThemeStore((s) => s.theme);
  const themeMeta = THEMES.find((t) => t.id === theme)!;

  const [todos, setTodos] = useState([
    { id: 1, label: "Sketch the weekly plan", done: true },
    { id: 2, label: "30 min deep work on TimeSketch", done: false },
    { id: 3, label: "Water the focus garden 🌱", done: false },
  ]);
  const [notifications, setNotifications] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative paper-card p-8"
        >
          <Tape className="absolute -top-3 left-10" rotate={-5} />
          <Tape className="absolute -top-3 right-16 h-4 w-20" rotate={4} />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-hand text-xl text-ink-soft">slice one · design system</p>
              <h1 className="font-hand text-6xl sm:text-7xl leading-none">
                Time<span className="highlight-marker">Sketch</span> ✏️
              </h1>
              <p className="mt-3 max-w-xl text-ink-soft">
                A cozy handwritten productivity companion. Currently wearing{" "}
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
        </motion.header>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Focus hours"
            value="12.4"
            hint="+1.8 this week"
            icon={<Clock className="h-6 w-6" />}
            tone="accent"
          />
          <StatsCard
            label="Tasks done"
            value="38"
            hint="across 6 sessions"
            icon={<NotebookPen className="h-6 w-6" />}
            tone="mint"
          />
          <StatsCard
            label="Current streak"
            value="7 days"
            hint="keep it going 🔥"
            icon={<Flame className="h-6 w-6" />}
            tone="coral"
          />
          <StatsCard
            label="Garden XP"
            value="320"
            hint="next: 🌳 Tree"
            icon={<Sprout className="h-6 w-6" />}
            tone="sky"
          />
        </section>

        {/* Two-column: components + notes */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Components column */}
          <Card className="lg:col-span-2 space-y-6">
            <CardHeader>
              <div>
                <CardTitle>Component playground</CardTitle>
                <CardDescription>Every primitive themes itself from the active palette.</CardDescription>
              </div>
              <Badge tone="tape">v0.1</Badge>
            </CardHeader>

            {/* Buttons */}
            <div className="space-y-2">
              <p className="font-hand text-lg text-ink-soft">Buttons</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>
                  <TimerIcon className="h-4 w-4" /> Start focus
                </Button>
                <Button variant="outline">Save session</Button>
                <Button variant="tape">Add a note</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="danger">Reset</Button>
                <Button size="sm" variant="outline">
                  small
                </Button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-hand text-lg">Session label</label>
                <Input placeholder="What are you working on?" defaultValue="Drafting TimeSketch v1" />
              </div>
              <div className="space-y-1.5">
                <label className="font-hand text-lg">Notifications</label>
                <div className="h-11 flex items-center">
                  <Toggle checked={notifications} onCheckedChange={setNotifications} label="Gentle nudges only" />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-hand text-lg">Today's goal</label>
                <Textarea defaultValue={"Ship the design system.\nPlant one new flower in the focus garden."} />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <p className="font-hand text-lg text-ink-soft">Quick notes checklist</p>
              <div className="space-y-2 paper-card p-4">
                {todos.map((t) => (
                  <Checkbox
                    key={t.id}
                    checked={t.done}
                    onCheckedChange={(v) =>
                      setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: v } : x)))
                    }
                    label={t.label}
                  />
                ))}
              </div>
            </div>

            {/* Badges + modal */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge tone="accent">accent</Badge>
              <Badge tone="mint">mint</Badge>
              <Badge tone="coral">coral</Badge>
              <Badge tone="sky">sky</Badge>
              <Badge tone="tape">tape</Badge>
              <Badge tone="highlight">highlight</Badge>
              <Badge tone="soft">soft</Badge>
              <div className="ml-auto">
                <Button variant="outline" onClick={() => setModalOpen(true)}>
                  Open modal
                </Button>
              </div>
            </div>
          </Card>

          {/* Notes column */}
          <div className="space-y-4">
            <NoteCard
              title="Morning pages"
              body={"Three things I'm grateful for today:\n1. Quiet coffee\n2. Sunlight\n3. This little notebook."}
              tags={["journal", "morning"]}
              date="Today"
              pinned
              tilt="left"
            />
            <NoteCard
              title="Reading list"
              body={"• Deep Work — Cal Newport\n• How to Take Smart Notes\n• Hyperfocus"}
              tags={["books"]}
              date="Yesterday"
              tilt="right"
            />
            <NoteCard
              title="Garden ideas 🌱"
              body={"Unlock cherry blossom at 500 XP. Add tiny watering can animation when a session completes."}
              tags={["garden", "ideas"]}
              date="2d"
              tilt="left"
            />
          </div>
        </section>

        {/* Theme picker grid */}
        <section className="space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-hand text-4xl">Pick your notebook</h2>
              <p className="text-ink-soft">Eight hand-mixed themes. Click any card to swatch the whole app.</p>
            </div>
            <Badge tone="highlight">
              <Sparkles className="h-3.5 w-3.5" /> {THEMES.length} themes
            </Badge>
          </div>
          <ThemePicker />
        </section>

        <footer className="pt-4 pb-12 text-center text-ink-soft text-sm">
          Slice 1 complete · auth, dashboard, and the focus garden are up next.
        </footer>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Start a focus session"
        description="Pick a length and a vibe. We'll do the timekeeping."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Not now
            </Button>
            <Button onClick={() => setModalOpen(false)}>
              <TimerIcon className="h-4 w-4" /> Let's go
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input placeholder="Session label" defaultValue="Deep work · TimeSketch" />
          <div className="flex flex-wrap gap-2">
            {["25 min Pomodoro", "50 min Deep work", "90 min Study", "120 min Coding"].map((p) => (
              <Badge key={p} tone="soft" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      </Modal>
    </main>
  );
}
