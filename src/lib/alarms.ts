// Synthesized alarm sounds via Web Audio API.
// Avoids shipping audio assets while giving each alarm a distinct character.

export type AlarmId = "chime" | "beep" | "digital";

export interface AlarmMeta {
  id: AlarmId;
  name: string;
  emoji: string;
  description: string;
}

export const ALARMS: AlarmMeta[] = [
  { id: "chime", name: "Soft Chime", emoji: "🔔", description: "Warm bell, gentle and friendly." },
  { id: "beep", name: "Classic Beep", emoji: "⏰", description: "Steady alarm-clock pulse." },
  { id: "digital", name: "Digital Rise", emoji: "📟", description: "Bright rising chirp." },
];

export const DEFAULT_ALARM: AlarmId = "chime";

type Ctx = AudioContext & { webkitAudioContext?: typeof AudioContext };

class AlarmPlayer {
  private ctx: AudioContext | null = null;
  private interval: number | null = null;
  private playing = false;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const W = window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const Ctor = W.AudioContext || W.webkitAudioContext!;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Play a single occurrence of the alarm pattern. */
  playOnce(id: AlarmId): void {
    try {
      const ctx = this.ensureCtx();
      renderPattern(ctx, id, ctx.currentTime);
    } catch {
      /* ignore */
    }
  }

  /** Loop the alarm until stop() is called. */
  startLoop(id: AlarmId): void {
    if (this.playing) return;
    this.playing = true;
    try {
      const ctx = this.ensureCtx();
      const period = PATTERN_PERIOD[id];
      // schedule first immediately, then on interval
      renderPattern(ctx, id, ctx.currentTime);
      this.interval = window.setInterval(() => {
        if (!this.ctx) return;
        renderPattern(this.ctx, id, this.ctx.currentTime);
      }, period * 1000);
    } catch {
      this.playing = false;
    }
  }

  stop(): void {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }
}

const PATTERN_PERIOD: Record<AlarmId, number> = {
  chime: 2.2,
  beep: 1.6,
  digital: 1.8,
};

function renderPattern(ctx: AudioContext, id: AlarmId, t0: number): void {
  switch (id) {
    case "chime":
      tone(ctx, t0 + 0.0, 880, 1.1, "sine", 0.35);
      tone(ctx, t0 + 0.18, 1320, 1.4, "sine", 0.25);
      tone(ctx, t0 + 0.36, 660, 1.6, "sine", 0.18);
      break;
    case "beep":
      for (let i = 0; i < 3; i++) {
        tone(ctx, t0 + i * 0.22, 1000, 0.16, "square", 0.22);
      }
      break;
    case "digital":
      tone(ctx, t0 + 0.0, 700, 0.18, "triangle", 0.28);
      tone(ctx, t0 + 0.18, 950, 0.18, "triangle", 0.28);
      tone(ctx, t0 + 0.36, 1250, 0.22, "triangle", 0.3);
      tone(ctx, t0 + 0.7, 1250, 0.22, "triangle", 0.3);
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
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export const alarmPlayer = new AlarmPlayer();
