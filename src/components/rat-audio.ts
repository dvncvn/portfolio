// Straight 132 BPM; five-step and seven-step phrases drift across the bar.
export const RAT_BPM = 132;
const SIXTEENTH = 60 / RAT_BPM / 4;
export const DEFAULT_RAT_MIX = { drums: 0.85, bass: 0.8, arp: 0.6, synth: 0.45, pad: 0.4, filter: 0.68, delay: 0.35 };
export type RatMix = typeof DEFAULT_RAT_MIX;
export type RatCue = "build" | "drop" | "pattern";
type Track = "drums" | "bass" | "arp" | "synth" | "pad" | "delay";
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

export class RatAudio {
  private context: AudioContext;
  private master: GainNode;
  private limiter: DynamicsCompressorNode;
  private filter: BiquadFilterNode;
  private tracks: Record<Track, GainNode>;
  private mix = { ...DEFAULT_RAT_MIX };
  private pending: RatCue | null = null;
  private pattern = 0;
  private noise: AudioBuffer;
  private timer: ReturnType<typeof setInterval> | undefined;
  private voices = new Set<OscillatorNode | AudioBufferSourceNode>();
  private step = 0;
  private nextNote = 0;
  private nextPad = 0;
  private population = 3;
  private running = false;
  private disposed = false;
  private lastSqueak = -1;
  private beats: { time: number; step: number; bar: number; section: string }[] = [];

  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.value = -18;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 6;
    this.filter = this.context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.tracks = Object.fromEntries((["drums", "bass", "arp", "synth", "pad", "delay"] as Track[]).map((track) => {
      const gain = this.context.createGain();
      gain.connect(this.filter);
      return [track, gain];
    })) as Record<Track, GainNode>;
    this.filter.connect(this.master);
    this.master.connect(this.limiter);
    this.setMix(this.mix);
    this.limiter.connect(this.context.destination);
    this.noise = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.12), this.context.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  setPopulation(count: number) { this.population = Math.max(3, Math.min(24, count)); }

  setMix(update: Partial<RatMix>) {
    if (this.disposed) return;
    for (const key of Object.keys(this.mix) as (keyof RatMix)[]) {
      const value = update[key];
      if (value !== undefined && Number.isFinite(value)) this.mix[key] = Math.max(0, Math.min(1, value));
    }
    const now = this.context.currentTime;
    for (const track of Object.keys(this.tracks) as Track[]) this.tracks[track].gain.setTargetAtTime(this.mix[track], now, 0.025);
    this.filter.frequency.setTargetAtTime(180 * (18000 / 180) ** this.mix.filter, now, 0.04);
  }

  cue(action: RatCue) { this.pending = action; }

  // Read the audible beat, not the scheduler's next (future) note.
  getBeat() {
    if (!this.running || this.context.state !== "running") return null;
    const now = this.context.currentTime;
    for (let i = this.beats.length - 1; i >= 0; i--) {
      const beat = this.beats[i];
      if (beat.time <= now) return { step: beat.step, bar: beat.bar, section: beat.section, queued: this.pending, strength: Math.max(0, 1 - (now - beat.time) / 0.18) };
    }
    return null;
  }

  async start() {
    if (this.disposed || this.running) return;
    this.running = true;
    try {
      await this.context.resume();
    } catch (error) {
      this.running = false;
      throw error;
    }
    // A mute, tab switch, or unmount may have happened during resume().
    if (!this.running || this.disposed || this.timer !== undefined) return;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(0.32, this.context.currentTime, 0.025);
    this.nextNote = this.context.currentTime + 0.03;
    this.nextPad = this.nextNote;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    this.running = false;
    this.beats = [];
    clearInterval(this.timer);
    this.timer = undefined;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.008);
    for (const voice of this.voices) voice.stop(this.context.currentTime + 0.04);
  }

  dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    void this.context.close().catch(() => {});
  }

  private voice(source: OscillatorNode | AudioBufferSourceNode, nodes: AudioNode[], time: number, duration: number) {
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
    source.start(time);
    source.stop(time + duration);
  }

  private note(note: number, time: number, duration: number, volume: number, type: OscillatorType, pan = 0, slide = 0, cutoff = 0, track: Track | null = null) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    osc.type = type;
    osc.frequency.setValueAtTime(hz(note), time);
    if (slide) osc.frequency.exponentialRampToValueAtTime(hz(note + slide), time + duration * 0.7);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    panner.pan.value = pan;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff || 18000, time);
    if (cutoff) filter.frequency.exponentialRampToValueAtTime(Math.max(180, cutoff * 0.22), time + duration);
    osc.connect(filter).connect(gain).connect(panner).connect(track ? this.tracks[track] : this.master);
    this.voice(osc, [filter, gain, panner], time, duration + 0.01);
  }

  private tap(time: number, snare: boolean) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noise;
    filter.type = "highpass";
    filter.frequency.value = snare ? 950 : 5800;
    const duration = snare ? 0.09 : 0.035;
    gain.gain.setValueAtTime(snare ? 0.12 : 0.055, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(gain).connect(this.tracks.drums);
    this.voice(source, [filter, gain], time, duration);
  }

  // Feeding gets a little arguing duet, panned toward the crumbs.
  squeak(pan = 0) {
    const now = this.context.currentTime;
    if (!this.running || this.context.state !== "running" || now - this.lastSqueak < 0.14) return;
    this.lastSqueak = now;
    this.note(84, now, 0.11, 0.1, "sine", pan, 9);
    this.note(91, now + 0.12, 0.15, 0.065, "triangle", -pan, -12);
  }

  private kick(time: number) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.1);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.65, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
    osc.connect(gain).connect(this.tracks.drums);
    this.voice(osc, [gain], time, 0.33);
  }

  private metal(time: number, pitch: number, depth: number, pan: number) {
    const carrier = this.context.createOscillator();
    const modulator = this.context.createOscillator();
    const modulation = this.context.createGain();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    carrier.frequency.value = hz(pitch);
    modulator.frequency.value = hz(pitch) * 1.414;
    modulation.gain.setValueAtTime(depth, time);
    modulation.gain.exponentialRampToValueAtTime(1, time + 0.18);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(0.055, time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
    panner.pan.value = pan;
    modulator.connect(modulation).connect(carrier.frequency);
    carrier.connect(envelope).connect(panner).connect(this.tracks.synth);
    this.voice(carrier, [envelope, panner], time, 0.28);
    this.voice(modulator, [modulation], time, 0.28);
  }

  private pad(time: number, variation: number) {
    const phrase = SIXTEENTH * 64;
    const duration = phrase + 3;
    // Open A/E/B voicing: no chord progression, just a slowly moving bed.
    [57, 64, 71].forEach((pitch, index) => {
      for (const side of [-1, 1]) {
        const osc = this.context.createOscillator();
        const filter = this.context.createBiquadFilter();
        const envelope = this.context.createGain();
        const panner = this.context.createStereoPanner();
        osc.type = index === 2 ? "sine" : "triangle";
        osc.frequency.value = hz(pitch) * 2 ** (side * (4 + index * 2) / 1200);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(380, time);
        filter.frequency.exponentialRampToValueAtTime(850 + 250 * Math.sin(variation * 0.7 + index), time + phrase * 0.55);
        filter.frequency.exponentialRampToValueAtTime(320, time + duration);
        const level = index === 2 ? 0.022 : 0.045;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(level, time + 2.5);
        envelope.gain.linearRampToValueAtTime(level * 0.8, time + phrase);
        envelope.gain.linearRampToValueAtTime(0, time + duration);
        panner.pan.setValueAtTime(side * 0.75, time);
        panner.pan.linearRampToValueAtTime(side * 0.3, time + phrase * 0.5);
        panner.pan.linearRampToValueAtTime(side * 0.85, time + duration);
        osc.connect(filter).connect(envelope).connect(panner).connect(this.tracks.pad);
        this.voice(osc, [filter, envelope, panner], time, duration + 0.02);
      }
    });
  }

  private schedule() {
    if (!this.running || this.context.state !== "running") return;
    const now = this.context.currentTime;
    if (this.nextNote < now) this.nextNote = now + 0.02;
    while (this.nextNote < now + 0.1) {
      const step = this.step % 16;
      if (step === 0 && this.pending) {
        if (this.pending === "pattern") this.pattern++;
        else this.step = Math.floor(this.step / 512) * 512 + (this.pending === "build" ? 12 : 16) * 16;
        this.pending = null;
      }
      const bar = Math.floor(this.step / 16) % 32;
      const cycle = Math.floor(this.step / 512);
      const variation = cycle + this.pattern;
      const stripped = bar >= 8 && bar < 12;
      const tension = bar >= 12 && bar < 16;
      const full = bar >= 16 && bar < 24;
      const section = stripped ? "STRIPPED" : tension ? "TENSION" : full ? "FULL" : bar >= 24 ? "SHIFT" : "GROOVE";
      const time = this.nextNote;
      // Use elapsed audio time so arrangement cues cannot pile up long voices.
      if (time >= this.nextPad) {
        this.pad(time, Math.floor(this.step / 64) + variation);
        this.nextPad = time + SIXTEENTH * 64;
      }
      if (step % 4 === 0) {
        this.beats.push({ time, step, bar: bar + 1, section });
        if (this.beats.length > 16) this.beats.shift();
        this.kick(time);
      }
      // Keep the pulse intact. Density and timbre evolve around it.
      if (!stripped && (step === 4 || (full && step === 12))) this.tap(time, true);
      if (step % 4 === 2 && (!stripped || step === 10)) this.tap(time, false);
      if ((full || bar >= 24) && (this.step + variation) % 7 === 3) this.tap(time + 0.012, false);
      if (step % 4 === 2 || (!stripped && (this.step + variation) % 7 === 5)) {
        const level = stripped ? 0.1 : 0.17;
        this.note(33, time, 0.16, level, "sine", 0, 0, 0, "bass");
        this.note(33, time, 0.11, level * 0.5, "triangle", 0, 0, 340, "bass");
      }
      const motif = [0, 0, 7, 3, 0];
      const phase = (this.step + variation * 2) % motif.length;
      const pitch = 57 + motif[phase];
      const drift = (Math.sin(this.step * 0.013) + 1) * 400;
      const openness = (stripped ? 450 : tension ? 650 + (bar - 12 + step / 16) * 330 : full ? 1700 : 900) + drift + this.population * 12;
      if (phase !== 1 && (!stripped || step % 2 === 0)) {
        const length = phase === 0 ? 0.18 : 0.09;
        this.note(pitch, time, length, phase === 0 ? 0.065 : 0.04, "triangle", -0.2, 0, openness, "arp");
        // A quiet saw gives the filtered pulse some grit without a chord stack.
        this.note(pitch, time, length, 0.02, "sawtooth", 0.2, 0, openness, "arp");
        if (this.mix.delay > 0) {
          this.note(pitch, time + SIXTEENTH * 3, 0.16, 0.045, "triangle", 0.6, 0, 1500, "delay");
          this.note(pitch, time + SIXTEENTH * 6, 0.18, 0.022, "triangle", -0.6, 0, 850, "delay");
        }
      }
      if ((this.step + variation) % 7 === 0 && !stripped) {
        this.metal(time, 45 + (bar >= 24 ? 7 : 0), tension ? 80 + (bar - 12) * 65 : full ? 260 : 110, Math.sin(this.step * 0.07) * 0.45);
      }
      this.nextNote += SIXTEENTH;
      this.step++;
    }
  }
}
