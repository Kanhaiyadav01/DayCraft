import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Sparkles, TimerReset, Timer as TimerIcon, Trash2, NotebookPen, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button, Card, Input, Tape } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { formatHMS, formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History · TimeSketch" }] }),
  component: HistoryPage,
});

type Entry = {
  id: string;
  kind: "stopwatch" | "timer" | "focus";
  label: string | null;
  seconds: number;
  at: string;
  meta?: string;
};

function HistoryPage() {
  const [filter, setFilter] = React.useState<"all" | "stopwatch" | "timer" | "focus">("all");
  const [query, setQuery] = React.useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [{ data: runs }, { data: sessions }] = await Promise.all([
        supabase
          .from("timer_runs")
          .select("id, kind, label, seconds, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("focus_sessions")
          .select("id, label, mode, planned_minutes, actual_seconds, completed, started_at")
          .order("started_at", { ascending: false })
          .limit(200),
      ]);
      const entries: Entry[] = [
        ...(runs ?? []).map((r) => ({
          id: `r-${r.id}`,
          kind: r.kind as "stopwatch" | "timer",
          label: r.label,
          seconds: r.seconds,
          at: r.created_at,
        })),
        ...(sessions ?? []).map((s) => ({
          id: `f-${s.id}`,
          kind: "focus" as const,
          label: s.label,
          seconds: s.actual_seconds,
          at: s.started_at,
          meta: `${s.mode} · ${s.planned_minutes}m planned${s.completed ? " · ✓" : ""}`,
        })),
      ];
      entries.sort((a, b) => +new Date(b.at) - +new Date(a.at));
      return entries;
    },
  });

  async function remove(e: Entry) {
    const realId = e.id.slice(2);
    const table = e.id.startsWith("r-") ? "timer_runs" : "focus_sessions";
    const { error } = await supabase.from(table).delete().eq("id", realId);
    if (error) return toast.error(error.message);
    toast.success("Removed from history");
    refetch();
  }

  const filtered = (data ?? []).filter((e) => {
    if (filter !== "all" && e.kind !== filter) return false;
    if (query && !(e.label ?? "").toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  // Group by day label
  const groups = React.useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of filtered) {
      const d = new Date(e.at);
      d.setHours(0, 0, 0, 0);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalSeconds = filtered.reduce((a, e) => a + e.seconds, 0);

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 left-12" rotate={-3} />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-hand text-5xl leading-none">History</h1>
                <p className="text-ink-soft mt-1">
                  Every lap, sprint, and deep dive you've logged. {filtered.length} entries · {formatHMS(totalSeconds)} total.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "focus", "timer", "stopwatch"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={cn(
                      "px-3 py-1.5 font-hand text-base ink-border rounded-[10px_14px_8px_12px] capitalize transition-all",
                      filter === k ? "bg-accent text-accent-foreground ink-shadow-sm" : "bg-card hover:-translate-y-0.5",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
              <Input
                className="pl-9"
                placeholder="Search by label…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </header>

          {isLoading && <Card><p className="text-ink-soft">Flipping through the pages…</p></Card>}

          {!isLoading && groups.length === 0 && (
            <Card className="text-center py-12">
              <NotebookPen className="mx-auto h-10 w-10 text-ink-soft" />
              <p className="font-hand text-2xl mt-3">No entries yet</p>
              <p className="text-ink-soft mt-1">Start a focus session or timer and it'll show up here.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link to="/focus" className="inline-flex items-center gap-2 px-4 py-2 ink-border ink-shadow-sm bg-accent text-accent-foreground font-hand text-lg rounded-[10px_14px_8px_12px]">Start focus</Link>
                <Link to="/timer" className="inline-flex items-center gap-2 px-4 py-2 ink-border ink-shadow-sm bg-card font-hand text-lg rounded-[10px_14px_8px_12px]">Open timer</Link>
              </div>
            </Card>
          )}

          {groups.map(([day, items]) => {
            const daySeconds = items.reduce((a, e) => a + e.seconds, 0);
            return (
              <section key={day} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-hand text-2xl">{prettyDay(day)}</h2>
                  <Badge tone="soft">{items.length} · {formatHMS(daySeconds)}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((e, i) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <EntryRow entry={e} onDelete={() => remove(e)} />
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function prettyDay(key: string) {
  const d = new Date(key);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = (today.getTime() - d.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function EntryRow({ entry, onDelete }: { entry: Entry; onDelete: () => void }) {
  const icon = entry.kind === "focus" ? Sparkles : entry.kind === "timer" ? TimerIcon : TimerReset;
  const Icon = icon;
  const tone = entry.kind === "focus" ? "bg-mint" : entry.kind === "timer" ? "bg-sky" : "bg-tape";
  return (
    <div className="paper-card p-4 flex items-center gap-4">
      <span className={cn("grid place-items-center h-11 w-11 ink-border rounded-[12px_16px_10px_14px] ink-shadow-sm", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-hand text-xl leading-none truncate">
          {entry.label || untitled(entry.kind)}
        </div>
        <div className="text-xs text-ink-soft mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="capitalize">{entry.kind}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatHMS(entry.seconds)}</span>
          <span>·</span>
          <span>{formatRelative(entry.at)}</span>
          {entry.meta && <><span>·</span><span>{entry.meta}</span></>}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete entry">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function untitled(kind: Entry["kind"]) {
  if (kind === "focus") return "Focus session";
  if (kind === "timer") return "Timer";
  return "Stopwatch lap set";
}
