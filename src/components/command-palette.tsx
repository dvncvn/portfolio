"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useResume } from "@/contexts/resume-context";
import { usePageContent } from "@/contexts/page-content-context";
import { useAccent } from "@/contexts/accent-context";
import { ACCENT_IDS, ACCENTS, type AccentId } from "@/lib/accents";

type PaletteAction =
  | "openPresentation"
  | "openResume"
  | "copyEmail"
  | "viewMarkdown";

type NavItem = {
  type: "nav";
  label: string;
  href: string;
  indent?: boolean;
};

type ActionItem = {
  type: "action";
  label: string;
  action: PaletteAction;
  indent?: boolean;
};

type SeparatorItem = {
  type: "separator";
  label: string;
};

type AccentItem = { type: "accent"; accent: AccentId };

type PaletteItem = NavItem | ActionItem | SeparatorItem;

const navItems: PaletteItem[] = [
  { type: "nav", label: "Work", href: "/" },
  { type: "nav", label: "Langflow: Platform Redesign", href: "/work/langflow-platform-redesign", indent: true },
  { type: "nav", label: "Langflow: Agent Experience", href: "/work/langflow-agent-experience", indent: true },
  { type: "nav", label: "Context Forge: Reimagined", href: "/work/context-forge", indent: true },
  { type: "nav", label: "Astra: AI-First Database Design", href: "/work/astra-db", indent: true },
  { type: "nav", label: "Play", href: "/play" },
  { type: "nav", label: "Info", href: "/info" },
  { type: "separator", label: "Actions" },
  { type: "action", label: "Open Presentation", action: "openPresentation" },
  { type: "action", label: "View Resume", action: "openResume" },
  { type: "action", label: "Copy Email", action: "copyEmail" },
  { type: "action", label: "View as Markdown", action: "viewMarkdown" },
];

// Get selectable items only (not separators)
const accentItems: AccentItem[] = ACCENT_IDS.map((accent) => ({ type: "accent", accent }));
const selectableItems = [
  ...navItems.filter((item): item is NavItem | ActionItem => item.type !== "separator"),
  ...accentItems,
];

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
};

const EMAIL = "simonfraserduncan@gmail.com";

export function CommandPalette({ isOpen, onClose, currentPath = "/" }: CommandPaletteProps) {
  const router = useRouter();
  const { openResume } = useResume();
  const { openViewer } = usePageContent();
  const { accent, setAccent } = useAccent();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if a nav item matches the current path
  const isCurrentPage = (item: NavItem) => {
    if (item.href === "/") {
      return currentPath === "/";
    }
    return currentPath === item.href || currentPath.startsWith(item.href + "/");
  };

  const handleSelect = useCallback(
    async (item: NavItem | ActionItem | AccentItem) => {
      if (item.type === "accent") {
        setAccent(item.accent);
      } else if (item.type === "nav") {
        router.push(item.href);
        onClose();
      } else if (item.type === "action") {
        switch (item.action) {
          case "openPresentation":
            router.push("/?presentation=true");
            onClose();
            break;
          case "openResume":
            openResume();
            onClose();
            break;
          case "copyEmail":
            await navigator.clipboard.writeText(EMAIL);
            setCopiedEmail(true);
            setTimeout(() => {
              setCopiedEmail(false);
            }, 1500);
            break;
          case "viewMarkdown":
            openViewer();
            onClose();
            break;
          default: {
            const _exhaustive: never = item.action;
            return _exhaustive;
          }
        }
      }
    },
    [router, onClose, openResume, openViewer, setAccent]
  );

  // Reset selection when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setCopiedEmail(false);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % selectableItems.length);
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + selectableItems.length) % selectableItems.length);
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(selectableItems[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-selectable-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#151413]/95 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <span className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
                Go to
              </span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                /
              </kbd>
            </div>

            {/* List */}
            <div className="py-2">
              {navItems.map((item) => {
                if (item.type === "separator") {
                  return (
                    <div
                      key={`sep-${item.label}`}
                      className="border-t border-white/5 mt-2 pt-3 pb-1 px-4"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/50">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                // Find the index in selectableItems for this item
                const selectableIdx = selectableItems.findIndex(
                  (si) => si === item
                );
                const isSelected = selectableIdx === selectedIndex;

                const isCurrent = item.type === "nav" && isCurrentPage(item);

                return (
                  <button
                    key={item.type === "nav" ? item.href : item.action}
                    data-selectable-index={selectableIdx}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(selectableIdx)}
                    className={`group flex w-full items-center justify-between py-2 text-left transition-colors ${
                      item.indent ? "pl-7 pr-4" : "px-4"
                    } ${
                      isSelected
                        ? "bg-white/5"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`text-[13px] transition-colors ${
                          isCurrent
                            ? "text-highlight"
                            : isSelected
                            ? "text-foreground"
                            : item.indent
                            ? "text-muted-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.type === "action" && item.action === "copyEmail" && copiedEmail
                          ? "Copied"
                          : item.label}
                      </span>
                      {isCurrent && (
                        <motion.span
                          aria-label="Current page"
                          className="inline-block h-1.5 w-1.5 rounded-full bg-highlight"
                          animate={{ opacity: [1, 0.25, 1] }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </span>
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
                      aria-hidden="true"
                      className={`transition-all duration-200 ease-out ${
                        isSelected
                          ? "translate-x-0 text-highlight opacity-100"
                          : "-translate-x-1 opacity-0"
                      }`}
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/5 px-4 py-2" role="group" aria-label="Accent color">
              <span className="text-[13px] text-muted-foreground">Accent</span>
              <div className="flex items-center">
                {accentItems.map((item) => {
                  const color = ACCENTS[item.accent];
                  const selectableIdx = selectableItems.indexOf(item);
                  const active = accent === item.accent;
                  const highlighted = selectedIndex === selectableIdx;
                  return (
                    <button
                      key={item.accent}
                      type="button"
                      data-selectable-index={selectableIdx}
                      aria-label={color.label}
                      aria-pressed={active}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(selectableIdx)}
                      className={`relative flex h-8 w-5 items-center justify-center focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${highlighted ? "brightness-110" : "hover:brightness-110"}`}
                    >
                      <span
                        className="relative h-5 w-5"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      >
                        {active && <span className="absolute bottom-1 left-1/2 h-0.5 w-2 -translate-x-1/2 rounded-full bg-black/50" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
