import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, PinOff, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, Input, Modal, Tape, Textarea } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Notes · DayCraft" }] }),
  component: NotesPage,
});

type Note = {
  id: string;
  title: string | null;
  body: string | null;
  tags: string[];
  pinned: boolean;
  color: string;
  updated_at: string;
};

const COLORS = [
  { id: "paper", swatch: "var(--paper)" },
  { id: "mint", swatch: "var(--mint)" },
  { id: "coral", swatch: "var(--coral)" },
  { id: "sky", swatch: "var(--sky)" },
  { id: "tape", swatch: "var(--tape)" },
  { id: "highlight", swatch: "var(--highlight)" },
];

function tiltFor(id: string): "left" | "right" | "none" {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return sum % 3 === 0 ? "left" : sum % 3 === 1 ? "right" : "none";
}

function NotesPage() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<Partial<Note> | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-notes");
        const list = local ? JSON.parse(local) : [];
        return list.sort((a: Note, b: Note) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      }
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, tags, pinned, color, updated_at")
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(q) ||
        (n.body ?? "").toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, query]);

  async function save(n: Partial<Note>) {
    if (!user) return;
    const payload = {
      user_id: user.id,
      title: n.title?.trim() || null,
      body: n.body?.trim() || null,
      tags: n.tags ?? [],
      pinned: n.pinned ?? false,
      color: n.color ?? "paper",
    };
    if (!payload.title && !payload.body) {
      toast.error("Add a title or body first.");
      return;
    }
    if (isGuest) {
      const local = localStorage.getItem("daycraft-guest-notes");
      const list = local ? JSON.parse(local) : [];
      if (n.id) {
        const idx = list.findIndex((x: Note) => x.id === n.id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        list.push({
          id: `g-note-${Math.random().toString(36).slice(2, 9)}`,
          ...payload,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
      localStorage.setItem("daycraft-guest-notes", JSON.stringify(list));
      toast.success(n.id ? "Note updated" : "Note saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      return;
    }
    const res = n.id
      ? await supabase.from("notes").update(payload).eq("id", n.id)
      : await supabase.from("notes").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(n.id ? "Note updated" : "Note saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["notes"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const [deletingNote, setDeletingNote] = React.useState<Note | null>(null);

  async function togglePin(n: Note) {
    if (isGuest) {
      const local = localStorage.getItem("daycraft-guest-notes");
      const list = local ? JSON.parse(local) : [];
      const updated = list.map((x: Note) =>
        x.id === n.id ? { ...x, pinned: !x.pinned, updated_at: new Date().toISOString() } : x,
      );
      localStorage.setItem("daycraft-guest-notes", JSON.stringify(updated));
      qc.invalidateQueries({ queryKey: ["notes"] });
      return;
    }
    await supabase.from("notes").update({ pinned: !n.pinned }).eq("id", n.id);
    qc.invalidateQueries({ queryKey: ["notes"] });
  }

  async function confirmRemove() {
    if (!deletingNote) return;
    if (isGuest) {
      const local = localStorage.getItem("daycraft-guest-notes");
      const list = local ? JSON.parse(local) : [];
      const updated = list.filter((x: Note) => x.id !== deletingNote.id);
      localStorage.setItem("daycraft-guest-notes", JSON.stringify(updated));
      toast.success("Note removed");
      setDeletingNote(null);
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      return;
    }
    await supabase.from("notes").delete().eq("id", deletingNote.id);
    toast.success("Note removed");
    setDeletingNote(null);
    qc.invalidateQueries({ queryKey: ["notes"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 right-16" rotate={4} />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-hand text-5xl leading-none">Quick Notes</h1>
                <p className="text-ink-soft mt-1">
                  Sticky ideas, pinned to the page so you don't lose them.
                </p>
              </div>
              <Button onClick={() => setEditing({})}>
                <Plus className="h-4 w-4" /> New note
              </Button>
            </div>
            <div className="mt-4 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search notes, tags…"
                className="pl-9"
              />
            </div>
          </header>

          {isLoading ? (
            <Card>
              <p className="text-ink-soft">Loading your notebook…</p>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-16">
              <p className="font-hand text-3xl">no notes here yet</p>
              <p className="text-ink-soft mt-2">Click "New note" to scribble your first one.</p>
            </Card>
          ) : (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filtered.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <NoteTile
                      note={n}
                      onOpen={() => setEditing(n)}
                      onPin={() => togglePin(n)}
                      onDelete={() => setDeletingNote(n)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <NoteEditor open={!!editing} note={editing} onClose={() => setEditing(null)} onSave={save} />

      <Modal
        open={!!deletingNote}
        onOpenChange={(o) => !o && setDeletingNote(null)}
        title="Discard Note?"
        description="Are you sure you want to delete this note? This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingNote(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Delete
            </Button>
          </>
        }
      />
    </Shell>
  );
}

function colorBg(c: string) {
  switch (c) {
    case "mint":
      return "bg-mint";
    case "coral":
      return "bg-coral text-white";
    case "sky":
      return "bg-sky";
    case "tape":
      return "bg-tape";
    case "highlight":
      return "bg-highlight";
    default:
      return "bg-card";
  }
}

function NoteTile({
  note,
  onOpen,
  onPin,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const tilt = tiltFor(note.id);
  const tiltCls = tilt === "left" ? "-rotate-[0.6deg]" : tilt === "right" ? "rotate-[0.6deg]" : "";
  return (
    <div
      className={cn(
        "relative paper-card p-5 transition-transform hover:-translate-y-1",
        tiltCls,
        colorBg(note.color),
      )}
    >
      <span
        aria-hidden
        className="tape-strip absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-20 -rotate-2"
      />
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="text-left flex-1 min-w-0">
          <h4 className="font-hand text-2xl leading-tight break-words">
            {note.title || "Untitled"}
          </h4>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onPin} aria-label="Pin" className="p-1.5 hover:bg-ink/10 rounded-md">
            {note.pinned ? (
              <Pin className="h-4 w-4 fill-current" />
            ) : (
              <PinOff className="h-4 w-4 opacity-60" />
            )}
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="p-1.5 hover:bg-ink/10 rounded-md"
          >
            <Trash2 className="h-4 w-4 opacity-60" />
          </button>
        </div>
      </div>
      <button onClick={onOpen} className="block text-left w-full">
        <p className="mt-2 font-body text-[15px] line-clamp-6 whitespace-pre-wrap">{note.body}</p>
      </button>
      {(note.tags?.length || note.updated_at) && (
        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {note.tags?.map((t) => (
              <Badge key={t} tone="soft">
                #{t}
              </Badge>
            ))}
          </div>
          <span className="text-xs opacity-70">{formatRelative(note.updated_at)}</span>
        </div>
      )}
    </div>
  );
}

function NoteEditor({
  open,
  note,
  onClose,
  onSave,
}: {
  open: boolean;
  note: Partial<Note> | null;
  onClose: () => void;
  onSave: (n: Partial<Note>) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [color, setColor] = React.useState("paper");
  const [pinned, setPinned] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setTags(note?.tags ?? []);
    setColor(note?.color ?? "paper");
    setPinned(note?.pinned ?? false);
    setTagInput("");
  }, [open, note]);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={note?.id ? "Edit note" : "New note"}
    >
      <div className="space-y-4">
        <Input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          placeholder="what's on your mind?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
        />

        <div>
          <div className="font-hand text-lg mb-2">Tags</div>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <Badge key={t} tone="soft" className="gap-1">
                #{t}
                <button
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  aria-label={`remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="add tag…"
              className="max-w-[160px]"
            />
          </div>
        </div>

        <div>
          <div className="font-hand text-lg mb-2">Paper</div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                aria-label={c.id}
                className={cn(
                  "h-8 w-8 rounded-full ink-border ink-shadow-sm",
                  color === c.id && "ring-3 ring-accent ring-offset-2 ring-offset-paper",
                )}
                style={{ background: c.swatch }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 font-hand text-lg">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent)]"
          />
          Pin to the top
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ id: note?.id, title, body, tags, pinned, color })}>
            {note?.id ? "Save changes" : "Save note"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
