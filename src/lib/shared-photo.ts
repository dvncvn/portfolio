import { EFFECT_LABELS, STICKERS, PIXEL_MAX_SIZE, ASCII_MAX_SIZE, ASCII_SETS, DEFAULT_SETTINGS, type AsciiSet, type EffectColor, type EffectSettings, type ImageEffect } from "./photo-effects";

export type PhotoLayer = {
  id: string;
  effect: Exclude<ImageEffect, "normal">;
  enabled: boolean;
  opacity?: number;
  settings: EffectSettings;
  color: EffectColor;
};
export const PHOTO_LAYER_LIMIT = 6;

export type PhotoRecipe = {
  layers?: PhotoLayer[];
  effect: ImageEffect;
  settings: Record<Exclude<ImageEffect, "normal">, EffectSettings>;
  colors: Record<Exclude<ImageEffect, "normal">, EffectColor>;
};

export type PhotoEdit = {
  id: string;
  recipe: PhotoRecipe;
  savedAt: string;
  location: string | null;
};

export const PHOTO_HISTORY_LIMIT = 4;
export type PhotoHistory = { version: 2; current: PhotoEdit; previous: PhotoEdit[] };

export const INITIAL_PHOTO: PhotoRecipe = {
  effect: "normal",
  settings: DEFAULT_SETTINGS,
  colors: { dither: null, ascii: null, pixelate: null, gradient: null, grain: null, sticker: null, slice: null, scanlines: null, offset: null, chromatic: null, vhs: null, decay: null },
};

export function photoLayers(recipe: PhotoRecipe): PhotoLayer[] {
  return recipe.layers ?? (recipe.effect === "normal" ? [] : [{
    id: "legacy", effect: recipe.effect, enabled: true,
    settings: recipe.settings[recipe.effect], color: recipe.colors[recipe.effect],
  }]);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid photo settings");
  return value as Record<string, unknown>;
}

function number(value: unknown, min: number, max: number, step = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || !Number.isInteger(value / step)) {
    throw new Error("Invalid photo setting range");
  }
  return value;
}

function color(value: unknown): EffectColor {
  if (value === null) return null;
  const rgb = record(value);
  return { r: number(rgb.r, 0, 255), g: number(rgb.g, 0, 255), b: number(rgb.b, 0, 255) };
}

function settings(value: unknown, effect: Exclude<ImageEffect, "normal">): EffectSettings {
  const s = record(value);
  if (typeof s.ditherType !== "string" || !["bayer", "floyd-steinberg", "atkinson", "noise"].includes(s.ditherType) ||
      (typeof s.glyphs !== "string" || !Object.hasOwn(ASCII_SETS, s.glyphs)) || typeof s.invert !== "boolean") {
    throw new Error("Invalid photo effect");
  }
  const extra: Partial<EffectSettings> = {};
  if (effect === "gradient") {
    if (![s.shadows, s.highlights].every((value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value))) throw new Error("Invalid gradient colors");
    extra.shadows = s.shadows as string; extra.highlights = s.highlights as string;
  }
  if (effect === "chromatic") { extra.amount = number(s.amount, 0, 10); extra.rotation = number(s.rotation, -180, 180); extra.edgeBias = number(s.edgeBias, 0, 100); }
  if (effect === "vhs") { extra.bleed = number(s.bleed, 0, 100); extra.tracking = number(s.tracking, 0, 100); extra.wear = number(s.wear, 0, 100); extra.seed = number(s.seed, 1, 1000000); }
  if (effect === "decay") { extra.amount = number(s.amount, 0, 100); extra.repetition = number(s.repetition, 0, 100); extra.seed = number(s.seed, 1, 1000000); }
  if (effect === "slice") { extra.rotation = number(s.rotation ?? 0, -180, 180); extra.bands = number(s.bands, 2, 40); extra.amount = number(s.amount, 0, 35); extra.seed = number(s.seed, 1, 1000000); }
  if (effect === "scanlines") { extra.coverage = number(s.coverage, 5, 75); extra.amount = number(s.amount, 0, 100); }
  if (effect === "offset") { extra.x = number(s.x, -25, 25); extra.y = number(s.y, -25, 25); }
  if (effect === "grain") { extra.amount = number(s.amount, 0, 100); extra.seed = number(s.seed, 1, 1000000); }
  if (effect === "sticker") {
    if (!STICKERS.includes(s.emoji as typeof STICKERS[number])) throw new Error("Invalid sticker");
    extra.emoji = s.emoji as string; extra.x = number(s.x, 0, 100); extra.y = number(s.y, 0, 100);
    extra.scale = number(s.scale, 5, 80); extra.rotation = number(s.rotation, -180, 180);
  }
  return {
    ...extra,
    ditherType: s.ditherType as EffectSettings["ditherType"],
    size: number(s.size, effect === "dither" || effect === "grain" ? 1 : effect === "scanlines" ? 2 : 4, effect === "dither" ? 8 : effect === "ascii" ? ASCII_MAX_SIZE : PIXEL_MAX_SIZE),
    brightness: number(s.brightness, -50, 50),
    contrast: number(s.contrast, 25, 200),
    invert: s.invert,
    threshold: number(s.threshold, 0, 100),
    levels: number(s.levels, 2, 256),
    gap: number(s.gap, 0, 3, 0.5),
    glyphs: s.glyphs as AsciiSet,
  };
}

