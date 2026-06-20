import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, User as UserIcon, Mail, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Input, Tape, Badge, Textarea } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · TimeSketch" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("user_settings").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { profile: p, settings: s };
    },
  });

  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [dailyGoal, setDailyGoal] = React.useState(120);
  const [focusMin, setFocusMin] = React.useState(25);
  const [breakMin, setBreakMin] = React.useState(5);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!profile || loaded) return;
    setDisplayName(profile.profile?.display_name ?? "");
    setBio(profile.profile?.bio ?? "");
    setAvatarUrl(profile.profile?.avatar_url ?? "");
    setDailyGoal(profile.settings?.daily_goal_minutes ?? 120);
    setFocusMin(profile.settings?.default_focus_minutes ?? 25);
    setBreakMin(profile.settings?.default_break_minutes ?? 5);
    setLoaded(true);
  }, [profile, loaded]);

  const [saving, setSaving] = React.useState(false);
  async function save() {
    if (!user) return;
    setSaving(true);
    const [{ error: pErr }, { error: sErr }] = await Promise.all([
      supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      }),
      supabase.from("user_settings").upsert({
        user_id: user.id,
        daily_goal_minutes: dailyGoal,
        default_focus_minutes: focusMin,
        default_break_minutes: breakMin,
      }),
    ]);
    setSaving(false);
    if (pErr || sErr) return toast.error(pErr?.message ?? sErr?.message ?? "Couldn't save");
    toast.success("Profile saved ✏️");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const created = user?.created_at ? new Date(user.created_at) : null;
  const initial = (displayName || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 left-12" rotate={-3} />
            <h1 className="font-hand text-5xl leading-none">Profile</h1>
            <p className="text-ink-soft mt-1">How you show up in your notebook.</p>
          </header>

          {isGuest && (
            <Card className="bg-coral/15">
              <p className="font-hand text-xl">You're in guest mode</p>
              <p className="text-ink-soft text-sm mt-1">
                Sign up to keep your profile, focus garden, and history safe across devices.
              </p>
            </Card>
          )}

          <Card>
            <div className="flex items-start gap-5 flex-wrap">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-24 w-24 object-cover ink-border rounded-[20px_28px_18px_24px] ink-shadow-sm"
                    onError={(e) => ((e.currentTarget.style.display = "none"))}
                  />
                ) : (
                  <div className="h-24 w-24 grid place-items-center bg-accent text-accent-foreground ink-border rounded-[20px_28px_18px_24px] ink-shadow-sm font-hand text-5xl">
                    {initial}
                  </div>
                )}
                <Tape className="absolute -top-3 -left-3" rotate={-12} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-hand text-3xl leading-none">{displayName || "Unnamed scribbler"}</div>
                <div className="text-sm text-ink-soft inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {user?.email ?? "guest@timesketch"}</div>
                {created && (
                  <div className="text-sm text-ink-soft inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> Joined {created.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
                )}
                <div className="pt-1"><Badge tone="mint"><Sparkles className="h-3 w-3 mr-1 inline" /> Notebook member</Badge></div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-hand text-2xl flex items-center gap-2"><UserIcon className="h-5 w-5" /> About you</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Display name">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="What should we call you?" />
              </Field>
              <Field label="Avatar URL">
                <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
              </Field>
              <Field label="Bio">
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A line or two about your focus practice…" />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="font-hand text-2xl">Defaults</h2>
            <p className="text-ink-soft text-sm mt-1">Used across timer and focus sessions.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Daily goal (min)">
                <Input type="number" min={5} max={1440} value={dailyGoal} onChange={(e) => setDailyGoal(clamp(+e.target.value, 5, 1440))} />
              </Field>
              <Field label="Default focus (min)">
                <Input type="number" min={1} max={240} value={focusMin} onChange={(e) => setFocusMin(clamp(+e.target.value, 1, 240))} />
              </Field>
              <Field label="Default break (min)">
                <Input type="number" min={1} max={60} value={breakMin} onChange={(e) => setBreakMin(clamp(+e.target.value, 1, 60))} />
              </Field>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || isGuest}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-hand text-lg leading-none mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function clamp(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
