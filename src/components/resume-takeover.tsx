"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export type ResumeEntry = {
  company: string;
  role: string;
  location?: string;
  years: string;
  progression?: string;
  bullets?: string[];
};

export type ResumeSection = {
  title: string;
  entries: ResumeEntry[];
};

export type ResumeData = {
  name: string;
  title: string;
  location: string;
  portfolio?: string;
  email?: string;
  phone?: string;
  summary: string;
  sections: ResumeSection[];
  education?: {
    degree: string;
    school: string;
    honors?: string;
  };
  skills?: string;
  tools?: string[];
};

type ResumeTakeoverProps = {
  isOpen: boolean;
  onClose: () => void;
  data: ResumeData;
};

function formatResumeAsText(data: ResumeData): string {
  const lines: string[] = [];
  
  // Header
  lines.push(data.name);
  lines.push(data.title);
  lines.push(data.location);
  if (data.portfolio) lines.push(`Portfolio: ${data.portfolio}`);
  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.phone) lines.push(`Phone: ${data.phone}`);
  lines.push("");
  
  // Summary
  lines.push("SUMMARY");
  lines.push(data.summary);
  lines.push("");
  
  // Experience
  for (const section of data.sections) {
    lines.push(section.title.toUpperCase());
    lines.push("");
    for (const entry of section.entries) {
      lines.push(`${entry.company}, ${entry.role}`);
      if (entry.location) lines.push(entry.location);
      lines.push(entry.years);
      if (entry.progression) lines.push(entry.progression);
      if (entry.bullets && entry.bullets.length > 0) {
        lines.push(entry.bullets.join(". ") + ".");
      }
      lines.push("");
    }
  }
  
  // Education
  if (data.education) {
    lines.push("EDUCATION");
    lines.push(data.education.degree);
    lines.push(data.education.school);
    if (data.education.honors) lines.push(data.education.honors);
    lines.push("");
  }
  
  // Skills
  if (data.skills) {
    lines.push("SKILLS");
    lines.push(data.skills);
    lines.push("");
  }
  
  // Tools
  if (data.tools && data.tools.length > 0) {
    lines.push("TOOLS AND AI WORKFLOW");
    lines.push(data.tools.join(". ") + ".");
  }
  
  return lines.join("\n");
}

export function ResumeTakeover({ isOpen, onClose, data }: ResumeTakeoverProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = formatResumeAsText(data);
    await navigator.clipboard.writeText(text);
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
          className="fixed inset-0 z-50 bg-background"
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

          {/* Action buttons - fixed to bottom right */}
          <div className="fixed bottom-6 right-6 z-10 flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="group/btn inline-flex items-center gap-2 rounded-md bg-white/[0.06] px-4 py-2 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:bg-white/[0.1] hover:text-foreground"
            >
              {copied ? (
                <>
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
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
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>Copy Resume</span>
                </>
              )}
            </button>
            <div className="group relative">
              <button
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-white/[0.04] px-4 py-2 text-[14px] text-muted-foreground/50"
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
                <span>Download PDF</span>
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[12px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                PDF coming soon
              </div>
            </div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full overflow-y-auto px-6 pb-24 pt-12 scrollbar-none"
          >
            <div className="mx-auto max-w-[1100px]">
              {/* Header */}
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-[28px] font-medium text-foreground">{data.name}</h1>
                  <p className="text-[15px] text-muted-foreground">{data.title}</p>
                  <p className="text-[15px] text-muted-foreground">{data.location}</p>
                </div>
                <div className="space-y-1 text-[13px] text-muted-foreground sm:text-right">
                  {data.portfolio && <p>{data.portfolio}</p>}
                  {data.email && <p>{data.email}</p>}
                  {data.phone && <p>{data.phone}</p>}
                </div>
              </div>

              {/* Two column layout */}
              <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
                {/* Left column: Experience */}
                <div className="space-y-10">
                  {data.sections.map((section) => (
                    <div key={section.title} className="space-y-6">
                      <h3 className="text-[14px] font-medium uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </h3>
                      <div className="space-y-8">
                        {section.entries.map((entry, idx) => (
                          <div key={`${entry.company}-${entry.role}-${idx}`}>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h4 className="text-[16px] font-medium text-foreground">
                                  {entry.company}, {entry.role}
                                </h4>
                                {entry.location && (
                                  <p className="text-[14px] text-muted-foreground">
                                    {entry.location}
                                  </p>
                                )}
                                {entry.progression && (
                                  <p className="mt-1 text-[14px] italic text-muted-foreground">
                                    {entry.progression}
                                  </p>
                                )}
                              </div>
                              <span className="mt-1 font-mono text-[14px] tabular-nums text-muted-foreground sm:mt-0 sm:text-right whitespace-nowrap">
                                {entry.years}
                              </span>
                            </div>
                            {entry.bullets && entry.bullets.length > 0 && (
                              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                                {entry.bullets.join(". ")}
                                {entry.bullets[entry.bullets.length - 1]?.endsWith(".") ? "" : "."}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right column: Summary, Education, Skills, Tools */}
                <div className="space-y-8 text-[13px]">
                  {/* Summary */}
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                      Summary
                    </h3>
                    <p className="leading-relaxed text-foreground/90">
                      {data.summary}
                    </p>
                  </div>

                  {/* Education */}
                  {data.education && (
                    <div className="space-y-2">
                      <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                        Education
                      </h3>
                      <div>
                        <p className="text-foreground">{data.education.degree}</p>
                        <p className="text-muted-foreground">{data.education.school}</p>
                        {data.education.honors && (
                          <p className="text-muted-foreground">{data.education.honors}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {data.skills && (
                    <div className="space-y-2">
                      <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                        Skills
                      </h3>
                      <p className="leading-relaxed text-muted-foreground">
                        {data.skills}
                      </p>
                    </div>
                  )}

                  {/* Tools */}
                  {data.tools && data.tools.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                        Tools and AI Workflow
                      </h3>
                      <ul className="space-y-1 text-muted-foreground">
                        {data.tools.map((tool, idx) => (
                          <li key={idx}>{tool}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
