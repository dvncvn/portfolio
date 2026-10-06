import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';

// Compile just these server modules with explicit dependency doubles.
function load(file, dependencies = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = { exports: {} };
  const requireFromFile = createRequire(filename);
  new Function('require', 'module', 'exports', source)(
    (id) => id in dependencies ? dependencies[id] : requireFromFile(id), compiled, compiled.exports,
  );
  return compiled.exports;
}
const effects = load('src/lib/photo-effects.ts', { './accents': load('src/lib/accents.ts') });
const shared = load('src/lib/shared-photo.ts', { './photo-effects': effects });
const { createPhotoEditId } = load('src/lib/photo-edit-id.ts');
const freshRecipe = () => structuredClone(shared.INITIAL_PHOTO);

test('save IDs work without the secure-context-only randomUUID API', () => {
  const id = createPhotoEditId({ getRandomValues: (bytes) => bytes.fill(255) });
  assert.match(id, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  assert.equal(id, 'ffffffff-ffff-4fff-bfff-ffffffffffff');
});
const edit = (id = '00000000-0000-4000-8000-000000000001', savedAt = new Date(Date.now() - 10000).toISOString()) => ({
  id, savedAt, recipe: freshRecipe(), location: null,
});

function storeFixture(initial = null) {
  let history = initial;
  let etag = 'initial';
  let writes = 0;
  let collide = false;
  class Precondition extends Error {}
  const sdk = {
    BlobPreconditionFailedError: Precondition,
    get: async (_path, options) => {
      assert.equal(options.access, 'private');
      assert.equal(options.useCache, false);
      assert.equal(options.headers['Accept-Encoding'], 'identity');
      return history ? { statusCode: 200, stream: new Response(JSON.stringify(history)).body, blob: { etag } } : null;
    },
    put: async (_path, body, options) => {
      assert.equal(options.access, 'private');
      assert.equal(options.addRandomSuffix, false);
      if (history) assert.equal(options.ifMatch, etag);
      else assert.equal(options.allowOverwrite, false);
      if (collide) throw new Precondition();
      history = JSON.parse(body);
      etag = String(++writes);
    },
  };
  return {
    store: load('src/lib/photo-store.ts', { '@vercel/blob': sdk, './shared-photo': shared }),
    get history() { return history; },
    get writes() { return writes; },
    collide() { collide = true; },
  };
}

test('recipes round-trip every effect and strip unknown fields', () => {
  for (const effect of ['normal', 'dither', 'pixelate', 'ascii']) {
    const recipe = freshRecipe();
    recipe.effect = effect;
    recipe.colors.ascii = { r: 255, g: 92, b: 0 };
    assert.deepEqual(shared.parsePhotoRecipe({ ...recipe, location: 'Forged city' }), recipe);
  }
});

test('rejects unsafe, incomplete, or out-of-range settings', () => {
  for (const value of [0, -1, 100000, NaN, Infinity, '2', 2.5]) {
    const recipe = freshRecipe();
    recipe.settings.dither.size = value;
    assert.throws(() => shared.parsePhotoRecipe(recipe));
  }
  for (const input of [null, {}, { effect: 'unknown' }, { ...freshRecipe(), effect: ['normal'] }, { ...freshRecipe(), colors: { ascii: { r: 999, g: 0, b: 0 }, dither: null } }]) {
    assert.throws(() => shared.parsePhotoRecipe(input));
  }
});

test('unchanged recipes compare equally before and after server normalization', () => {
  const recipe = freshRecipe();
  assert.equal(shared.photoFingerprint(recipe), shared.photoFingerprint(shared.parsePhotoRecipe(recipe)));
});

test('all character sets and large ASCII sizes survive saving', () => {
  for (const glyphs of Object.keys(effects.ASCII_SETS)) {
    const recipe = freshRecipe();
    recipe.effect = 'ascii';
    recipe.settings.ascii.glyphs = glyphs;
    recipe.settings.ascii.size = effects.ASCII_MAX_SIZE;
    assert.deepEqual(shared.parsePhotoRecipe(recipe), recipe);
  }
  const recipe = freshRecipe();
  recipe.settings.ascii.size = effects.ASCII_MAX_SIZE + 1;
  assert.throws(() => shared.parsePhotoRecipe(recipe));
  recipe.settings.ascii.size = 8;
  recipe.settings.ascii.glyphs = 'unknown';
  assert.throws(() => shared.parsePhotoRecipe(recipe));
});

test('geo attribution handles encoded cities, regions, missing and malformed data', () => {
  assert.equal(shared.photoLocation(new Headers({ 'x-vercel-ip-city': 'Madison', 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'WI' })), 'Madison, WI');
  assert.equal(shared.photoLocation(new Headers({ 'x-vercel-ip-city': 'Stockholm', 'x-vercel-ip-country': 'SE' })), 'Stockholm, Sweden');
  assert.equal(shared.photoLocation(new Headers({ 'x-vercel-ip-city': 'S%C3%A3o%20Paulo', 'x-vercel-ip-country': 'BR' })), 'São Paulo, Brazil');
  assert.equal(shared.photoLocation(new Headers()), null);
  assert.equal(shared.photoLocation(new Headers({ 'x-vercel-ip-city': '%XX', 'x-vercel-ip-country': 'US' })), null);
});

test('local and preview writes cannot target production', () => {
  const prod = shared.photoStoragePath('production');
  assert.notEqual(shared.photoStoragePath(), prod);
  assert.notEqual(shared.photoStoragePath('preview', '../../production'), prod);
  assert.notEqual(shared.photoStoragePath('preview', 'one.vercel.app'), shared.photoStoragePath('preview', 'two.vercel.app'));
});

test('preserves the previous recipe and retries saves idempotently', async () => {
  const fixture = storeFixture();
  const first = edit();
  assert.equal(await fixture.store.readPhotoHistory(), null);
  await fixture.store.savePhotoEdit(first);
  const second = edit('00000000-0000-4000-8000-000000000002');
  second.recipe.effect = 'ascii';
  await fixture.store.savePhotoEdit(second);
  assert.deepEqual(fixture.history.previous, [first]);
  assert.deepEqual(fixture.history.current, second);
  await fixture.store.savePhotoEdit(second);
  await fixture.store.savePhotoEdit(first);
  assert.equal(fixture.writes, 2);
});

test('cooldown and simultaneous saves do not overwrite history', async () => {
  const fixture = storeFixture();
  await fixture.store.savePhotoEdit(edit(undefined, new Date().toISOString()));
  await assert.rejects(() => fixture.store.savePhotoEdit(edit('00000000-0000-4000-8000-000000000002')), fixture.store.PhotoSaveBusy);
  assert.equal(fixture.writes, 1);
  const collision = storeFixture();
  await collision.store.savePhotoEdit(edit());
  collision.collide();
  await assert.rejects(() => collision.store.savePhotoEdit(edit('00000000-0000-4000-8000-000000000002')), collision.store.PhotoSaveBusy);
  assert.equal(collision.writes, 1);
});

function routeFixture() {
  const saved = [];
  class Busy extends Error {}
  return {
    saved,
    route: load('src/app/api/photo/route.ts', {
      '@/lib/shared-photo': shared,
      '@/lib/photo-store': { PhotoSaveBusy: Busy, readPhotoHistory: async () => null, savePhotoEdit: async (value) => { saved.push(value); return { edit: value, history: { current: value, previous: [] } }; } },
    }),
  };
}
const request = (body, origin = 'https://portfolio.test') => new NextRequest('https://portfolio.test/api/photo', {
  method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('API rejects cross-origin, invalid and oversized requests without writing', async () => {
  const { route, saved } = routeFixture();
  assert.equal((await route.POST(request({}, 'https://elsewhere.test'))).status, 403);
  assert.equal((await route.POST(request({}))).status, 400);
  assert.equal((await route.POST(request({ data: 'x'.repeat(9000) }))).status, 400);
  assert.equal(saved.length, 0);
});

test('anonymous saves ignore client-supplied attribution and timestamp', async () => {
  const { route, saved } = routeFixture();
  const response = await route.POST(request({ id: edit().id, recipe: freshRecipe(), shareLocation: false, location: 'Fake city', savedAt: '2000-01-01' }));
  assert.equal(response.status, 200);
  assert.equal(saved[0].location, null);
  assert.notEqual(saved[0].savedAt, '2000-01-01');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});


test('migrates legacy history and retains only the four most recent previous edits', async () => {
  const first = edit();
  const fixture = storeFixture({ version: 1, current: first, previous: null });
  assert.deepEqual((await fixture.store.readPhotoHistory()).history.previous, []);
  const values = [first];
  for (let i = 2; i <= 7; i++) {
    const next = edit(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    values.push(next);
    await fixture.store.savePhotoEdit(next);
  }
  assert.equal(fixture.history.version, 2);
  assert.deepEqual(fixture.history.current, values[6]);
  assert.deepEqual(fixture.history.previous, values.slice(2, 6).reverse());
  const retried = await fixture.store.savePhotoEdit(values[2]);
  assert.deepEqual(retried.edit, values[2]);
  assert.deepEqual(retried.history.current, values[6]);
  assert.equal(fixture.writes, 6);
  assert.deepEqual(shared.parsePhotoHistory({ version: 1, current: values[1], previous: first }).previous, [first]);
});

test('rejects malformed and unbounded history', () => {
  for (const previous of [null, {}, [null], Array(5).fill(edit())]) {
    assert.throws(() => shared.parsePhotoHistory({ version: 2, current: edit(), previous }));
  }
});

test('pixel ink survives saving and older recipes default to white ink', () => {
  const recipe = freshRecipe();
  delete recipe.colors.pixelate;
  assert.equal(shared.parsePhotoRecipe(recipe).colors.pixelate, null);
  recipe.colors.pixelate = { r: 255, g: 92, b: 0 };
  assert.deepEqual(shared.parsePhotoRecipe(recipe).colors.pixelate, recipe.colors.pixelate);
  recipe.colors.pixelate.r = 999;
  assert.throws(() => shared.parsePhotoRecipe(recipe));
});

test('pixelate maps stepped tones to the selected ink and preserves alpha', () => {
  const data = new Uint8ClampedArray([0, 0, 0, 128, 128, 128, 128, 255, 255, 255, 255, 255]);
  effects.colorPixelate(data, 3, { r: 240, g: 100, b: 20 });
  assert.deepEqual(Array.from(data), [0, 0, 0, 128, 120, 50, 10, 255, 240, 100, 20, 255]);
  const white = new Uint8ClampedArray([255, 255, 255, 255]);
  effects.colorPixelate(white, 2, null);
  assert.deepEqual(Array.from(white), [255, 255, 255, 255]);
});


test('large pixel sizes survive saving and remain bounded', () => {
  const recipe = freshRecipe();
  recipe.effect = 'pixelate';
  for (const size of [24, 32, 48, effects.PIXEL_MAX_SIZE]) {
    recipe.settings.pixelate.size = size;
    assert.equal(shared.parsePhotoRecipe(recipe).settings.pixelate.size, size);
  }
  recipe.settings.pixelate.size = effects.PIXEL_MAX_SIZE + 1;
  assert.throws(() => shared.parsePhotoRecipe(recipe));
});


test('layer stacks preserve order, per-layer settings, colors, and disabled layers', () => {
  const recipe = freshRecipe();
  recipe.layers = [
    { id: 'first', effect: 'pixelate', enabled: true, settings: { ...effects.DEFAULT_SETTINGS.pixelate, size: 12 }, color: null },
    { id: 'second', effect: 'dither', enabled: false, settings: { ...effects.DEFAULT_SETTINGS.dither, size: 3 }, color: { r: 255, g: 92, b: 0 } },
    { id: 'third', effect: 'pixelate', enabled: true, settings: { ...effects.DEFAULT_SETTINGS.pixelate, size: 24 }, color: null },
  ];
  const parsed = shared.parsePhotoRecipe(recipe);
  assert.deepEqual(parsed.layers, recipe.layers);
  assert.notEqual(shared.photoFingerprint(recipe), shared.photoFingerprint({ ...recipe, layers: [...recipe.layers].reverse() }));
  assert.notEqual(shared.photoFingerprint(recipe), shared.photoFingerprint({ ...recipe, layers: recipe.layers.map(l => ({ ...l, enabled: true })) }));
});

test('layer validation rejects duplicate IDs, invalid effects, settings, and excessive stacks', () => {
  const layer = { id: 'one', effect: 'dither', enabled: true, settings: effects.DEFAULT_SETTINGS.dither, color: null };
  for (const layers of [
    [layer, layer], [{ ...layer, effect: 'normal' }], [{ ...layer, enabled: 'yes' }],
    [{ ...layer, settings: { ...layer.settings, size: 100 } }],
    Array.from({ length: shared.PHOTO_LAYER_LIMIT + 1 }, (_, i) => ({ ...layer, id: `layer-${i}` })),
  ]) assert.throws(() => shared.parsePhotoRecipe({ ...freshRecipe(), layers }));
});

test('legacy recipes become one layer and an explicit empty stack stays empty', () => {
  const recipe = { ...freshRecipe(), effect: 'ascii' };
  assert.equal(shared.photoLayers(recipe)[0].effect, 'ascii');
  assert.deepEqual(shared.photoLayers({ ...recipe, layers: [] }), []);
  assert.deepEqual(shared.photoLayers(freshRecipe()), []);
});

test('cover crop accepts a prior canvas as the next effect source', () => {
  const canvas = { width: 800, height: 1000 };
  let args;
  effects.drawCover({ drawImage: (...input) => { args = input; } }, canvas, 80, 100, .8);
  assert.deepEqual(args, [canvas, 0, 0, 800, 1000, 0, 0, 80, 100]);
});

test('saved history retains the complete layer stack', async () => {
  const fixture = storeFixture();
  const saved = edit();
  saved.recipe.layers = [
    { id: 'a', effect: 'pixelate', enabled: true, settings: effects.DEFAULT_SETTINGS.pixelate, color: null },
    { id: 'b', effect: 'ascii', enabled: false, settings: effects.DEFAULT_SETTINGS.ascii, color: effects.BLAZE_ORANGE },
  ];
  await fixture.store.savePhotoEdit(saved);
  const history = shared.parsePhotoHistory(fixture.history);
  assert.deepEqual(history.current.recipe.layers, saved.recipe.layers);
});

test('new effects and opacity round-trip through Blob history, with old recipes still accepted', async () => {
  const recipe = freshRecipe();
  recipe.layers = ['gradient', 'grain', 'sticker'].map((effect, i) => ({
    id: `new-${i}`, effect, enabled: true, opacity: 63,
    settings: structuredClone(effects.DEFAULT_SETTINGS[effect]), color: null,
  }));
  recipe.layers[2].settings = { ...recipe.layers[2].settings, emoji: '👀', x: 21, y: 78, rotation: -32, scale: 40 };
  const fixture = storeFixture();
  await fixture.store.savePhotoEdit({ ...edit(), recipe });
  assert.deepEqual((await fixture.store.readPhotoHistory()).history.current.recipe.layers, recipe.layers);
  const legacy = freshRecipe();
  for (const effect of ['gradient', 'grain', 'sticker']) { delete legacy.settings[effect]; delete legacy.colors[effect]; }
  assert.deepEqual(shared.parsePhotoRecipe(legacy), freshRecipe());
  const maxRecipe = freshRecipe();
  maxRecipe.layers = Array.from({ length: 6 }, (_, i) => ({ ...recipe.layers[i % 3], id: `max-${i}` }));
  assert.ok(Buffer.byteLength(JSON.stringify({ id: edit().id, recipe: maxRecipe, shareLocation: true })) < 8192);
});

test('rejects invalid new effect settings and opacity', () => {
  for (const [effect, patch] of [['gradient', { shadows: 'red' }], ['grain', { seed: Infinity }], ['sticker', { emoji: '<script>' }], ['sticker', { x: 101 }], ['sticker', { scale: 0 }]]) {
    const recipe = freshRecipe();
    recipe.layers = [{ id: 'invalid', effect, enabled: true, color: null, settings: { ...effects.DEFAULT_SETTINGS[effect], ...patch } }];
    assert.throws(() => shared.parsePhotoRecipe(recipe));
  }
  const recipe = freshRecipe();
  recipe.layers = [{ id: 'invalid', effect: 'grain', enabled: true, opacity: -1, color: null, settings: effects.DEFAULT_SETTINGS.grain }];
  assert.throws(() => shared.parsePhotoRecipe(recipe));
});

test('gradient map uses luminance endpoints and preserves alpha', () => {
  const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 123, 128, 128, 128, 0]);
  effects.gradientMap(pixels, '#102030', '#90a0b0');
  assert.deepEqual([...pixels], [16, 32, 48, 255, 144, 160, 176, 123, 80, 96, 112, 0]);
});

test('grain is stable by seed, respects zero amount, and preserves alpha', () => {
  const original = new Uint8ClampedArray(Array.from({ length: 64 }, (_, i) => i % 4 === 3 ? 200 : 128));
  const first = original.slice(), second = original.slice(), other = original.slice(), zero = original.slice();
  effects.addGrain(first, 4, 1, 50, 1); effects.addGrain(second, 4, 1, 50, 1);
  effects.addGrain(other, 4, 1, 50, 2); effects.addGrain(zero, 4, 1, 0, 1);
  assert.deepEqual(first, second); assert.notDeepEqual(first, other); assert.deepEqual(zero, original);
  assert.ok(first.every((value, i) => i % 4 !== 3 || value === 200));
});

test('slice, scanlines and offset preserve their controls and ink through saved history', async () => {
  const recipe = freshRecipe();
  recipe.layers = ['slice', 'scanlines', 'offset'].map((effect, index) => ({ id: `effect-${index}`, effect, enabled: true, opacity: 72, settings: { ...effects.DEFAULT_SETTINGS[effect] }, color: null }));
  recipe.layers[0].settings = { ...recipe.layers[0].settings, bands: 24, amount: 30, seed: 456 };
  recipe.layers[1].settings = { ...recipe.layers[1].settings, size: 2, coverage: 75, amount: 80 };
  recipe.layers[2].settings = { ...recipe.layers[2].settings, x: -25, y: 25 };
  recipe.layers[2].color = { r: 1, g: 248, b: 165 };
  const fixture = storeFixture();
  await fixture.store.savePhotoEdit({ ...edit(), recipe });
  assert.deepEqual((await fixture.store.readPhotoHistory()).history.current.recipe.layers, recipe.layers);
  const old = freshRecipe();
  for (const effect of ['slice', 'scanlines', 'offset']) { delete old.settings[effect]; delete old.colors[effect]; }
  assert.deepEqual(shared.parsePhotoRecipe(old), freshRecipe());
});

test('new spatial effect parameters are bounded before rendering', () => {
  for (const [effect, patch] of [['slice', { bands: 0 }], ['slice', { bands: 41 }], ['slice', { amount: 36 }], ['slice', { seed: NaN }], ['scanlines', { size: 0 }], ['scanlines', { coverage: 101 }], ['offset', { x: -26 }], ['offset', { y: 26 }]]) {
    const recipe = freshRecipe();
    recipe.layers = [{ id: 'invalid', effect, enabled: true, settings: { ...effects.DEFAULT_SETTINGS[effect], ...patch }, color: null }];
    assert.throws(() => shared.parsePhotoRecipe(recipe));
  }
});

test('slice displacement is deterministic, seedable, bounded, and zero at zero amount', () => {
  const shifts = Array.from({ length: 40 }, (_, i) => effects.sliceShift(i, 1, 35));
  assert.deepEqual(shifts, Array.from({ length: 40 }, (_, i) => effects.sliceShift(i, 1, 35)));
  assert.notDeepEqual(shifts, Array.from({ length: 40 }, (_, i) => effects.sliceShift(i, 2, 35)));
  assert.ok(shifts.every(value => Math.abs(value) <= 0.35));
  assert.ok(Array.from({ length: 40 }, (_, i) => effects.sliceShift(i, 1, 0)).every(value => value === 0));
});

test('slice angle survives saving and older slices default to horizontal', () => {
  const recipe = freshRecipe();
  recipe.layers = [{ id: 'slice', effect: 'slice', enabled: true, settings: { ...effects.DEFAULT_SETTINGS.slice, rotation: -45 }, color: null }];
  assert.equal(shared.parsePhotoRecipe(recipe).layers[0].settings.rotation, -45);
  delete recipe.layers[0].settings.rotation;
  assert.equal(shared.parsePhotoRecipe(recipe).layers[0].settings.rotation, 0);
  recipe.layers[0].settings.rotation = 181;
  assert.throws(() => shared.parsePhotoRecipe(recipe));
});

test('angled slices wrap every channel and leave zero displacement unchanged', () => {
  const width = 20, height = 30;
  const input = Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => i % 4 === 3 ? 255 : Math.floor(i / 4) % 256);
  for (const angle of [-180, -45, 45, 90, 180]) {
    assert.deepEqual(effects.angledSlice(input, width, height, 8, 0, 1, angle), input);
    const output = effects.angledSlice(input, width, height, 8, 35, 1, angle);
    assert.ok(output.every((value, i) => i % 4 !== 3 || value === 255));
  }
  const vertical = effects.angledSlice(input, width, height, 8, 35, 1, 90);
  const horizontal = effects.angledSlice(input, width, height, 8, 35, 1, 0);
  assert.notDeepEqual(vertical, horizontal);
});

function photoHookFixture() {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useCallback: (callback) => callback,
    useEffect: () => {}, // These tests explicitly control saves, without the initial GET.
  };
  const { useSharedPhoto } = load('src/components/profile-photo/use-shared-photo.ts', {
    react,
    '@/lib/shared-photo': shared,
    '@/lib/photo-edit-id': { createPhotoEditId },
  });
  return () => { cursor = 0; return useSharedPhoto(); };
}

