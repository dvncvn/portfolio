"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type NavLink = {
  label: string;
  href: string;
  indent?: boolean;
};

const navLinks: NavLink[] = [
  { label: "Work", href: "/" },
  { label: "Langflow: Platform Redesign", href: "/work/langflow-platform-redesign", indent: true },
  { label: "Langflow: Agent Experience", href: "/work/langflow-agent-experience", indent: true },
  { label: "Context Forge", href: "/work/context-forge", indent: true },
  { label: "Astra DB", href: "/work/astra-db", indent: true },
  { label: "Play", href: "/play" },
  { label: "Info", href: "/info" },
];

// Patterns to match in markdown content and their corresponding routes/links
type LinkPattern = {
  pattern: RegExp;
  href: string;
  external?: boolean; // If true, opens in new tab
};

const linkPatterns: LinkPattern[] = [
  // Work projects
  { pattern: /Langflow:\s*Platform\s*Redesign/gi, href: "/work/langflow-platform-redesign" },
  { pattern: /Langflow:\s*Agent\s*Experience/gi, href: "/work/langflow-agent-experience" },
  { pattern: /Context\s*Forge(?::\s*Reimagined)?/gi, href: "/work/context-forge" },
  { pattern: /Astra(?:\s*DB)?(?::\s*AI-First\s*Database\s*Design)?/gi, href: "/work/astra-db" },
  // Play projects (all link to /play)
  { pattern: /\bBitfield\b/g, href: "/play" },
  { pattern: /\bSnowfall\b/g, href: "/play" },
  { pattern: /\bTerra\b/g, href: "/play" },
  { pattern: /A surprising gust of air/gi, href: "/play" },
  { pattern: /Of what was/gi, href: "/play" },
  // External links - contact & social
  { pattern: /simonfraserduncan@gmail\.com/g, href: "mailto:simonfraserduncan@gmail.com", external: true },
  { pattern: /simonduncan\.co/g, href: "https://simonduncan.co", external: true },
  { pattern: /linkedin\.com\/in\/simonfraserduncan/g, href: "https://linkedin.com/in/simonfraserduncan", external: true },
  { pattern: /github\.com\/dvncvn/g, href: "https://github.com/dvncvn", external: true },
];

function FallingPixels() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const PIXEL_SIZE = 3;
    const COUNT = 40;
    const pixels = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 0.15 + Math.random() * 0.35,
      opacity: 0.04 + Math.random() * 0.08,
    }));

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of pixels) {
        p.y += p.speed;
        if (p.y > h + PIXEL_SIZE) {
          p.y = -PIXEL_SIZE;
          p.x = Math.random() * w;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillRect(
          Math.round(p.x / PIXEL_SIZE) * PIXEL_SIZE,
          Math.round(p.y / PIXEL_SIZE) * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE
        );
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      aria-hidden="true"
    />
  );
}

type MarkdownTakeoverProps = {
  isOpen: boolean;
  onClose: () => void;
  markdown: string | null;
};

