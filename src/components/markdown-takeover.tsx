"use client";

import { useEffect, useState } from "react";
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

  // Render markdown with clickable links for known patterns
  const renderMarkdownWithLinks = (text: string) => {
    // Build a combined pattern that matches any of our link patterns
    const allPatterns = linkPatterns.map(p => `(${p.pattern.source})`).join("|");
    const combinedRegex = new RegExp(allPatterns, "gi");
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = combinedRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Find which pattern matched
      const matchedText = match[0];
      const linkPattern = linkPatterns.find(p => p.pattern.test(matchedText));
      
      if (linkPattern) {
        // Reset the pattern's lastIndex since we used test()
        linkPattern.pattern.lastIndex = 0;
        
        if (linkPattern.external) {
          // External link - open in new tab
          parts.push(
            <a
              key={`link-${keyIndex++}`}
              href={linkPattern.href}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-[#01F8A5] underline decoration-[#01F8A5]/30 underline-offset-2 transition-colors hover:decoration-[#01F8A5]/60"
            >
              {matchedText}
            </a>
          );
        } else {
          // Internal link - navigate within app
          parts.push(
            <button
              key={`link-${keyIndex++}`}
              onClick={() => handleNavigate(linkPattern.href)}
              className="cursor-pointer text-[#01F8A5] underline decoration-[#01F8A5]/30 underline-offset-2 transition-colors hover:decoration-[#01F8A5]/60"
            >
              {matchedText}
            </button>
          );
        }
      } else {
        parts.push(matchedText);
      }

      lastIndex = match.index + matchedText.length;
    }

    // Add remaining text
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
              <nav className="mb-8 flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-white/[0.06] pb-4">
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
                <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.7] text-foreground/80">
                  {renderMarkdownWithLinks(markdown)}
                </pre>
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