// Construct a fresh, bounded recipe. Never persist arbitrary client fields.
export function parsePhotoRecipe(value: unknown): PhotoRecipe {
  const input = record(value);
  if (typeof input.effect !== "string" || !Object.hasOwn(EFFECT_LABELS, input.effect)) throw new Error("Invalid photo effect");
  const s = record(input.settings);
  const c = record(input.colors);
  let layers: PhotoLayer[] | undefined;
  if (input.layers !== undefined) {
    if (!Array.isArray(input.layers) || input.layers.length > PHOTO_LAYER_LIMIT) throw new Error("Invalid photo layers");
    const ids = new Set<string>();
    layers = input.layers.map((value) => {
      const layer = record(value);
      if (typeof layer.id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(layer.id) || ids.has(layer.id) ||
          (layer.effect === "normal" || !Object.hasOwn(EFFECT_LABELS, String(layer.effect))) || typeof layer.enabled !== "boolean") throw new Error("Invalid photo layer");
      ids.add(layer.id);
      const effect = layer.effect as PhotoLayer["effect"];
      return { ...(layer.opacity === undefined ? {} : { opacity: number(layer.opacity, 0, 100) }), id: layer.id, effect, enabled: layer.enabled, settings: settings(layer.settings, effect), color: color(layer.color) };
    });
  }
  return {
    ...(layers === undefined ? {} : { layers }),
    effect: input.effect as ImageEffect,
    settings: { dither: settings(s.dither, "dither"), pixelate: settings(s.pixelate, "pixelate"), ascii: settings(s.ascii, "ascii"), gradient: settings(s.gradient ?? DEFAULT_SETTINGS.gradient, "gradient"), grain: settings(s.grain ?? DEFAULT_SETTINGS.grain, "grain"), sticker: settings(s.sticker ?? DEFAULT_SETTINGS.sticker, "sticker"), slice: settings(s.slice ?? DEFAULT_SETTINGS.slice, "slice"), scanlines: settings(s.scanlines ?? DEFAULT_SETTINGS.scanlines, "scanlines"), offset: settings(s.offset ?? DEFAULT_SETTINGS.offset, "offset"), chromatic: settings(s.chromatic ?? DEFAULT_SETTINGS.chromatic, "chromatic"), vhs: settings(s.vhs ?? DEFAULT_SETTINGS.vhs, "vhs"), decay: settings(s.decay ?? DEFAULT_SETTINGS.decay, "decay") },
    colors: { dither: color(c.dither), ascii: color(c.ascii), pixelate: c.pixelate === undefined ? null : color(c.pixelate), gradient: color(c.gradient ?? null), grain: color(c.grain ?? null), sticker: color(c.sticker ?? null), slice: color(c.slice ?? null), scanlines: color(c.scanlines ?? null), offset: color(c.offset ?? null), chromatic: color(c.chromatic ?? null), vhs: color(c.vhs ?? null), decay: color(c.decay ?? null) },
  };
}

export function photoFingerprint(recipe: PhotoRecipe): string {
  return JSON.stringify(parsePhotoRecipe(recipe));
}

export function parsePhotoEdit(value: unknown): PhotoEdit {
  const edit = record(value);
  if (typeof edit.id !== "string" || !/^[\da-f-]{36}$/i.test(edit.id) ||
      typeof edit.savedAt !== "string" || !Number.isFinite(Date.parse(edit.savedAt)) ||
      !(edit.location === null || (typeof edit.location === "string" && edit.location.length <= 160))) {
    throw new Error("Invalid saved photo");
  }
  return { id: edit.id, recipe: parsePhotoRecipe(edit.recipe), savedAt: edit.savedAt, location: edit.location };
}

export function parsePhotoHistory(value: unknown): PhotoHistory {
  const history = record(value);
  if (history.version !== 1 && history.version !== 2) throw new Error("Unsupported photo version");
  const previous = history.version === 1
    ? (history.previous === null ? [] : [history.previous]) : history.previous;
  if (!Array.isArray(previous) || previous.length > PHOTO_HISTORY_LIMIT) throw new Error("Invalid photo history");
  return { version: 2, current: parsePhotoEdit(history.current), previous: previous.map(parsePhotoEdit) };
}

export function photoLocation(headers: Headers): string | null {
  const rawCity = headers.get("x-vercel-ip-city");
  const country = headers.get("x-vercel-ip-country");
  if (!rawCity || !country || !/^[A-Z]{2}$/.test(country)) return null;
  let city: string;
  try { city = decodeURIComponent(rawCity).trim(); } catch { return null; }
  if (!city || city.length > 100 || /[\u0000-\u001f\u007f<>]/.test(city)) return null;
  const region = headers.get("x-vercel-ip-country-region");
  const area = country === "US" && region && /^[A-Z]{2}$/.test(region)
    ? region : new Intl.DisplayNames(["en"], { type: "region" }).of(country);
  return `${city}, ${area ?? country}`;
}

export function photoStoragePath(environment = "development", deployment?: string): string {
  // A deployment cannot write to the production photo unless Vercel marks it production.
  const scope = environment === "production" ? "production"
    : environment === "preview" ? `preview/${(deployment ?? "local").replace(/[^a-zA-Z0-9.-]/g, "_")}` : "development";
  return `photo-edits/${scope}/profile-v1.json`;
}
