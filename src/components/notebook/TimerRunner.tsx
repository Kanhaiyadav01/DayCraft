import * as React from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTimerStore } from "@/stores/timer-store";
import { useSoundStore } from "@/stores/sound-store";
import { alarmPlayer } from "@/lib/alarms";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mounted once at the app root. Drives the global timer:
 * - polls every 500ms (works even when other components unmount)
 * - on zero, plays the chosen alarm in a loop until the user stops it
 * - records the completed run to Supabase once per cycle
 */
export function TimerRunner() {
  const endAt = useTimerStore((s) => s.endAt);
  const alarming = useTimerStore((s) => s.alarming);
  const duration = useTimerStore((s) => s.duration);
  const label = useTimerStore((s) => s.label);
  const presetLabel = useTimerStore((s) => s.presetLabel);
  const _markComplete = useTimerStore((s) => s._markComplete);

  const muted = useSoundStore((s) => s.muted);
  const alarm = useSoundStore((s) => s.alarm);
  const qc = useQueryClient();

  // Tick: detect completion.
  React.useEffect(() => {
    if (!endAt) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (Date.now() >= endAt) {
        _markComplete();
        return;
      }
    };
    const id = window.setInterval(tick, 500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [endAt, _markComplete]);

  // When alarming flips on: play loop + toast + save run.
  const lastFiredRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (!alarming) {
      alarmPlayer.stop();
      return;
    }
    const now = Date.now();
    if (now - lastFiredRef.current < 1500) return; // de-dupe across remounts
    lastFiredRef.current = now;

    if (!muted) alarmPlayer.startLoop(alarm);
    toast.success(`${presetLabel} complete! Click stop to silence.`, {
      duration: 8000,
    });

    void (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) return;
        await supabase.from("timer_runs").insert({
          user_id: user.id,
          kind: "timer",
          seconds: duration,
          label: label || presetLabel,
        });
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      } catch {
        /* ignore */
      }
    })();

    return () => alarmPlayer.stop();
    // alarming is the trigger; other values are read at fire-time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarming]);

  // If user toggles mute while alarm is playing, honor it.
  React.useEffect(() => {
    if (!alarming) return;
    if (muted) alarmPlayer.stop();
    else alarmPlayer.startLoop(alarm);
  }, [muted, alarm, alarming]);

  return null;
}