export function MarkdownTakeover({ isOpen, onClose, markdown }: MarkdownTakeoverProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    // Don't close - stay in markdown mode
  };

  // Regex for standard markdown links [text](url)
  const mdLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g;

  // Render markdown with clickable links: known patterns + standard [text](url) links
  const renderMarkdownWithLinks = (text: string) => {
    type Span = { start: number; end: number; type: "mdlink"; text: string; url: string } | { start: number; end: number; type: "pattern"; pattern: LinkPattern; matchedText: string };
    const spans: Span[] = [];

    // Collect markdown link spans
    let mdMatch;
    mdLinkRegex.lastIndex = 0;
    while ((mdMatch = mdLinkRegex.exec(text)) !== null) {
      spans.push({ start: mdMatch.index, end: mdMatch.index + mdMatch[0].length, type: "mdlink", text: mdMatch[1], url: mdMatch[2] });
    }

    // Collect pattern match spans
    const allPatterns = linkPatterns.map(p => `(${p.pattern.source})`).join("|");
    const combinedRegex = new RegExp(allPatterns, "gi");
    let patternMatch;
    while ((patternMatch = combinedRegex.exec(text)) !== null) {
      const matchedText = patternMatch[0];
      const linkPattern = linkPatterns.find(p => p.pattern.test(matchedText));
      if (linkPattern) {
        linkPattern.pattern.lastIndex = 0;
        spans.push({ start: patternMatch.index, end: patternMatch.index + matchedText.length, type: "pattern", pattern: linkPattern, matchedText });
      }
    }

    // Sort by start, then drop overlaps (keep first)
    spans.sort((a, b) => a.start - b.start);
    const nonOverlapping: Span[] = [];
    for (const s of spans) {
      if (nonOverlapping.length === 0 || s.start >= nonOverlapping[nonOverlapping.length - 1].end) {
        nonOverlapping.push(s);
      }
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let keyIndex = 0;
    const linkClass = "cursor-pointer text-[#01F8A5] underline decoration-[#01F8A5]/30 underline-offset-2 transition-colors hover:decoration-[#01F8A5]/60";

    for (const span of nonOverlapping) {
      if (span.start > lastIndex) {
        parts.push(text.slice(lastIndex, span.start));
      }
      if (span.type === "mdlink") {
        parts.push(
          <a key={`link-${keyIndex++}`} href={span.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {span.text || span.url}
          </a>
        );
      } else {
        const { pattern, matchedText } = span;
        if (pattern.external) {
          parts.push(
            <a key={`link-${keyIndex++}`} href={pattern.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {matchedText}
            </a>
          );
        } else {
          parts.push(
            <button key={`link-${keyIndex++}`} onClick={() => handleNavigate(pattern.href)} className={linkClass}>
              {matchedText}
            </button>
          );
        }
      }
      lastIndex = span.end;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const handleCopy = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#0a0a0a]"
        >
          {/* Decorative falling pixels */}
          <FallingPixels />

          {/* Close button - fixed to top right */}
          <button
            onClick={onClose}
            className="fixed right-6 top-6 z-10 rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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

          {/* Copy button - fixed to bottom right */}
          <div className="fixed bottom-6 right-6 z-20 flex items-center gap-3 rounded-lg bg-background p-2">
            <button
              onClick={handleCopy}
              disabled={!markdown}
              className="group/btn inline-flex items-center gap-2 rounded-md bg-[#1a1a1a] px-4 py-2 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:bg-[#252525] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#01F8A5]"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="h-full overflow-y-auto px-6 pb-24 pt-6 scrollbar-none"
          >
            <div className="mx-auto max-w-[900px]">
              {/* Navigation */}
              <nav className="mb-8 flex flex-wrap items-center gap-x-1 gap-y-1 pb-4">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavigate(link.href)}
                    className={`rounded-md px-2.5 py-1 font-mono text-[12px] transition-colors ${
                      link.indent ? "ml-1" : ""
                    } ${
                      isActive(link.href)
                        ? "bg-white/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* Markdown content */}
              {markdown ? (
                <div className="mx-auto max-w-[600px]">
                  {/* Top frame */}
                  <div className="mb-4 flex select-none font-mono text-[13px] text-white/[0.08]">
                    <span>┌</span>
                    <span className="flex-1 overflow-hidden">{"─".repeat(200)}</span>
                    <span>┐</span>
                  </div>

                  <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.7] text-foreground/80">
                    {markdown.split("\n").map((line, i) => {
                      const isHeading = /^#{1,3}\s/.test(line);
                      return (
                        <span key={i} className={isHeading ? "text-foreground font-medium" : undefined}>
                          {renderMarkdownWithLinks(line)}
                          {"\n"}
                        </span>
                      );
                    })}
                  </pre>

                  {/* Bottom frame */}
                  <div className="mt-4 flex select-none font-mono text-[13px] text-white/[0.08]">
                    <span>└</span>
                    <span className="flex-1 overflow-hidden">{"─".repeat(200)}</span>
                    <span>┘</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-[60vh] items-center justify-center">
                  <p className="text-[14px] text-muted-foreground/50">
                    Loading content...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
