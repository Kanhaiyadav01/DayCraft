import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Timer,
  TimerReset,
  NotebookPen,
  LogOut,
  Menu,
  X,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Sparkles,
  History as HistoryIcon,
  BarChart3,
  Clock,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useApplyTheme } from "@/stores/theme-store";
import { useSoundStore } from "@/stores/sound-store";
import { useTimerStore } from "@/stores/timer-store";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Modal } from "./Modal";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/focus", label: "Focus Mode", icon: Sparkles },
  { to: "/time-tracking", label: "Time Tracking", icon: HistoryIcon },
  { to: "/timer", label: "Timer", icon: Timer },
  { to: "/stopwatch", label: "Stopwatch", icon: TimerReset },
  { to: "/goals", label: "Today's Goals", icon: CheckSquare },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/clock", label: "Clock", icon: Clock },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  useApplyTheme();
  const [open, setOpen] = React.useState(false);
  const [signOutOpen, setSignOutOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuth();
  const name =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    (isGuest ? "Guest" : "Friend");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const displayName = profile?.display_name || name;
  const avatarUrl = profile?.avatar_url;

  React.useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      useTimerStore.getState().reset();
      queryClient.clear();
      setSignOutOpen(false);
      toast.success(isGuest ? "Guest mode exited." : "Signed out. See you soon!");
      await navigate({ to: "/auth", search: { mode: undefined }, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out");
    } finally {
      setSigningOut(false);
    }
  }

  async function keepGuestNotebook() {
    setSignOutOpen(false);
    await navigate({ to: "/auth", search: { mode: "signup" } });
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4 border-r-2 border-ink bg-paper-2 p-5 sticky top-0 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <BrandMark />
        <NavList pathname={pathname} />
        <div className="mt-auto">
          <UserCard
            name={displayName}
            avatarUrl={avatarUrl}
            isGuest={isGuest}
            onSignOut={() => setSignOutOpen(true)}
          />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between gap-2 border-b-2 border-ink bg-paper-2 px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="font-hand text-2xl leading-none">DayCraft</span>
        </Link>
        <Button variant="outline" size="icon" aria-label="Menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-ink/40"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="h-full w-72 bg-paper-2 border-r-2 border-ink p-5 flex flex-col gap-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <BrandMark />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavList pathname={pathname} />
              <div className="mt-auto">
                <UserCard
                  name={displayName}
                  avatarUrl={avatarUrl}
                  isGuest={isGuest}
                  onSignOut={() => setSignOutOpen(true)}
                />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">{children}</main>

      <Modal
        open={signOutOpen}
        onOpenChange={(next) => !signingOut && setSignOutOpen(next)}
        title={isGuest ? "Exit guest mode?" : "Sign out?"}
        description={
          isGuest
            ? "This guest notebook is tied to this temporary session. Create an account first if you want to keep its notes, history, and garden."
            : "You can sign back in whenever you are ready."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setSignOutOpen(false)} disabled={signingOut}>
              Cancel
            </Button>
            {isGuest && (
              <Button variant="outline" onClick={keepGuestNotebook} disabled={signingOut}>
                Keep my notebook
              </Button>
            )}
            <Button variant="danger" onClick={signOut} disabled={signingOut}>
              <LogOut className="h-4 w-4" />
              {signingOut ? "Leaving..." : isGuest ? "Exit guest mode" : "Sign out"}
            </Button>
          </>
        }
      />
    </div>
  );
}

function BrandMark() {
  return (
    <Link to="/dashboard" className="block">
      <div className="font-hand text-3xl leading-none">
        Day<span className="highlight-marker">Craft</span>
      </div>
      <div className="font-body text-xs text-ink-soft mt-1">your productivity notebook</div>
    </Link>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 font-hand text-lg",
              "border-2 border-transparent rounded-[10px_14px_8px_12px] transition-all",
              active
                ? "bg-accent text-accent-foreground border-ink ink-shadow-sm -rotate-[0.4deg]"
                : "text-ink hover:bg-accent-soft hover:border-ink/30",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({
  name,
  avatarUrl,
  isGuest,
  onSignOut,
}: {
  name: string;
  avatarUrl?: string | null;
  isGuest: boolean;
  onSignOut: () => void;
}) {
  const navigate = useNavigate();
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      onClick={() => navigate({ to: "/settings" })}
      className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-accent-soft cursor-pointer transition-colors border border-transparent hover:border-ink/10"
      title="Profile settings"
    >
      <div className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-10 w-10 object-cover rounded-full ink-border"
          />
        ) : (
          <div className="h-10 w-10 grid place-items-center bg-accent text-accent-foreground ink-border rounded-full font-hand text-xl">
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-hand text-base font-bold leading-none truncate">Hello, {name}!</div>
        <div className="text-xs text-ink-soft mt-0.5 truncate">
          {isGuest ? "Guest Mode ✏️" : "Stay productive 🚀"}
        </div>
      </div>
    </div>
  );
}