test('background saves preserve newer edits and drain queued snapshots', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', (_url, options) => new Promise((resolve) => {
    requests.push({ request: JSON.parse(options.body), resolve });
  }));
  const render = photoHookFixture();
  let photo = render();
  photo.changeRecipe((recipe) => ({ ...recipe, effect: 'dither' }));
  const saving = photo.saveChanges();
  assert.equal(render().status, 'saving');
  photo.changeRecipe((recipe) => ({ ...recipe, effect: 'ascii' }));
  void photo.saveChanges();
  assert.equal(requests[0].request.recipe.effect, 'dither');
  const complete = (index) => {
    const saved = { ...edit(requests[index].request.id), recipe: requests[index].request.recipe };
    requests[index].resolve(Response.json({ saved, current: saved, previous: [] }));
  };
  complete(0);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.equal(requests[1].request.recipe.effect, 'ascii');
  assert.equal(render().recipe.effect, 'ascii');
  assert.equal(render().status, 'saving');
  complete(1);
  assert.equal(await saving, true);
  assert.equal(render().status, 'saved');
  assert.equal(render().saveFailed, false);
});

test('failed background saves preserve the photo and can be retried', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  const render = photoHookFixture();
  const photo = render();
  photo.changeRecipe((recipe) => ({ ...recipe, effect: 'pixelate' }));
  assert.equal(await photo.saveChanges(), false);
  assert.equal(render().saveFailed, true);
  assert.equal(render().recipe.effect, 'pixelate');
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const request = JSON.parse(options.body);
    const saved = { ...edit(request.id), recipe: request.recipe };
    return Response.json({ saved, current: saved, previous: [] });
  });
  assert.equal(await render().saveChanges(), true);
  assert.equal(render().saveFailed, false);
  assert.equal(render().status, 'saved');
});

