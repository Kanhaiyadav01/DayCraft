import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Input, Tape } from "@/components/notebook";
import { useApplyTheme } from "@/stores/theme-store";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password · DayCraft" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  useApplyTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places `type=recovery` on the URL hash after the redirect.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-paper">
      <Card className="relative w-full max-w-md p-7 space-y-5">
        <Tape className="absolute -top-3 left-10" rotate={-5} />
        <h1 className="font-hand text-4xl text-center">
          New <span className="highlight-marker">password</span> ✏️
        </h1>
        {!ready ? (
          <p className="text-center text-ink-soft">
            This link looks expired. Request a new reset email from the sign-in page.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-hand text-lg flex items-center gap-2">
                <Lock className="h-4 w-4" /> New password
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-hand text-lg flex items-center gap-2">
                <Lock className="h-4 w-4" /> Confirm password
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              <Save className="h-4 w-4" /> Save new password
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
