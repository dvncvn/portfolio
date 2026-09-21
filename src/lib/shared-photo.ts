import { PIXEL_MAX_SIZE, ASCII_MAX_SIZE, ASCII_SETS, DEFAULT_SETTINGS, type AsciiSet, type EffectColor, type EffectSettings, type ImageEffect } from "./photo-effects";

export type PhotoRecipe = {
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
  colors: { dither: null, ascii: null, pixelate: null },
};

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
  return {
    ditherType: s.ditherType as EffectSettings["ditherType"],
    size: number(s.size, effect === "dither" ? 1 : 4, effect === "dither" ? 8 : effect === "ascii" ? ASCII_MAX_SIZE : PIXEL_MAX_SIZE),
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
  if (typeof input.effect !== "string" || !["normal", "dither", "pixelate", "ascii"].includes(input.effect)) throw new Error("Invalid photo effect");
  const s = record(input.settings);
  const c = record(input.colors);
  return {
    effect: input.effect as ImageEffect,
    settings: { dither: settings(s.dither, "dither"), pixelate: settings(s.pixelate, "pixelate"), ascii: settings(s.ascii, "ascii") },
    colors: { dither: color(c.dither), ascii: color(c.ascii), pixelate: c.pixelate === undefined ? null : color(c.pixelate) },
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