test('chromatic, VHS and decay survive history and default correctly in older recipes', async () => {
  const recipe = freshRecipe();
  recipe.layers = ['chromatic', 'vhs', 'decay'].map((effect, index) => ({ id: `new-${index}`, effect, enabled: true, opacity: 65, settings: { ...effects.DEFAULT_SETTINGS[effect] }, color: null }));
  recipe.effect = 'decay';
  assert.deepEqual(shared.parsePhotoRecipe(recipe), recipe);
  const older = freshRecipe();
  for (const effect of ['chromatic', 'vhs', 'decay']) { delete older.settings[effect]; delete older.colors[effect]; }
  assert.deepEqual(shared.parsePhotoRecipe(older), freshRecipe());
  const fixture = storeFixture();
  const value = { ...edit(), recipe };
  const saved = await fixture.store.savePhotoEdit(value);
  assert.deepEqual(saved.edit.recipe.layers, recipe.layers);
});

test('new degradation controls reject invalid input before rendering', () => {
  for (const [effect, patch] of [['chromatic', { amount: 11 }], ['chromatic', { rotation: -181 }], ['chromatic', { edgeBias: 101 }], ['vhs', { bleed: -1 }], ['vhs', { tracking: 101 }], ['vhs', { wear: NaN }], ['decay', { size: 65 }], ['decay', { amount: 101 }], ['decay', { repetition: -1 }], ['decay', { seed: 0 }]]) {
    const recipe = freshRecipe();
    recipe.layers = [{ id: 'invalid', effect, enabled: true, settings: { ...effects.DEFAULT_SETTINGS[effect], ...patch }, color: null }];
    assert.throws(() => shared.parsePhotoRecipe(recipe));
  }
});

