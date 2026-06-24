// Synthesized alarm sounds via Web Audio API, plus HTML5 audio support for custom sound uploads.
// Avoids shipping large static audio assets while offering robust customizable alarms.

export type AlarmId = "beep" | "bell" | "chime" | "focus" | "minimal";

export interface AlarmMeta {
  id: AlarmId;
  name: string;
  emoji: string;
  description: string;
}

export const ALARMS: AlarmMeta[] = [
  { id: "beep", name: "Classic Beep", emoji: "⏰", description: "Steady alarm-clock pulse." },
  { id: "bell", name: "Digital Bell", emoji: "🔔", description: "Bright clear bell ring." },
  { id: "chime", name: "Soft Chime", emoji: "🎐", description: "Warm wind chime tones." },
  { id: "focus", name: "Focus Bell", emoji: "🧘", description: "Calming resonance for work." },
  {
    id: "minimal",
    name: "Minimal Notification",
    emoji: "✨",
    description: "Quick clean double chirp.",
  },
];

export const DEFAULT_ALARM: AlarmId = "chime";

class AlarmPlayer {
  private ctx: AudioContext | null = null;
  private interval: number | ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null =
    null;
  private playing = false;
  private activeAudio: HTMLAudioElement | null = null;
  private onEndedCallback: (() => void) | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const W = window as unknown as {
        AudioContext: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = W.AudioContext || W.webkitAudioContext!;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private stopActiveAudio(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {
        /* ignore */
      }
      this.activeAudio = null;
    }
  }

  private triggerEnded(): void {
    const cb = this.onEndedCallback;
    this.stop();
    if (cb) {
      try {
        cb();
      } catch (err) {
        console.error("Error in alarm onEnded callback:", err);
      }
    }
  }

  /** Play a single occurrence of the alarm pattern. */
  playOnce(id: AlarmId, customSoundData?: string | null, volume: number = 0.8): void {
    try {
      this.stopActiveAudio();
      if (customSoundData) {
        const audio = new Audio(customSoundData);
        audio.volume = volume;
        this.activeAudio = audio;
        audio.play().catch((err) => console.error("Custom preview play error:", err));
      } else {
        const ctx = this.ensureCtx();
        renderPattern(ctx, id, ctx.currentTime, volume);
      }
    } catch (e) {
      console.error("Play once failed:", e);
    }
  }

  /** Play alarm according to selected mode (Notification, Repeat, Continuous) */
  start(
    id: AlarmId,
    mode: "notification" | "repeat" | "continuous",
    customSoundData: string | null,
    volume: number = 0.8,
    onEnded?: () => void,
  ): void {
    if (this.playing) {
      this.stop(); // Stop any currently playing alarms
    }
    this.playing = true;
    this.onEndedCallback = onEnded || null;

    if (customSoundData) {
      try {
        const audio = new Audio(customSoundData);
        audio.volume = volume;
        this.activeAudio = audio;

        if (mode === "notification") {
          audio.play().catch(() => this.triggerEnded());
          audio.addEventListener("ended", () => {
            this.triggerEnded();
          });
        } else if (mode === "repeat") {
          let playCount = 1;
          const handleEnded = () => {
            if (!this.playing) return;
            if (playCount >= 4) {
              // Repeat 4 times total
              this.triggerEnded();
              return;
            }
            this.interval = window.setTimeout(() => {
              if (!this.playing) return;
              audio.currentTime = 0;
              audio
                .play()
                .then(() => {
                  playCount++;
                })
                .catch(() => this.triggerEnded());
            }, 1000); // 1-second delay between repeats
          };
          audio.addEventListener("ended", handleEnded);
          audio.play().catch(() => this.triggerEnded());
        } else {
          // Continuous mode
          audio.loop = true;
          audio.play().catch((err) => {
            console.error("Continuous play error:", err);
            this.triggerEnded();
          });
        }
      } catch (err) {
        console.error("Audio playback error:", err);
        this.triggerEnded();
      }
    } else {
      // Synthesized alarm
      try {
        const ctx = this.ensureCtx();
        const period = PATTERN_PERIOD[id] || 2.0;

        renderPattern(ctx, id, ctx.currentTime, volume);

        if (mode === "notification") {
          this.interval = window.setTimeout(() => {
            this.triggerEnded();
          }, period * 1000);
        } else if (mode === "repeat") {
          let count = 1;
          this.interval = window.setInterval(() => {
            if (!this.ctx) return;
            if (count >= 4) {
              // Repeat 4 times total
              this.triggerEnded();
              return;
            }
            renderPattern(this.ctx, id, this.ctx.currentTime, volume);
            count++;
          }, period * 1000);
        } else {
          // Continuous mode
          this.interval = window.setInterval(() => {
            if (!this.ctx) return;
            renderPattern(this.ctx, id, this.ctx.currentTime, volume);
          }, period * 1000);
        }
      } catch (err) {
        console.error("Synthesizer playback error:", err);
        this.triggerEnded();
      }
    }
  }

