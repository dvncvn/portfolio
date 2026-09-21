import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../src/components/rat-audio.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function setup() {
  const sources = [];
  const timers = new Set();
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = () => ({ connect(next) { return next; }, disconnect() {}, gain: param(), frequency: param(), pan: param(), threshold: param(), knee: param(), ratio: param() });
  let context;
  class Context {
    constructor() { context = this; this.currentTime = 0; this.sampleRate = 44100; this.state = 'suspended'; this.destination = node(); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() { return node(); }
    createStereoPanner() { return node(); }
    createDynamicsCompressor() { return node(); }
    createBiquadFilter() { return node(); }
    createBuffer(_, size) { return { getChannelData: () => new Float32Array(size) }; }
    createOscillator() {
      const source = { ...node(), starts: [], stops: [], start(t) { this.starts.push(t); }, stop(t) { this.stops.push(t); } };
      sources.push(source); return source;
    }
    createBufferSource() { return this.createOscillator(); }
  }
  const sandbox = { exports: {}, AudioContext: Context, setInterval(fn) { timers.add(fn); return fn; }, clearInterval(fn) { timers.delete(fn); } };
  vm.runInNewContext(compiled, sandbox);
  const band = new sandbox.exports.RatAudio();
  return { band, context, sources, timers, tick(time) { context.currentTime = time; [...timers].forEach(fn => fn()); } };
}

test('mute cancels scheduler and voices; disposed band cannot restart', async () => {
  const { band, sources, timers, context } = setup();
  await band.start();
  assert.equal(timers.size, 1);
  assert.ok(sources.length > 0);
  band.stop();
  assert.equal(timers.size, 0);
  assert.ok(sources.every(s => s.stops.at(-1) === 0.04));
  await band.start();
  assert.equal(timers.size, 1);
  band.dispose();
  await band.start();
  assert.equal(timers.size, 0);
  assert.equal(context.state, 'closed');
});

test('mute during asynchronous resume does not start the scheduler', async () => {
  const { band, timers } = setup();
  const pending = band.start();
  band.stop();
  await pending;
  assert.equal(timers.size, 0);
});

test('feeding is silent when muted and rapid squeaks are bounded', async () => {
  const { band, sources } = setup();
  band.squeak();
  assert.equal(sources.length, 0);
  await band.start();
  const initial = sources.length;
  for (let i = 0; i < 20; i++) band.squeak();
  assert.equal(sources.length, initial + 2);
  band.stop();
  band.squeak();
  assert.equal(sources.length, initial + 2);
});

test('scheduler skips throttled backlog at maximum population', async () => {
  const large = setup();
  large.band.setPopulation(24);
  await large.band.start();
  for (let i = 1; i <= 40; i++) large.tick(i / 10);
  const before = large.sources.length;
  large.tick(100);
  // One sequencer step may contain a chord plus two delayed echoes.
  // A resumed tick must schedule only that step, not replay missed bars.
  assert.ok(new Set(large.sources.slice(before).map(s => s.starts[0])).size <= 3);
  assert.ok(large.sources.slice(before).every(s => s.starts[0] >= 100));
});


test('visual beat waits for audible notes and clears immediately on mute', async () => {
  const { band, tick } = setup();
  assert.equal(band.getBeat(), null);
  await band.start();
  assert.equal(band.getBeat(), null, 'scheduled future notes must not pulse early');
  tick(0.04);
  assert.equal(band.getBeat().step, 0);
  assert.ok(band.getBeat().strength > 0.9);
  tick(0.22);
  assert.equal(band.getBeat().strength, 0);
  band.stop();
  assert.equal(band.getBeat(), null);
});


test('trench beat stays straight at 132 BPM at every population', async () => {
  for (const population of [3, 24]) {
    const { band, tick } = setup();
    band.setPopulation(population);
    await band.start();
    const beats = [];
    let previous = -1;
    for (let i = 0; i <= 200; i++) {
      const time = i / 100;
      tick(time);
      const beat = band.getBeat();
      if (beat && beat.step !== previous) { beats.push(time); previous = beat.step; }
    }
    assert.ok(beats.length >= 4);
    for (let i = 1; i < beats.length; i++) {
      assert.ok(Math.abs(beats[i] - beats[i - 1] - 60 / 132) < 0.011);
    }
    band.dispose();
  }
});


test('arrangement develops through all five sections across 32 bars', async () => {
  const { band, tick } = setup();
  await band.start();
  const sections = new Set();
  const bars = new Set();
  for (let i = 0; i < 5900; i++) {
    tick(i / 100);
    const beat = band.getBeat();
    if (beat) { sections.add(beat.section); bars.add(beat.bar); }
  }
  assert.deepEqual([...sections], ['GROOVE', 'STRIPPED', 'TENSION', 'FULL', 'SHIFT']);
  assert.equal(bars.size, 32);
  band.dispose();
});

test('build and drop cues wait for a bar boundary and preserve the audio clock', async () => {
  const { band, tick } = setup();
  await band.start();
  tick(0.04);
  band.cue('build');
  assert.equal(band.getBeat().queued, 'build');
  for (let i = 5; i < 165; i++) tick(i / 100);
  assert.equal(band.getBeat().section, 'GROOVE');
  for (let i = 165; i <= 190; i++) tick(i / 100);
  assert.equal(band.getBeat().section, 'TENSION');
  assert.equal(band.getBeat().bar, 13);
  band.cue('drop');
  for (let i = 191; i <= 380; i++) tick(i / 100);
  assert.equal(band.getBeat().section, 'FULL');
  assert.equal(band.getBeat().bar, 17);
  assert.equal(band.getBeat().queued, null);
  band.stop();
  assert.equal(band.getBeat(), null);
});

test('pad overlaps its slow swells without stacking on arrangement cues, and restarts after mute', async () => {
  const { band, sources, tick } = setup();
  const pads = () => sources.filter(source => source.stops[0] - source.starts[0] > 5);
  await band.start();
  assert.equal(pads().length, 6, 'pad starts with the transport');
  for (let i = 1; i <= 800; i++) {
    if (i % 50 === 0) band.cue(i % 100 === 0 ? 'build' : 'drop');
    tick(i / 100);
  }
  assert.equal(pads().length, 12, 'cues must not retrigger sustained voices');
  assert.ok(pads()[6].starts[0] < pads()[0].stops[0], 'swells overlap without a gap');
  band.stop();
  assert.ok(pads().every(source => source.stops.at(-1) === 8.04), 'mute ends all pad tails');
  tick(9);
  await band.start();
  assert.equal(pads().length, 18, 'resume brings the pad back immediately');
  assert.equal(pads().at(-1).starts[0], 9.03);
  band.dispose();
});
