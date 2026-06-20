import { createFileRoute } from "@tanstack/react-router";
import { Volume2, VolumeX, Play, Check, Palette, Bell } from "lucide-react";
import { Badge, Button, Card, Tape, Toggle } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";
import { ThemePicker } from "@/components/notebook/ThemePicker";
import { useSoundStore } from "@/stores/sound-store";
import { ALARMS, alarmPlayer, type AlarmId } from "@/lib/alarms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · TimeSketch" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { alarm, muted, setAlarm, setMuted } = useSoundStore();

  function preview(id: AlarmId) {
    alarmPlayer.playOnce(id);
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

          {/* Sound */}
          <Card>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
                  <Bell className="h-6 w-6" /> Alarm sound
                </h2>
                <p className="text-ink-soft mt-1 text-sm">
                  Pick the chime that plays when your timer hits zero. It will keep ringing until you press stop.
                </p>
              </div>
              <Toggle
                checked={!muted}
                onCheckedChange={(v) => setMuted(!v)}
                label={muted ? <span className="inline-flex items-center gap-2"><VolumeX className="h-4 w-4" /> Muted</span> : <span className="inline-flex items-center gap-2"><Volume2 className="h-4 w-4" /> Sound on</span>}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
            </div>

            {muted && (
              <div className="mt-4">
                <Badge tone="coral">Alarms are currently muted — timers will still complete, just silently.</Badge>
              </div>
            )}
          </Card>

          {/* Theme */}
          <Card>
            <h2 className="font-hand text-3xl leading-none flex items-center gap-2">
              <Palette className="h-6 w-6" /> Theme
            </h2>
            <p className="text-ink-soft mt-1 text-sm">Switch the whole notebook's mood. Saved across visits.</p>
            <div className="mt-5">
              <ThemePicker />
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
