import { ACCENTS } from "./accents";

export type ImageEffect = "normal" | "dither" | "pixelate" | "ascii" | "gradient" | "grain" | "sticker" | "slice" | "scanlines" | "offset" | "chromatic" | "vhs" | "decay";
export type EffectColor = { r: number; g: number; b: number } | null;

export const ASCII_MAX_SIZE = 96;
export const PIXEL_MAX_SIZE = 64;
export const ASCII_SETS = {
  blocks: { label: "Blocks", sample: "░▒▓█", ramp: " ░▒▓█" },
  classic: { label: "Classic", sample: ".:+#@", ramp: " .,:;irsXA253hMHGS#9B&@" },
  braille: { label: "Braille", sample: "⠁⠃⠇⡇⣿", ramp: " ⠁⠃⠇⡇⡏⡟⡿⣿" },
  dots: { label: "Dots", sample: "·∙•●", ramp: " ·∙•●" },
  lines: { label: "Lines", sample: "╴─┼╬", ramp: " ╴─┼╬█" },
  binary: { label: "Binary", sample: "0101", ramp: " 01" },
} as const;
export type AsciiSet = keyof typeof ASCII_SETS;

export type DitherType = "bayer" | "floyd-steinberg" | "atkinson" | "noise";

export type EffectSettings = {
  edgeBias?: number;
  bleed?: number;
  tracking?: number;
  wear?: number;
  repetition?: number;
  bands?: number;
  coverage?: number;
  shadows?: string;
  highlights?: string;
  amount?: number;
  seed?: number;
  emoji?: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  ditherType: DitherType;
  size: number;
  brightness: number;
  contrast: number;
  invert: boolean;
  threshold: number;
  levels: number;
  gap: number;
  glyphs: AsciiSet;
};
export const BLAZE_ORANGE = { r: 255, g: 92, b: 0 };
const green = ACCENTS.green.hex.toLowerCase();
const orange = ACCENTS.orange.hex.toLowerCase();
export const GRADIENT_PRESETS = [
  { name: "Electric Green", shadows: "#0b0a09", highlights: green },
  { name: "Blaze Orange", shadows: "#0b0a09", highlights: orange },
  { name: "Paper", shadows: "#0b0a09", highlights: "#e8e4dc" },
  { name: "Chalk", shadows: "#0b0a09", highlights: "#ffffff" },
  { name: "Silver", shadows: "#0b0a09", highlights: "#b9b9b9" },
  { name: "Green / paper", shadows: green, highlights: "#e8e4dc" },
  { name: "Orange / paper", shadows: orange, highlights: "#e8e4dc" },
  { name: "Orange / green", shadows: orange, highlights: green },
] as const;

const base: EffectSettings = { size: 4, brightness: 0, contrast: 100, invert: false, threshold: 50, levels: 256, gap: 0, glyphs: "blocks", ditherType: "bayer" };
export const EFFECT_LABELS = { normal: "Normal", dither: "Dither", pixelate: "Pixelate", ascii: "ASCII", gradient: "Gradient map", grain: "Grain", sticker: "Sticker", slice: "Slice", scanlines: "Scanlines", offset: "Offset", chromatic: "Chromatic aberration", vhs: "VHS", decay: "Digital decay" } as const;
export const STICKERS = ["⭐", "❤️", "👀", "🌸", "🔥", "🦋", "🍄", "✨", "😎", "👑", "🛸", "🎲"] as const;
export const DEFAULT_SETTINGS: Record<Exclude<ImageEffect, "normal">, EffectSettings> = {
  chromatic: { ...base, amount: 2, rotation: 0, edgeBias: 70 },
  vhs: { ...base, bleed: 45, tracking: 25, wear: 30, seed: 1 },
  decay: { ...base, size: 16, amount: 35, repetition: 50, seed: 1 },
  slice: { ...base, bands: 12, amount: 12, seed: 1, rotation: 0 },
  scanlines: { ...base, size: 6, coverage: 25, amount: 55 },
  offset: { ...base, x: 4, y: 1 },
  gradient: { ...base, shadows: GRADIENT_PRESETS[0].shadows, highlights: GRADIENT_PRESETS[0].highlights },
  grain: { ...base, size: 1, amount: 25, seed: 1 },
  sticker: { ...base, emoji: "⭐", x: 50, y: 30, scale: 25, rotation: 0 },
  dither: { size: 2, brightness: 0, contrast: 100, invert: false, threshold: 50, levels: 256, gap: 0, glyphs: "blocks", ditherType: "bayer" },
  pixelate: { size: 10, brightness: 0, contrast: 100, invert: false, threshold: 50, levels: 256, gap: 0, glyphs: "blocks", ditherType: "bayer" },
  ascii: { size: 8, brightness: 0, contrast: 100, invert: false, threshold: 50, levels: 5, gap: 0, glyphs: "blocks", ditherType: "bayer" },
};

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

