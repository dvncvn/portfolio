export type ImageEffect = "normal" | "dither" | "pixelate" | "ascii";
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
export const DEFAULT_SETTINGS: Record<Exclude<ImageEffect, "normal">, EffectSettings> = {
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
  image: HTMLImageElement,
  width: number,
  height: number,
  aspect: number,
) {
  const sw = Math.min(image.naturalWidth, image.naturalHeight * aspect);
  const sh = sw / aspect;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2,
    sw, sh, 0, 0, width, height);
}

export function renderPhotoEffect(
  canvas: HTMLCanvasElement,
  sample: HTMLCanvasElement,
  image: HTMLImageElement,
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
