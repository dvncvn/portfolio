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

test('large crowds add instruments and scheduler skips throttled backlog', async () => {
  const small = setup(); const large = setup();
  large.band.setPopulation(24);
  await small.band.start(); await large.band.start();
  for (let i = 1; i <= 40; i++) { small.tick(i / 10); large.tick(i / 10); }
  assert.ok(large.sources.length > small.sources.length);
  const before = large.sources.length;
  large.tick(100);
  assert.ok(large.sources.length - before < 10);
  assert.ok(large.sources.slice(before).every(s => s.starts[0] >= 100));
});
