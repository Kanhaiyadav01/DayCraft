import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  text: string;
  done: boolean;
  sort_order: number;
  created_at: string;
};

export function QuickChecklist({ className, limit }: { className?: string; limit?: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, text, done, sort_order, created_at")
        .order("done", { ascending: true })
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  async function addTask(e?: React.FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !user) return;
    setBusy(true);
    const { error } = await supabase
      .from("tasks")
      .insert({ user_id: user.id, text: t, sort_order: Date.now() });
    setBusy(false);
    if (error) return toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  async function toggle(task: Task, done: boolean) {
    qc.setQueryData<Task[]>(["tasks", user?.id], (prev) =>
      (prev ?? []).map((x) => (x.id === task.id ? { ...x, done } : x)),
    );
    const { error } = await supabase.from("tasks").update({ done }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  const visible = limit ? tasks.slice(0, limit) : tasks;

  return (
    <div className={cn("space-y-3", className)}>
      <form onSubmit={addTask} className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="add a checklist item…"
          disabled={!user || busy}
        />
        <Button type="submit" size="icon" aria-label="Add task" disabled={!user || busy || !text.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="paper-card p-4 min-h-[80px]">
        {isLoading ? (
          <p className="text-ink-soft text-sm">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-ink-soft text-sm">No items yet — add one above to start your list.</p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {visible.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center justify-between gap-2 group"
                >
                  <Checkbox
                    checked={t.done}
                    onCheckedChange={(v) => toggle(t, v)}
                    label={t.text}
                  />
                  <button
                    onClick={() => remove(t.id)}
                    aria-label="Remove"
                    className="p-1.5 rounded-md hover:bg-ink/10 opacity-40 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {limit && tasks.length > limit && (
          <p className="mt-2 text-xs text-ink-soft">+{tasks.length - limit} more…</p>
        )}
      </div>
    </div>
  );
}
