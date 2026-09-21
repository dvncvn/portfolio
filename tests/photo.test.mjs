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
const effects = load('src/lib/photo-effects.ts');
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