test('degradation kernels are deterministic, preserve alpha and leave their input unchanged', () => {
  const width = 80, height = 70;
  const input = Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => (i * 73 + Math.floor(i / 4) * 19) % 256);
  const original = input.slice();
  for (const [effect, process] of [['chromatic', effects.chromaticAberration], ['vhs', effects.vhsDegrade], ['decay', effects.digitalDecay]]) {
    const settings = { ...effects.DEFAULT_SETTINGS[effect] };
    const result = process(input, width, height, settings);
    assert.deepEqual(result, process(input, width, height, settings));
    assert.notDeepEqual(result, input);
    assert.deepEqual(input, original);
    for (let i = 3; i < input.length; i += 4) assert.equal(result[i], input[i]);
    if (effect !== 'chromatic') assert.notDeepEqual(result, process(input, width, height, { ...settings, seed: 909 }));
  }
  assert.deepEqual(effects.chromaticAberration(input, width, height, { ...effects.DEFAULT_SETTINGS.chromatic, amount: 0 }), input);
  assert.deepEqual(effects.vhsDegrade(input, width, height, { ...effects.DEFAULT_SETTINGS.vhs, bleed: 0, tracking: 0, wear: 0 }), input);
  assert.deepEqual(effects.digitalDecay(input, width, height, { ...effects.DEFAULT_SETTINGS.decay, amount: 0 }), input);
});

