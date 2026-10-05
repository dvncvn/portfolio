import { ASCII_SETS, BLAZE_ORANGE, DEFAULT_SETTINGS, EDITABLE_EFFECTS, GRADIENT_PRESETS, type AsciiSet, type EffectColor, type ImageEffect } from './photo-effects';
import { PHOTO_LAYER_LIMIT, type PhotoLayer } from './shared-photo';
import { createPhotoEditId } from './photo-edit-id';

export function randomPhotoEffect(effect: Exclude<ImageEffect, 'normal'>, random = Math.random) {
  const integer = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const pick = <T,>(values: readonly T[]) => values[integer(0, values.length - 1)];
  const settings = { ...DEFAULT_SETTINGS[effect] };
  let color: EffectColor = null;
  switch (effect) {
    case 'gradient': {
      const { shadows, highlights } = pick(GRADIENT_PRESETS);
      Object.assign(settings, { shadows, highlights }); break;
    }
    case 'chromatic': Object.assign(settings, { amount: integer(1, 6), rotation: integer(-180, 180), edgeBias: integer(25, 100) }); break;
    case 'vhs': Object.assign(settings, { bleed: integer(20, 85), tracking: integer(10, 65), wear: integer(15, 70), seed: integer(1, 1000000) }); break;
    case 'decay': Object.assign(settings, { amount: integer(15, 65), size: integer(8, 40), repetition: integer(10, 90), seed: integer(1, 1000000) }); break;
    case 'slice': Object.assign(settings, { seed: integer(1, 1000000), bands: integer(5, 24), amount: integer(4, 25), rotation: pick([-90, -45, -30, 0, 30, 45, 90]) }); break;
    case 'scanlines': Object.assign(settings, { size: integer(3, 16), coverage: integer(15, 55), amount: integer(30, 80) }); break;
    case 'offset': Object.assign(settings, { x: pick([-10, -6, -3, 3, 6, 10]), y: integer(-6, 6) }); break;
    case 'dither': case 'pixelate': case 'ascii':
      Object.assign(settings, { brightness: integer(-20, 20), contrast: integer(70, 150), invert: random() < .25 });
      if (effect === 'dither') Object.assign(settings, { size: integer(1, 6), threshold: integer(30, 70), ditherType: pick(['bayer', 'floyd-steinberg', 'atkinson', 'noise'] as const) });
      if (effect === 'pixelate') Object.assign(settings, { size: integer(4, 32), levels: pick([4, 8, 16, 32, 64, 128, 256]) });
      if (effect === 'ascii') Object.assign(settings, { size: integer(4, 24), gap: integer(0, 6) / 2, glyphs: pick(Object.keys(ASCII_SETS) as AsciiSet[]) });
  }
  if (['offset', 'dither', 'pixelate', 'ascii'].includes(effect)) {
    color = { ...pick([BLAZE_ORANGE, { r: 1, g: 248, b: 165 }, { r: 232, g: 228, b: 220 }, { r: 255, g: 255, b: 255 }]) };
  }
  return { settings, color };
}

export function randomPhotoLayers(random = Math.random): PhotoLayer[] {
  const effects = [...EDITABLE_EFFECTS];
  for (let i = effects.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [effects[i], effects[j]] = [effects[j], effects[i]];
  }
  return effects.slice(0, PHOTO_LAYER_LIMIT).map((effect) => ({
    id: createPhotoEditId(), effect, enabled: true,
    // Partial opacity lets earlier layers survive the more destructive effects.
    opacity: ['ascii', 'pixelate', 'dither'].includes(effect) ? 25 + Math.floor(random() * 36) : 40 + Math.floor(random() * 46),
    ...randomPhotoEffect(effect, random),
  }));
}
