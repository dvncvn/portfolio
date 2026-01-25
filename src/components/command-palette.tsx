"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  indent?: boolean;
};

const navItems: NavItem[] = [
  { label: "Work", href: "/" },
  { label: "Platform Redesign", href: "/work/langflow-platform-redesign", indent: true },
  { label: "Astra DB", href: "/work/astra-db", indent: true },
  { label: "Context Forge", href: "/work/context-forge", indent: true },
  { label: "Agent Experience", href: "/work/langflow-agent-experience", indent: true },
  { label: "Play", href: "/play" },
  { label: "Info", href: "/info" },
];

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  // Reset selection when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
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
          setSelectedIndex((prev) => (prev + 1) % navItems.length);
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + navItems.length) % navItems.length);
          break;
        case "Enter":
          e.preventDefault();
          handleNavigate(navItems[selectedIndex].href);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, handleNavigate, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
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
            <div ref={listRef} className="py-2">
              {navItems.map((item, idx) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex w-full items-center justify-between py-2 text-left transition-colors ${
                    item.indent ? "pl-7 pr-4" : "px-4"
                  } ${
                    selectedIndex === idx
                      ? "bg-white/5"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`text-[13px] transition-colors ${
                      selectedIndex === idx
                        ? "text-foreground"
                        : item.indent
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`font-mono text-[11px] transition-all ${
                      selectedIndex === idx
                        ? "text-[#01F8A5] opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    →
                  </span>
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 border-t border-white/5 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ↑
                </kbd>
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ↓
                </kbd>
                <span className="font-mono text-[10px] text-[#5a5a5a]">navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ↵
                </kbd>
                <span className="font-mono text-[10px] text-[#5a5a5a]">go</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
