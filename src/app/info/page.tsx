"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";
import { BlurFade } from "@/components/ui/blur-fade";
import { motion, AnimatePresence } from "framer-motion";
import { useResume } from "@/contexts/resume-context";
import { usePageContent } from "@/contexts/page-content-context";
import { infoPageToMarkdown } from "@/lib/markdown";
import { DndHoverCard } from "@/components/dnd-hover-card";

type ImageEffect = "normal" | "dither" | "pixelate" | "ascii";

// 8x8 Bayer matrix for ordered dithering (normalized to 0-1)
const BAYER_8X8 = [
  [0/64, 32/64, 8/64, 40/64, 2/64, 34/64, 10/64, 42/64],
  [48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64],
  [12/64, 44/64, 4/64, 36/64, 14/64, 46/64, 6/64, 38/64],
  [60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64],
  [3/64, 35/64, 11/64, 43/64, 1/64, 33/64, 9/64, 41/64],
  [51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64],
  [15/64, 47/64, 7/64, 39/64, 13/64, 45/64, 5/64, 37/64],
  [63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64],
];

// Color type for effect colors
type EffectColor = { r: number; g: number; b: number } | null;

// Generate a random vibrant color
function getRandomColor(): EffectColor {
  const hue = Math.random() * 360;
  const saturation = 70 + Math.random() * 30; // 70-100%
  const lightness = 50 + Math.random() * 20; // 50-70%
  
  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = lightness / 100 - c / 2;
  
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; b = 0; }
  else if (hue < 120) { r = x; g = c; b = 0; }
  else if (hue < 180) { r = 0; g = c; b = x; }
  else if (hue < 240) { r = 0; g = x; b = c; }
  else if (hue < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function DitheredImage({ src, blockSize = 16, color = null }: { src: string; blockSize?: number; color?: EffectColor }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const applyOrderedDither = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, size: number, effectColor: EffectColor) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw image with cover behavior (crop to fill)
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      
      if (imgAspect > canvasAspect) {
        // Image is wider - crop sides
        sw = img.naturalHeight * canvasAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        // Image is taller - crop top/bottom
        sh = img.naturalWidth / canvasAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

      // Get image data
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Apply ordered dithering
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;

          // Convert to grayscale
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const normalizedGray = gray / 255;

          // Get Bayer threshold based on block size
          const bx = Math.floor(x / (size / 8)) % 8;
          const by = Math.floor(y / (size / 8)) % 8;
          const threshold = BAYER_8X8[by][bx];

          // Apply threshold with optional color
          const isLight = normalizedGray > threshold;
          if (effectColor) {
            data[i] = isLight ? effectColor.r : 0;
            data[i + 1] = isLight ? effectColor.g : 0;
            data[i + 2] = isLight ? effectColor.b : 0;
          } else {
            const output = isLight ? 255 : 0;
            data[i] = output;
            data[i + 1] = output;
            data[i + 2] = output;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    // Calculate height based on 4:5 aspect ratio
    const canvasHeight = Math.round(containerWidth * (5 / 4));

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = containerWidth;
      canvas.height = canvasHeight;
      applyOrderedDither(img, canvas, blockSize, color);
    };
    img.src = src;
  }, [src, blockSize, containerWidth, applyOrderedDither, color]);

  return (
    <div ref={containerRef} className="aspect-[4/5] w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function PixelatedImage({ src, pixelSize = 8 }: { src: string; pixelSize?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const pixelate = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement, size: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // First draw with cover behavior (crop to fill)
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = w / h;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    
    if (imgAspect > canvasAspect) {
      sw = img.naturalHeight * canvasAspect;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / canvasAspect;
      sy = (img.naturalHeight - sh) / 2;
    }

    // Draw scaled down for pixelation
    const scaledW = Math.ceil(w / size);
    const scaledH = Math.ceil(h / size);
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, scaledW, scaledH);
    
    // Scale back up with pixelated rendering
    ctx.drawImage(canvas, 0, 0, scaledW, scaledH, 0, 0, w, h);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    // Calculate height based on 4:5 aspect ratio
    const canvasHeight = Math.round(containerWidth * (5 / 4));

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = containerWidth;
      canvas.height = canvasHeight;
      pixelate(img, canvas, pixelSize);
    };
    img.src = src;
  }, [src, pixelSize, containerWidth, pixelate]);

  return (
    <div ref={containerRef} className="aspect-[4/5] w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

// ASCII characters from dark to light
const ASCII_CHARS = "@%#*+=-:. ";

function AsciiImage({ src, fontSize = 6, color = null }: { src: string; fontSize?: number; color?: EffectColor }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Default green color if no color specified
  const textColor = color ? `rgb(${color.r}, ${color.g}, ${color.b})` : "rgb(74, 222, 128)";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (containerWidth === 0) return;

    // Character dimensions - measure actual rendered size
    // Monospace chars at this size are roughly 0.6 width:height ratio
    const charWidthRatio = 0.6;
    const charWidth = fontSize * charWidthRatio;
    const charHeight = fontSize; // line-height = 1
    
    // Calculate grid size to fill container
    const cols = Math.floor(containerWidth / charWidth);
    const containerHeight = Math.round(containerWidth * (5 / 4));
    const rows = Math.floor(containerHeight / charHeight);

    // The image aspect ratio we need to sample
    // Container is 4:5, and each char cell is charWidth:charHeight
    // Rendered aspect = (cols * charWidth) / (rows * charHeight)
    // We want this to equal 4/5, so sample aspect needs to compensate
    const charCellAspect = charWidth / charHeight; // ~0.6
    const containerAspect = 4 / 5; // 0.8
    
    // Sample aspect = container aspect / char cell aspect
    // This ensures rendered output matches container
    const sampleAspect = containerAspect / charCellAspect;
    
    // Sample dimensions
    const sampleCols = cols;
    const sampleRows = Math.round(cols / sampleAspect);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = sampleCols;
      canvas.height = sampleRows;

      // Draw with cover behavior for 4:5 crop
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const targetAspect = 4 / 5;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (imgAspect > targetAspect) {
        sw = img.naturalHeight * targetAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / targetAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sampleCols, sampleRows);

      const imageData = ctx.getImageData(0, 0, sampleCols, sampleRows);
      const data = imageData.data;

      let result = "";
      for (let y = 0; y < sampleRows; y++) {
        for (let x = 0; x < sampleCols; x++) {
          const i = (y * sampleCols + x) * 4;
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const charIndex = Math.floor((gray / 255) * (ASCII_CHARS.length - 1));
          result += ASCII_CHARS[charIndex];
        }
        result += "\n";
      }

      setAsciiArt(result);
    };
    img.src = src;
  }, [src, containerWidth, fontSize]);

  return (
    <div ref={containerRef} className="aspect-[4/5] w-full overflow-hidden bg-[#0a0a0a]">
      <pre
        className="h-full w-full overflow-hidden whitespace-pre"
        style={{
          fontFamily: "monospace",
          fontSize: `${fontSize}px`,
          lineHeight: 1,
          letterSpacing: "0px",
          color: textColor,
          opacity: 0.9,
        }}
      >
        {asciiArt}
      </pre>
    </div>
  );
}

function EffectButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ${
        isActive
          ? "bg-white/[0.12] text-foreground"
          : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ActivityIndicator() {
  return (
    <motion.svg
      width="26"
      height="18"
      viewBox="0 0 26 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
    >
      <rect x="18" y="3.99951" width="2" height="2" transform="rotate(90 18 3.99951)" fill="#01F8A5"/>
      <rect opacity="0.4" x="6" y="7.99951" width="2" height="2" transform="rotate(90 6 7.99951)" fill="#01F8A5"/>
      <rect x="22.001" y="4" width="2" height="2" transform="rotate(90 22.001 4)" fill="#01F8A5"/>
      <rect x="22" y="7.99951" width="2" height="2" transform="rotate(90 22 7.99951)" fill="#01F8A5"/>
      <rect opacity="0.5" x="10" y="7.99951" width="2" height="2" transform="rotate(90 10 7.99951)" fill="#01F8A5"/>
      <rect opacity="0.8" x="14" y="7.99951" width="2" height="2" transform="rotate(90 14 7.99951)" fill="#01F8A5"/>
      <rect opacity="0.2" x="2" y="7.99951" width="2" height="2" transform="rotate(90 2 7.99951)" fill="#01F8A5"/>
      <rect x="22.001" y="12" width="2" height="2" transform="rotate(90 22.001 12)" fill="#01F8A5"/>
      <rect x="18.001" y="12" width="2" height="2" transform="rotate(90 18.001 12)" fill="#01F8A5"/>
      <rect x="18.001" y="16" width="2" height="2" transform="rotate(90 18.001 16)" fill="#01F8A5"/>
      <rect x="26.001" y="8" width="2" height="2" transform="rotate(90 26.001 8)" fill="#01F8A5"/>
      <rect x="18.001" y="2.27308e-06" width="2" height="2" transform="rotate(90 18.001 2.27308e-06)" fill="#01F8A5"/>
    </motion.svg>
  );
}

const workHistory: EmploymentRow[] = [
  {
    role: "Staff Product Designer",
    roleFlag: "Acquired",
    company: "IBM",
    companyFlag: null,
    years: "2025 – Now",
  },
  {
    role: "Staff Product Designer",
    company: "DataStax",
    roleFlag: "Promoted",
    companyFlag: null,
    years: "2024 – 2025",
  },
  {
    role: "Product Design Manager",
    company: "DataStax",
    roleFlag: "Promoted",
    companyFlag: null,
    years: "2023 – 2024",
  },
  {
    role: "Senior Product Designer",
    company: "DataStax",
    roleFlag: null,
    companyFlag: null,
    years: "2023 – 2024",
  },
];

export default function InfoPage() {
  const { openResume } = useResume();
  const { setPageContent } = usePageContent();
  const [imageEffect, setImageEffect] = useState<ImageEffect>("normal");
  const [showControls, setShowControls] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [ditherSize, setDitherSize] = useState(16);
  const [ditherColor, setDitherColor] = useState<EffectColor>(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [asciiSize, setAsciiSize] = useState(12);
  const [asciiColor, setAsciiColor] = useState<EffectColor>(null);

  // Register page content for markdown view
  useEffect(() => {
    setPageContent(infoPageToMarkdown(), "Info");
  }, [setPageContent]);

  return (
    <div className="py-20">
      {/* 2-column layout: content takes more space, image is smaller */}
      <section className="grid gap-10 lg:grid-cols-[1fr_440px] lg:gap-24">
        {/* Left column: intro (unanimated) + table immediately below */}
        <div className="space-y-12 max-w-[768px]">
          <div className="space-y-4">
            {/* Spacer for visual alignment with home page */}
            <div className="h-9" aria-hidden="true" />
            <h1 className="text-[20px] font-medium leading-tight text-foreground">
              Hi, I&apos;m Simon
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground lg:max-w-[768px]">
              I&apos;m a Staff Product Designer working on AI and developer platforms at IBM. I turn complex systems into clear, usable, and durable products. I&apos;m experienced across OSS, startups, and enterprise.
            </p>
          </div>

          {/* Table should be the first thing below the intro paragraph */}
          <BlurFade delay={0}>
            <div className="relative">
              {/* Activity indicator pointing at current position */}
              <div className="absolute -left-10 top-[10px] hidden xl:block">
                <ActivityIndicator />
              </div>
              <EmploymentTable rows={workHistory} onViewHistory={openResume} />
            </div>
          </BlurFade>

          {/* Ways of Working */}
          <BlurFade delay={0.1}>
            <div className="space-y-4">
              <h2 className="text-[20px] font-medium leading-tight text-foreground">
                Ways of Working
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
                <li>End-to-end: problem framing through shipped UI</li>
                <li>Strong in ambiguous, zero-to-one spaces</li>
                <li>Strong product intuition. I make calls and keep momentum without waiting on perfect inputs or PM coverage</li>
                <li>Systems-minded, human-centered. Clarity, hierarchy, intent over novelty</li>
                <li>Partner tightly with engineering, often in code or prototypes</li>
                <li>Flexible on process and tools. I&apos;ll use what works and drop what doesn&apos;t</li>
                <li>Focused on developer tools and agentic systems where UX shapes what&apos;s possible</li>
              </ul>
            </div>
          </BlurFade>

          {/* Outside of Work */}
          <BlurFade delay={0.15}>
            <div className="space-y-4">
              <h2 className="text-[20px] font-medium leading-tight text-foreground">
                Outside of Work
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Outside of product design, I&apos;m a parent, husband, runner, musician, and{" "}
                <DndHoverCard>D&amp;D player</DndHoverCard>.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                I spend a lot of time thinking about creativity, constraint, and sustainability. I make music that blends ambient, electronic, and guitar-driven textures, and I&apos;m interested in long-term lifestyle design, balancing ambition with family, health, and creative output.
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Right column: photo */}
        <BlurFade delay={0.06} className="w-full">
          <div className="space-y-0">
            <button
              type="button"
              className="group relative w-full cursor-pointer overflow-hidden rounded-[24px] bg-[#121212]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setShowControls(true)}
            >
              {/* Stack all effects and crossfade between them */}
              <div className="relative aspect-[4/5] w-full">
                {/* Normal - standard img */}
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: imageEffect === "normal" ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ pointerEvents: imageEffect === "normal" ? "auto" : "none" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/profile.png"
                    alt="Simon Duncan"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
                {/* Dither - canvas with ordered dithering */}
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: imageEffect === "dither" ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ pointerEvents: imageEffect === "dither" ? "auto" : "none" }}
                >
                  <DitheredImage src="/assets/profile.png" blockSize={ditherSize} color={ditherColor} />
                </motion.div>
                {/* Pixelate - canvas pixelation */}
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: imageEffect === "pixelate" ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ pointerEvents: imageEffect === "pixelate" ? "auto" : "none" }}
                >
                  <PixelatedImage src="/assets/profile.png" pixelSize={pixelSize} />
                </motion.div>
                {/* ASCII - text-based rendering */}
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: imageEffect === "ascii" ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ pointerEvents: imageEffect === "ascii" ? "auto" : "none" }}
                >
                  <AsciiImage src="/assets/profile.png" fontSize={asciiSize} color={asciiColor} />
                </motion.div>
              </div>
              {/* Edit icon - appears on hover */}
              {/* Edit icon indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered || showControls ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white/70 backdrop-blur-sm"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
                  <path d="m8 6 2-2" />
                  <path d="m18 16 2-2" />
                  <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  <path d="m15 5 4 4" />
                </svg>
              </motion.div>
            </button>
            {/* Expandable effect controls */}
            <motion.div
              initial={false}
              animate={{
                height: showControls ? "auto" : 0,
                opacity: showControls ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-3">
                {/* Effect selector row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <EffectButton
                      label="Normal"
                      isActive={imageEffect === "normal"}
                      onClick={() => setImageEffect("normal")}
                    />
                    <EffectButton
                      label="Dither"
                      isActive={imageEffect === "dither"}
                      onClick={() => setImageEffect("dither")}
                    />
                    <EffectButton
                      label="Pixelate"
                      isActive={imageEffect === "pixelate"}
                      onClick={() => setImageEffect("pixelate")}
                    />
                    <EffectButton
                      label="ASCII"
                      isActive={imageEffect === "ascii"}
                      onClick={() => setImageEffect("ascii")}
                    />
                  </div>
                  <button
                    onClick={() => setShowControls(false)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    aria-label="Close controls"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {/* Dither controls */}
                {imageEffect === "dither" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-muted-foreground">Block size</span>
                      <input
                        type="range"
                        min="4"
                        max="32"
                        step="4"
                        value={ditherSize}
                        onChange={(e) => setDitherSize(Number(e.target.value))}
                        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                      <span className="min-w-[40px] text-right font-mono text-[12px] text-muted-foreground">
                        {ditherSize}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDitherColor(getRandomColor())}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                        Random color
                      </button>
                      {ditherColor && (
                        <>
                          <div
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ backgroundColor: `rgb(${ditherColor.r}, ${ditherColor.g}, ${ditherColor.b})` }}
                          />
                          <button
                            onClick={() => setDitherColor(null)}
                            className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground"
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
                {/* Pixelate controls */}
                {imageEffect === "pixelate" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[12px] text-muted-foreground">Pixel size</span>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      step="2"
                      value={pixelSize}
                      onChange={(e) => setPixelSize(Number(e.target.value))}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                    <span className="min-w-[40px] text-right font-mono text-[12px] text-muted-foreground">
                      {pixelSize}px
                    </span>
                  </motion.div>
                )}
                {/* ASCII controls */}
                {imageEffect === "ascii" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-muted-foreground">Font size</span>
                      <input
                        type="range"
                        min="4"
                        max="20"
                        step="2"
                        value={asciiSize}
                        onChange={(e) => setAsciiSize(Number(e.target.value))}
                        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                      <span className="min-w-[40px] text-right font-mono text-[12px] text-muted-foreground">
                        {asciiSize}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAsciiColor(getRandomColor())}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                        Random color
                      </button>
                      {asciiColor && (
                        <>
                          <div
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ backgroundColor: `rgb(${asciiColor.r}, ${asciiColor.g}, ${asciiColor.b})` }}
                          />
                          <button
                            onClick={() => setAsciiColor(null)}
                            className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground"
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
