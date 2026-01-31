"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type MarkdownTakeoverProps = {
  isOpen: boolean;
  onClose: () => void;
  markdown: string | null;
};

export function MarkdownTakeover({ isOpen, onClose, markdown }: MarkdownTakeoverProps) {
  const [copied, setCopied] = useState(false);

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
            className="h-full overflow-y-auto px-6 pb-24 pt-12 scrollbar-none"
          >
            <div className="mx-auto max-w-[900px]">
              {markdown ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.7] text-foreground/80">
                  {markdown}
                </pre>
              ) : (
                <div className="flex h-[60vh] items-center justify-center">
                  <p className="text-[14px] text-muted-foreground/50">
                    No content available for this page
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