const luminance = (data: Uint8ClampedArray, i: number) =>
  (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;

/** Every mode uses the same centered cover crop, regardless of its sample grid. */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
  aspect: number,
) {
  const iw = "naturalWidth" in image ? image.naturalWidth : image.width;
  const ih = "naturalHeight" in image ? image.naturalHeight : image.height;
  const sw = Math.min(iw, ih * aspect);
  const sh = sw / aspect;
  ctx.drawImage(image, (iw - sw) / 2, (ih - sh) / 2,
    sw, sh, 0, 0, width, height);
}

export function renderPhotoEffect(
  canvas: HTMLCanvasElement,
  sample: HTMLCanvasElement,
  image: HTMLImageElement | HTMLCanvasElement,
  effect: Exclude<ImageEffect, "normal">,
  settings: EffectSettings,
  color: EffectColor,
  width: number,
  height: number,
  dpr: number,
) {
  const { size, brightness, contrast, invert, threshold, levels, gap } = settings;
  const ctx = canvas.getContext("2d");
  const source = sample.getContext("2d", { willReadFrequently: true });
  if (!ctx || !source) return false;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (effect === "chromatic" || effect === "vhs" || effect === "decay") {
    // Sample at CSS resolution and render only on changes, like the other layers.
    sample.width = Math.max(1, Math.round(width));
    sample.height = Math.max(1, Math.round(height));
    drawCover(source, image, sample.width, sample.height, width / height);
    const pixels = source.getImageData(0, 0, sample.width, sample.height);
    const process = effect === "chromatic" ? chromaticAberration : effect === "vhs" ? vhsDegrade : digitalDecay;
    pixels.data.set(process(pixels.data, sample.width, sample.height, settings));
    source.putImageData(pixels, 0, 0);
    ctx.drawImage(sample, 0, 0, width, height);
    return true;
  }

  if (effect === "slice" || effect === "scanlines" || effect === "offset") {
    sample.width = Math.max(1, Math.round(width));
    sample.height = Math.max(1, Math.round(height));
    drawCover(source, image, sample.width, sample.height, width / height);
    if (effect === "slice") {
      const bands = settings.bands ?? 12;
      if (settings.rotation) {
        const pixels = source.getImageData(0, 0, sample.width, sample.height);
        pixels.data.set(angledSlice(pixels.data, sample.width, sample.height, bands, settings.amount ?? 12, settings.seed ?? 1, settings.rotation));
        source.putImageData(pixels, 0, 0);
        ctx.drawImage(sample, 0, 0, width, height);
        return true;
      }
      for (let band = 0; band < bands; band++) {
        const top = Math.floor(band * sample.height / bands);
        const bottom = Math.floor((band + 1) * sample.height / bands);
        if (bottom === top) continue;
        const shift = sliceShift(band, settings.seed ?? 1, settings.amount ?? 12) * width;
        const y = top / sample.height * height, h = (bottom - top) / sample.height * height;
        // Wrap displaced strips so no empty edges appear.
        for (const wrap of [-width, 0, width]) ctx.drawImage(sample, 0, top, sample.width, bottom - top, shift + wrap, y, width, h);
      }
    } else {
      ctx.drawImage(sample, 0, 0, width, height);
      if (effect === "scanlines") {
        ctx.fillStyle = "#0b0a09";
        ctx.globalAlpha = (settings.amount ?? 55) / 100;
        const thickness = size * (settings.coverage ?? 25) / 100;
        for (let y = 0; y < height; y += size) ctx.fillRect(0, y, width, thickness);
        ctx.globalAlpha = 1;
      } else {
        const ink = color ?? BLAZE_ORANGE;
        const hex = "#" + [ink.r, ink.g, ink.b].map((c) => c.toString(16).padStart(2, "0")).join("");
        const pixels = source.getImageData(0, 0, sample.width, sample.height);
        gradientMap(pixels.data, "#000000", hex);
        source.putImageData(pixels, 0, 0);
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(sample, width * (settings.x ?? 4) / 100, height * (settings.y ?? 1) / 100, width, height);
        ctx.globalCompositeOperation = "source-over";
      }
    }
    return true;
  }
  if (effect === "sticker") {
    drawCover(ctx, image, width, height, width / height);
    ctx.save();
    ctx.translate(width * (settings.x ?? 50) / 100, height * (settings.y ?? 30) / 100);
    ctx.rotate((settings.rotation ?? 0) * Math.PI / 180);
    ctx.font = `${width * (settings.scale ?? 25) / 100}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(settings.emoji ?? "⭐", 0, 0);
    ctx.restore();
    return true;
  }
  if (effect === "gradient" || effect === "grain") {
    // Work at CSS resolution; never run pixel processing at device-pixel resolution.
    sample.width = Math.max(1, Math.round(width));
    sample.height = Math.max(1, Math.round(height));
    drawCover(source, image, sample.width, sample.height, width / height);
    const pixels = source.getImageData(0, 0, sample.width, sample.height);
    if (effect === "gradient") gradientMap(pixels.data, settings.shadows ?? GRADIENT_PRESETS[0].shadows, settings.highlights ?? GRADIENT_PRESETS[0].highlights);
    else addGrain(pixels.data, sample.width, size, settings.amount ?? 25, settings.seed ?? 1);
    source.putImageData(pixels, 0, 0);
    ctx.drawImage(sample, 0, 0, width, height);
    return true;
  }

  ctx.font = `${size}px "Courier New", monospace`;
  const cellWidth = effect === "ascii" ? ctx.measureText("M").width + gap : size;
  const cellHeight = effect === "ascii" ? size + gap : size;
  const cols = Math.max(1, Math.ceil(width / cellWidth));
  const rows = Math.max(1, Math.ceil(height / cellHeight));
  sample.width = cols;
  sample.height = rows;
  // Average the source into cells before quantizing; avoids noisy point sampling.
  source.imageSmoothingEnabled = true;
  source.imageSmoothingQuality = "high";
  source.fillStyle = "#0a0a0a";
  source.fillRect(0, 0, cols, rows);
  drawCover(source, image, cols, rows, width / height);

  const pixels = source.getImageData(0, 0, cols, rows);
  for (let i = 0; i < pixels.data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const adjusted = Math.max(0, Math.min(1,
        (pixels.data[i + channel] / 255 - 0.5) * contrast / 100 + 0.5 + brightness / 100));
      pixels.data[i + channel] = Math.round((invert ? 1 - adjusted : adjusted) * 255);
    }
  }
  if (effect === "pixelate") {
    colorPixelate(pixels.data, levels, color);
    source.putImageData(pixels, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sample, 0, 0, width, height);
    return true;
  }

  const ink = color ?? (effect === "ascii" ? BLAZE_ORANGE : { r: 255, g: 255, b: 255 });
  if (effect === "dither") {
    const tones = Float32Array.from({ length: cols * rows }, (_, i) => luminance(pixels.data, i * 4));
    const mask = ditherMask(tones, cols, rows, settings.ditherType ?? "bayer", threshold);
    for (let i = 0; i < mask.length; i++) {
      pixels.data[i * 4] = mask[i] * ink.r;
      pixels.data[i * 4 + 1] = mask[i] * ink.g;
      pixels.data[i * 4 + 2] = mask[i] * ink.b;
    }
    source.putImageData(pixels, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sample, 0, 0, width, height);
    return true;
  }

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = `rgb(${ink.r}, ${ink.g}, ${ink.b})`;
  const glyphs = ASCII_SETS[settings.glyphs]?.ramp ?? ASCII_SETS.blocks.ramp;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cw = width / cols;
  const ch = height / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const gray = luminance(pixels.data, (y * cols + x) * 4);
      const glyph = glyphs[Math.round(gray * (glyphs.length - 1))];
      ctx.fillText(glyph, (x + 0.5) * cw, (y + 0.5) * ch);
    }
  }
  ctx.globalAlpha = 1;
  return true;
}

/** Returns binary ink coverage without mutating the input. Noise is stable across redraws. */
export function ditherMask(tones: Float32Array, width: number, height: number, type: DitherType, threshold = 50) {
  const values = Float32Array.from(tones, (tone) => Math.max(0, Math.min(1, tone + (50 - threshold) / 100)));
  const output = new Uint8Array(width * height);
  const spread = (x: number, y: number, error: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) values[y * width + x] += error;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let cutoff = 0.5;
      if (type === "bayer") cutoff = (BAYER[y % 8][x % 8] + 0.5) / 64;
      if (type === "noise") {
        let hash = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
        hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
        cutoff = (((hash ^ (hash >>> 16)) >>> 0) + 0.5) / 4294967296;
      }
      const bit = values[i] > cutoff ? 1 : 0;
      output[i] = bit;
      const error = values[i] - bit;
      if (type === "floyd-steinberg") {
        spread(x + 1, y, error * 7 / 16);
        spread(x - 1, y + 1, error * 3 / 16);
        spread(x, y + 1, error * 5 / 16);
        spread(x + 1, y + 1, error / 16);
      } else if (type === "atkinson") {
        const portion = error / 8;
        spread(x + 1, y, portion);
        spread(x + 2, y, portion);
        spread(x - 1, y + 1, portion);
        spread(x, y + 1, portion);
        spread(x + 1, y + 1, portion);
        spread(x, y + 2, portion);
      }
    }
  }
  return output;
}

/** Use the same black-to-ink treatment as Dither and ASCII, with stepped tones. */
export function colorPixelate(data: Uint8ClampedArray, levels: number, color: EffectColor) {
  const ink = color ?? { r: 255, g: 255, b: 255 };
  for (let i = 0; i < data.length; i += 4) {
    const tone = Math.round(luminance(data, i) * (levels - 1)) / (levels - 1);
    data[i] = tone * ink.r;
    data[i + 1] = tone * ink.g;
    data[i + 2] = tone * ink.b;
  }
}

export function gradientMap(data: Uint8ClampedArray, shadows: string, highlights: string) {
  const rgb = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const low = rgb(shadows), high = rgb(highlights);
  for (let i = 0; i < data.length; i += 4) {
    const tone = luminance(data, i);
    for (let c = 0; c < 3; c++) data[i + c] = low[c] + (high[c] - low[c]) * tone;
  }
}

export function addGrain(data: Uint8ClampedArray, width: number, size: number, amount: number, seed: number) {
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = Math.floor((pixel % width) / size), y = Math.floor(Math.floor(pixel / width) / size);
    let hash = Math.imul(x + seed, 374761393) ^ Math.imul(y + 1, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const noise = (((hash ^ (hash >>> 16)) >>> 0) / 4294967296 - 0.5) * amount * 2.55;
    for (let c = 0; c < 3; c++) data[i + c] += noise;
  }
}

/** Stable, bounded horizontal displacement as a fraction of the image width. */
export function sliceShift(band: number, seed: number, amount: number) {
  let hash = Math.imul(band + 1, 374761393) ^ Math.imul(seed, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((((hash ^ (hash >>> 16)) >>> 0) / 4294967296) * 2 - 1) * amount / 100;
}

/** Rotate the slice axis and its displacement together, wrapping source coordinates. */
export function angledSlice(input: Uint8ClampedArray, width: number, height: number, bands: number, amount: number, seed: number, angle: number) {
  const output = new Uint8ClampedArray(input.length);
  const radians = angle * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  const extent = Math.abs(sin) * width + Math.abs(cos) * height;
  const offsets = Array.from({ length: bands }, (_, band) => {
    const shift = sliceShift(band, seed, amount) * width;
    return [Math.round(shift * cos), Math.round(shift * sin)];
  });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const across = -(x + 0.5 - width / 2) * sin + (y + 0.5 - height / 2) * cos;
      const band = Math.max(0, Math.min(bands - 1, Math.floor((across / extent + 0.5) * bands)));
      const [dx, dy] = offsets[band];
      const sx = ((x - dx) % width + width) % width;
      const sy = ((y - dy) % height + height) % height;
      const from = (sy * width + sx) * 4, to = (y * width + x) * 4;
      for (let c = 0; c < 4; c++) output[to + c] = input[from + c];
    }
  }
  return output;
}

const clampPixel = (value: number, extent: number) => Math.max(0, Math.min(extent - 1, Math.round(value)));
function artifactNoise(x: number, y: number, seed: number) {
  let hash = Math.imul(x + seed, 374761393) ^ Math.imul(y + 1, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

/** Separate red/blue samples with an optional falloff toward the center. */
export function chromaticAberration(input: Uint8ClampedArray, width: number, height: number, settings: EffectSettings) {
  const output = new Uint8ClampedArray(input);
  const amount = (settings.amount ?? 2) / 100 * width;
  if (!amount) return output;
  const angle = (settings.rotation ?? 0) * Math.PI / 180;
  const dx = Math.cos(angle) * amount, dy = Math.sin(angle) * amount;
  const bias = (settings.edgeBias ?? 70) / 100;
  for (let y = 0; y < height; y++) {
    const ny = (2 * y + 1) / height - 1;
    for (let x = 0; x < width; x++) {
      const nx = (2 * x + 1) / width - 1;
      const strength = 1 - bias + bias * Math.min(1, nx * nx + ny * ny);
      const i = (y * width + x) * 4;
      const red = (clampPixel(y + dy * strength, height) * width + clampPixel(x + dx * strength, width)) * 4;
      const blue = (clampPixel(y - dy * strength, height) * width + clampPixel(x - dx * strength, width)) * 4;
      output[i] = input[red]; output[i + 2] = input[blue + 2];
    }
  }
  return output;
}

/** Low-resolution chroma, tracking distortion, and sparse tape dropouts. No blur passes. */
export function vhsDegrade(input: Uint8ClampedArray, width: number, height: number, settings: EffectSettings) {
  const output = new Uint8ClampedArray(input);
  const bleed = (settings.bleed ?? 45) / 100, tracking = (settings.tracking ?? 25) / 100, wear = (settings.wear ?? 30) / 100;
  if (!bleed && !tracking && !wear) return output;
  const seed = settings.seed ?? 1;
  const chromaStep = Math.max(1, Math.round(1 + bleed * width * .04));
  const bands = Math.max(1, Math.round(height / 38));
  for (let y = 0; y < height; y++) {
    const row = artifactNoise(0, y, seed);
    const bend = Math.sin(y / height * 19 + seed) * .2 + (artifactNoise(1, Math.floor(y / bands), seed) - .5);
    const shift = Math.round(bend * tracking * width * .055);
    const dropout = row < wear * .07;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const sx = clampPixel(x + shift, width), from = (y * width + sx) * 4;
      const cx = clampPixel(Math.floor((sx - bleed * width * .018) / chromaStep) * chromaStep + chromaStep / 2, width);
      const chroma = (y * width + cx) * 4;
      const light = luminance(input, from) * 255, colorLight = luminance(input, chroma) * 255;
      const noise = (artifactNoise(x, y, seed) - .5) * wear * 25;
      const fade = light * (1 - wear * .16) + wear * 14 + noise;
      const streak = dropout && artifactNoise(Math.floor(x / 12), y, seed) > .25;
      for (let c = 0; c < 3; c++) {
        const nativeChroma = input[from + c] - light;
        const coarseChroma = input[chroma + c] - colorLight;
        const tone = fade + (nativeChroma * (1 - bleed) + coarseChroma * bleed) * (1 - wear * .3);
        output[i + c] = streak ? tone * .45 + 140 : tone;
      }
    }
  }
  return output;
}

/** Bursts of damaged scan data: broken chroma, repeated rows, and coarse partial decodes. */
export function digitalDecay(input: Uint8ClampedArray, width: number, height: number, settings: EffectSettings) {
  const output = new Uint8ClampedArray(input);
  const amount = (settings.amount ?? 35) / 100;
  if (!amount) return output;
  const seed = settings.seed ?? 1, scale = settings.size;
  const repetition = (settings.repetition ?? 50) / 100;
  let band = 0;
  for (let top = 0; top < height; band++) {
    const bandHeight = Math.max(1, Math.round(scale * (.2 + artifactNoise(band, 11, seed) ** 2 * 3)));
    const bottom = Math.min(height, top + bandHeight);
    // Damage arrives in bursts, with longer failed runs toward the bottom.
    const damaged = artifactNoise(band, 23, seed) < amount * (1.05 + top / height * .45);
    if (!damaged) { top = bottom; continue; }
    let packet = 0;
    for (let left = 0; left < width; packet++) {
      const key = band * 97 + packet;
      const span = Math.max(1, Math.round(scale * (1.5 + artifactNoise(key, 31, seed) ** 2 * 16)));
      const right = Math.min(width, left + span);
      if (artifactNoise(key, 37, seed) > .7 + amount * .25) { left = right; continue; }
      const repeat = artifactNoise(key, 41, seed) < repetition;
      const mode = artifactNoise(key, 43, seed);
      const shift = Math.round((artifactNoise(key, 47, seed) - .5) * width * (.08 + amount * .5));
      const heldRow = clampPixel(top - scale * (1 + artifactNoise(key, 53, seed) * 3), height);
      const period = Math.max(1, Math.round(scale * (.08 + artifactNoise(key, 59, seed) * .25)));
      const block = Math.max(2, Math.round(scale * (.2 + artifactNoise(key, 61, seed) * .8)));
      const tint = (artifactNoise(key, 67, seed) - .5) * (60 + amount * 170);
      const levels = mode < .3 ? 4 : 12;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const sx = clampPixel(x + shift, width);
          const sy = repeat ? clampPixel(heldRow + (y - top) % period, height) : y;
          const from = (sy * width + sx) * 4;
          const coarseX = clampPixel(Math.floor(sx / block) * block + block / 2, width);
          const coarseY = clampPixel(Math.floor(sy / block) * block + block / 2, height);
          const coarse = (coarseY * width + coarseX) * 4;
          const to = (y * width + x) * 4;
          const light = luminance(input, from) * 255;
          const coarseLight = luminance(input, coarse) * 255;
          // Some packets retain luminance but lose their color data; others
          // decode only a coarse preview or reuse a previous scanline.
          for (let c = 0; c < 3; c++) {
            let tone: number;
            if (mode < .25) tone = input[coarse + c];
            else if (mode < .48) tone = light * .8 + 28;
            else tone = light + (input[coarse + c] - coarseLight) * .65 + tint * (c === 1 ? -.7 : 1);
            if (repeat && mode < .25) tone = input[from + c];
            const dither = ((x % 2) !== (y % 2) ? 1 : -1) * 255 / levels * .18;
            output[to + c] = Math.round((tone + dither) / 255 * levels) / levels * 255;
          }
        }
      }
      left = right;
    }
    top = bottom;
  }
  return output;
}