test('chromatic angle changes separation and full edge bias preserves the center', () => {
  const width = 101, height = 101;
  const input = Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => i % 256);
  const settings = { ...effects.DEFAULT_SETTINGS.chromatic, amount: 10, edgeBias: 100 };
  const horizontal = effects.chromaticAberration(input, width, height, settings);
  const vertical = effects.chromaticAberration(input, width, height, { ...settings, rotation: 90 });
  assert.notDeepEqual(horizontal, vertical);
  const center = (50 * width + 50) * 4;
  assert.deepEqual(horizontal.slice(center, center + 4), input.slice(center, center + 4));
});

test('random designs vary from one to six unique supported layers with valid settings', () => {
  const { randomPhotoLayers } = load('src/lib/photo-randomize.ts', {
    './photo-effects': effects, './shared-photo': shared, './photo-edit-id': { createPhotoEditId },
  });
  const defaults = structuredClone(effects.DEFAULT_SETTINGS);
  let seed = 73;
  const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const counts = new Set();
  for (let roll = 0; roll < 100; roll++) {
    const layers = randomPhotoLayers(random);
    counts.add(layers.length);
    assert.ok(layers.length >= 1 && layers.length <= shared.PHOTO_LAYER_LIMIT);
    assert.equal(new Set(layers.map(layer => layer.id)).size, layers.length);
    assert.equal(new Set(layers.map(layer => layer.effect)).size, layers.length);
    assert.ok(layers.every(layer => effects.EDITABLE_EFFECTS.includes(layer.effect) && layer.enabled));
    const recipe = { ...freshRecipe(), layers, effect: layers.at(-1).effect };
    assert.deepEqual(shared.parsePhotoRecipe(recipe), recipe);
  }
  assert.deepEqual([...counts].sort(), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(effects.DEFAULT_SETTINGS, defaults);
});
