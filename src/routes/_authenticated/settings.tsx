import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Check,
  Palette,
  Bell,
  LogOut,
  User as UserIcon,
  RotateCcw,
  Upload,
  Trash2,
  Repeat,
  Volume1,
  Repeat1,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, Tape, Toggle, Modal, Input, Textarea } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { ThemePicker } from "@/components/notebook/ThemePicker";
import { useSoundStore } from "@/stores/sound-store";
import { ALARMS, DEFAULT_ALARM, alarmPlayer, type AlarmId } from "@/lib/alarms";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTimerStore } from "@/stores/timer-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · DayCraft" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const {
    alarm,
    muted,
    alarmMode,
    volume,
    customSoundName,
    customSoundData,
    setAlarm,
    setMuted,
    setAlarmMode,
    setCustomSound,
    setVolume,
  } = useSoundStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [signOutOpen, setSignOutOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("daycraft-guest-profile");
        return local
          ? JSON.parse(local)
          : { display_name: "Guest", bio: "Cozy planning guest mode ✏️", avatar_url: null };
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);

  React.useEffect(() => {
    if (profileData && !loaded) {
      setDisplayName(profileData.display_name ?? "");
      setBio(profileData.bio ?? "");
      setAvatarUrl(profileData.avatar_url ?? "");
      setLoaded(true);
    }
  }, [profileData, loaded]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setAvatarUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);
    if (isGuest) {
      localStorage.setItem(
        "daycraft-guest-profile",
        JSON.stringify({
          id: user.id,
          display_name: displayName || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        }),
      );
      setSavingProfile(false);
      toast.success("Profile saved successfully ✏️");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    });
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved successfully ✏️");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

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

  function preview(id: AlarmId | "custom") {
    if (id === "custom" && customSoundData) {
      alarmPlayer.playOnce(alarm, customSoundData, volume);
    } else if (id !== "custom") {
      alarmPlayer.playOnce(id, null, volume);
    }
  }

  const [testingAlarm, setTestingAlarm] = React.useState(false);

  function handleTestAlarm() {
    if (testingAlarm) {
      alarmPlayer.stop();
      setTestingAlarm(false);
      return;
    }
    setTestingAlarm(true);
    const soundData = customSoundData || null;
    alarmPlayer.start(alarm, alarmMode, soundData, volume);
    // Auto-stop for non-continuous modes
    if (alarmMode === "notification") {
      setTimeout(() => setTestingAlarm(false), 3000);
    } else if (alarmMode === "repeat") {
      setTimeout(() => setTestingAlarm(false), 12000);
    }
  }

  // Sync sound settings to/from Supabase profile
  React.useEffect(() => {
    if (profileData && !loaded) return; // wait for profile load
    if (!profileData?.sound_settings || loaded) return;
  }, [profileData, loaded]);

  // Hydrate sound store from Supabase profile on first load
  React.useEffect(() => {
    if (!profileData?.sound_settings) return;
    const ss = profileData.sound_settings as Record<string, unknown>;
    if (typeof ss.alarm === "string") setAlarm(ss.alarm as AlarmId);
    if (
      ss.alarmMode === "notification" ||
      ss.alarmMode === "repeat" ||
      ss.alarmMode === "continuous"
    ) {
      setAlarmMode(ss.alarmMode);
    }
    if (typeof ss.volume === "number") setVolume(ss.volume);
    if (typeof ss.customSoundData === "string") {
      setCustomSound(ss.customSoundData, (ss.customSoundName as string) || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData?.sound_settings]);

  async function saveSoundSettings() {
    if (!user) return;
    const soundSettings = {
      alarm,
      alarmMode,
      volume,
      customSoundData,
      customSoundName: customSoundName,
      muted,
    };
    if (isGuest) {
      // Already persisted by zustand
      toast.success("Sound settings saved ✏️");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      sound_settings: soundSettings,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Sound settings synced to cloud ☁️");
    }
  }

  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false);

  function handleResetGuestData() {
    import("@/lib/guest-db").then(({ resetAllGuestData }) => {
      resetAllGuestData();
      toast.success("Guest data has been reset successfully.");
      setResetConfirmOpen(false);
      queryClient.invalidateQueries();
      setDisplayName("Guest");
      setBio("Cozy planning guest mode ✏️");
      setAvatarUrl("");
      navigate({ to: "/dashboard" });
    });
  }

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="paper-card p-6 relative">
            <Tape className="absolute -top-3 left-12" rotate={-4} />
            <h1 className="font-hand text-5xl leading-none">Settings</h1>
            <p className="text-ink-soft mt-1">All your customization in one cozy spot.</p>
          </header>

          {/* Profile settings */}
          <Card>
            <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
              <UserIcon className="h-6 w-6" /> Customize Profile
            </h2>
            <p className="text-ink-soft mt-1 text-sm">
              Update your notebook identity. Upload a custom avatar or write your bio.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-3 items-start">
              <div className="flex flex-col items-center gap-3 p-4 paper-card bg-card max-w-[200px] mx-auto md:mx-0">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User profile avatar"
                      className="h-24 w-24 object-cover rounded-full ink-border ink-shadow-sm bg-paper"
                    />
                  ) : (
                    <div className="h-24 w-24 grid place-items-center bg-accent text-accent-foreground ink-border rounded-full font-hand text-4xl">
                      {(displayName || user?.email || "?").trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 ink-border rounded-[10px_14px_8px_12px] font-hand text-base bg-card ink-shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer text-center">
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                  {avatarUrl && (
                    <Button variant="outline" size="sm" onClick={() => setAvatarUrl("")}>
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block">
                  <span className="block font-hand text-lg mb-1">Display Name</span>
                  <Input
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="block font-hand text-lg mb-1">Bio</span>
                  <Textarea
                    placeholder="A line or two about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                </label>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Sound */}
          <Card>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
                  <Bell className="h-6 w-6" /> Alarm & Sounds
                </h2>
                <p className="text-ink-soft mt-1 text-sm">
                  Customize your focus notification sounds, playback behavior, and volume.
                </p>
              </div>
              <Toggle
                checked={!muted}
                onCheckedChange={(v) => setMuted(!v)}
                label={
                  muted ? (
                    <span className="inline-flex items-center gap-2">
                      <VolumeX className="h-4 w-4" /> Muted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Volume2 className="h-4 w-4" /> Sound on
                    </span>
                  )
                }
              />
            </div>

            <div className="mt-6 space-y-6">
              {/* Playback Mode */}
              <div className="space-y-3">
                <h3 className="font-hand text-2xl">Playback Mode</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "notification",
                      name: "Once",
                      desc: "Plays a short beep once",
                      icon: Bell,
                    },
                    {
                      id: "repeat",
                      name: "Repeat (3x)",
                      desc: "Plays the sound 3 times",
                      icon: Repeat1,
                    },
                    {
                      id: "continuous",
                      name: "Continuous",
                      desc: "Loops until you stop it",
                      icon: Repeat,
                    },
                  ].map((mode) => {
                    const active = alarmMode === mode.id;
                    const Icon = mode.icon;
                    return (
                      <div
                        key={mode.id}
                        onClick={() =>
                          setAlarmMode(mode.id as "notification" | "repeat" | "continuous")
                        }
                        className={cn(
                          "paper-card p-3 cursor-pointer transition-all hover:-translate-y-0.5",
                          active &&
                            "ring-3 ring-accent ring-offset-2 ring-offset-paper bg-accent/5",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {mode.name}
                          </div>
                          {active && (
                            <Check className="h-4 w-4 text-accent-foreground" strokeWidth={3} />
                          )}
                        </div>
                        <p className="text-xs text-ink-soft mt-1">{mode.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Control */}
              <div className="space-y-3 max-w-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-hand text-2xl">Volume</h3>
                  <span className="text-sm font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Volume1 className="h-5 w-5 text-ink-soft" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <Volume2 className="h-5 w-5 text-ink-soft" />
                </div>
              </div>

              {/* Built-in Sounds */}
              <div className="space-y-3">
                <h3 className="font-hand text-2xl">Choose Sound</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {ALARMS.map((a) => {
                    const active = alarm === a.id;
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "paper-card p-4 transition-all",
                          active && "ring-3 ring-accent ring-offset-2 ring-offset-paper",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-hand text-2xl leading-none">
                            {a.emoji} {a.name}
                          </div>
                          {active && (
                            <span className="grid place-items-center h-7 w-7 rounded-full bg-accent text-accent-foreground ink-border">
                              <Check className="h-4 w-4" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-soft mt-1">{a.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => preview(a.id)}>
                            <Play className="h-4 w-4" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            variant={active ? "ghost" : "primary"}
                            onClick={() => setAlarm(a.id)}
                            disabled={active}
                          >
                            {active ? "Selected" : "Choose"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Sound Card */}
                  <div
                    className={cn(
                      "paper-card p-4 transition-all",
                      alarm === "custom" && "ring-3 ring-accent ring-offset-2 ring-offset-paper",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-hand text-2xl leading-none flex items-center gap-2">
                        🎵 Custom
                      </div>
                      {alarm === "custom" && (
                        <span className="grid place-items-center h-7 w-7 rounded-full bg-accent text-accent-foreground ink-border">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft mt-1">
                      {customSoundName ? `Uploaded: ${customSoundName}` : "Upload your own MP3/WAV"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customSoundData ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => preview("custom")}>
                            <Play className="h-4 w-4" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            variant={alarm === "custom" ? "ghost" : "primary"}
                            onClick={() => setAlarm("custom")}
                            disabled={alarm === "custom"}
                          >
                            {alarm === "custom" ? "Selected" : "Choose"}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setCustomSound(null, null);
                              if (alarm === "custom") setAlarm(DEFAULT_ALARM);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <label className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px_14px_8px_12px] bg-accent text-accent-foreground px-3 py-1.5 text-sm font-bold shadow-[2px_4px_0px_0px_#27272a] transition-all hover:-translate-y-0.5 hover:shadow-[3px_6px_0px_0px_#27272a] cursor-pointer">
                          <Upload className="h-4 w-4" /> Upload
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("Audio file must be under 5MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setCustomSound(event.target?.result as string, file.name);
                                setAlarm("custom");
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Alarm */}
              <div className="space-y-3">
                <h3 className="font-hand text-2xl">Test Alarm</h3>
                <p className="text-xs text-ink-soft">
                  Plays your active alarm (
                  {customSoundData
                    ? customSoundName || "Custom"
                    : ALARMS.find((a) => a.id === alarm)?.name || alarm}
                  ) in {alarmMode} mode.
                </p>
                <div className="flex gap-3">
                  <Button variant={testingAlarm ? "danger" : "primary"} onClick={handleTestAlarm}>
                    {testingAlarm ? (
                      <>
                        <Square className="h-4 w-4" /> Stop Test
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Test Alarm
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={saveSoundSettings}>
                    Save Sound Settings
                  </Button>
                </div>
              </div>
            </div>

            {muted && (
              <div className="mt-4">
                <Badge tone="coral">
                  Alarms are currently muted — timers will still complete, just silently.
                </Badge>
              </div>
            )}
          </Card>

          {/* Theme */}
          <Card>
            <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
              <Palette className="h-6 w-6" /> Theme
            </h2>
            <p className="text-ink-soft mt-1 text-sm">
              Switch the whole notebook's mood. Saved across visits.
            </p>
            <div className="mt-5">
              <ThemePicker />
            </div>
          </Card>

          {/* Session management */}
          <Card>
            <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
              <LogOut className="h-6 w-6 text-coral" /> {isGuest ? "Exit Guest Mode" : "Sign Out"}
            </h2>
            <p className="text-ink-soft mt-1 text-sm">
              {isGuest
                ? "This guest notebook is tied to your temporary browser session. Exit to start fresh or sign in."
                : "Log out of your account. Your garden and history will be saved."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {isGuest && (
                <Button variant="outline" onClick={keepGuestNotebook}>
                  Keep my notebook (Sign up)
                </Button>
              )}
              <Button variant="danger" onClick={() => setSignOutOpen(true)}>
                <LogOut className="h-4 w-4" /> {isGuest ? "Exit guest mode" : "Sign out"}
              </Button>
            </div>
          </Card>

          {/* Guest Reset Card */}
          {isGuest && (
            <Card>
              <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-coral" /> Reset Guest Data
              </h2>
              <p className="text-ink-soft mt-1 text-sm">
                Permanently clear all guest data from this browser, including your notes, checklist
                items, focus sessions, timer logs, and settings.
              </p>
              <div className="mt-5">
                <Button variant="danger" onClick={() => setResetConfirmOpen(true)}>
                  Reset Guest Data
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

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

      <Modal
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset Guest Data?"
        description="Are you absolutely sure? This will delete all your notes, history, goals, and customized settings from this browser. This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetGuestData}>
              Yes, reset all guest data
            </Button>
          </>
        }
      />
    </Shell>
  );
}