  /** Backward-compatible loop: continuous mode with built-in sound. */
  startLoop(id: AlarmId, volume: number = 0.8): void {
    this.start(id, "continuous", null, volume);
  }

  /** Convenience: reads user preferences from sound store. */
  startWithPreferences(
    builtInId: AlarmId,
    mode: "notification" | "repeat" | "continuous",
    customSoundData: string | null,
    volume: number,
    muted: boolean,
    onEnded?: () => void,
  ): void {
    if (muted) return;
    if (customSoundData) {
      this.start(builtInId, mode, customSoundData, volume, onEnded);
    } else {
      this.start(builtInId, mode, null, volume, onEnded);
    }
  }

  stop(): void {
    if (this.interval != null) {
      clearInterval(this.interval as number);
      clearTimeout(this.interval as number);
      this.interval = null;
    }
    this.stopActiveAudio();
    this.playing = false;
    this.onEndedCallback = null;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  unlockAudio(): void {
    try {
      const ctx = this.ensureCtx();
      if (ctx.state === "suspended") {
        void ctx.resume().then(() => {
          console.log("[AlarmPlayer] AudioContext successfully resumed on user gesture.");
        });
      }
    } catch (e) {
      console.error("[AlarmPlayer] Failed to unlock audio context:", e);
    }
  }
}

const PATTERN_PERIOD: Record<AlarmId, number> = {
  beep: 1.6,
  bell: 2.0,
  chime: 2.2,
  focus: 2.5,
  minimal: 1.0,
};

function renderPattern(ctx: AudioContext, id: AlarmId, t0: number, volume: number = 0.8): void {
  switch (id) {
    case "beep":
      for (let i = 0; i < 3; i++) {
        tone(ctx, t0 + i * 0.22, 1000, 0.16, "square", 0.22, volume);
      }
      break;
    case "bell":
      tone(ctx, t0, 987.77, 1.5, "sine", 0.4, volume);
      tone(ctx, t0, 1975.53, 0.5, "sine", 0.1, volume);
      break;
    case "chime":
      tone(ctx, t0 + 0.0, 880, 1.1, "sine", 0.35, volume);
      tone(ctx, t0 + 0.18, 1320, 1.4, "sine", 0.25, volume);
      tone(ctx, t0 + 0.36, 660, 1.6, "sine", 0.18, volume);
      break;
    case "focus":
      tone(ctx, t0, 659.25, 2.0, "triangle", 0.35, volume);
      tone(ctx, t0 + 0.05, 987.77, 1.5, "sine", 0.2, volume);
      break;
    case "minimal":
      tone(ctx, t0, 880, 0.08, "sine", 0.3, volume);
      tone(ctx, t0 + 0.1, 1046.5, 0.15, "sine", 0.25, volume);
      break;
  }
}

function tone(
  ctx: AudioContext,
  start: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  gainPeak: number,
  volumeFactor: number = 0.8,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = ctx.currentTime;
  const startTime = Math.max(now, start);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak * volumeFactor, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0.0001, startTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.05);
}

export const alarmPlayer = new AlarmPlayer();

if (typeof window !== "undefined") {
  const unlock = () => {
    alarmPlayer.unlockAudio();
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
    document.removeEventListener("touchstart", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
  document.addEventListener("touchstart", unlock);
}
