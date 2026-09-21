// A small sewer cabaret. Audio-clock scheduling keeps the band in time even
// when the page is busy; the odd notes are deliberate, the timing isn't random.
const BASS = [43, 50, 46, 50, 41, 48, 45, 48];
const TUNE = [79, null, 82, 81, 79, null, 74, 77, 79, 82, 86, null, 81, 77, 74, null];
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

export class RatAudio {
  private context: AudioContext;
  private master: GainNode;
  private limiter: DynamicsCompressorNode;
  private noise: AudioBuffer;
  private timer: ReturnType<typeof setInterval> | undefined;
  private voices = new Set<OscillatorNode | AudioBufferSourceNode>();
  private step = 0;
  private nextNote = 0;
  private population = 3;
  private running = false;
  private disposed = false;
  private lastSqueak = -1;

  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.value = -18;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 6;
    this.master.connect(this.limiter);
    this.limiter.connect(this.context.destination);
    this.noise = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.12), this.context.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  setPopulation(count: number) { this.population = Math.max(3, Math.min(24, count)); }

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
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    this.running = false;
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

  private note(note: number, time: number, duration: number, volume: number, type: OscillatorType, pan = 0, slide = 0) {
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
    osc.connect(gain).connect(panner).connect(this.master);
    this.voice(osc, [gain, panner], time, duration + 0.01);
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
    source.connect(filter).connect(gain).connect(this.master);
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

  private schedule() {
    if (!this.running || this.context.state !== "running") return;
    const now = this.context.currentTime;
    // Never replay a backlog after the browser throttles the page.
    if (this.nextNote < now) this.nextNote = now + 0.02;
    while (this.nextNote < now + 0.1) {
      const step = this.step % 16;
      const time = this.nextNote;
      if (step % 2 === 0) {
        this.note(BASS[(step / 2) % BASS.length], time, 0.19, 0.3, "triangle");
        this.note(43, time, 0.065, 0.18, "sine", 0, -19);
      }
      if (step % 4 === 2) this.tap(time, true);
      if (this.population >= 6 && step % 2 === 1) this.tap(time, false);
      const melody = TUNE[(step + Math.floor(this.step / 16) % 2 * 8) % 16];
      if (melody !== null) this.note(melody, time, 0.13, 0.045, "square", -0.3, step === 14 ? -2 : 0);
      // More residents join with a badly tuned answering horn.
      if (this.population >= 12 && step % 4 === 3) {
        this.note(BASS[Math.floor(step / 2)] + 24.15, time, 0.2, 0.055, "sawtooth", 0.35, -1);
      }
      if (this.population >= 20 && step >= 12) {
        this.note(86 + (step % 3) * 3, time, 0.08, 0.04, "sine", step % 2 ? -0.55 : 0.55, 7);
      }
      const eighth = 60 / (108 + this.population * 1.3) / 2;
      this.nextNote += eighth * (step % 2 === 0 ? 1.16 : 0.84);
      this.step++;
    }
  }
}
