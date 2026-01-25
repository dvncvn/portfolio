"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export type ResumeEntry = {
  role: string;
  company: string;
  years: string;
  description?: string;
};

type ResumeTakeoverProps = {
  isOpen: boolean;
  onClose: () => void;
  entries: ResumeEntry[];
  resumeUrl?: string;
};

export function ResumeTakeover({ isOpen, onClose, entries, resumeUrl }: ResumeTakeoverProps) {
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
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background px-6 py-4">
            <h2 className="text-[20px] font-medium text-foreground">Work History</h2>
            <div className="flex items-center gap-4">
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  download
                  className="group/btn inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:bg-white/[0.06] hover:text-foreground"
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Resume</span>
                </a>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
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
            </div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full overflow-y-auto px-6 pb-20 pt-24"
          >
            <div className="mx-auto max-w-[768px]">
              <table className="w-full border-collapse text-[16px]">
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr
                      key={`${entry.role}-${entry.company}-${entry.years}-${idx}`}
                      className="border-b border-white/10 last:border-b-0"
                    >
                      <td className="py-4 pr-6 align-top">
                        <div className="space-y-1">
                          <span className="font-medium text-foreground">
                            {entry.role}
                          </span>
                          {entry.description && (
                            <p className="text-[14px] text-muted-foreground">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-6 align-top">
                        <span className="text-foreground">{entry.company}</span>
                      </td>
                      <td className="py-4 align-top text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                        {entry.years}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
