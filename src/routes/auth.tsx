import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, Sparkles, UserRound, LogIn, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Input, Tape, Badge } from "@/components/notebook";
import { useApplyTheme } from "@/stores/theme-store";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · DayCraft" },
      { name: "description", content: "Sign in to DayCraft with email, Google, or as a guest." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  useApplyTheme();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const goNext = () => navigate({ to: "/dashboard" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // If the user is currently a guest, link credentials instead of signing up fresh.
      const { data: cur } = await supabase.auth.getUser();
      const isGuest = Boolean(cur.user && (cur.user as { is_anonymous?: boolean }).is_anonymous);

      if (mode === "signup") {
        if (isGuest) {
          // Convert guest -> permanent account, preserving all data.
          const { error: updErr } = await supabase.auth.updateUser({ email, password });
          if (updErr) throw updErr;
          if (displayName) {
            await supabase
              .from("profiles")
              .update({ display_name: displayName })
              .eq("id", cur.user!.id);
          }
          toast.success("Account linked! Your sketches are safe.");
          goNext();
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
              data: { display_name: displayName || email.split("@")[0] },
            },
          });
          if (error) throw error;
          toast.success("Welcome to DayCraft! ✏️");
          goNext();
        }
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        goNext();
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your inbox.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      // OAuth redirect is handled automatically by Supabase
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  async function continueAsGuest() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: "Guest" } },
      });
      if (error) throw error;
      toast.success("Sketching as a guest. Sign up later to save it.");
      goNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start guest session");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-paper">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="relative p-7 space-y-6">
          <Tape className="absolute -top-3 left-8" rotate={-6} />
          <Tape className="absolute -top-3 right-10 h-4 w-20" rotate={5} />

          <div className="text-center">
            <Link to="/" className="font-hand text-4xl leading-none">
              Day<span className="highlight-marker">Craft</span> ✏️
            </Link>
            <p className="mt-2 text-ink-soft">
              {mode === "signup"
                ? "Create your notebook."
                : mode === "forgot"
                  ? "We'll send you a reset link."
                  : "Welcome back to your notebook."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="font-hand text-lg flex items-center gap-2">
                  <UserRound className="h-4 w-4" /> Display name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-hand text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@notebook.com"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <label className="font-hand text-lg flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Password
                </label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {mode === "signup" ? (
                <>
                  <Sparkles className="h-4 w-4" /> Create account
                </>
              ) : mode === "forgot" ? (
                <>
                  Send reset link <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign in
                </>
              )}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="relative flex items-center">
                <div className="h-px w-full bg-ink/15" />
                <span className="px-3 font-hand text-ink-soft text-sm">or</span>
                <div className="h-px w-full bg-ink/15" />
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={signInWithGoogle}
                >
                  <GoogleMark /> Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="tape"
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={continueAsGuest}
                >
                  <Sparkles className="h-4 w-4" /> Try as guest
                </Button>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-between gap-2 text-sm">
            {mode === "signin" && (
              <>
                <button
                  className="font-hand text-ink-soft hover:text-ink"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
                <button
                  className="font-hand text-ink-soft hover:text-ink"
                  onClick={() => setMode("signup")}
                >
                  Need an account? <span className="highlight-marker">Sign up</span>
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                className="font-hand text-ink-soft hover:text-ink ml-auto"
                onClick={() => setMode("signin")}
              >
                Already have a notebook? <span className="highlight-marker">Sign in</span>
              </button>
            )}
            {mode === "forgot" && (
              <button
                className="font-hand text-ink-soft hover:text-ink ml-auto"
                onClick={() => setMode("signin")}
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-9.3 0-.6-.1-1.2-.2-1.8H12z"
      />
    </svg>
  );
}
